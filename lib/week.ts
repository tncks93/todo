/**
 * WeekGrid columns run Monday..Sunday (index 0..6).
 * `Todo.dayOfWeek` uses JS `Date.getDay()` (0=Sun .. 6=Sat).
 * `COLUMN_TO_DOW[c]` maps a column index to its `dayOfWeek` value.
 */
export const COLUMN_TO_DOW = [1, 2, 3, 4, 5, 6, 0] as const;

/** Map a `dayOfWeek` value (0=Sun .. 6=Sat) to a Mon..Sun column index (0..6). */
export function dowToColumn(dow: number): number {
  return (dow + 6) % 7;
}
