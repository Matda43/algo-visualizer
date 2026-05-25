import { SelectOption } from "../../../shared/select-option/select-option";

export function buildOptionType<T extends string>(types: T[]): SelectOption<T>[] {
  return types.map(type => ({ label: type, value: type }));
}

export type ViewMode = 'bars' | 'numbers' | 'mosaic';
export const VIEW_MODES = ['bars', 'numbers', 'mosaic'];

export type DataType = 'int' | 'long' | 'float' | 'double';
export const DATA_TYPES = ['int', 'long', 'float', 'double'];

export interface Bar {
  value: number;
  state: 'default' | 'compare' | 'swap' | 'pivot' | 'sorted';
}

export interface  AlgoInstance {
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