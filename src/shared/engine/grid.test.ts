import { describe, expect, it } from 'vitest';
import {
  distanceField,
  EIGHT_DIRECTIONS,
  floodFill,
  labelRegions,
  toIndex,
  toPoint,
  UNREACHABLE,
} from './grid';

// Builds a grid from rows of '#' (member/wall) and '.' characters.
function parse(rows: readonly string[]): {
  size: { width: number; height: number };
  cells: string[];
} {
  return {
    size: { width: rows[0]?.length ?? 0, height: rows.length },
    cells: rows.join('').split(''),
  };
}

describe('index helpers', () => {
  it('round-trips between index and point', () => {
    const size = { width: 5, height: 4 };
    expect(toIndex(size, 3, 2)).toBe(13);
    expect(toPoint(size, 13)).toEqual({ x: 3, y: 2 });
  });
});

describe('floodFill', () => {
  it('fills only 4-connected open cells reachable from the start', () => {
    const { size, cells } = parse(['..#.', '..#.', '###.', '....']);
    const reached = floodFill(size, [0], (i) => cells[i] === '.');
    expect(reached[toIndex(size, 1, 1)]).toBe(1);
    expect(reached[toIndex(size, 3, 0)]).toBe(0);
    expect(reached.reduce((sum, v) => sum + v, 0)).toBe(4);
  });

  it('skips start cells that cannot be entered', () => {
    const { size, cells } = parse(['#.']);
    expect(floodFill(size, [0], (i) => cells[i] === '.').every((v) => v === 0)).toBe(true);
  });
});

describe('labelRegions', () => {
  it('counts separate 4-connected regions (diagonals do not connect)', () => {
    const { size, cells } = parse(['#..#', '.#..', '...#']);
    const { labels, regionSizes } = labelRegions(size, (i) => cells[i] === '#');
    expect(regionSizes).toEqual([1, 1, 1, 1]);
    expect(labels[toIndex(size, 1, 0)]).toBe(UNREACHABLE);
  });
});

describe('distanceField', () => {
  it('measures 4-connected steps to the nearest source', () => {
    const { size, cells } = parse(['#...', '....', '...#']);
    const distances = distanceField(size, (i) => cells[i] === '#');
    expect(distances[toIndex(size, 0, 0)]).toBe(0);
    expect(distances[toIndex(size, 2, 0)]).toBe(2);
    expect(distances[toIndex(size, 1, 2)]).toBe(2);
  });

  it('measures Chebyshev distance with eight directions', () => {
    const { size, cells } = parse(['#...', '....', '....']);
    const distances = distanceField(size, (i) => cells[i] === '#', EIGHT_DIRECTIONS);
    expect(distances[toIndex(size, 2, 2)]).toBe(2);
    expect(distances[toIndex(size, 1, 1)]).toBe(1);
  });

  it('marks everything unreachable without sources', () => {
    const distances = distanceField({ width: 2, height: 2 }, () => false);
    expect([...distances]).toEqual([UNREACHABLE, UNREACHABLE, UNREACHABLE, UNREACHABLE]);
  });
});
