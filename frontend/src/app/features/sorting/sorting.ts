import {
  Component, OnDestroy, OnInit, ViewChildren, QueryList,
  ElementRef, signal, computed, inject, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, timer, of, Observable, takeUntil } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { WebsocketService } from '../../core/websocket';
import { ALGO_CODE, CODE_LANGUAGES, CodeLanguage, ALGO_COMPLEXITY, ALGO_DESCRIPTIONS } from './code/algo-code.constants';
import { DecimalPipe } from '@angular/common';

interface SortStep {
  type: 'COMPARE' | 'SWAP' | 'PIVOT' | 'SORTED' | 'DONE';
  indexA: number;
  indexB: number;
  stateSnapshot: number[];
}

interface ExecuteResult {
  sortedArray: number[];
  comparisons: number;
  swaps: number;
  pivots: number;
  sessionId: string;
}

interface Bar {
  value: number;
  state: 'default' | 'compare' | 'swap' | 'pivot' | 'sorted';
}

interface AlgoInstance {
  name: string;
  bars: Bar[];
  comparisons: number;
  swaps: number;
  pivots: number;
  sortedCount: number;
  done: boolean;
  sortedIndices: Set<number>;
}

interface AlgoQueue {
  name: string;
  queue: SortStep[];
  done: boolean;
  sub?: Subscription;
}

export type DataType = 'int' | 'float' | 'double' | 'long';
export const DATA_TYPES: DataType[] = ['int', 'float', 'double', 'long'];

@Component({
  selector: 'app-sorting',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './sorting.html',
  styleUrl: './sorting.scss'
})
export class SortingComponent implements OnInit, OnDestroy {
  private ws        = inject(WebsocketService);
  private cdr       = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  readonly ALL_ALGOS      = ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Bubble Sort'];
  readonly CODE_LANGUAGES = CODE_LANGUAGES;
  readonly DATA_TYPES     = DATA_TYPES;
  readonly ALGO_DESCRIPTIONS = ALGO_DESCRIPTIONS;

  comparisonMode   = signal(false);
  isPaused         = signal(false);
  isRunning        = signal(false);
  sidebarOpen      = signal(true);
  showRunDropdown  = signal(false);
  showInput  = signal(false);
  showOutput = signal(false);

  selectedAlgos    = signal<string[]>(['Merge Sort']);
  arraySize        = signal(50);
  speedMs          = signal(1);
  selectedDataType = signal<DataType>('int');

  instances        = signal<AlgoInstance[]>([this.makeInstance('Merge Sort', [])]);

  selectedCodeAlgo = signal<string | null>(null);
  selectedLanguage = signal<CodeLanguage>('Java');

  userInputRaw     = signal('');
  outputNumbers    = signal<number[]>([]);

  manualInput  = signal(false);  // toggle entrée manuelle
  minValue     = signal(0);
  maxValue    = signal(100);

  private stepTrigger$ = new Subject<void>();
  private destroy$     = new Subject<void>();
  private currentArray: number[] = [];
  private initialArray: number[] = [];

  private algoQueues: AlgoQueue[]  = [];
  private syncLoopActive           = false;

  // ── Computed ──────────────────────────────────────────────────────────────

  allDone      = computed(() => this.instances().length > 0 && this.instances().every(i => i.done));
  showNextStep = computed(() => this.isPaused() && this.isRunning());
  complexity   = computed(() => this.selectedCodeAlgo() ? (ALGO_COMPLEXITY[this.selectedCodeAlgo()!] ?? null) : null);

  codeLines = computed(() => {
    const algo = this.selectedCodeAlgo();
    if (!algo) return [];
    const code = ALGO_CODE[algo]?.[this.selectedLanguage()] ?? '';
    return this.applyDataType(code, this.selectedDataType()).split('\n');
  });

