export function clampNumber(value: number, min: number, max: number): number {
  const safeMin = isNaN(min) ? Number.MIN_VALUE : min;
  const safeMax = isNaN(max) ? Number.MAX_VALUE : max;
  return Math.min(safeMax, Math.max(safeMin, value));
}

export function coerceNumber(value: unknown, defaultValue = 0): number {
  const n = Number(value);
  return isNaN(n) ? defaultValue : n;
}

export function coerceBoolean(value: unknown): boolean {
  return value === '' || value === true || value === 'true';
}

export function coerceString(value: unknown, defaultValue = ''): string {
  return String(value ?? defaultValue);
}

export function coerceArray<T>(values: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(values) ? values as T[] : defaultValue;
}