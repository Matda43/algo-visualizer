export type BarState = 'default' | 'compare' | 'swap' | 'pivot' | 'sorted';
export type ViewMode = 'bars' | 'numbers';
export type DataType = 'int' | 'float' | 'double' | 'long' | 'char' | 'string';

export const DATA_TYPES: DataType[] = ['int', 'float', 'double', 'long', 'char', 'string'];

export interface Bar {
  value: number;
  state: BarState;
}

export interface AlgoInstance {
  name: string;
  bars: Bar[];
  comparisons: number;
  swaps: number;
  pivots: number;
  sortedCount: number;
  done: boolean;
  sortedIndices: Set<number>;
}

export interface SortStep {
  type: 'COMPARE' | 'SWAP' | 'PIVOT' | 'SORTED' | 'DONE';
  indexA: number;
  indexB: number;
  stateSnapshot: number[];
}

export interface ExecuteResult {
  sortedArray: number[];
  comparisons: number;
  swaps: number;
  pivots: number;
  sessionId: string;
  dataType: DataType;
}