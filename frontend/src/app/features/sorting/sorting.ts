import { Component, OnDestroy, OnInit, signal, computed, inject } from '@angular/core';
import { Subject, Subscription, timer, takeUntil } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { WebsocketService } from '../../core/websocket';
import { AlgoMetadataService } from './services/algo-metadata.service';
import { AlgoMetadata } from './models/algo-metadata.model';
import { AlgoInstance, Bar, SortStep, ExecuteResult, DATA_TYPES, DataType, ViewMode } from './models/sorting.models';
import { VizInstanceComponent } from './viz-instance/viz-instance';

export type CodeLanguage = string;

interface AlgoQueue {
  name:         string;
  queue:        SortStep[];
  done:         boolean;
  sessionId?:   string;
  sub?:         Subscription;
  stepCount:    number;
  displayCount: number;
}

@Component({
  selector:    'app-sorting',
  standalone:  true,
  imports:     [VizInstanceComponent],
  templateUrl: './sorting.html',
  styleUrl:    './sorting.scss',
})
export class SortingComponent implements OnInit, OnDestroy {

  // ── Injections ────────────────────────────────────────────────────────────
  private readonly ws              = inject(WebsocketService);
  private readonly sanitizer       = inject(DomSanitizer);
  private readonly algoMetaSvc     = inject(AlgoMetadataService);

  // ── Constants ─────────────────────────────────────────────────────────────
  readonly DATA_TYPES = DATA_TYPES;

  // ── Metadata (from backend) ───────────────────────────────────────────────
  allMetadata   = signal<AlgoMetadata[]>([]);
  allAlgoNames  = computed(() => this.allMetadata().map(m => m.name));

  // ── UI state ──────────────────────────────────────────────────────────────
  comparisonMode  = signal(false);
  isPaused        = signal(false);
  isRunning       = signal(false);
  sidebarOpen     = signal(true);
  showRunDropdown = signal(false);
  showInput       = signal(false);
  showOutput      = signal(false);
  viewMode        = signal<ViewMode>('bars');
  showParams = signal(false);

  getMetaForAlgo(name: string): AlgoMetadata | null {
    return this.allMetadata().find(m => m.name === name) ?? null;
  }

  // ── Algo selection ────────────────────────────────────────────────────────
  selectedAlgos    = signal<string[]>([]);
  selectedCodeAlgo = signal<string | null>(null);
  selectedLanguage = signal<CodeLanguage>('Java');
  selectedDataType = signal<DataType>('int');

  // ── Array params ──────────────────────────────────────────────────────────
  arraySize    = signal(50);
  speedMs      = signal(1);
  minValue     = signal(0);
  maxValue     = signal(300);
  manualInput  = signal(false);
  userInputRaw = signal('');
  outputNumbers = signal<number[]>([]);

  // ── Viz instances ─────────────────────────────────────────────────────────
  instances = signal<AlgoInstance[]>([]);

  // ── Private ───────────────────────────────────────────────────────────────
  private stepTrigger$ = new Subject<void>();
  private destroy$     = new Subject<void>();
  private currentArray: number[] = [];
  private initialArray: number[] = [];
  private algoQueues: AlgoQueue[] = [];
  private syncLoopActive = false;
  private currentSessionId: string | null = null;

  // ── Computed ──────────────────────────────────────────────────────────────

  allDone = computed(() =>
    this.instances().length > 0 && this.instances().every(i => i.done)
  );

  showNextStep = computed(() => this.isPaused() && this.isRunning());

  selectedMetadata = computed(() => {
    const algo = this.selectedCodeAlgo();
    if (!algo) return null;
    return this.allMetadata().find(m => m.name === algo) ?? null;
  });

  availableLanguages = computed(() => {
    const meta = this.selectedMetadata();
    if (!meta) return ['Java', 'Python', 'C++', 'C', 'C#', 'JavaScript', 'PHP'];
    return Object.keys(meta.codeByLanguage);
  });

  codeLines = computed(() => {
    const meta = this.selectedMetadata();
    if (!meta) return [];
    const code = meta.codeByLanguage[this.selectedLanguage()] ?? '';
    return this.applyDataType(code, this.selectedDataType()).split('\n');
  });

