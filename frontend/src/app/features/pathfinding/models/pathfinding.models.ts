// ── Types de vue ─────────────────────────────────────────────────────────────

export type ViewMode = 'grid' | 'graph' | 'tree';

export interface ViewModeOption { value: ViewMode; label: string; }
export const VIEW_MODE_OPTIONS: ViewModeOption[] = [
  { value: 'grid',  label: 'Grille' },
  { value: 'graph', label: 'Graphe' },
  { value: 'tree',  label: 'Arbre'  },
];

// ── Mode auto / manuel ────────────────────────────────────────────────────────

export type InputMode = 'auto' | 'manual';

// ── Éléments de grille ────────────────────────────────────────────────────────

export interface GridElement {
  name:           string;
  hexColor:       string;
  cardinalWeight: number;   // Infinity = mur bloquant
  deletable:      boolean;
}

export const WALL_ELEMENT: GridElement = {
  name:           'Mur',
  hexColor:       '#1c1c1c',
  cardinalWeight: Number.POSITIVE_INFINITY,
  deletable:      false,
};

/** Mode de dessin actif — sélectionner un élément dans la liste active 'element' */
export type DrawMode = 'start' | 'end' | 'erase' | 'element';

// ── Cellule de grille ─────────────────────────────────────────────────────────

export type CellState = 'empty' | 'start' | 'end' | 'visited' | 'frontier' | 'path' | 'custom';

export interface GridCell {
  row:         number;
  col:         number;
  state:       CellState;
  elementName: string | null;
}

// ── Génération de grille ──────────────────────────────────────────────────────

/**
 * Type de terrain de base (sans murs).
 * "none" = grille vide.
 */
export type TerrainGenerationMode =
  | 'none'
  | 'terrain-islands'
  | 'terrain-dungeon';

/**
 * Type de murs à superposer sur le terrain.
 * La génération combinée est : terrain + murs = carte finale.
 */
export type WallGenerationMode =
  | 'none'
  | 'maze-recursive'
  | 'random'
  | 'borders'
  | 'dense';

export interface TerrainOption { value: TerrainGenerationMode; label: string; }
export interface WallOption    { value: WallGenerationMode;    label: string; }

export const TERRAIN_OPTIONS: TerrainOption[] = [
  { value: 'none',             label: 'Vide'   },
  { value: 'terrain-islands',  label: 'Îles'   },
  { value: 'terrain-dungeon',  label: 'Donjon' },
];

export const WALL_OPTIONS: WallOption[] = [
  { value: 'none',             label: 'Aucun'      },
  { value: 'maze-recursive',   label: 'Labyrinthe' },
  { value: 'random',           label: 'Aléatoire'  },
  { value: 'borders',          label: 'Bordures'   },
  { value: 'dense',            label: 'Dense'      },
];

// ── Réponse backend grille ────────────────────────────────────────────────────

export interface GeneratedGrid {
  rows:   number;
  cols:   number;
  cells:  GeneratedGridCell[];
  startX: number;
  startY: number;
  endX:   number;
  endY:   number;
}

export interface GeneratedGridCell {
  x:           number;
  y:           number;
  elementName: string;
}

// ── Graphe ────────────────────────────────────────────────────────────────────

export interface GraphEdge {
  from:   number;
  to:     number;
  weight: number;
}

export interface GraphVertex {
  id: number;
  x:  number;
  y:  number;
}

export interface GeneratedGraph {
  vertexCount:      number;
  edges:            GraphEdge[];
  directed:         boolean;
  isTree:           boolean;
  validationErrors: string[];
}

// ── Stats pathfinding ─────────────────────────────────────────────────────────

export interface PathfindingStats {
  visitedCount: number;
  pathLength:   number;
  pathFound:    boolean | null;
}

// ── WebSocket steps ───────────────────────────────────────────────────────────

export interface PathStep {
  type:         string;
  row:          number;
  col:          number;
  pathFound:    boolean;
  visitedCount: number;
  pathLength:   number;
}

// ── Metadata backend DTO ──────────────────────────────────────────────────────

export interface PathfindingMetadata {
  name:            string;
  timeComplexity:  string;
  spaceComplexity: string;
  optimal:         string;
  complete:        string;
  description:     string;
  wikipediaUrl:    string;
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

export function parseGraphEdgeInput(raw: string): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const pattern = /\(\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.+-]+)\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw)) !== null) {
    edges.push({ from: parseInt(match[1], 10), to: parseInt(match[2], 10), weight: parseFloat(match[3]) });
  }
  return edges;
}

export function parseTreeEdgeInput(raw: string): { from: number; to: number }[] {
  const edges: { from: number; to: number }[] = [];
  const pattern = /\(\s*(\d+)\s*,\s*(\d+)\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw)) !== null) {
    edges.push({ from: parseInt(match[1], 10), to: parseInt(match[2], 10) });
  }
  return edges;
}

export function serializeGraphEdges(edges: GraphEdge[]): string {
  return edges.map(e => `(${e.from},${e.to},${e.weight})`).join(' ');
}

export function serializeTreeEdges(edges: { from: number; to: number }[]): string {
  return edges.map(e => `(${e.from},${e.to})`).join(' ');
}

export function serializeGridCells(cells: GridCell[]): string {
  return cells
    .filter(c => c.elementName !== null
              && c.state !== 'visited'
              && c.state !== 'frontier'
              && c.state !== 'path')
    .map(c => `(${c.col},${c.row},${c.elementName ?? 'Vide'})`)
    .join(' ');
}