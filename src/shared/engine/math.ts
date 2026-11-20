/** Restricts `value` to the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError(`clamp: min (${String(min)}) is greater than max (${String(max)})`);
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Frame-rate independent exponential smoothing: moves `current` towards
 * `target`, covering the same share of the distance per second at any frame rate.
 */
export function approach(
  current: number,
  target: number,
  sharpness: number,
  seconds: number,
): number {
  return current + (target - current) * (1 - Math.exp(-sharpness * seconds));
}
