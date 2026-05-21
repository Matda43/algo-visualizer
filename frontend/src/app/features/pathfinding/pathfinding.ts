import { Component, OnDestroy, OnInit, signal, computed, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WebsocketService } from '../../core/websocket';
import { PathfindingMetadataService } from './services/pathfinding-metadata.service';
import {
  CellState, DrawMode, GridCell,
  PathfindingMetadata, PathStep, PathfindingStats
} from './models/pathfinding.models';
import { SliderComponent } from '../../shared/slider/slider';
import { StatBadgeComponent } from '../../shared/stat-badge/stat-badge';
import { AlgorithmListPanelComponent } from '../../shared/algorithm-list-panel/algorithm-list-panel';
import { PathfindingGridControlsComponent } from './pathfinding-grid-controls/pathfinding-grid-controls';
import { PathfindingInformationPanelComponent } from './pathfinding-information-panel/pathfinding-information-panel';

interface DrawTool { mode: DrawMode; label: string; }

@Component({
  selector:    'app-pathfinding',
  standalone:  true,
  imports:     [
    SliderComponent,
    StatBadgeComponent,
    AlgorithmListPanelComponent,
    PathfindingGridControlsComponent,
    PathfindingInformationPanelComponent,
  ],
  templateUrl: './pathfinding.html',
  styleUrl:    './pathfinding.scss',
})
export class PathfindingComponent implements OnInit, OnDestroy {

  private readonly websocketService           = inject(WebsocketService);
  private readonly pathfindingMetadataService = inject(PathfindingMetadataService);
  private readonly destroy$                   = new Subject<void>();

  // ── Constants ──────────────────────────────────────────────────────────────
  readonly ROWS_MIN = 5;
  readonly ROWS_MAX = 60;
  readonly COLS_MIN = 5;
  readonly COLS_MAX = 100;

  readonly DRAW_TOOLS: DrawTool[] = [
    { mode: 'wall',  label: 'Mur'     },
    { mode: 'erase', label: 'Gomme'   },
    { mode: 'start', label: 'Départ'  },
    { mode: 'end',   label: 'Arrivée' },
  ];

  // ── Metadata ───────────────────────────────────────────────────────────────
  allMetadata = signal<PathfindingMetadata[]>([]);

  allAlgoNames = computed(() => this.allMetadata().map(meta => meta.name));

  selectedMetadata = computed(() =>
    this.allMetadata().find(meta => meta.name === this.selectedAlgo()) ?? null
  );

  // ── UI state ───────────────────────────────────────────────────────────────
  selectedAlgo  = signal<string>('');
  selectedAlgos = signal<string[]>([]);
  drawMode      = signal<DrawMode>('wall');
  allowDiagonal = signal(false);
  sidebarOpen   = signal(true);
  showParams    = signal(false);
  isRunning     = signal(false);
  isPaused      = signal(false);
  speedMs       = signal(10);

  // ── Grid ───────────────────────────────────────────────────────────────────
  rows = signal(20);
  cols = signal(30);
  grid = signal<GridCell[]>([]);

  stats = signal<PathfindingStats>({ visitedCount: 0, pathLength: 0, pathFound: null });

  // ── Private ────────────────────────────────────────────────────────────────
  private currentSessionId: string | null = null;
  private isMouseDown = false;
  private startRow = 3;
  private startCol = 3;
  private endRow   = 16;
  private endCol   = 26;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.websocketService.connect().subscribe();
    this.buildGrid();
    this.pathfindingMetadataService.getAll().subscribe(metadata => {
      this.allMetadata.set(metadata);
      if (metadata.length > 0) {
        this.selectedAlgo.set(metadata[0].name);
        this.selectedAlgos.set([metadata[0].name]);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.currentSessionId) {
      this.websocketService.send('/app/path.stop', this.currentSessionId);
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.websocketService.disconnect();
  }

  // ── Grid management ────────────────────────────────────────────────────────

  cellKey(cell: GridCell): string {
    return `${cell.row}-${cell.col}`;
  }

  private buildGrid(): void {
    const rowCount = this.rows();
    const colCount = this.cols();
    const cells: GridCell[] = [];

    this.startRow = Math.min(this.startRow, rowCount - 1);
    this.startCol = Math.min(this.startCol, colCount - 1);
    this.endRow   = Math.min(this.endRow,   rowCount - 1);
    this.endCol   = Math.min(this.endCol,   colCount - 1);

    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        let state: CellState = 'empty';
        if (row === this.startRow && col === this.startCol) state = 'start';
        else if (row === this.endRow && col === this.endCol) state = 'end';
        cells.push({ row, col, state });
      }
    }

    this.grid.set(cells);
    this.stats.set({ visitedCount: 0, pathLength: 0, pathFound: null });
  }

