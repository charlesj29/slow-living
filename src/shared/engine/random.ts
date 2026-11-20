// Deterministic randomness. Everything that must be reproducible from a seed
// takes an `Rng` instead of calling Math.random().

/** Returns a float in [0, 1). */
export type RandomFn = () => number;

export interface Rng {
  /** Float in [0, 1). */
  next: RandomFn;
  /** Integer in [minInclusive, maxInclusive]. */
  int: (minInclusive: number, maxInclusive: number) => number;
  /** Float in [min, maxExclusive). */
  range: (min: number, maxExclusive: number) => number;
  /** True with the given probability (0..1). */
  chance: (probability: number) => boolean;
  /** Uniformly picks one item. Throws on an empty list. */
  pick: <T>(items: readonly T[]) => T;
}

const UINT32_RANGE = 0x1_0000_0000;
const MAX_SEED = 0xffff_ffff;
const MULBERRY_INCREMENT = 0x6d2b79f5;
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const MURMUR_MIX_1 = 0x85ebca6b;
const MURMUR_MIX_2 = 0xc2b2ae35;
// Large odd constants that decorrelate x and y before mixing.
const COORD_PRIME_X = 0x27d4eb2d;
const COORD_PRIME_Y = 0x165667b1;

/**
 * mulberry32: tiny, fast, good-enough PRNG with a 32-bit state. The state is
 * kept as uint32 (`>>> 0`) so it never loses precision on long runs.
 */
export function mulberry32(seed: number): RandomFn {
  let state = seed >>> 0;
  return () => {
    state = (state + MULBERRY_INCREMENT) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  return {
    next,
    int: (minInclusive, maxInclusive) =>
      minInclusive + Math.floor(next() * (maxInclusive - minInclusive + 1)),
    range: (min, maxExclusive) => min + next() * (maxExclusive - min),
    chance: (probability) => next() < probability,
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) {
        throw new RangeError('Rng.pick: cannot pick from an empty list');
      }
      return items[Math.floor(next() * items.length)] as T;
    },
  };
}

/** FNV-1a 32-bit string hash. */
export function hashString(text: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** murmur3 finalizer: spreads small input differences over all 32 bits. */
function mixUint32(value: number): number {
  let h = value >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, MURMUR_MIX_1);
  h ^= h >>> 13;
  h = Math.imul(h, MURMUR_MIX_2);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Derives an independent seed from a base seed and a label. Used to give each
 * generation step its own random stream (tuning one step doesn't reshuffle the
 * others) and to derive retry seeds deterministically.
 */
export function deriveSeed(seed: number, label: string): number {
  return mixUint32(hashString(`${String(seed >>> 0)}:${label}`));
}

/**
 * Parses a user-supplied seed (e.g. from `?seed=`). Integers in uint32 range
 * are used as-is; any other non-empty text is hashed so word seeds work too.
 */
export function parseSeed(raw: string | null): number | null {
  if (raw === null) {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }
  if (/^\d+$/.test(trimmed)) {
    const value = Number(trimmed);
    if (value <= MAX_SEED) {
      return value;
    }
  }
  return hashString(trimmed);
}

/** Stable pseudo-random uint32 for grid coordinates (e.g. picking a tile sprite variant). */
export function hashCoords(x: number, y: number, salt = 0): number {
  return mixUint32(Math.imul(x, COORD_PRIME_X) ^ Math.imul(y, COORD_PRIME_Y) ^ salt);
}

/** Non-deterministic seed for "give me a new world". */
export function createRandomSeed(): number {
  return Math.floor(Math.random() * UINT32_RANGE);
}
