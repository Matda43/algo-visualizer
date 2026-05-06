import { Component, OnDestroy, OnInit, signal, computed, inject } from '@angular/core';
import { Subject, Subscription, timer, takeUntil } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { WebsocketService } from '../../core/websocket';
import { AlgoMetadataService } from './services/algo-metadata.service';
import { AlgoMetadata } from './models/algo-metadata.model';
import { AlgoInstance, Bar, SortStep, ExecuteResult, DATA_TYPES, DataType, ViewMode } from './models/sorting.models';
import { VizInstanceComponent } from './viz-instance/viz-instance';
import { ToggleSwitchComponent } from '../../shared/toggle-switch/toggle-switch';
import { ComplexityGridComponent } from '../../shared/complexity-grid/complexity-grid';

export type CodeLanguage = string;

interface AlgoQueue {
  name:       string;
  queue:      SortStep[];
  done:       boolean;
  sessionId?: string;
  sub?:       Subscription;
  stepCount:  number;
}

@Component({
  selector:    'app-sorting',
  standalone:  true,
  imports:     [VizInstanceComponent, ToggleSwitchComponent, ComplexityGridComponent],
  templateUrl: './sorting.html',
  styleUrl:    './sorting.scss',
})
export class SortingComponent implements OnInit, OnDestroy {

  // ── Injections ─────────────────────────────────────────────────────────────
  private readonly websocketService    = inject(WebsocketService);
  private readonly sanitizer           = inject(DomSanitizer);
  private readonly algoMetadataService = inject(AlgoMetadataService);

  // ── Constants ──────────────────────────────────────────────────────────────
  readonly DATA_TYPES  = DATA_TYPES;
  readonly VIEW_MODES: { value: ViewMode; label: string }[] = [
    { value: 'bars',    label: 'Barres'   },
    { value: 'numbers', label: 'Nombres'  },
    { value: 'mosaic',  label: 'Mosaïque' },
  ];

  // ── Metadata (from backend) ────────────────────────────────────────────────
  allMetadata  = signal<AlgoMetadata[]>([]);
  allAlgoNames = computed(() => this.allMetadata().map(meta => meta.name));

  // ── UI state ───────────────────────────────────────────────────────────────
  comparisonMode = signal(false);
  isPaused       = signal(false);
  isRunning      = signal(false);
  sidebarOpen    = signal(true);
  showInput      = signal(false);
  showOutput     = signal(false);
  showParams     = signal(false);
  viewMode       = signal<ViewMode>('bars');

  getMetaForAlgo(algoName: string): AlgoMetadata | null {
    return this.allMetadata().find(meta => meta.name === algoName) ?? null;
  }

  // ── Algo selection ─────────────────────────────────────────────────────────
  selectedAlgos    = signal<string[]>([]);
  selectedCodeAlgo = signal<string | null>(null);
  selectedLanguage = signal<CodeLanguage>('Java');
  selectedDataType = signal<DataType>('int');

  // ── Array params ───────────────────────────────────────────────────────────
  arraySize     = signal(50);
  speedMs       = signal(1);
  minValue      = signal(0);
  maxValue      = signal(300);
  manualInput   = signal(false);
  userInputRaw  = signal('');
  outputNumbers = signal<number[]>([]);

  // ── Viz instances ──────────────────────────────────────────────────────────
  instances = signal<AlgoInstance[]>([]);

  // ── Private ────────────────────────────────────────────────────────────────
  private readonly destroy$  = new Subject<void>();
  private currentArray:      number[] = [];
  private initialArray:      number[] = [];
  private algoQueues:        AlgoQueue[] = [];
  private currentSessionId:  string | null = null;
  private syncScheduled      = false;
  private syncRetryTimer:    ReturnType<typeof setTimeout> | null = null;

  // ── Computed ───────────────────────────────────────────────────────────────

  allDone = computed(() =>
    this.instances().length > 0 && this.instances().every(instance => instance.done)
  );

  showNextStep = computed(() => this.isPaused() && this.isRunning());

  selectedMetadata = computed(() => {
    const algoName = this.selectedCodeAlgo();
    if (!algoName) return null;
    return this.allMetadata().find(meta => meta.name === algoName) ?? null;
  });

