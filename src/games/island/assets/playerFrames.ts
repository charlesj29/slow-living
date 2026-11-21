// Assembles a character's body parts (the explorer's in playerPixels.ts, the
// villagers' in villagerParts.ts) into animation strips, laid out as
// `PLAYER_FRAMES` says: idle (stand, breath, blink), an 8-frame
// walk cycle, an 8-frame run cycle and a sitting frame per direction.
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
import { sideLegs, type FootPose } from './sideLegs';

/** Upper-body offset in pixels: +1 sinks into the legs (bent knees), -1 rises (legs stretch). */
type Bob = -1 | 0 | 1;

/** Everything that differs between characters; legs and timing are shared. */
export interface CharacterParts {
  readonly frontHead: Rows;
  readonly backHead: Rows;
  readonly sideHead: Rows;
  readonly frontTorso: { readonly stand: Rows; readonly swing: Rows; readonly pump: Rows };
  readonly backTorso: { readonly stand: Rows; readonly swing: Rows; readonly pump: Rows };
  /** Facing right. */
  readonly sideTorso: { readonly stand: Rows; readonly forward: Rows; readonly back: Rows };
}

interface Pose {
  readonly torso: Rows;
  readonly legs: Rows;
  readonly bob: Bob;
  /** Both feet off the ground: the whole figure rises a pixel above its shadow. */
  readonly airborne?: boolean;
}

const mirror = (rows: Rows): string[] => rows.map((row) => [...row].reverse().join(''));

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

/**
 * Sitting (on a bench, seen from the front): the same upper body two rows
 * lower, on legs with the thigh rows dropped, so the knees seem to point at
 * the viewer and the feet stay at the bottom.
 */
function sitting(head: Rows, torso: Rows, legs: Rows): string[] {
  const [hip = EMPTY_ROW] = legs;
  return [EMPTY_ROW, EMPTY_ROW, ...head, ...torso, hip, ...legs.slice(3)];
}

/** Closes the eyes: the upper eye pixels become skin, leaving a one-pixel line. */
function blink(head: Rows): string[] {
  return head.map((row, y) => (y === EYE_ROW ? row.replace(/(?<=s)o(?=s)/g, 's') : row));
}

/** Front and back are symmetric: the second step is the first, mirrored. */
function symmetricStrip(
  head: Rows,
  torso: CharacterParts['frontTorso'],
  eyes: boolean,
): string[][] {
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
    sitting(head, torso.stand, legs.stand),
  ];
}

/** One side-view frame: near foot, far foot, body bob, airborne. */
type SideStep = readonly [FootPose, FootPose, Bob, boolean];
const foot = (x: number, lift: FootPose['lift'] = 0): FootPose => ({ x, lift });

/**
 * Walk: contact (near leg forward), push down, the far leg swings through
 * just clear of the ground, reach; then the same with the legs swapped.
 * Feet stay low: only the swinging foot lifts, one pixel, as it passes.
 */
const SIDE_WALK: readonly SideStep[] = [
  [foot(9), foot(3), 0, false],
  [foot(8), foot(4), 1, false],
  [foot(5), foot(7, 1), 0, false],
  [foot(4), foot(8), -1, false],
  [foot(3), foot(9), 0, false],
  [foot(4), foot(8), 1, false],
  [foot(7, 1), foot(5), 0, false],
  [foot(8), foot(4), -1, false],
];

/**
 * Run: a longer reach, the back foot pushes off, the knee comes through
 * and both feet leave the ground in a scissor; then legs swapped. Feet lift
 * at most one pixel (more looks like kicking on a sprite this small); the
 * hips sit a pixel back, so the body leans into the run.
 */
const SIDE_RUN: readonly SideStep[] = [
  [foot(9), foot(2, 1), 0, false],
  [foot(7), foot(3, 1), 1, false],
  [foot(4), foot(7, 1), 0, false],
  [foot(3), foot(9, 1), -1, true],
  [foot(2, 1), foot(9), 0, false],
  [foot(3, 1), foot(7), 1, false],
  [foot(7, 1), foot(4), 0, false],
  [foot(9, 1), foot(3), -1, true],
];
const WALK_HIP_X = 6;
const RUN_HIP_X = 5;

/** Facing right; facing left is the mirror image. */
function sideStrip(parts: CharacterParts): string[][] {
  const t = parts.sideTorso;
  const head = parts.sideHead;
  const l = SIDE_LEGS;
  const stand: Pose = { torso: t.stand, legs: l.stand, bob: 0 };
  // Arms swing against the near leg: back while it reaches forward, forward while it trails.
  const arms = [t.back, t.back, t.stand, t.forward, t.forward, t.forward, t.stand, t.back];
  const cycle = (steps: readonly SideStep[], hipX: number): Pose[] =>
    steps.map(([near, far, bob, airborne], i) => ({
      torso: arms[i] ?? t.stand,
      legs: sideLegs(near, far, hipX),
      bob,
      airborne,
    }));
  const walk = cycle(SIDE_WALK, WALK_HIP_X);
  const run = cycle(SIDE_RUN, RUN_HIP_X);
  return [
    compose(head, stand),
    compose(head, { ...stand, bob: 1 }),
    compose(blink(head), stand),
    ...walk.map((pose) => compose(head, pose)),
    ...run.map((pose) => compose(head, pose)),
    sitting(head, t.stand, l.stand),
  ];
}

export type CharacterMaps = Readonly<Record<'down' | 'up' | 'left' | 'right', readonly Rows[]>>;

/** Pixel maps per direction, in `PLAYER_FRAMES` order (`PLAYER_FRAME_COUNT` each). */
export function buildCharacterMaps(parts: CharacterParts): CharacterMaps {
  const side = sideStrip(parts);
  return {
    down: symmetricStrip(parts.frontHead, parts.frontTorso, true),
    up: symmetricStrip(parts.backHead, parts.backTorso, false),
    right: side,
    left: side.map(mirror),
  };
}

export const PLAYER_PARTS: CharacterParts = {
  frontHead: FRONT_HEAD,
  backHead: BACK_HEAD,
  sideHead: SIDE_HEAD,
  frontTorso: FRONT_TORSO,
  backTorso: BACK_TORSO,
  sideTorso: SIDE_TORSO,
};

export const PLAYER_PIXEL_MAPS: CharacterMaps = buildCharacterMaps(PLAYER_PARTS);
