export type ViewMode = 'bars' | 'numbers' | 'mosaic';
export type DataType = 'int' | 'long' | 'float' | 'double' | 'char' | 'string';

export const DATA_TYPES: DataType[] = ['int', 'long', 'float', 'double', 'char', 'string'];

export interface Bar {
  value: number;
  state: 'default' | 'compare' | 'swap' | 'pivot' | 'sorted';
}

export interface AlgoInstance {
  name:          string;
  bars:          Bar[];
  comparisons:   number;
  swaps:         number;
  pivots:        number;
  sortedCount:   number;
  done:          boolean;
  sortedIndices: Set<number>;
}

export interface SortStep {
  type:          string;
  indexA:        number;
  indexB:        number;
  stateSnapshot: number[];
}

export interface ExecuteResult {
  sortedArray:  number[];
  comparisons:  number;
  swaps:        number;
  pivots:       number;
  sessionId:    string;
  dataType:     string;
}