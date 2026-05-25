import { Component, OnDestroy, OnInit, signal, computed, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WebsocketService } from '../../core/websocket';
import { PathfindingMetadataService } from './services/pathfinding-metadata.service';
import { PathfindingGenerationService } from './services/pathfinding-generation.service';
import {
  ViewMode, VIEW_MODE_OPTIONS, InputMode,
  GridElement, WALL_ELEMENT, DrawMode,
  GridCell, CellState,
  WallGenerationMode, WALL_OPTIONS,
  TerrainGenerationMode, TERRAIN_OPTIONS,
  GeneratedGrid,
  GraphEdge,
  PathStep, PathfindingStats,
  PathfindingMetadata,
  serializeGraphEdges, serializeTreeEdges, serializeGridCells,
  parseGraphEdgeInput, parseTreeEdgeInput,
} from './models/pathfinding.models';
import { AlgorithmMetadata, buildPathfindingMetadata } from '../../shared/algorithm-information-panel/algorithm-metadata.model';
import { ControlConfig } from '../../shared/control-config.model';
import { StatBadgeComponent } from '../../shared/stat-badge/stat-badge';
import { AlgorithmListPanelComponent } from '../../shared/algorithm-list-panel/algorithm-list-panel';
import { AlgorithmInformationPanelComponent } from '../../shared/algorithm-information-panel/algorithm-information-panel';
import { DynamicControlsComponent } from '../../shared/dynamic-controls/dynamic-controls';
import { GraphRendererComponent } from './graph-renderer/graph-renderer';
import { TreeRendererComponent, TreeEdge } from './tree-renderer/tree-renderer';

@Component({
  selector:    'app-pathfinding',
  standalone:  true,
  imports:     [
    StatBadgeComponent,
    AlgorithmListPanelComponent,
    AlgorithmInformationPanelComponent,
    DynamicControlsComponent,
    GraphRendererComponent,
    TreeRendererComponent,
  ],
  templateUrl: './pathfinding.html',
  styleUrl:    './pathfinding.scss',
})
export class PathfindingComponent implements OnInit, OnDestroy {

  private readonly websocketService  = inject(WebsocketService);
  private readonly metadataService   = inject(PathfindingMetadataService);
  private readonly generationService = inject(PathfindingGenerationService);
  private readonly destroy$          = new Subject<void>();

  readonly ROWS_MIN = 5;
  readonly ROWS_MAX = 60;
  readonly COLS_MIN = 5;
  readonly COLS_MAX = 100;

  // ── Metadata ───────────────────────────────────────────────────────────────
  allRawMetadata = signal<PathfindingMetadata[]>([]);
  allAlgoNames   = computed(() => this.allRawMetadata().map(m => m.name));

  selectedAlgorithmMetadata = computed((): AlgorithmMetadata | null => {
    const raw = this.allRawMetadata().find(m => m.name === this.selectedAlgo());
    return raw ? buildPathfindingMetadata(raw) : null;
  });

  // ── UI state ───────────────────────────────────────────────────────────────
  selectedAlgo  = signal('');
  selectedAlgos = signal<string[]>([]);
  sidebarOpen   = signal(true);
  showParams    = signal(true);
  showInput     = signal(true);
  isRunning     = signal(false);
  isPaused      = signal(false);
  viewMode      = signal<ViewMode>('grid');
  inputMode     = signal<InputMode>('auto');
  speedMs       = signal(1);
  allowDiagonal = signal(false);

  // ── Grid state ─────────────────────────────────────────────────────────────
  rows            = signal(20);
  cols            = signal(30);
  grid            = signal<GridCell[]>([]);
  gridElements    = signal<GridElement[]>([{ ...WALL_ELEMENT }]);
  selectedElement = signal<GridElement>({ ...WALL_ELEMENT });
  drawMode        = signal<DrawMode>('element');
  stats           = signal<PathfindingStats>({ visitedCount: 0, pathLength: 0, pathFound: null });

