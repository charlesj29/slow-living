// Helpers for row-major 2D grids stored in flat arrays (index = y * width + x).

export interface GridSize {
  readonly width: number;
  readonly height: number;
}

export interface TilePoint {
  readonly x: number;
  readonly y: number;
}

export const CARDINAL_DIRECTIONS: readonly TilePoint[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export const EIGHT_DIRECTIONS: readonly TilePoint[] = [
  ...CARDINAL_DIRECTIONS,
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
];

export const UNREACHABLE = -1;

export function toIndex(size: GridSize, x: number, y: number): number {
  return y * size.width + x;
}

export function toPoint(size: GridSize, index: number): TilePoint {
  return { x: index % size.width, y: Math.floor(index / size.width) };
}

export function isInBounds(size: GridSize, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < size.width && y < size.height;
}

export function isOnBorder(size: GridSize, x: number, y: number): boolean {
  return x === 0 || y === 0 || x === size.width - 1 || y === size.height - 1;
}

export function cellCount(size: GridSize): number {
  return size.width * size.height;
}

/** Calls `visit` with the index of every in-bounds neighbour. */
export function forEachNeighbor(
  size: GridSize,
  index: number,
  directions: readonly TilePoint[],
  visit: (neighborIndex: number) => void,
): void {
  const x = index % size.width;
  const y = Math.floor(index / size.width);
  for (const direction of directions) {
    const nx = x + direction.x;
    const ny = y + direction.y;
    if (isInBounds(size, nx, ny)) {
      visit(toIndex(size, nx, ny));
    }
  }
}

/**
 * 4-connected breadth-first flood fill from one or more start cells.
 * Returns a mask (1 = reached). Start cells that can't be entered are skipped.
 */
export function floodFill(
  size: GridSize,
  startIndexes: readonly number[],
  canEnter: (index: number) => boolean,
): Uint8Array {
  const visited = new Uint8Array(cellCount(size));
  const queue = new Int32Array(cellCount(size));
  let head = 0;
  let tail = 0;
  for (const start of startIndexes) {
    if (visited[start] === 0 && canEnter(start)) {
      visited[start] = 1;
      queue[tail++] = start;
    }
  }
  while (head < tail) {
    const current = queue[head++] ?? 0;
    forEachNeighbor(size, current, CARDINAL_DIRECTIONS, (neighbor) => {
      if (visited[neighbor] === 0 && canEnter(neighbor)) {
        visited[neighbor] = 1;
        queue[tail++] = neighbor;
      }
    });
  }
  return visited;
}

export interface RegionLabels {
  /** Region number per cell, or UNREACHABLE (-1) for non-member cells. */
  readonly labels: Int32Array;
  /** Cell count per region, indexed by region number. */
  readonly regionSizes: readonly number[];
}

/** Labels 4-connected regions of cells for which `isMember` is true. */
export function labelRegions(size: GridSize, isMember: (index: number) => boolean): RegionLabels {
  const labels = new Int32Array(cellCount(size)).fill(UNREACHABLE);
  const regionSizes: number[] = [];
  const queue = new Int32Array(cellCount(size));

  for (let start = 0; start < labels.length; start++) {
    if (labels[start] !== UNREACHABLE || !isMember(start)) {
      continue;
    }
    const region = regionSizes.length;
    let head = 0;
    let tail = 0;
    labels[start] = region;
    queue[tail++] = start;
    while (head < tail) {
      const current = queue[head++] ?? 0;
      forEachNeighbor(size, current, CARDINAL_DIRECTIONS, (neighbor) => {
        if (labels[neighbor] === UNREACHABLE && isMember(neighbor)) {
          labels[neighbor] = region;
          queue[tail++] = neighbor;
        }
      });
    }
    regionSizes.push(tail);
  }
  return { labels, regionSizes };
}

/**
 * Multi-source BFS: number of steps from each cell to the nearest source cell
 * (0 for sources). UNREACHABLE (-1) if there are no sources. With
 * EIGHT_DIRECTIONS this is the Chebyshev distance, so rings built from it
 * also cover diagonal neighbours.
 */
export function distanceField(
  size: GridSize,
  isSource: (index: number) => boolean,
  directions: readonly TilePoint[] = CARDINAL_DIRECTIONS,
): Int32Array {
  const distances = new Int32Array(cellCount(size)).fill(UNREACHABLE);
  const queue = new Int32Array(cellCount(size));
  let head = 0;
  let tail = 0;
  for (let index = 0; index < distances.length; index++) {
    if (isSource(index)) {
      distances[index] = 0;
      queue[tail++] = index;
    }
  }
  while (head < tail) {
    const current = queue[head++] ?? 0;
    const nextDistance = (distances[current] ?? 0) + 1;
    forEachNeighbor(size, current, directions, (neighbor) => {
      if (distances[neighbor] === UNREACHABLE) {
        distances[neighbor] = nextDistance;
        queue[tail++] = neighbor;
      }
    });
  }
  return distances;
}