  parsedInput = computed(() => {
    const raw = this.userInputRaw().trim();
    if (!raw) return null;
    const nums = raw.split(/[,;\s]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
    return nums.length > 0 ? nums : null;
  });

  maxAbsValue = computed(() => {
    const inst = this.instances()[0];
    if (!inst?.bars.length) return 310;
    const vals = inst.bars.map(b => b.value);
    return Math.max(...vals.map(Math.abs), 1);
  });

  hasNegativeValues = computed(() => {
    const inst = this.instances()[0];
    if (!inst?.bars.length) return false;
    return inst.bars.some(b => b.value < 0);
  });

  // Ticks Y adaptés aux valeurs négatives
  yTicks = computed((): { value: number; pct: number }[] => {
    const inst = this.instances()[0];
    if (!inst?.bars.length) return [];
    const vals   = inst.bars.map(b => b.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals, 1);
    const total  = maxVal - minVal;
    if (total === 0) return [];

    const tickCount = 5;
    const step = total / tickCount;
    return Array.from({ length: tickCount + 1 }, (_, i) => {
      const value = minVal + step * i;
      const pct   = ((value - minVal) / total) * 100;
      return { value: parseFloat(value.toFixed(1)), pct };
    });
  });

  description = computed(() => {
    const algo = this.selectedCodeAlgo();
    if (!algo) return null;
    return ALGO_DESCRIPTIONS[algo] ?? null;
  });

  // Helpers
  onMinValueChange(v: number): void    { this.minValue.set(v); this.generateArray(); }
  onMaxValueChange(v: number): void    { this.maxValue.set(v); this.generateArray(); }
  toggleManualInput(): void            { this.manualInput.update(v => !v); this.generateArray(); }
  incrementMin(delta: number): void    { this.minValue.update(v => v + delta); this.generateArray(); }
  incrementMax(delta: number): void    { this.maxValue.update(v => v + delta); this.generateArray(); }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.ws.connect().subscribe();
    this.generateArray();
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    this.ws.disconnect();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private makeInstance(name: string, arr: number[]): AlgoInstance {
    return {
      name,
      bars: arr.map(v => ({ value: v, state: 'default' })),
      comparisons: 0, swaps: 0, pivots: 0, sortedCount: 0,
      done: false, sortedIndices: new Set()
    };
  }

  unsortedCount(inst: AlgoInstance): number {
    return this.arraySize() - inst.sortedIndices.size;
  }

  barLayout(val: number): { height: number; bottom: number } {
    const maxAbs  = this.maxAbsValue();
    const hasNeg  = this.hasNegativeValues();
    const minVal  = hasNeg ? Math.min(...this.instances()[0].bars.map(b => b.value)) : 0;
    const maxVal  = Math.max(...this.instances()[0].bars.map(b => b.value), 1);
    const total   = maxVal - minVal;

    if (total === 0) return { height: 0, bottom: 50 };

    const zeroPct    = hasNeg ? (-minVal / total) * 100 : 0;
    const heightPct  = (Math.abs(val) / total) * 100;
    const bottomPct  = val >= 0 ? zeroPct : zeroPct - heightPct;

    return { height: heightPct, bottom: bottomPct };
  }


  private applyDataType(code: string, type: DataType): string {
    if (type === 'int') return code;
    return code.replace(/\bint(?=\s+\w)/g, type).replace(/\bint\[\]/g, `${type}[]`);
  }

  formatOutput(values: number[]): string {
    const type = this.selectedDataType();
    return values.map(v => {
      if (type === 'float')  return v.toFixed(2) + 'f';
      if (type === 'double') return v.toFixed(4);
      if (type === 'long')   return v.toString() + 'L';
      return Math.round(v).toString();
    }).join(', ');
  }

  private normalizeValue(v: number): number {
    const type = this.selectedDataType();
    if (type === 'float')  return parseFloat(v.toFixed(2));
    if (type === 'double') return parseFloat(v.toFixed(4));
    return Math.trunc(v);
  }

  // ── Array ─────────────────────────────────────────────────────────────────

  generateArray(): void {
    const parsed = this.parsedInput();
    let arr: number[];

    if (this.manualInput() && parsed) {
      arr = parsed.map(v => this.normalizeValue(v));
      this.arraySize.set(arr.length);
    } else if (!this.manualInput()) {
      const type = this.selectedDataType();
      const min  = this.minValue();
      const max  = this.maxValue();
      const range = max - min;
      arr = Array.from({ length: this.arraySize() }, () => {
        const raw = Math.random() * range + min;
        if (type === 'float')  return parseFloat(raw.toFixed(2));
        if (type === 'double') return parseFloat(raw.toFixed(4));
        return Math.trunc(raw);
      });
    } else {
      // Manuel activé mais pas de valeurs saisies : tableau vide
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

  private rebuildInstances(arr: number[]): void {
    this.instances.set(
      this.selectedAlgos().map(name => this.makeInstance(name, arr))
    );
  }

  incrementSize(delta: number): void {
    const next = Math.min(1000, Math.max(2, this.arraySize() + delta));
    this.arraySize.set(next);
    this.generateArray();
  }

  onArraySizeInput(v: number): void {
    this.arraySize.set(Math.min(1000, Math.max(2, v || 2)));
    this.generateArray();
  }

  onSpeedChange(v: number): void { this.speedMs.set(v); }

  // ── Mode ──────────────────────────────────────────────────────────────────

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
      next = current.includes(algo) ? current.filter(a => a !== algo) : [...current, algo];
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

  // ── Code panel ────────────────────────────────────────────────────────────

  toggleCodePanel(algoName: string): void {
    this.selectedCodeAlgo.set(this.selectedCodeAlgo() === algoName ? null : algoName);
  }

  selectLanguage(lang: CodeLanguage): void { this.selectedLanguage.set(lang); }

  selectDataType(type: DataType): void {
    this.selectedDataType.set(type);
    this.generateArray();
  }

  highlightLine(line: string): SafeHtml {
    if (!line.trim()) return this.sanitizer.bypassSecurityTrustHtml('&nbsp;');
    const e = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const h = e
      .replace(/(["'`][^"'`]*["'`])/g, '<span class="hl-string">$1</span>')
      .replace(/\b(void|bool|boolean|return|if|else|for|while|break|true|false|null|new|class|function|def|let|const|var|static|public|private|import|from|int|float|double|long)\b/g,
        '<span class="hl-keyword">$1</span>')
      .replace(/\b(Arrays|Math|count|len|range|intdiv|vector|swap|print|console)\b/g,
        '<span class="hl-builtin">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')
      .replace(/(\/\/.*$)/g, '<span class="hl-comment">$1</span>')
      .replace(/(#.*$)/g, '<span class="hl-comment">$1</span>')
      .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="hl-fn">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(h);
  }

  // ── Controls ──────────────────────────────────────────────────────────────

  start(): void {
    if (this.isRunning()) return;
    this.showRunDropdown.set(false);
    this.isPaused.set(false);
    this.isRunning.set(true);
    this.outputNumbers.set([]);
    this.rebuildInstances(this.currentArray);
    // Envoyer la vitesse au backend avant de démarrer
    if (this.comparisonMode()) this.startComparison();
    else                       this.startSolo();
  }

  togglePause(): void {
    this.isPaused.update(v => !v);
    if (!this.isPaused()) {
      if (this.comparisonMode()) this.drainSyncLoop();
      // Solo : le pauseWatch interval dans startSolo s'en charge
    }
  }

  nextStep(): void {
    if (!this.isPaused()) return;
    if (this.comparisonMode()) {
      const active = this.algoQueues.filter(aq => !aq.done);
      if (!active.every(aq => aq.queue.length > 0)) return;
      active.forEach(aq => {
        const step = aq.queue.shift()!;
        if (step.type === 'DONE') aq.done = true;
        this.applyStep(aq.name, step);
      });
    } else {
      this.stepTrigger$.next();
    }
  }

  // ── Execute (instantané) ──────────────────────────────────────────────────

  execute(): void {
    if (this.isRunning()) return;
    this.showRunDropdown.set(false);
    this.outputNumbers.set([]);
    this.rebuildInstances(this.currentArray);
    this.isRunning.set(true);

    const algos = this.instances();
    let doneCount = 0;

    algos.forEach(inst => {
      const sessionId = crypto.randomUUID();
      this.ws.subscribe<ExecuteResult>(`/topic/execute.${sessionId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          this.instances.update(list =>
            list.map(i => {
              if (i.name !== inst.name) return i;
              return {
                ...i,
                bars: result.sortedArray.map(v => ({ value: v, state: 'sorted' as const })),
                comparisons:  result.comparisons,
                swaps:        result.swaps,
                pivots:       result.pivots,
                sortedCount:  result.sortedArray.length,
                done:         true,
                sortedIndices: new Set(result.sortedArray.map((_, k) => k)),
              };
            })
          );
          this.outputNumbers.set(result.sortedArray);
          doneCount++;
          if (doneCount === algos.length) this.isRunning.set(false);
        });
      this.ws.send('/app/session.execute', { algo: inst.name, array: this.currentArray, sessionId });
    });
  }

  // ── Solo ──────────────────────────────────────────────────────────────────

  private startSolo(): void {
    const inst        = this.instances()[0];
    const sessionId   = crypto.randomUUID();
    const buffer: SortStep[] = [];
    let   processing  = false;
    const cancelStep$ = new Subject<void>();

    const processNext = () => {
      if (processing || buffer.length === 0 || this.isPaused()) return;
      processing = true;
      const step  = buffer.shift()!;
      const delay = this.speedMs();
      const d$: Observable<null | number> = delay <= 1 ? of(null) : timer(delay);

      d$.pipe(
        takeUntil(cancelStep$),
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.applyStep(inst.name, step);
          processing = false;
          processNext();
        },
        // Si annulé (pause), remettre le step dans le buffer
        complete: () => {
          if (processing) {
            buffer.unshift(step);
            processing = false;
          }
        }
      });
    };

    // Quand on pause : annuler le timer en cours
    const pauseWatch = setInterval(() => {
      if (!this.isRunning()) { clearInterval(pauseWatch); cancelStep$.complete(); return; }
      if (this.isPaused() && processing) {
        cancelStep$.next(); // annule le timer
      }
      if (!this.isPaused()) processNext(); // relance si on reprend
    }, 20);

    // Étape manuelle
    this.stepTrigger$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!this.isPaused() || buffer.length === 0) return;
      const step = buffer.shift()!;
      this.applyStep(inst.name, step);
    });

    this.ws.subscribe<SortStep>(`/topic/session.${sessionId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(step => { buffer.push(step); processNext(); });

    this.ws.send('/app/session.start', { algo: inst.name, array: this.currentArray, sessionId });
    this.ws.send('/app/session.speed', { sessionId, speedMs: this.speedMs() });
  }

  // ── Comparison ────────────────────────────────────────────────────────────

  private startComparison(): void {
    const algos = this.instances();
    this.algoQueues = algos.map(inst => ({ name: inst.name, queue: [], done: false }));

    algos.forEach((inst, idx) => {
      const sessionId = crypto.randomUUID();
      const aq        = this.algoQueues[idx];
      aq.sub = this.ws.subscribe<SortStep>(`/topic/session.${sessionId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe(step => {
          aq.queue.push(step);
          if (!this.syncLoopActive && !this.isPaused()) this.drainSyncLoop();
        });
      this.ws.send('/app/session.start', { algo: inst.name, array: this.currentArray, sessionId });
      this.ws.send('/app/session.speed', { sessionId, speedMs: this.speedMs() });
    });
  }

  private drainSyncLoop(): void {
    if (this.syncLoopActive || this.isPaused() || !this.isRunning()) return;
    const active = this.algoQueues.filter(aq => !aq.done);
    if (active.length === 0) return;
    if (!active.every(aq => aq.queue.length > 0)) return; // attendre que tout le monde ait un step

    this.syncLoopActive = true;
    const steps = active.map(aq => ({ name: aq.name, step: aq.queue.shift()! }));
    steps.forEach(({ name, step }) => {
      if (step.type === 'DONE') { const aq = this.algoQueues.find(q => q.name === name); if (aq) aq.done = true; }
      this.applyStep(name, step);
    });

    this.syncLoopActive = false;
    // Continuer sans délai si 1ms — sinon respecter le délai
    const delay = this.speedMs();
    if (delay <= 1) {
      // Micro-tâche pour ne pas bloquer le rendu
      Promise.resolve().then(() => this.drainSyncLoop());
    } else {
      timer(delay).pipe(takeUntil(this.destroy$)).subscribe(() => this.drainSyncLoop());
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

        // Calculer les bars APRÈS avoir mis à jour sortedIndices
        const bars = step.stateSnapshot.map((v, idx) => ({
          value: v,
          state: this.barStateForIndex(idx, step, sortedIndices)
        }));

        return {
          ...i,
          bars,
          comparisons, swaps, pivots, sortedCount,
          done: step.type === 'DONE',
          sortedIndices,
        };
      })
    );

    if (step.type === 'DONE') {
      this.outputNumbers.set([...step.stateSnapshot]);
      if (this.allDone()) { this.isRunning.set(false); this.isPaused.set(false); }
    }
  }

  private barStateForIndex(idx: number, step: SortStep, sortedIndices: Set<number>): Bar['state'] {
    if (step.type === 'DONE') return 'sorted';
    if (sortedIndices.has(idx)) return 'sorted';
    if (idx === step.indexA || idx === step.indexB) {
      if (step.type === 'SWAP')  return 'swap';
      if (step.type === 'PIVOT') return 'pivot';
      return 'compare';
    }
    return 'default';
  }
}