import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../../core/websocket';
import { xpActions } from '../../store/xp/xp.actions';
import { selectLevel, selectTotalXp, selectXpProgress } from '../../store/xp/xp.selectors';

interface SortStep {
  type: 'COMPARE' | 'SWAP' | 'PIVOT' | 'SORTED' | 'DONE';
  indexA: number;
  indexB: number;
  stateSnapshot: number[];
}

@Component({
  selector: 'app-sorting',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './sorting.html',
  styleUrl: './sorting.scss'
})
export class SortingComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Injection moderne
  private ws = inject(WebsocketService);
  private store = inject(Store);

  // Signaux
  algorithms = signal(['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Heap Sort']);
  selectedAlgo = signal('Bubble Sort');
  arraySize = signal(50);
  speedMs = signal(100);
  isRunning = signal(false);
  comparisons = signal(0);
  swaps = signal(0);

  // Signaux depuis le store NgRx
  level = this.store.selectSignal(selectLevel);
  totalXp = this.store.selectSignal(selectTotalXp);
  xpProgress = this.store.selectSignal(selectXpProgress);

  // Computed
  canStart = computed(() => !this.isRunning());
  statsLabel = computed(() =>
    `🔍 ${this.comparisons()} comparaisons · 🔄 ${this.swaps()} échanges`
  );

  private ctx!: CanvasRenderingContext2D;
  private sub!: Subscription;
  private currentArray: number[] = [];

  ngOnInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.generateArray();
    this.ws.connect().subscribe();
  }

  generateArray(): void {
    this.currentArray = Array.from(
      { length: this.arraySize() },
      () => Math.floor(Math.random() * 300) + 10
    );
    this.drawArray(this.currentArray, -1, -1, 'COMPARE');
  }

  onArraySizeChange(value: number): void {
    this.arraySize.set(value);
    this.generateArray();
  }

  onAlgoChange(value: string): void {
    this.selectedAlgo.set(value);
  }

  onSpeedChange(value: number): void {
    this.speedMs.set(value);
    const sessionId = 'current';
    this.ws.send('/app/session.speed', { sessionId, speedMs: value });
  }

  start(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.comparisons.set(0);
    this.swaps.set(0);

    const sessionId = crypto.randomUUID();

    this.sub = this.ws
      .subscribe<SortStep>(`/topic/session.${sessionId}`)
      .subscribe(step => {
        this.drawArray(step.stateSnapshot, step.indexA, step.indexB, step.type);
        this.store.dispatch(xpActions.stepReceived());

        if (step.type === 'COMPARE') this.comparisons.update(v => v + 1);
        if (step.type === 'SWAP') this.swaps.update(v => v + 1);

        if (step.type === 'DONE') {
          this.isRunning.set(false);
          this.store.dispatch(xpActions.sessionComplete({ xpGained: 10 }));
        }
      });

    this.ws.send('/app/session.start', {
      algo: this.selectedAlgo(),
      array: this.currentArray,
      sessionId
    });
  }

  private drawArray(arr: number[], indexA: number, indexB: number, type: string): void {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.width;
    const h = canvas.height;
    this.ctx.clearRect(0, 0, w, h);
    const barWidth = w / arr.length;

    arr.forEach((val, i) => {
      this.ctx.fillStyle =
        i === indexA || i === indexB
          ? type === 'SWAP'  ? '#D85A30'
          : type === 'PIVOT' ? '#BA7517'
          : '#1D9E75'
          : '#7F77DD';

      this.ctx.fillRect(
        i * barWidth,
        h - (val / 310) * h,
        barWidth - 1,
        (val / 310) * h
      );
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.ws.disconnect();
  }
}