  private getCellIndex(row: number, col: number): number {
    return row * this.cols() + col;
  }

  private updateCell(row: number, col: number, state: CellState): void {
    this.grid.update(cells => {
      const updated = [...cells];
      const index   = this.getCellIndex(row, col);
      if (index >= 0 && index < updated.length) {
        updated[index] = { ...updated[index], state };
      }
      return updated;
    });
  }

  // ── Mouse interactions ─────────────────────────────────────────────────────

  onCellMouseDown(cell: GridCell): void {
    if (this.isRunning()) return;
    this.isMouseDown = true;
    this.applyDraw(cell);
  }

  onCellMouseEnter(cell: GridCell): void {
    if (!this.isMouseDown || this.isRunning()) return;
    this.applyDraw(cell);
  }

  onMouseUp(): void {
    this.isMouseDown = false;
  }

  private applyDraw(cell: GridCell): void {
    const mode         = this.drawMode();
    const { row, col } = cell;

    if (mode === 'wall') {
      if (cell.state === 'start' || cell.state === 'end') return;
      this.updateCell(row, col, 'wall');
    } else if (mode === 'erase') {
      if (cell.state === 'start' || cell.state === 'end') return;
      this.updateCell(row, col, 'empty');
    } else if (mode === 'start') {
      this.updateCell(this.startRow, this.startCol, 'empty');
      this.startRow = row;
      this.startCol = col;
      this.updateCell(row, col, 'start');
    } else if (mode === 'end') {
      this.updateCell(this.endRow, this.endCol, 'empty');
      this.endRow = row;
      this.endCol = col;
      this.updateCell(row, col, 'end');
    }
  }

  // ── Grid controls ──────────────────────────────────────────────────────────

  resetPath(): void {
    if (this.isRunning()) return;
    this.grid.update(cells =>
      cells.map(cell =>
        (cell.state === 'visited' || cell.state === 'frontier' || cell.state === 'path')
          ? { ...cell, state: 'empty' as CellState }
          : cell
      )
    );
    this.stats.set({ visitedCount: 0, pathLength: 0, pathFound: null });
  }

  clearGrid(): void {
    if (this.isRunning()) return;
    this.buildGrid();
  }

