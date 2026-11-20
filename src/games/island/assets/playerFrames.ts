// Assembles the player's body parts (playerPixels.ts) into animation strips,
// laid out as `PLAYER_FRAMES` says: idle (stand, breath, blink), an 8-frame
// walk cycle and an 8-frame run cycle per direction.
//
// Smoothness comes from small, consistent moves: the upper body bobs one
// pixel (down on contact, up while passing), arms swing against the legs,
// and running adds pumping arms, a lifted knee, a moment in the air and (side
// view) a forward lean.

import {
  BACK_HEAD,
  BACK_TORSO,
  EMPTY_ROW,
  EYE_ROW,
  FRONT_HEAD,
  FRONT_LEGS,
  FRONT_TORSO,
  SIDE_HEAD,
  SIDE_LEGS,
  SIDE_TORSO,
  type Rows,
} from './playerPixels';

/** Upper-body offset in pixels: +1 sinks into the legs (bent knees), -1 rises (legs stretch). */
type Bob = -1 | 0 | 1;

interface Pose {
  readonly torso: Rows;
  readonly legs: Rows;
  readonly bob: Bob;
  /** Both feet off the ground: the whole figure rises a pixel above its shadow. */
  readonly airborne?: boolean;
}

const mirror = (rows: Rows): string[] => rows.map((row) => [...row].reverse().join(''));

/** Moves leg rows left (the body then leans forward over them when facing right). */
const shiftLeft = (rows: Rows, by: number): string[] =>
  rows.map((row) => row.slice(by) + '.'.repeat(by));

/** Head (13 rows) + torso (6) + legs (5) = 24 rows, with the upper body bobbed. */
function compose(head: Rows, { torso, legs, bob, airborne = false }: Pose): string[] {
  const upper = [...head, ...torso];
  const [hip = EMPTY_ROW] = legs;
  const rows =
    bob === 1
      ? [EMPTY_ROW, ...upper, ...legs.slice(1)]
      : bob === -1
        ? [...upper.slice(1), hip, ...legs]
        : [...upper, ...legs];
  return airborne ? [...rows.slice(1), EMPTY_ROW] : rows;
}

/** Closes the eyes: the upper eye pixels become skin, leaving a one-pixel line. */
function blink(head: Rows): string[] {
  return head.map((row, y) => (y === EYE_ROW ? row.replace(/(?<=s)o(?=s)/g, 's') : row));
}

/** Front and back are symmetric: the second step is the first, mirrored. */
function symmetricStrip(head: Rows, torso: typeof FRONT_TORSO, eyes: boolean): string[][] {
  const legs = FRONT_LEGS;
  const stand: Pose = { torso: torso.stand, legs: legs.stand, bob: 0 };
  const walkStep: Pose[] = [
    stand,
    { torso: torso.swing, legs: legs.step, bob: 0 },
    { torso: torso.swing, legs: legs.stepHigh, bob: -1 },
    { torso: torso.swing, legs: legs.step, bob: 0 },
  ];
  const runStep: Pose[] = [
    { torso: torso.stand, legs: legs.stand, bob: 1 },
    { torso: torso.pump, legs: legs.stepHigh, bob: 0 },
    { torso: torso.pump, legs: legs.stepHigh, bob: -1, airborne: true },
    { torso: torso.swing, legs: legs.step, bob: 0 },
  ];
  const cycle = (step: Pose[]): string[][] => {
    const half = step.map((pose) => compose(head, pose));
    return [...half, ...half.map(mirror)];
  };
  return [
    compose(head, stand),
    compose(head, { ...stand, bob: 1 }),
    compose(eyes ? blink(head) : head, stand),
    ...cycle(walkStep),
    ...cycle(runStep),
  ];
}

/** Facing right; facing left is the mirror image. */
function sideStrip(): string[][] {
  const t = SIDE_TORSO;
  const l = SIDE_LEGS;
  const stand: Pose = { torso: t.stand, legs: l.stand, bob: 0 };
  const walk: Pose[] = [
    { torso: t.forward, legs: l.stride, bob: 0 },
    { torso: t.forward, legs: l.stride, bob: 1 },
    { torso: t.stand, legs: l.passing, bob: 0 },
    { torso: t.stand, legs: l.passing, bob: -1 },
    { torso: t.back, legs: l.strideOther, bob: 0 },
    { torso: t.back, legs: l.strideOther, bob: 1 },
    { torso: t.stand, legs: l.passing, bob: 0 },
    { torso: t.stand, legs: l.passing, bob: -1 },
  ];
  const lean = (legs: Rows): string[] => shiftLeft(legs, 1);
  const run: Pose[] = [
    { torso: t.forward, legs: lean(l.runStride), bob: 1 },
    { torso: t.forward, legs: lean(l.runStride), bob: 0 },
    { torso: t.stand, legs: lean(l.runAir), bob: -1, airborne: true },
    { torso: t.stand, legs: lean(l.runAir), bob: 0 },
    { torso: t.back, legs: lean(l.runStride), bob: 1 },
    { torso: t.back, legs: lean(l.runStride), bob: 0 },
    { torso: t.stand, legs: lean(l.runAir), bob: -1, airborne: true },
    { torso: t.stand, legs: lean(l.runAir), bob: 0 },
  ];
  return [
    compose(SIDE_HEAD, stand),
    compose(SIDE_HEAD, { ...stand, bob: 1 }),
    compose(blink(SIDE_HEAD), stand),
    ...walk.map((pose) => compose(SIDE_HEAD, pose)),
    ...run.map((pose) => compose(SIDE_HEAD, pose)),
  ];
}

const SIDE = sideStrip();

/** Pixel maps per direction, in `PLAYER_FRAMES` order (`PLAYER_FRAME_COUNT` each). */
export const PLAYER_PIXEL_MAPS: Readonly<
  Record<'down' | 'up' | 'left' | 'right', readonly Rows[]>
> = {
  down: symmetricStrip(FRONT_HEAD, FRONT_TORSO, true),
  up: symmetricStrip(BACK_HEAD, BACK_TORSO, false),
  right: SIDE,
  left: SIDE.map(mirror),
};