  /** Terrain sélectionné (Carte) */
  selectedTerrain = signal<TerrainGenerationMode>('none');
  /** Type de murs sélectionné */
  selectedWallMode = signal<WallGenerationMode>('none');

  private startRow = 3;
  private startCol = 3;
  private endRow   = 16;
  private endCol   = 26;
  private isMouseDown = false;
  private currentSessionId: string | null = null;

  // ── Graph state ────────────────────────────────────────────────────────────
  graphVertexCount      = signal(6);
  graphEdges            = signal<GraphEdge[]>([]);
  graphDirected         = signal(false);
  graphValidationErrors = signal<string[]>([]);
  manualGraphInput      = signal('');

  // ── Tree state ─────────────────────────────────────────────────────────────
  treeVertexCount      = signal(7);
  treeEdges            = signal<TreeEdge[]>([]);
  treeValidationErrors = signal<string[]>([]);
  manualTreeInput      = signal('');

  // ── Options select ─────────────────────────────────────────────────────────
  private readonly viewOptions    = VIEW_MODE_OPTIONS.map(o => ({ label: o.label, value: o.value }));
  private readonly wallOptions    = WALL_OPTIONS.map(o => ({ label: o.label, value: o.value }));
  private readonly terrainOptions = TERRAIN_OPTIONS.map(o => ({ label: o.label, value: o.value }));

  /**
   * Outils de dessin : Départ, Arrivée, Gomme sont des outils fixes.
   * Les éléments de la liste sont des outils dynamiques — cliquer sur un élément
   * active automatiquement drawMode = 'element' et sélectionne cet élément.
   */
  readonly FIXED_DRAW_TOOLS = [
    { key: 'start', icon: '⚐', label: 'Départ'  },
    { key: 'end',   icon: '⚑', label: 'Arrivée' },
    { key: 'erase', icon: '⊚',  label: 'Gomme'   },
  ];

  /** Clé active dans les tool-buttons = drawMode, sauf si drawMode='element' où c'est l'elementName */
  activeToolKey = computed(() => {
    if (this.drawMode() === 'element') return `el:${this.selectedElement().name}`;
    return this.drawMode();
  });

  /** Outils fixes + éléments de la liste → une seule liste unifiée pour tool-buttons */
  allDrawTools = computed(() => [
    ...this.FIXED_DRAW_TOOLS
  ]);

  // ── Sérialisations ─────────────────────────────────────────────────────────
  gridDataSerialized  = computed(() => serializeGridCells(this.grid()));
  graphDataSerialized = computed(() => serializeGraphEdges(this.graphEdges()));
  treeDataSerialized  = computed(() => serializeTreeEdges(this.treeEdges()));

  // ── Contrôles Paramètres ───────────────────────────────────────────────────
  paramsControls = computed((): ControlConfig[][] => [
    [
      {
        type: 'select', label: 'Affichage', title: 'Mode d\'affichage',
        value: this.viewMode(),
        options: this.viewOptions,
        valueChanged: (v) => this.viewMode.set(v as ViewMode),
        disabled: this.isRunning(),
      },
      {
        type: 'slider', label: 'Délai', title: 'Délai entre étapes (ms)',
        description: 'Rapide → Lent',
        value: this.speedMs(), unit: 'ms', valueMin: 1, valueMax: 200,
        valueChanged: (v) => this.onSpeedChange(v),
      },
    ],
  ]);