  generateMaze(): void {
    if (this.isRunning()) return;
    const rowCount = this.rows();
    const colCount = this.cols();

    const cells: GridCell[] = Array.from({ length: rowCount * colCount }, (_, index) => ({
      row:   Math.floor(index / colCount),
      col:   index % colCount,
      state: 'empty' as CellState,
    }));

    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        if (row === 0 || row === rowCount - 1 || col === 0 || col === colCount - 1) {
          cells[row * colCount + col].state = 'wall';
        }
      }
    }

    this.recursiveDivision(cells, 1, rowCount - 2, 1, colCount - 2, rowCount, colCount);

    cells[this.startRow * colCount + this.startCol].state = 'start';
    cells[this.endRow   * colCount + this.endCol].state   = 'end';

    this.grid.set(cells);
    this.stats.set({ visitedCount: 0, pathLength: 0, pathFound: null });
  }

  private recursiveDivision(
    cells: GridCell[],
    rowStart: number, rowEnd: number,
    colStart: number, colEnd: number,
    totalRows: number, totalCols: number
  ): void {
    if (rowEnd - rowStart < 2 || colEnd - colStart < 2) return;

    const isHorizontal = (rowEnd - rowStart) > (colEnd - colStart);

    if (isHorizontal) {
      const wallRow    = rowStart + 1 + Math.floor(Math.random() * Math.floor((rowEnd - rowStart - 1) / 2)) * 2;
      const passageCol = colStart + Math.floor(Math.random() * (colEnd - colStart + 1));
      for (let col = colStart; col <= colEnd; col++) {
        if (col !== passageCol) cells[wallRow * totalCols + col].state = 'wall';
      }
      this.recursiveDivision(cells, rowStart, wallRow - 1, colStart, colEnd, totalRows, totalCols);
      this.recursiveDivision(cells, wallRow + 1, rowEnd,   colStart, colEnd, totalRows, totalCols);
    } else {
      const wallCol    = colStart + 1 + Math.floor(Math.random() * Math.floor((colEnd - colStart - 1) / 2)) * 2;
      const passageRow = rowStart + Math.floor(Math.random() * (rowEnd - rowStart + 1));
      for (let row = rowStart; row <= rowEnd; row++) {
        if (row !== passageRow) cells[row * totalCols + wallCol].state = 'wall';
      }
      this.recursiveDivision(cells, rowStart, rowEnd, colStart, wallCol - 1, totalRows, totalCols);
      this.recursiveDivision(cells, rowStart, rowEnd, wallCol + 1, colEnd,   totalRows, totalCols);
    }
  }

  // ── Grid dimension controls ────────────────────────────────────────────────

  onRowsChange(value: number): void {
    this.rows.set(Math.min(this.ROWS_MAX, Math.max(this.ROWS_MIN, value || this.ROWS_MIN)));
    this.buildGrid();
  }

  onColsChange(value: number): void {
    this.cols.set(Math.min(this.COLS_MAX, Math.max(this.COLS_MIN, value || this.COLS_MIN)));
    this.buildGrid();
  }

  // ── Algo selection ─────────────────────────────────────────────────────────

  selectAlgo(name: string): void {
    if (this.isRunning() || !name) return;
    this.selectedAlgo.set(name);
    this.selectedAlgos.set([name]);
  }

  // ── Run controls ───────────────────────────────────────────────────────────

  start(): void {
    if (this.isRunning() || !this.selectedAlgo()) return;
    this.resetPath();
    this.isRunning.set(true);
    this.isPaused.set(false);

    const sessionId = crypto.randomUUID();
    this.currentSessionId = sessionId;

    this.websocketService.subscribe<PathStep>(`/topic/path.${sessionId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(step => this.applyStep(step));

    const walls = this.grid().map(cell => cell.state === 'wall');

    this.websocketService.send('/app/path.start', {
      algo:          this.selectedAlgo(),
      walls,
      rows:          this.rows(),
      cols:          this.cols(),
      startRow:      this.startRow,
      startCol:      this.startCol,
      endRow:        this.endRow,
      endCol:        this.endCol,
      sessionId,
      speedMs:       this.speedMs(),
      allowDiagonal: this.allowDiagonal(),
    });
  }

  togglePause(): void {
    const nowPaused = !this.isPaused();
    this.isPaused.set(nowPaused);
    if (!this.currentSessionId) return;
    this.websocketService.send(
      nowPaused ? '/app/path.pause' : '/app/path.resume',
      { sessionId: this.currentSessionId }
    );
  }

  onSpeedChange(newSpeed: number): void {
    this.speedMs.set(newSpeed);
    if (this.isRunning() && this.currentSessionId) {
      this.websocketService.send('/app/path.speed', {
        sessionId: this.currentSessionId,
        speedMs:   newSpeed,
      });
    }
  }

  // ── Apply step ─────────────────────────────────────────────────────────────

  private applyStep(step: PathStep): void {
    if (step.type === 'DONE') {
      this.isRunning.set(false);
      this.isPaused.set(false);
      this.stats.update(currentStats => ({
        ...currentStats,
        pathFound:  step.pathFound,
        pathLength: step.pathLength,
      }));
      return;
    }

    const stateMap: Record<string, CellState> = {
      VISITED:  'visited',
      FRONTIER: 'frontier',
      PATH:     'path',
    };
    const newState = stateMap[step.type];
    if (!newState) return;

    const currentState = this.grid()[this.getCellIndex(step.row, step.col)]?.state;
    if (currentState === 'start' || currentState === 'end') return;

    this.updateCell(step.row, step.col, newState);

    if (step.type === 'VISITED') {
      this.stats.update(currentStats => ({ ...currentStats, visitedCount: step.visitedCount }));
    }
  }
}