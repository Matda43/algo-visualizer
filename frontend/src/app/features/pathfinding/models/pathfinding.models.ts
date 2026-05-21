export type CellState = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'frontier' | 'path';
export type DrawMode  = 'wall' | 'erase' | 'start' | 'end';

export interface GridCell {
  row:   number;
  col:   number;
  state: CellState;
}

export interface PathfindingMetadata {
  name:            string;
  timeComplexity:  string;
  spaceComplexity: string;
  optimal:         string;
  complete:        string;
  description:     string;
  wikipediaUrl:    string;
}

export interface PathStep {
  type:         string;   // 'VISITED' | 'FRONTIER' | 'PATH' | 'DONE'
  row:          number;
  col:          number;
  pathFound:    boolean;
  visitedCount: number;
  pathLength:   number;
}

export interface PathfindingStats {
  visitedCount: number;
  pathLength:   number;
  pathFound:    boolean | null;
}