  // ── Contrôles Entrée ───────────────────────────────────────────────────────
  inputControls = computed((): ControlConfig[][] => {
    const mode      = this.viewMode();
    const inputMode = this.inputMode();
    const running   = this.isRunning();

    const commonRow: ControlConfig[] = [
      {
        type: 'toggle',
        label: inputMode === 'auto' ? 'Auto.' : 'Manuel',
        title: 'Mode de saisie',
        active: inputMode === 'manual',
        activeChange: (v) => this.inputMode.set(v ? 'manual' : 'auto'),
        disabled: running,
      },
      {
        type: 'character-button', label: 'Réinit.', character: '↺',
        title: 'Réinitialiser', clicked: () => this.resetPath(), disabled: running,
      },
      {
        type: 'character-button', label: 'Vider', character: '✕',
        title: 'Vider', clicked: () => this.clearGrid(), disabled: running,
      },
    ];

    // ══════════════ GRILLE ══════════════
    if (mode === 'grid') {
      const gridCommon: ControlConfig[] = [
        ...commonRow,
        {
          type: 'toggle', label: 'Diagonales', title: 'Autoriser les diagonales',
          active: this.allowDiagonal(),
          activeChange: (v) => this.allowDiagonal.set(v),
          disabled: running,
        },
      ];

      if (inputMode === 'auto') {
        return [
          gridCommon,
          [
            {
              type: 'select', label: 'Carte', title: 'Type de terrain de base',
              value: this.selectedTerrain(),
              options: this.terrainOptions,
              valueChanged: (v) => this.onTerrainChange(v as TerrainGenerationMode),
              disabled: running,
            },
            {
              type: 'select', label: 'Type', title: 'Type de murs à superposer',
              value: this.selectedWallMode(),
              options: this.wallOptions,
              valueChanged: (v) => this.onWallChange(v as WallGenerationMode),
              disabled: running,
            },
            {
              type: 'number-input', label: 'Lignes', title: 'Nombre de lignes',
              value: this.rows(), valueMin: this.ROWS_MIN, valueMax: this.ROWS_MAX,
              canDec: true, decTitle: 'Moins',
              decDisabled: running || this.rows() <= this.ROWS_MIN,
              decClicked: () => this.onRowsChange(this.rows() - 1),
              canInc: true, incTitle: 'Plus',
              incDisabled: running || this.rows() >= this.ROWS_MAX,
              incClicked: () => this.onRowsChange(this.rows() + 1),
              valueChanged: (v) => this.onRowsChange(v),
              disabled: running,
            },
            {
              type: 'number-input', label: 'Colonnes', title: 'Nombre de colonnes',
              value: this.cols(), valueMin: this.COLS_MIN, valueMax: this.COLS_MAX,
              canDec: true, decTitle: 'Moins',
              decDisabled: running || this.cols() <= this.COLS_MIN,
              decClicked: () => this.onColsChange(this.cols() - 1),
              canInc: true, incTitle: 'Plus',
              incDisabled: running || this.cols() >= this.COLS_MAX,
              incClicked: () => this.onColsChange(this.cols() + 1),
              valueChanged: (v) => this.onColsChange(v),
              disabled: running,
            },
            {
              type: 'tool-buttons', label: 'Outils',
              tools: this.allDrawTools(),
              activeKey: this.activeToolKey(),
              onSelect: (key) => this.onToolSelect(key),
              disabled: running,
            }
          ],
          [ 
            {
              type: 'element-list',
              elements: this.gridElements(),
              selectedElement: this.selectedElement(),
              onElementsChange: (elements) => this.gridElements.set(elements),
              onSelectedChange: (element) => this.onElementSelected(element),
              disabled: running,
            },
            {
              type: 'input', label: 'Données', title: 'Cellules de la grille (x,y,nom)',
              value: this.gridDataSerialized(),
              placeholder: '(x,y,nom) ...',
              rows: 2,
              disabled: true,
            },
          ],
        ];
      } else {
        return [
          gridCommon,
          [
            {
              type: 'input',
              label: 'Éléments',
              title: 'Définir les éléments (x, y, nom, poids cardinal, couleur hexa)',
              placeholder: 'Liste de cellules (x, y, nom, poids cardinal, couleur hexa)',
              value: '',
              rows: 2,
            },
            {
              type: 'input',
              label: 'Données',
              title: 'Données de la map (x,y,nom)',
              placeholder: '(x,y,nom) ...',
              value: this.gridDataSerialized(),
              rows: 2,
            },
          ],
        ];
      }
    }

    // ══════════════ GRAPHE ══════════════
    if (mode === 'graph') {
      const graphCommon: ControlConfig[] = [
        ...commonRow,
        {
          type: 'toggle', label: 'Orienté', title: 'Graphe orienté',
          active: this.graphDirected(),
          activeChange: (v) => { this.graphDirected.set(v); this.onGraphDirectedChange(); },
          disabled: running,
        },
      ];

      if (inputMode === 'auto') {
        return [
          graphCommon,
          [
            {
              type: 'number-input', label: 'Sommets', title: 'Nombre de sommets',
              value: this.graphVertexCount(), valueMin: 2, valueMax: 100,
              canDec: true, decTitle: 'Moins', decDisabled: this.graphVertexCount() <= 2,
              decClicked: () => this.graphVertexCount.update(v => Math.max(2, v - 1)),
              canInc: true, incTitle: 'Plus', incDisabled: this.graphVertexCount() >= 100,
              incClicked: () => this.graphVertexCount.update(v => Math.min(100, v + 1)),
              valueChanged: (v) => this.graphVertexCount.set(v),
              disabled: running,
            },
            {
              type: 'character-button', label: 'Générer', character: '⟳',
              title: 'Générer un graphe aléatoire',
              clicked: () => this.onGraphGenerateRequested(),
              disabled: running,
            },
          ],
          [
            {
              type: 'input', label: 'Données (A, B, poids)', title: 'Arêtes du graphe',
              value: this.graphDataSerialized(),
              placeholder: '(0,1,2.5) ...', rows: 2,
              disabled: true,
            },
          ],
          ...(this.graphValidationErrors().length > 0 ? [[{
            type: 'validation-errors' as const,
            errors: this.graphValidationErrors(),
          }]] : []),
        ];
      } else {
        return [
          graphCommon,
          [
            {
              type: 'input', label: 'Données (A, B, poids)', title: 'Arêtes du graphe',
              value: this.manualGraphInput(),
              placeholder: '(0,1,2.5) (1,2,1.0) ...', rows: 3,
              valueChanged: (v) => this.onManualGraphInputChange(v),
            },
          ],
          ...(this.graphValidationErrors().length > 0 ? [[{
            type: 'validation-errors' as const,
            errors: this.graphValidationErrors(),
          }]] : []),
        ];
      }
    }

    // ══════════════ ARBRE ══════════════
    if (mode === 'tree') {
      if (inputMode === 'auto') {
        return [
          commonRow,
          [
            {
              type: 'number-input', label: 'Sommets', title: 'Nombre de sommets',
              value: this.treeVertexCount(), valueMin: 2, valueMax: 50,
              canDec: true, decTitle: 'Moins', decDisabled: this.treeVertexCount() <= 2,
              decClicked: () => this.treeVertexCount.update(v => Math.max(2, v - 1)),
              canInc: true, incTitle: 'Plus', incDisabled: this.treeVertexCount() >= 50,
              incClicked: () => this.treeVertexCount.update(v => Math.min(50, v + 1)),
              valueChanged: (v) => this.treeVertexCount.set(v),
              disabled: running,
            },
            {
              type: 'character-button', label: 'Générer', character: '⟳',
              title: 'Générer un arbre aléatoire',
              clicked: () => this.onTreeGenerateRequested(),
              disabled: running,
            },
          ],
          [
            {
              type: 'input', label: 'Données (A, B)', title: 'Arêtes de l\'arbre',
              value: this.treeDataSerialized(),
              placeholder: '(0,1) (1,2) ...', rows: 2,
              disabled: true,
            },
          ],
          ...(this.treeValidationErrors().length > 0 ? [[{
            type: 'validation-errors' as const,
            errors: this.treeValidationErrors(),
          }]] : []),
        ];
      } else {
        return [
          commonRow,
          [
            {
              type: 'input', label: 'Données (A, B)', title: 'Arêtes de l\'arbre',
              value: this.manualTreeInput(),
              placeholder: '(0,1) (1,2) (2,3) ...', rows: 3,
              valueChanged: (v) => this.onManualTreeInputChange(v),
            },
          ],
          ...(this.treeValidationErrors().length > 0 ? [[{
            type: 'validation-errors' as const,
            errors: this.treeValidationErrors(),
          }]] : []),
        ];
      }
    }

    return [commonRow];
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.websocketService.connect().subscribe();
    this.buildGrid();
    this.metadataService.getAll().subscribe(metadata => {
      this.allRawMetadata.set(metadata);
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

  // ── Outils de dessin ──────────────────────────────────────────────────────

  /**
   * Sélection d'un outil dans la liste unifiée.
   * Les clés d'éléments commencent par "el:" pour les distinguer des outils fixes.
   * Les outils sont mutuellement exclusifs.
   */
  onToolSelect(key: string): void {
    if (key.startsWith('el:')) {
      const elementName = key.slice(3);
      const element = this.gridElements().find(e => e.name === elementName);
      if (element) {
        this.selectedElement.set(element);
        this.drawMode.set('element');
      }
    } else {
      this.drawMode.set(key as DrawMode);
    }
  }

  /** Appelé depuis element-list quand l'utilisateur clique sur un élément */
  onElementSelected(element: GridElement): void {
    this.selectedElement.set(element);
    this.drawMode.set('element');
  }

  // ── Grid ──────────────────────────────────────────────────────────────────

  private buildGrid(): void {
    const rowCount = this.rows();
    const colCount = this.cols();
    this.startRow = Math.min(this.startRow, rowCount - 1);
    this.startCol = Math.min(this.startCol, colCount - 1);
    this.endRow   = Math.min(this.endRow,   rowCount - 1);
    this.endCol   = Math.min(this.endCol,   colCount - 1);

    const cells: GridCell[] = [];
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        let state: CellState = 'empty';
        if (row === this.startRow && col === this.startCol) state = 'start';
        else if (row === this.endRow && col === this.endCol) state = 'end';
        cells.push({ row, col, state, elementName: null });
      }
    }
    this.grid.set(cells);
    this.stats.set({ visitedCount: 0, pathLength: 0, pathFound: null });
  }

  private applyGeneratedGrid(generated: GeneratedGrid): void {
    this.rows.set(generated.rows);
    this.cols.set(generated.cols);
    this.startRow = generated.startY;
    this.startCol = generated.startX;
    this.endRow   = generated.endY;
    this.endCol   = generated.endX;

    const cells: GridCell[] = [];
    for (let row = 0; row < generated.rows; row++) {
      for (let col = 0; col < generated.cols; col++) {
        cells.push({ row, col, state: 'empty', elementName: null });
      }
    }
    for (const cellData of generated.cells) {
      const index = cellData.y * generated.cols + cellData.x;
      if (index >= 0 && index < cells.length) {
        cells[index] = { ...cells[index], state: 'custom', elementName: cellData.elementName };
      }
    }
    cells[this.startRow * generated.cols + this.startCol].state = 'start';
    cells[this.endRow   * generated.cols + this.endCol].state   = 'end';
    this.grid.set(cells);
    this.stats.set({ visitedCount: 0, pathLength: 0, pathFound: null });
  }

  cellKey(cell: GridCell): string { return `${cell.row}-${cell.col}`; }

  cellStyle(cell: GridCell): string {
    if (cell.state === 'custom' && cell.elementName) {
      const element = this.gridElements().find(e => e.name === cell.elementName);
      return element ? `background-color: ${element.hexColor}` : '';
    }
    return '';
  }

  private getCellIndex(row: number, col: number): number {
    return row * this.cols() + col;
  }

  private updateCell(row: number, col: number, state: CellState, elementName: string | null = null): void {
    this.grid.update(cells => {
      const updated = [...cells];
      const index   = this.getCellIndex(row, col);
      if (index >= 0 && index < updated.length) {
        updated[index] = { ...updated[index], state, elementName };
      }
      return updated;
    });
  }

  onCellMouseDown(cell: GridCell): void {
    if (this.isRunning()) return;
    this.isMouseDown = true;
    this.applyDraw(cell);
  }

  onCellMouseEnter(cell: GridCell): void {
    if (!this.isMouseDown || this.isRunning()) return;
    this.applyDraw(cell);
  }

  onMouseUp(): void { this.isMouseDown = false; }

  private applyDraw(cell: GridCell): void {
    const { row, col } = cell;
    const mode = this.drawMode();
    if (mode === 'erase') {
      if (cell.state === 'start' || cell.state === 'end') return;
      this.updateCell(row, col, 'empty', null);
    } else if (mode === 'start') {
      this.updateCell(this.startRow, this.startCol, 'empty', null);
      this.startRow = row; this.startCol = col;
      this.updateCell(row, col, 'start', null);
    } else if (mode === 'end') {
      this.updateCell(this.endRow, this.endCol, 'empty', null);
      this.endRow = row; this.endCol = col;
      this.updateCell(row, col, 'end', null);
    } else if (mode === 'element') {
      if (cell.state === 'start' || cell.state === 'end') return;
      this.updateCell(row, col, 'custom', this.selectedElement().name);
    }
  }

  resetPath(): void {
    if (this.isRunning()) return;
    this.grid.update(cells =>
      cells.map(c =>
        (c.state === 'visited' || c.state === 'frontier' || c.state === 'path')
          ? { ...c, state: 'empty' as CellState } : c
      )
    );
    this.stats.set({ visitedCount: 0, pathLength: 0, pathFound: null });
  }

  clearGrid(): void {
    if (this.isRunning()) return;
    if (this.viewMode() === 'grid')  this.buildGrid();
    if (this.viewMode() === 'graph') { this.graphEdges.set([]); this.graphValidationErrors.set([]); }
    if (this.viewMode() === 'tree')  { this.treeEdges.set([]);  this.treeValidationErrors.set([]); }
  }

  onRowsChange(value: number): void {
    this.rows.set(Math.min(this.ROWS_MAX, Math.max(this.ROWS_MIN, value)));
    this.buildGrid();
  }

  onColsChange(value: number): void {
    this.cols.set(Math.min(this.COLS_MAX, Math.max(this.COLS_MIN, value)));
    this.buildGrid();
  }

  // ── Génération backend ────────────────────────────────────────────────────

  /**
   * Les deux selects Carte et Type se combinent : toute modification de l'un
   * déclenche une (re)génération avec les deux valeurs courantes.
   */
  onTerrainChange(terrain: TerrainGenerationMode): void {
    this.selectedTerrain.set(terrain);
    this.triggerGridGeneration();
  }

  onWallChange(wall: WallGenerationMode): void {
    this.selectedWallMode.set(wall);
    this.triggerGridGeneration();
  }

  private triggerGridGeneration(): void {
    if (this.isRunning()) return;
    const terrain = this.selectedTerrain();
    const wall    = this.selectedWallMode();
    if (terrain === 'none' && wall === 'none') { this.clearGrid(); return; }
    this.generationService.generateGrid(terrain, wall, this.rows(), this.cols())
      .pipe(takeUntil(this.destroy$))
      .subscribe(g => this.applyGeneratedGrid(g));
  }

  onGraphGenerateRequested(): void {
    this.generationService.generateGraph(this.graphVertexCount(), this.graphDirected(), false)
      .pipe(takeUntil(this.destroy$))
      .subscribe(g => {
        this.graphVertexCount.set(g.vertexCount);
        this.graphEdges.set(g.edges);
        this.graphDirected.set(g.directed);
        this.graphValidationErrors.set(g.validationErrors);
      });
  }

  onTreeGenerateRequested(): void {
    this.generationService.generateGraph(this.treeVertexCount(), false, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe(g => {
        this.treeVertexCount.set(g.vertexCount);
        this.treeEdges.set(g.edges.map(e => ({ from: e.from, to: e.to })));
        this.treeValidationErrors.set(g.validationErrors);
      });
  }

  // ── Saisie manuelle ───────────────────────────────────────────────────────

  onManualGraphInputChange(raw: string): void {
    this.manualGraphInput.set(raw);
    const edges = parseGraphEdgeInput(raw);
    this.graphEdges.set(edges);
    this.generationService.validateGraph(
      this.graphVertexCount(), edges, this.graphDirected(), false, this.selectedAlgo()
    ).pipe(takeUntil(this.destroy$))
     .subscribe(errors => this.graphValidationErrors.set(errors));
  }

  onManualTreeInputChange(raw: string): void {
    this.manualTreeInput.set(raw);
    const edges = parseTreeEdgeInput(raw);
    this.treeEdges.set(edges);
    const edgesWithWeight = edges.map(e => ({ ...e, weight: 1.0 }));
    this.generationService.validateGraph(
      this.treeVertexCount(), edgesWithWeight, false, true, this.selectedAlgo()
    ).pipe(takeUntil(this.destroy$))
     .subscribe(errors => this.treeValidationErrors.set(errors));
  }

  onGraphDirectedChange(): void {
    if (this.graphEdges().length > 0) {
      this.generationService.validateGraph(
        this.graphVertexCount(), this.graphEdges(), this.graphDirected(), false, this.selectedAlgo()
      ).pipe(takeUntil(this.destroy$))
       .subscribe(errors => this.graphValidationErrors.set(errors));
    }
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
    if (this.viewMode() === 'grid') this.startGridSession();
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
      this.websocketService.send('/app/path.speed', { sessionId: this.currentSessionId, speedMs: newSpeed });
    }
  }

  private startGridSession(): void {
    this.resetPath();
    this.isRunning.set(true);
    this.isPaused.set(false);
    const sessionId = crypto.randomUUID();
    this.currentSessionId = sessionId;

    this.websocketService.subscribe<PathStep>(`/topic/path.${sessionId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(step => this.applyGridStep(step));

    const walls = this.grid().map(cell => {
      if (cell.state === 'custom' && cell.elementName) {
        const element = this.gridElements().find(e => e.name === cell.elementName);
        return element ? !isFinite(element.cardinalWeight) : false;
      }
      return false;
    });

    this.websocketService.send('/app/path.start', {
      algo: this.selectedAlgo(), walls,
      rows: this.rows(), cols: this.cols(),
      startRow: this.startRow, startCol: this.startCol,
      endRow: this.endRow, endCol: this.endCol,
      sessionId, speedMs: this.speedMs(),
      allowDiagonal: this.allowDiagonal(),
    });
  }

  private applyGridStep(step: PathStep): void {
    if (step.type === 'DONE') {
      this.isRunning.set(false);
      this.isPaused.set(false);
      this.stats.update(s => ({ ...s, pathFound: step.pathFound, pathLength: step.pathLength }));
      return;
    }
    const stateMap: Record<string, CellState> = {
      VISITED: 'visited', FRONTIER: 'frontier', PATH: 'path',
    };
    const newState = stateMap[step.type];
    if (!newState) return;
    const currentState = this.grid()[this.getCellIndex(step.row, step.col)]?.state;
    if (currentState === 'start' || currentState === 'end') return;
    this.updateCell(step.row, step.col, newState, null);
    if (step.type === 'VISITED') {
      this.stats.update(s => ({ ...s, visitedCount: step.visitedCount }));
    }
  }
}