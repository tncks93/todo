import {
  generateKeyBetween,
  generateNKeysBetween,
} from "fractional-indexing";

/**
 * Returns an order key that sorts strictly between `a` and `b`.
 * Pass `null` for an open end (start or end of the list).
 */
export function keyBetween(a: string | null, b: string | null): string {
  return generateKeyBetween(a, b);
}

/**
 * Returns `count` evenly spaced order keys between `a` and `b`.
 */
export function keysBetween(
  a: string | null,
  b: string | null,
  count: number
): string[] {
  return generateNKeysBetween(a, b, count);
}

/**
 * Returns `count` initial order keys for a fresh list.
 */
export function initialKeys(count: number): string[] {
  return generateNKeysBetween(null, null, count);
}
