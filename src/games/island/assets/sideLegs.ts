// Side-view legs (facing right), drawn from foot positions instead of by
// hand, so every walk/run frame has the legs genuinely in a different place
// and the two halves of a cycle swap which leg is in front. The near leg is
// light (`p`), the far leg dark (`P`); outlines are added around everything,
// and between the legs where the near one covers the far one.
import { PLAYER_WIDTH, type Rows } from './playerPixels';

export interface FootPose {
  /** Column of the foot's centre (the toe points right). */
  readonly x: number;
  /** Rows the foot is off the ground: 0 planted, 1 heel up / tucked, 2 knee raised high. */
  readonly lift: 0 | 1 | 2;
}

const ROWS = 5;
/** Shoe row when the foot is planted; the row below it is the sole's outline. */
const GROUND_SHOE_ROW = 3;
/** The waistband, the same in every frame (it meets the jacket hem above). */
const WAIST = { left: 4, right: 9 };
const HIP_SPREAD = 1;

type Cell = '' | 'waist' | 'nearLeg' | 'nearShoe' | 'farLeg' | 'farShoe';

const CHAR: Readonly<Record<Exclude<Cell, ''>, string>> = {
  waist: 'p',
  nearLeg: 'p',
  nearShoe: 'k',
  farLeg: 'P',
  farShoe: 'k',
};

function paintLeg(grid: Cell[][], hipX: number, foot: FootPose, near: boolean): void {
  const shoeRow = GROUND_SHOE_ROW - foot.lift;
  // Two pixels wide, from the hip towards the foot: thin enough that both legs
  // stay readable as they scissor past each other.
  for (let row = 1; row < shoeRow; row++) {
    const left = Math.round(hipX + ((foot.x - hipX) * row) / shoeRow - 0.5);
    for (let x = left; x <= left + 1; x++) set(grid, x, row, near ? 'nearLeg' : 'farLeg');
  }
  for (let x = foot.x - 1; x <= foot.x + 2; x++)
    set(grid, x, shoeRow, near ? 'nearShoe' : 'farShoe');
}

function set(grid: Cell[][], x: number, y: number, cell: Cell): void {
  const row = grid[y];
  if (row && x >= 0 && x < PLAYER_WIDTH) row[x] = cell;
}

const at = (grid: Cell[][], x: number, y: number): Cell => grid[y]?.[x] ?? '';
const isNear = (cell: Cell): boolean => cell === 'nearLeg' || cell === 'nearShoe';
const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** Five leg rows for one frame; `hipX` below the body's centre (lower = leaning forward). */
export function sideLegs(near: FootPose, far: FootPose, hipX = 6): Rows {
  const grid: Cell[][] = Array.from({ length: ROWS }, () => Array<Cell>(PLAYER_WIDTH).fill(''));
  for (let x = WAIST.left; x <= WAIST.right; x++) set(grid, x, 0, 'waist');
  // The hips sit side by side: the far leg hangs from just behind, the near one just ahead.
  paintLeg(grid, hipX - HIP_SPREAD, far, false);
  paintLeg(grid, hipX + HIP_SPREAD, near, true);

  return grid.map((row, y) =>
    row
      .map((cell, x) => {
        const neighbours = NEIGHBOURS.map(([dx, dy]) => at(grid, x + dx, y + dy));
        if (cell === '') return neighbours.some((n) => n !== '') ? 'o' : '.';
        // Trousers tell apart by shade; a far shoe touching the near leg gets a seam.
        if (cell === 'farShoe' && neighbours.some(isNear)) return 'o';
        return CHAR[cell];
      })
      .join(''),
  );
}