  parsedInput = computed(() => {
    const raw = this.userInputRaw().trim();
    if (!raw) return null;
    const nums = raw.split(/[,;\s]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
    return nums.length > 0 ? nums : null;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.ws.connect().subscribe();
    this.algoMetaSvc.getAll().subscribe(metadata => {
      this.allMetadata.set(metadata);
      if (metadata.length > 0) {
        this.selectedAlgos.set([metadata[0].name]);
        this.generateArray();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.syncRetryTimer) clearTimeout(this.syncRetryTimer);
    if (this.currentSessionId) this.ws.send('/app/session.stop', this.currentSessionId);
    this.algoQueues.forEach(aq => {
      if (aq.sessionId) this.ws.send('/app/session.stop', aq.sessionId);
    });
    this.destroy$.next();
    this.destroy$.complete();
    this.ws.disconnect();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private makeInstance(name: string, arr: number[]): AlgoInstance {
    return {
      name,
      bars:         arr.map(v => ({ value: v, state: 'default' })),
      comparisons:  0,
      swaps:        0,
      pivots:       0,
      sortedCount:  0,
      done:         false,
      sortedIndices: new Set(),
    };
  }

  private rebuildInstances(arr: number[]): void {
    this.instances.set(
      this.selectedAlgos().map(name => this.makeInstance(name, arr))
    );
  }

  private normalizeValue(v: number): number {
    switch (this.selectedDataType()) {
      case 'float':  return parseFloat(v.toFixed(2));
      case 'double': return parseFloat(v.toFixed(4));
      default:       return Math.trunc(v);
    }
  }

  private applyDataType(code: string, type: DataType): string {
    if (type === 'int') return code;
    return code
      .replace(/\bint(?=\s+\w)/g, type)
      .replace(/\bint\[\]/g, `${type}[]`);
  }

  private barStateForIndex(
    idx: number, step: SortStep, sortedIndices: Set<number>
  ): Bar['state'] {
    if (step.type === 'DONE') return 'sorted';
    if (sortedIndices.has(idx)) return 'sorted';
    if (idx === step.indexA || idx === step.indexB) {
      if (step.type === 'SWAP')  return 'swap';
      if (step.type === 'PIVOT') return 'pivot';
      return 'compare';
    }
    return 'default';
  }

  // ── Formatting ────────────────────────────────────────────────────────────

  formatOutput(values: number[]): string {
    return values.map(v => this.formatValue(v)).join(', ');
  }

  formatValue(v: number): string {
    switch (this.selectedDataType()) {
      case 'float':  return v.toFixed(2) + 'f';
      case 'double': return v.toFixed(4);
      case 'long':   return v.toString() + 'L';
      default:       return Math.round(v).toString();
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

  // ── Array generation ──────────────────────────────────────────────────────

  generateArray(): void {
    const parsed = this.parsedInput();
    let arr: number[];

    if (this.manualInput() && parsed) {
      arr = parsed.map(v => this.normalizeValue(v));
      this.arraySize.set(arr.length);
    } else if (!this.manualInput()) {
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
    } else {
      arr = [];
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

  // ── Array param changes ───────────────────────────────────────────────────

  onArraySizeInput(v: number): void {
    this.arraySize.set(Math.min(1000, Math.max(2, v || 2)));
    this.generateArray();
  }

  incrementSize(delta: number): void {
    this.arraySize.update(v => Math.min(1000, Math.max(2, v + delta)));
    this.generateArray();
  }

// ── Speed change — propaguer au backend ───────────────────────────────────

  onSpeedChange(v: number): void {
    this.speedMs.set(v);
    if (!this.isRunning()) return;

    if (this.comparisonMode()) {
      this.algoQueues.forEach(aq => {
        if (aq.sessionId) this.ws.send('/app/session.speed', { sessionId: aq.sessionId, speedMs: v });
      });
    } else if (this.currentSessionId) {
      this.ws.send('/app/session.speed', { sessionId: this.currentSessionId, speedMs: v });
    }
  }
  onMinValueChange(v: number): void  { this.minValue.set(v);  this.generateArray(); }
  onMaxValueChange(v: number): void  { this.maxValue.set(v);  this.generateArray(); }
  incrementMin(delta: number): void  { this.minValue.update(v => v + delta);  this.generateArray(); }
  incrementMax(delta: number): void  { this.maxValue.update(v => v + delta);  this.generateArray(); }

  toggleManualInput(): void {
    this.manualInput.update(v => !v);
    this.generateArray();
  }

  // ── Mode toggles ──────────────────────────────────────────────────────────

  toggleComparisonMode(): void {
    if (this.isRunning()) return;
    const next = !this.comparisonMode();
    this.comparisonMode.set(next);
    if (!next) {
      const first = this.selectedAlgos()[0];
      this.selectedAlgos.set([first]);
      this.rebuildInstances(this.currentArray);
    }
    if (next) this.selectedCodeAlgo.set(null);
  }

  toggleAlgo(algo: string): void {
    if (this.isRunning()) return;
    const current = this.selectedAlgos();
    let next: string[];

    if (this.comparisonMode()) {
      next = current.includes(algo)
        ? current.filter(a => a !== algo)
        : [...current, algo];
      if (next.length === 0) return;
    } else {
      if (current[0] === algo) return;
      next = [algo];
      this.selectedCodeAlgo.set(null);
    }

    this.selectedAlgos.set(next);
    this.rebuildInstances(this.currentArray);
  }

  toggleSidebar(): void    { this.sidebarOpen.update(v => !v); }
  toggleRunDropdown(): void { this.showRunDropdown.update(v => !v); }
  toggleViewMode(): void   { this.viewMode.update(v => v === 'bars' ? 'numbers' : 'bars'); }

  toggleCodePanel(algoName: string): void {
    this.selectedCodeAlgo.update(current =>
      current === algoName ? null : algoName
    );
  }

  selectLanguage(lang: CodeLanguage): void { this.selectedLanguage.set(lang); }

  selectDataType(type: DataType): void {
    this.selectedDataType.set(type);
    this.generateArray();
  }

  // ── Run controls ──────────────────────────────────────────────────────────

  start(): void {
    if (this.isRunning()) return;
    this.showRunDropdown.set(false);
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
      this.algoQueues.forEach(aq => {
        if (!aq.sessionId) return;
        this.ws.send(
          nowPaused ? '/app/session.pause' : '/app/session.resume',
          { sessionId: aq.sessionId }
        );
      });
      if (!nowPaused) this.tryDrainSync();
    } else {
      if (!this.currentSessionId) return;
      this.ws.send(
        nowPaused ? '/app/session.pause' : '/app/session.resume',
        { sessionId: this.currentSessionId }
      );
    }
  }

  nextStep(): void {
    if (!this.isPaused()) return;

    if (this.comparisonMode()) {
      // Envoyer /session.step à chaque algo actif
      this.algoQueues
        .filter(aq => !aq.done && aq.sessionId)
        .forEach(aq => {
          this.ws.send('/app/session.step', { sessionId: aq.sessionId });
        });
    } else {
      if (!this.currentSessionId) return;
      this.ws.send('/app/session.step', { sessionId: this.currentSessionId });
    }
  }

  execute(): void {
    if (this.currentSessionId) {
      this.ws.send('/app/session.stop', this.currentSessionId);
    }
    if (this.isRunning()) return;
    this.showRunDropdown.set(false);
    this.outputNumbers.set([]);
    this.rebuildInstances(this.currentArray);
    this.isRunning.set(true);

    const algos     = this.instances();
    let   doneCount = 0;

    algos.forEach(inst => {
      const sessionId = crypto.randomUUID();
      this.ws.subscribe<ExecuteResult>(`/topic/execute.${sessionId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          this.instances.update(list =>
            list.map(i => i.name !== inst.name ? i : {
              ...i,
              bars: result.sortedArray.map(v => ({ value: v, state: 'sorted' as const })),
              comparisons:   result.comparisons,
              swaps:         result.swaps,
              pivots:        result.pivots,
              sortedCount:   result.sortedArray.length,
              done:          true,
              sortedIndices: new Set(result.sortedArray.map((_, k) => k)),
            })
          );
          this.outputNumbers.set(result.sortedArray);
          if (++doneCount === algos.length) this.isRunning.set(false);
        });
      this.ws.send('/app/session.execute', {
        algo:     inst.name,
        array:    this.currentArray,
        sessionId,
        dataType: this.selectedDataType().toUpperCase(),
      });
    });
  }

  // ── Solo run ──────────────────────────────────────────────────────────────

  private startSolo(): void {
    const inst      = this.instances()[0];
    const sessionId = crypto.randomUUID();
    this.currentSessionId = sessionId;

    this.ws.subscribe<SortStep>(`/topic/session.${sessionId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(step => this.applyStep(inst.name, step));

    this.ws.send('/app/session.start', {
      algo:     inst.name,
      array:    this.currentArray,
      sessionId,
      dataType: this.selectedDataType().toUpperCase(),
      speedMs:  this.speedMs(),
    });
  }


  // ── Comparison run ────────────────────────────────────────────────────────

  private readonly BATCH_SIZE = 50; // steps par demande
  private readonly LARGE_ARRAY_THRESHOLD = 200;

  private startComparison(): void {
    const algos = this.instances();
    this.algoQueues = algos.map(inst => ({
      name: inst.name, queue: [], done: false,
      sessionId: crypto.randomUUID(),
      stepCount: 0, displayCount: 0
    }));
    this.syncScheduled = false;

    const isLargeArray = this.arraySize() > this.LARGE_ARRAY_THRESHOLD;

    this.algoQueues.forEach(aq => {
      this.ws.subscribe<SortStep>(`/topic/session.${aq.sessionId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe(step => {
          aq.queue.push(step);
          aq.stepCount++;
          this.tryDrainSync();
        });

      this.ws.send('/app/session.start', {
        algo:      aq.name,
        array:     this.currentArray,
        sessionId: aq.sessionId,
        dataType:  this.selectedDataType().toUpperCase(),
        // Pour grands tableaux : speedMs=0 = envoi immédiat de tous les steps
        speedMs:   isLargeArray ? 0 : this.speedMs(),
      });
    });
  }

  // Remplacer drainSyncLoop par tryDrainSync + une boucle continue
  private drainSyncLoop(): void {
    this.tryDrainSync();
  }

  private syncScheduled = false;
  private syncRetryTimer: ReturnType<typeof setTimeout> | null = null;

  private tryDrainSync(): void {
    if (this.isPaused() || !this.isRunning() || this.syncScheduled) return;

    const active = this.algoQueues.filter(aq => !aq.done);
    if (active.length === 0) return;

    const allReady = active.every(aq => aq.queue.length > 0);

    if (!allReady) {
      // Retry dans 10ms — les steps WS arrivent en async
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

      const stillActive = this.algoQueues.filter(aq => !aq.done);
      if (stillActive.length === 0) return;

      // Vérifier à nouveau que tous ont des steps
      if (!stillActive.every(aq => aq.queue.length > 0)) {
        // Retry
        if (this.syncRetryTimer) clearTimeout(this.syncRetryTimer);
        this.syncRetryTimer = setTimeout(() => {
          this.syncRetryTimer = null;
          this.tryDrainSync();
        }, 10);
        return;
      }

      // Consommer 1 step de chaque algo actif
      stillActive.forEach(aq => {
        const step = aq.queue.shift()!;
        aq.displayCount++;
        if (step.type === 'DONE') aq.done = true;
        this.applyStep(aq.name, step);
      });

      // Continuer immédiatement ou après délai
      this.tryDrainSync();
    };

    if (delay <= 1) {
      // Micro-task pour ne pas bloquer le rendu Angular
      Promise.resolve().then(proceed);
    } else {
      timer(delay)
        .pipe(takeUntil(this.destroy$))
        .subscribe(proceed);
    }
  }

  // ── Apply step ────────────────────────────────────────────────────────────

  private applyStep(algoName: string, step: SortStep): void {
    this.instances.update(list =>
      list.map(i => {
        if (i.name !== algoName) return i;

        const sortedIndices = new Set(i.sortedIndices);
        let { comparisons, swaps, pivots, sortedCount } = i;

        if (step.type === 'COMPARE') comparisons++;
        if (step.type === 'SWAP')    swaps++;
        if (step.type === 'PIVOT')   pivots++;
        if (step.type === 'SORTED') {
          sortedIndices.add(step.indexA);
          sortedCount = sortedIndices.size;
        }
        if (step.type === 'DONE') {
          sortedIndices.clear();
          step.stateSnapshot.forEach((_, k) => sortedIndices.add(k));
          sortedCount = step.stateSnapshot.length;
        }

        const bars = step.stateSnapshot.map((v, idx) => ({
          value: v,
          state: this.barStateForIndex(idx, step, sortedIndices),
        }));

        return {
          ...i, bars, comparisons, swaps, pivots, sortedCount,
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