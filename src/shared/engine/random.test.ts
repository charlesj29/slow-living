import { describe, expect, it } from 'vitest';
import { createRng, deriveSeed, hashString, mulberry32, parseSeed } from './random';

describe('mulberry32', () => {
  it('produces a stable sequence (matches the reference implementation)', () => {
    const next = mulberry32(1234);
    expect([next(), next(), next(), next(), next()]).toEqual([
      0.07329497812315822, 0.7034119898453355, 0.9028560190927237, 0.9705493662040681,
      0.04096397617831826,
    ]);
  });

  it('gives identical sequences for identical seeds and different ones otherwise', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const c = mulberry32(43);
    const sequenceA = Array.from({ length: 10 }, a);
    expect(Array.from({ length: 10 }, b)).toEqual(sequenceA);
    expect(Array.from({ length: 10 }, c)).not.toEqual(sequenceA);
  });

  it('stays in [0, 1)', () => {
    const next = mulberry32(7);
    for (let i = 0; i < 10_000; i++) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('createRng', () => {
  it('int stays within inclusive bounds and hits both ends', () => {
    const rng = createRng(99);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const value = rng.int(3, 6);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(6);
      seen.add(value);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('pick throws on an empty list', () => {
    expect(() => createRng(1).pick([])).toThrow(RangeError);
  });
});

describe('deriveSeed', () => {
  it('is deterministic and label-sensitive', () => {
    expect(deriveSeed(10, 'trees')).toBe(deriveSeed(10, 'trees'));
    expect(deriveSeed(10, 'trees')).not.toBe(deriveSeed(10, 'flowers'));
    expect(deriveSeed(10, 'trees')).not.toBe(deriveSeed(11, 'trees'));
  });

  it('returns a uint32', () => {
    const seed = deriveSeed(123, 'x');
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffff_ffff);
  });
});

describe('parseSeed', () => {
  it('accepts uint32 integers as-is', () => {
    expect(parseSeed('1234')).toBe(1234);
    expect(parseSeed(' 0 ')).toBe(0);
    expect(parseSeed('4294967295')).toBe(4294967295);
  });

  it('returns null for missing or blank input', () => {
    expect(parseSeed(null)).toBeNull();
    expect(parseSeed('   ')).toBeNull();
  });

  it('hashes other text so word seeds are reproducible', () => {
    expect(parseSeed('palm')).toBe(hashString('palm'));
    expect(parseSeed('4294967296')).toBe(hashString('4294967296'));
  });
});
