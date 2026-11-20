import { describe, expect, it } from 'vitest';
import { toIndex } from './grid';
import { findPath } from './pathfinding';

function gridOf(rows: readonly string[]): {
  size: { width: number; height: number };
  at: (x: number, y: number) => number;
  cost: (index: number) => number;
} {
  const size = { width: rows[0]?.length ?? 0, height: rows.length };
  const cells = rows.join('');
  return {
    size,
    at: (x, y) => toIndex(size, x, y),
    // '#' wall, '2' expensive, anything else costs 1
    cost: (index) => (cells[index] === '#' ? Infinity : cells[index] === '2' ? 5 : 1),
  };
}

describe('findPath', () => {
  it('finds a shortest path around walls', () => {
    const { size, at, cost } = gridOf(['....', '.##.', '....']);
    const path = findPath(size, at(0, 1), at(3, 1), cost);
    expect(path?.[0]).toBe(at(0, 1));
    expect(path?.at(-1)).toBe(at(3, 1));
    expect(path).toHaveLength(6);
  });

  it('prefers cheaper cells over a shorter route', () => {
    const { size, at, cost } = gridOf(['.....', '.222.', '.....']);
    const path = findPath(size, at(0, 1), at(4, 1), cost);
    expect(path).not.toContain(at(2, 1));
  });

  it('returns null when the goal is unreachable', () => {
    const { size, at, cost } = gridOf(['..#..', '..#..']);
    expect(findPath(size, at(0, 0), at(4, 0), cost)).toBeNull();
  });

  it('only takes 4-connected steps', () => {
    const { size, at, cost } = gridOf(['...', '...', '...']);
    const path = findPath(size, at(0, 0), at(2, 2), cost) ?? [];
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1] ?? 0;
      const b = path[i] ?? 0;
      const dx = Math.abs((a % 3) - (b % 3));
      const dy = Math.abs(Math.floor(a / 3) - Math.floor(b / 3));
      expect(dx + dy).toBe(1);
    }
  });
});
