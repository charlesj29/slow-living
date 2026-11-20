import { CARDINAL_DIRECTIONS, cellCount, forEachNeighbor, type GridSize } from './grid';

/** Cost of entering a cell; `Infinity` means impassable. Must be > 0 for passable cells. */
export type StepCost = (index: number) => number;

/** Min-heap of cell indexes ordered by a priority array (typed arrays keep it allocation-free). */
class IndexMinHeap {
  private readonly items: number[] = [];

  constructor(private readonly priority: Float64Array) {}

  get size(): number {
    return this.items.length;
  }

  push(index: number): void {
    this.items.push(index);
    this.siftUp(this.items.length - 1);
  }

  pop(): number | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0 && last !== undefined) {
      this.items[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  private value(position: number): number {
    return this.priority[this.items[position] ?? 0] ?? Infinity;
  }

  private swap(a: number, b: number): void {
    const temp = this.items[a] ?? 0;
    this.items[a] = this.items[b] ?? 0;
    this.items[b] = temp;
  }

  private siftUp(start: number): void {
    let position = start;
    while (position > 0) {
      const parent = (position - 1) >> 1;
      if (this.value(parent) <= this.value(position)) return;
      this.swap(parent, position);
      position = parent;
    }
  }

  private siftDown(start: number): void {
    let position = start;
    for (;;) {
      const left = position * 2 + 1;
      const right = left + 1;
      let smallest = position;
      if (left < this.items.length && this.value(left) < this.value(smallest)) smallest = left;
      if (right < this.items.length && this.value(right) < this.value(smallest)) smallest = right;
      if (smallest === position) return;
      this.swap(smallest, position);
      position = smallest;
    }
  }
}

/**
 * 4-connected A* from `start` to `goal`. Returns the cell indexes of the
 * cheapest path including both ends, or null if the goal is unreachable.
 * `minStepCost` must not exceed the cheapest passable cell cost, otherwise the
 * heuristic overestimates and paths may be suboptimal.
 */
export function findPath(
  size: GridSize,
  start: number,
  goal: number,
  stepCost: StepCost,
  minStepCost = 1,
): number[] | null {
  const cells = cellCount(size);
  const costSoFar = new Float64Array(cells).fill(Infinity);
  const estimate = new Float64Array(cells).fill(Infinity);
  const cameFrom = new Int32Array(cells).fill(-1);
  const goalX = goal % size.width;
  const goalY = Math.floor(goal / size.width);
  const heuristic = (index: number): number =>
    (Math.abs((index % size.width) - goalX) + Math.abs(Math.floor(index / size.width) - goalY)) *
    minStepCost;

  const open = new IndexMinHeap(estimate);
  costSoFar[start] = 0;
  estimate[start] = heuristic(start);
  open.push(start);

  while (open.size > 0) {
    const current = open.pop() ?? start;
    if (current === goal) {
      const path = [goal];
      let step = cameFrom[goal] ?? -1;
      while (step !== -1) {
        path.push(step);
        step = cameFrom[step] ?? -1;
      }
      return path.reverse();
    }
    const currentCost = costSoFar[current] ?? Infinity;
    forEachNeighbor(size, current, CARDINAL_DIRECTIONS, (neighbor) => {
      const cost = stepCost(neighbor);
      if (!Number.isFinite(cost)) return;
      const candidate = currentCost + cost;
      if (candidate < (costSoFar[neighbor] ?? Infinity)) {
        costSoFar[neighbor] = candidate;
        cameFrom[neighbor] = current;
        // Stale heap entries are harmless: the cheaper copy is popped first.
        estimate[neighbor] = candidate + heuristic(neighbor);
        open.push(neighbor);
      }
    });
  }
  return null;
}