  availableLanguages = computed(() => {
    const metadata = this.selectedMetadata();
    if (!metadata) return ['Java', 'Python', 'C++', 'C', 'C#', 'JavaScript', 'PHP'];
    return Object.keys(metadata.codeByLanguage);
  });

  codeLines = computed(() => {
    const metadata = this.selectedMetadata();
    if (!metadata) return [];
    const code = metadata.codeByLanguage[this.selectedLanguage()] ?? '';
    return this.applyDataType(code, this.selectedDataType()).split('\n');
  });

  parsedInput = computed(() => {
    const rawInput = this.userInputRaw().trim();
    if (!rawInput) return null;
    const numbers = rawInput.split(/[,;\s]+/).map(value => parseFloat(value)).filter(value => !isNaN(value));
    return numbers.length > 0 ? numbers : null;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.websocketService.connect().subscribe();
    this.algoMetadataService.getAll().subscribe(metadata => {
      this.allMetadata.set(metadata);
      if (metadata.length > 0) {
        this.selectedAlgos.set([metadata[0].name]);
        this.generateArray();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.syncRetryTimer) clearTimeout(this.syncRetryTimer);
    if (this.currentSessionId) this.websocketService.send('/app/session.stop', this.currentSessionId);
    this.algoQueues.forEach(queue => {
      if (queue.sessionId) this.websocketService.send('/app/session.stop', queue.sessionId);
    });
    this.destroy$.next();
    this.destroy$.complete();
    this.websocketService.disconnect();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private makeInstance(algoName: string, arr: number[]): AlgoInstance {
    return {
      name:          algoName,
      bars:          arr.map(value => ({ value, state: 'default' })),
      comparisons:   0,
      swaps:         0,
      pivots:        0,
      sortedCount:   0,
      done:          false,
      sortedIndices: new Set(),
    };
  }

  private rebuildInstances(arr: number[]): void {
    this.instances.set(
      this.selectedAlgos().map(algoName => this.makeInstance(algoName, arr))
    );
  }

  private normalizeValue(rawValue: number): number {
    switch (this.selectedDataType()) {
      case 'float':  return parseFloat(rawValue.toFixed(2));
      case 'double': return parseFloat(rawValue.toFixed(4));
      default:       return Math.trunc(rawValue);
    }
  }

  private applyDataType(code: string, type: DataType): string {
    if (type === 'int') return code;
    return code
      .replace(/\bint(?=\s+\w)/g, type)
      .replace(/\bint\[\]/g, `${type}[]`);
  }

  private barStateForIndex(
    index: number, step: SortStep, sortedIndices: Set<number>
  ): Bar['state'] {
    if (step.type === 'DONE') return 'sorted';
    if (sortedIndices.has(index)) return 'sorted';
    if (index === step.indexA || index === step.indexB) {
      if (step.type === 'SWAP')  return 'swap';
      if (step.type === 'PIVOT') return 'pivot';
      return 'compare';
    }
    return 'default';
  }

  // ── Formatting ─────────────────────────────────────────────────────────────

  formatOutput(values: number[]): string {
    return values.map(value => this.formatValue(value)).join(', ');
  }

  formatValue(value: number): string {
    switch (this.selectedDataType()) {
      case 'float':  return value.toFixed(2) + 'f';
      case 'double': return value.toFixed(4);
      case 'long':   return value.toString() + 'L';
      default:       return Math.round(value).toString();
    }
  }

  highlightLine(line: string): SafeHtml {
    if (!line.trim()) return this.sanitizer.bypassSecurityTrustHtml('&nbsp;');
    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const highlighted = escaped
      .replace(/(["'`][^"'`]*["'`])/g,
        '<span class="hl-string">$1</span>')
      .replace(/\b(void|bool|boolean|return|if|else|for|while|break|true|false|null|new|class|function|def|let|const|var|static|public|private|import|from|int|float|double|long)\b/g,
        '<span class="hl-keyword">$1</span>')
      .replace(/\b(Arrays|Math|count|len|range|intdiv|vector|swap|print|console)\b/g,
        '<span class="hl-builtin">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g,
        '<span class="hl-number">$1</span>')
      .replace(/(\/\/.*$)/g,
        '<span class="hl-comment">$1</span>')
      .replace(/(#.*$)/g,
        '<span class="hl-comment">$1</span>')
      .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
        '<span class="hl-fn">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  // ── Array generation ───────────────────────────────────────────────────────

  generateArray(): void {
    const parsedInput = this.parsedInput();
    let arr: number[];

    if (this.manualInput() && parsedInput) {
      // Mode manuel avec saisie valide
      arr = parsedInput.map(value => this.normalizeValue(value));
      this.arraySize.set(arr.length);
    } else {
      // Mode automatique OU mode manuel sans saisie valide → génération auto
      const min   = this.minValue();
      const max   = this.maxValue();
      const range = max - min;
      const type  = this.selectedDataType();
      arr = Array.from({ length: this.arraySize() }, () => {
        const raw = Math.random() * range + min;
        if (type === 'float')  return parseFloat(raw.toFixed(2));
        if (type === 'double') return parseFloat(raw.toFixed(4));
        return Math.trunc(raw);
      });
    }

    this.currentArray = arr;
    this.initialArray = [...arr];
    this.outputNumbers.set([]);
    this.rebuildInstances(arr);
  }

  reinitialize(): void {
    if (this.isRunning()) return;
    this.currentArray = [...this.initialArray];
    this.outputNumbers.set([]);
    this.rebuildInstances(this.currentArray);
  }

  // ── Array param changes ────────────────────────────────────────────────────

  onArraySizeInput(rawValue: number): void {
    this.arraySize.set(Math.min(1000, Math.max(2, rawValue || 2)));
    this.generateArray();
  }

  incrementSize(delta: number): void {
    this.arraySize.update(value => Math.min(1000, Math.max(2, value + delta)));
    this.generateArray();
  }

  onSpeedChange(newSpeed: number): void {
    this.speedMs.set(newSpeed);
    if (!this.isRunning()) return;

    if (this.comparisonMode()) {
      this.algoQueues.forEach(queue => {
        if (queue.sessionId) {
          this.websocketService.send('/app/session.speed', { sessionId: queue.sessionId, speedMs: newSpeed });
        }
      });
    } else if (this.currentSessionId) {
      this.websocketService.send('/app/session.speed', { sessionId: this.currentSessionId, speedMs: newSpeed });
    }
  }

  onMinValueChange(value: number): void  { this.minValue.set(value);  this.generateArray(); }
  onMaxValueChange(value: number): void  { this.maxValue.set(value);  this.generateArray(); }
  incrementMin(delta: number): void      { this.minValue.update(value => value + delta); this.generateArray(); }
  incrementMax(delta: number): void      { this.maxValue.update(value => value + delta); this.generateArray(); }

  // ── Mode toggles ───────────────────────────────────────────────────────────

  /**
   * Switch le mode comparaison.
   * En mode solo → comparaison : on garde tous les algos sélectionnés et on réinitialise.
   * En mode comparaison → solo : on ne garde que le premier algo sélectionné et on réinitialise.
   */
  toggleComparisonMode(): void {
    if (this.isRunning()) return;
    
    this.selectedCodeAlgo.set(null);

    if (!this.comparisonMode()) {
      // Retour en solo : ne garder que le premier algo
      const firstAlgo = this.selectedAlgos()[0];
      this.selectedAlgos.set([firstAlgo]);
    }

    // Réinitialiser l'array dans les deux cas pour repartir d'un état propre
    this.generateArray();
  }

  toggleAlgo(algoName: string): void {
    if (this.isRunning()) return;
    const current = this.selectedAlgos();

    if (this.comparisonMode()) {
      const updated = current.includes(algoName)
        ? current.filter(name => name !== algoName)
        : [...current, algoName];
      if (updated.length === 0) return;
      this.selectedAlgos.set(updated);
    } else {
      if (current[0] === algoName) return;
      this.selectedAlgos.set([algoName]);
      this.selectedCodeAlgo.set(null);
    }

    this.rebuildInstances(this.currentArray);
  }

  toggleSidebar(): void               { this.sidebarOpen.update(value => !value); }
  selectViewMode(mode: ViewMode): void { this.viewMode.set(mode); }

  toggleCodePanel(algoName: string): void {
    this.selectedCodeAlgo.update(current => current === algoName ? null : algoName);
  }

  selectLanguage(lang: CodeLanguage): void { this.selectedLanguage.set(lang); }

  selectDataType(type: DataType): void {
    this.selectedDataType.set(type);
    this.generateArray();
  }

  // ── Run controls ───────────────────────────────────────────────────────────

  start(): void {
    if (this.isRunning()) return;
    this.isPaused.set(false);
    this.isRunning.set(true);
    this.outputNumbers.set([]);
    this.rebuildInstances(this.currentArray);
    if (this.comparisonMode()) this.startComparison();
    else                       this.startSolo();
  }

  togglePause(): void {
    const nowPaused = !this.isPaused();
    this.isPaused.set(nowPaused);

    if (nowPaused && this.syncRetryTimer) {
      clearTimeout(this.syncRetryTimer);
      this.syncRetryTimer = null;
    }

    if (this.comparisonMode()) {
      this.algoQueues.forEach(queue => {
        if (!queue.sessionId) return;
        this.websocketService.send(
          nowPaused ? '/app/session.pause' : '/app/session.resume',
          { sessionId: queue.sessionId }
        );
      });
      if (!nowPaused) this.tryDrainSync();
    } else {
      if (!this.currentSessionId) return;
      this.websocketService.send(
        nowPaused ? '/app/session.pause' : '/app/session.resume',
        { sessionId: this.currentSessionId }
      );
    }
  }

  nextStep(): void {
    if (!this.isPaused()) return;

    if (this.comparisonMode()) {
      this.algoQueues
        .filter(queue => !queue.done && queue.sessionId)
        .forEach(queue => {
          this.websocketService.send('/app/session.step', { sessionId: queue.sessionId });
        });
    } else {
      if (!this.currentSessionId) return;
      this.websocketService.send('/app/session.step', { sessionId: this.currentSessionId });
    }
  }

  execute(): void {
    if (this.currentSessionId) {
      this.websocketService.send('/app/session.stop', this.currentSessionId);
    }
    if (this.isRunning()) return;
    this.isPaused.set(false);
    this.outputNumbers.set([]);
    this.rebuildInstances(this.currentArray);
    this.isRunning.set(true);

    const currentInstances = this.instances();
    let completedCount = 0;

    currentInstances.forEach(instance => {
      const sessionId = crypto.randomUUID();
      this.websocketService.subscribe<ExecuteResult>(`/topic/execute.${sessionId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          this.instances.update(list =>
            list.map(item => item.name !== instance.name ? item : {
              ...item,
              bars:          result.sortedArray.map(value => ({ value, state: 'sorted' as const })),
              comparisons:   result.comparisons,
              swaps:         result.swaps,
              pivots:        result.pivots,
              sortedCount:   result.sortedArray.length,
              done:          true,
              sortedIndices: new Set(result.sortedArray.map((_, index) => index)),
            })
          );
          this.outputNumbers.set(result.sortedArray);
          if (++completedCount === currentInstances.length) this.isRunning.set(false);
        });
      this.websocketService.send('/app/session.execute', {
        algo:     instance.name,
        array:    this.currentArray,
        sessionId,
        dataType: this.selectedDataType().toUpperCase(),
      });
    });
  }

  // ── Solo run ───────────────────────────────────────────────────────────────

  private startSolo(): void {
    const firstInstance = this.instances()[0];
    const sessionId     = crypto.randomUUID();
    this.currentSessionId = sessionId;

    this.websocketService.subscribe<SortStep>(`/topic/session.${sessionId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(step => this.applyStep(firstInstance.name, step));

    this.websocketService.send('/app/session.start', {
      algo:     firstInstance.name,
      array:    this.currentArray,
      sessionId,
      dataType: this.selectedDataType().toUpperCase(),
      speedMs:  this.speedMs(),
    });
  }

  // ── Comparison run ─────────────────────────────────────────────────────────

  private readonly LARGE_ARRAY_THRESHOLD = 200;

  private startComparison(): void {
    const currentInstances = this.instances();
    this.algoQueues = currentInstances.map(instance => ({
      name: instance.name, queue: [], done: false,
      sessionId: crypto.randomUUID(),
      stepCount: 0,
    }));
    this.syncScheduled = false;

    const isLargeArray = this.arraySize() > this.LARGE_ARRAY_THRESHOLD;

    this.algoQueues.forEach(queue => {
      this.websocketService.subscribe<SortStep>(`/topic/session.${queue.sessionId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe(step => {
          queue.queue.push(step);
          queue.stepCount++;
          this.tryDrainSync();
        });

      this.websocketService.send('/app/session.start', {
        algo:      queue.name,
        array:     this.currentArray,
        sessionId: queue.sessionId,
        dataType:  this.selectedDataType().toUpperCase(),
        speedMs:   isLargeArray ? 0 : this.speedMs(),
      });
    });
  }

  private tryDrainSync(): void {
    if (this.isPaused() || !this.isRunning() || this.syncScheduled) return;

    const activeQueues = this.algoQueues.filter(queue => !queue.done);
    if (activeQueues.length === 0) return;

    const allQueuesReady = activeQueues.every(queue => queue.queue.length > 0);

    if (!allQueuesReady) {
      if (this.syncRetryTimer) clearTimeout(this.syncRetryTimer);
      this.syncRetryTimer = setTimeout(() => {
        this.syncRetryTimer = null;
        this.tryDrainSync();
      }, 10);
      return;
    }

    this.syncScheduled = true;

    const delay = this.speedMs();

    const proceed = () => {
      this.syncScheduled = false;
      if (this.isPaused() || !this.isRunning()) return;

      const stillActiveQueues = this.algoQueues.filter(queue => !queue.done);
      if (stillActiveQueues.length === 0) return;

      if (!stillActiveQueues.every(queue => queue.queue.length > 0)) {
        if (this.syncRetryTimer) clearTimeout(this.syncRetryTimer);
        this.syncRetryTimer = setTimeout(() => {
          this.syncRetryTimer = null;
          this.tryDrainSync();
        }, 10);
        return;
      }

      stillActiveQueues.forEach(queue => {
        const step = queue.queue.shift()!;
        if (step.type === 'DONE') queue.done = true;
        this.applyStep(queue.name, step);
      });

      this.tryDrainSync();
    };

    if (delay <= 1) {
      Promise.resolve().then(proceed);
    } else {
      timer(delay)
        .pipe(takeUntil(this.destroy$))
        .subscribe(proceed);
    }
  }

  // ── Apply step ─────────────────────────────────────────────────────────────

  private applyStep(algoName: string, step: SortStep): void {
    this.instances.update(list =>
      list.map(instance => {
        if (instance.name !== algoName) return instance;

        const sortedIndices = new Set(instance.sortedIndices);
        let { comparisons, swaps, pivots, sortedCount } = instance;

        if (step.type === 'COMPARE') comparisons++;
        if (step.type === 'SWAP')    swaps++;
        if (step.type === 'PIVOT')   pivots++;
        if (step.type === 'SORTED') {
          sortedIndices.add(step.indexA);
          sortedCount = sortedIndices.size;
        }
        if (step.type === 'DONE') {
          sortedIndices.clear();
          step.stateSnapshot.forEach((_, index) => sortedIndices.add(index));
          sortedCount = step.stateSnapshot.length;
        }

        const bars = step.stateSnapshot.map((value, index) => ({
          value,
          state: this.barStateForIndex(index, step, sortedIndices),
        }));

        return {
          ...instance, bars, comparisons, swaps, pivots, sortedCount,
          done: step.type === 'DONE',
          sortedIndices,
        };
      })
    );

    if (step.type === 'DONE') {
      this.outputNumbers.set([...step.stateSnapshot]);
      if (this.allDone()) {
        this.isRunning.set(false);
        this.isPaused.set(false);
      }
    }
  }
}