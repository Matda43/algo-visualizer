import {
  Component, ElementRef, OnDestroy, OnInit,
  ViewChildren, QueryList, signal, computed, inject, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription, concatMap, timer, of } from 'rxjs';
import { WebsocketService } from '../../core/websocket';

interface SortStep {
  type: 'COMPARE' | 'SWAP' | 'PIVOT' | 'SORTED' | 'DONE';
  indexA: number;
  indexB: number;
  stateSnapshot: number[];
}

interface AlgoInstance {
  name: string;
  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  comparisons: number;
  swaps: number;
  done: boolean;
  sortedIndices: Set<number>;
  sub?: Subscription;
}

@Component({
  selector: 'app-sorting',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './sorting.html',
  styleUrl: './sorting.scss'
})
export class SortingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('algoCanvas') canvasRefs!: QueryList<ElementRef<HTMLCanvasElement>>;

  private ws = inject(WebsocketService);
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);

  readonly ALL_ALGOS = ['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Heap Sort'];

  selectedAlgos = signal<string[]>(['Bubble Sort']);
  arraySize = signal(50);
  speedMs = signal(100);
  isRunning = signal(false);

  // Instances initialisées avec les noms dès le départ
  instances = signal<AlgoInstance[]>([
    { name: 'Bubble Sort', comparisons: 0, swaps: 0, done: false, sortedIndices: new Set() }
  ]);

  private currentArray: number[] = [];
  private ro!: ResizeObserver;

  allDone = computed(() =>
    this.instances().length > 0 && this.instances().every(i => i.done)
  );

  ngOnInit(): void {
    this.ws.connect().subscribe();
    this.generateArray();
  }

  ngAfterViewInit(): void {
    // Attendre que Angular rende les canvas
    setTimeout(() => this.attachCanvases(), 0);

    this.canvasRefs.changes.subscribe(() => {
      setTimeout(() => this.attachCanvases(), 0);
    });
  }

  private attachCanvases(): void {
    const canvases = this.canvasRefs.toArray();
    if (canvases.length === 0) return;

    this.instances.update(list =>
      list.map((inst, i) => {
        const canvas = canvases[i]?.nativeElement;
        if (!canvas) return inst;
        const ctx = canvas.getContext('2d')!;
        return { ...inst, canvas, ctx };
      })
    );

    // ResizeObserver
    if (this.ro) this.ro.disconnect();
    this.ro = new ResizeObserver(() => this.resizeAll());
    canvases.forEach(ref => {
      const parent = ref.nativeElement.parentElement;
      if (parent) this.ro.observe(parent);
    });

    setTimeout(() => {
      this.resizeAll();
      this.drawAll();
    }, 50);
  }

  private resizeAll(): void {
    this.instances().forEach(inst => {
      if (!inst.canvas) return;
      const parent = inst.canvas.parentElement;
      if (!parent) return;
      inst.canvas.width = parent.clientWidth;
      inst.canvas.height = parent.clientHeight;
    });
    this.drawAll();
  }

  private drawAll(): void {
    this.instances().forEach(inst => {
      if (!inst.canvas || !inst.ctx) return;
      this.drawArray(inst as Required<AlgoInstance>, this.currentArray, -1, -1, 'COMPARE');
    });
  }

  toggleAlgo(algo: string): void {
    if (this.isRunning()) return;
    const current = this.selectedAlgos();
    const next = current.includes(algo)
      ? current.filter(a => a !== algo)
      : [...current, algo];
    if (next.length === 0) return;

    this.selectedAlgos.set(next);

    // Recréer les instances avec les noms dans l'ordre sélectionné
    this.instances.set(
      next.map(name => ({
        name,
        comparisons: 0, swaps: 0,
        done: false,
        sortedIndices: new Set<number>()
      }))
    );

    // Forcer la détection de changement puis re-attacher les canvas
    this.cdr.detectChanges();
    setTimeout(() => this.attachCanvases(), 0);
  }

  generateArray(): void {
    this.currentArray = Array.from(
      { length: this.arraySize() },
      () => Math.floor(Math.random() * 300) + 10
    );
    this.drawAll();
  }

  onArraySizeChange(value: number): void {
    this.arraySize.set(value);
    this.generateArray();
  }

  onSpeedChange(value: number): void {
    this.speedMs.set(value);
  }

  start(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);

    this.instances.update(list =>
      list.map(inst => ({
        ...inst,
        comparisons: 0, swaps: 0,
        done: false,
        sortedIndices: new Set<number>()
      }))
    );

    this.instances().forEach(inst => {
      if (inst.canvas && inst.ctx) this.runAlgo(inst as Required<AlgoInstance>);
    });
  }

  private runAlgo(inst: Required<AlgoInstance>): void {
    const sessionId = crypto.randomUUID();
    const algoName = inst.name;

    inst.sub = this.ws
      .subscribe<SortStep>(`/topic/session.${sessionId}`)
      .pipe(
        concatMap(step => {
          const delay = this.speedMs();
          return delay <= 16 ? of(step) : timer(delay).pipe(concatMap(() => of(step)));
        })
      )
      .subscribe(step => {
        this.instances.update(list =>
          list.map(i => {
            if (i.name !== algoName) return i;
            const updated = { ...i };
            if (step.type === 'COMPARE') updated.comparisons++;
            if (step.type === 'SWAP') updated.swaps++;
            if (step.type === 'SORTED') {
              updated.sortedIndices = new Set([...i.sortedIndices, step.indexA]);
            }
            if (step.type === 'DONE') {
              updated.done = true;
              updated.sortedIndices = new Set(
                Array.from({ length: this.arraySize() }, (_, k) => k)
              );
            }
            return updated;
          })
        );

        const current = this.instances().find(i => i.name === algoName);
        if (current?.canvas && current?.ctx) {
          this.drawArray(current as Required<AlgoInstance>, step.stateSnapshot, step.indexA, step.indexB, step.type);
        }

        if (step.type === 'DONE' && this.allDone()) {
          this.isRunning.set(false);
        }
      });

    this.ws.send('/app/session.start', {
      algo: inst.name,
      array: this.currentArray,
      sessionId
    });
  }

  private drawArray(
    inst: Required<AlgoInstance>,
    arr: number[],
    indexA: number,
    indexB: number,
    type: string
  ): void {
    const { canvas, ctx, sortedIndices } = inst;
    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h || !arr.length) return;

    ctx.clearRect(0, 0, w, h);
    const barWidth = w / arr.length;

    arr.forEach((val, i) => {
      let color: string;
      if (sortedIndices.has(i)) {
        color = '#e8ff00';
      } else if (i === indexA || i === indexB) {
        color = type === 'SWAP'  ? '#D85A30'
              : type === 'PIVOT' ? '#BA7517'
              : '#1D9E75';
      } else {
        color = 'rgba(108, 99, 212, 0.8)';
      }

      ctx.fillStyle = color;
      ctx.fillRect(
        i * barWidth + 0.5,
        h - (val / 310) * h,
        Math.max(barWidth - 1, 1),
        (val / 310) * h
      );
    });

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 13px Inter, sans-serif';

    // Badge DONE
    if (inst.done) {
      ctx.fillStyle = 'rgba(232,255,0,0.15)';
      ctx.fillRect(w - 80, 8, 68, 22);
      ctx.fillStyle = '#e8ff00';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillText('TERMINÉ ✓', w - 74, 23);
    }
  }

  ngOnDestroy(): void {
    this.instances().forEach(inst => inst.sub?.unsubscribe());
    this.ro?.disconnect();
    this.ws.disconnect();
  }
}