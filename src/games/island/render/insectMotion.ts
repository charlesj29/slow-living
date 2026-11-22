// How the decorative insects move, as pure functions of time (they have no
// effect on the game, so they aren't simulated: the drawing just asks where
// one is now). Butterflies rest on a flower, flutter to a second flower along
// a wavy path and back; fireflies drift round their swarm and blink.
import type { Rng } from '@/shared/engine/random';
import type { IslandConfig } from '../core/config';
import { BUTTERFLY_FRAMES } from '../assets/paintInsects';
import type { ButterflyRoute } from './ambientSpots';

export interface InsectPose {
  /** Map pixels of the point on the ground under it, and how high above that it is. */
  readonly x: number;
  readonly groundY: number;
  readonly lift: number;
}

export interface ButterflyPose extends InsectPose {
  readonly frame: number;
}

/** Perched on a flower head, this high above the tile centre. */
const PERCH_LIFT_PX = 4;
/** Wing beat while flying: open, half, closed, half. */
const FLAP_CYCLE = [
  BUTTERFLY_FRAMES.open,
  BUTTERFLY_FRAMES.half,
  BUTTERFLY_FRAMES.closed,
  BUTTERFLY_FRAMES.half,
] as const;
/** Perched, the wings rest open and fold now and then. */
const PERCH_FOLD_EVERY_SECONDS = 2.2;
const PERCH_FOLD_SECONDS = 0.5;
/** Little up-and-down flutters per flight. */
const FLUTTER_BOBS = 7;
const FLUTTER_PX = 1.5;

const smoothstep = (t: number): number => t * t * (3 - 2 * t);
const TAU = Math.PI * 2;

function perchFrame(seconds: number): number {
  const t = seconds % PERCH_FOLD_EVERY_SECONDS;
  if (t < PERCH_FOLD_EVERY_SECONDS - PERCH_FOLD_SECONDS) return BUTTERFLY_FRAMES.open;
  const fold = (t - (PERCH_FOLD_EVERY_SECONDS - PERCH_FOLD_SECONDS)) / PERCH_FOLD_SECONDS;
  return fold < 0.25 || fold > 0.75 ? BUTTERFLY_FRAMES.half : BUTTERFLY_FRAMES.closed;
}

/** Where a butterfly is at `seconds`: perched, or on its way to the other flower. */
export function butterflyPose(
  route: ButterflyRoute,
  seconds: number,
  settings: IslandConfig['butterflies'],
): ButterflyPose {
  const leg = settings.restSeconds + settings.flightSeconds;
  const cycle = 2 * leg;
  const t = (((seconds + route.phase * cycle) % cycle) + cycle) % cycle;
  const outbound = t < leg;
  const inLeg = outbound ? t : t - leg;
  const [start, end] = outbound ? [route.from, route.to] : [route.to, route.from];
  if (inLeg < settings.restSeconds) {
    return { x: start.x, groundY: start.y, lift: PERCH_LIFT_PX, frame: perchFrame(seconds) };
  }
  const u = (inLeg - settings.restSeconds) / settings.flightSeconds;
  const along = smoothstep(u);
  // Wanders off the straight line mid-flight; leaves and lands right on the flowers.
  const away = Math.sin(Math.PI * u);
  const swirl = route.phase * TAU;
  const x =
    start.x +
    (end.x - start.x) * along +
    away * settings.wanderPx * Math.sin(TAU * 1.3 * u + swirl);
  const groundY =
    start.y +
    (end.y - start.y) * along +
    away * settings.wanderPx * 0.6 * Math.sin(TAU * 2.1 * u + swirl * 1.7);
  const lift =
    PERCH_LIFT_PX + away * settings.heightPx + away * FLUTTER_PX * Math.sin(TAU * FLUTTER_BOBS * u);
  const frame = FLAP_CYCLE[Math.floor(seconds / settings.flapFrameSeconds) % FLAP_CYCLE.length];
  return { x, groundY, lift, frame: frame ?? BUTTERFLY_FRAMES.open };
}

/** One firefly's own rhythm, fixed when the swarm is made. */
export interface Firefly {
  readonly centreX: number;
  readonly centreY: number;
  /** Drift speeds (radians per second) and offsets. */
  readonly speeds: readonly [number, number, number, number];
  readonly offsets: readonly [number, number, number, number];
  readonly blinkSeconds: number;
  readonly blinkOffset: number;
}

export type FireflyGlow = 'glow' | 'dim' | 'off';

export interface FireflyPose extends InsectPose {
  readonly glow: FireflyGlow;
}

/** Fireflies hover about this high (map pixels), bobbing a little. */
const HOVER_PX = 8;
const HOVER_BOB_PX = 3;
/** Parts of a blink: fade in (dim), lit, fade out (dim), then dark. */
const BLINK = { dimIn: 0.08, lit: 0.42, dimOut: 0.52 } as const;

/** Where a firefly is at `seconds`, and how brightly it glows. */
export function fireflyPose(fly: Firefly, seconds: number, driftPx: number): FireflyPose {
  const [a, b, c, d] = fly.speeds;
  const [p, q, r, s] = fly.offsets;
  const x =
    fly.centreX + driftPx * (0.65 * Math.sin(a * seconds + p) + 0.35 * Math.sin(b * seconds + q));
  const groundY =
    fly.centreY +
    driftPx * 0.6 * (0.65 * Math.sin(c * seconds + r) + 0.35 * Math.sin(d * seconds + s));
  const lift = HOVER_PX + HOVER_BOB_PX * Math.sin(b * seconds + r);
  const u =
    (((seconds + fly.blinkOffset) % fly.blinkSeconds) + fly.blinkSeconds) % fly.blinkSeconds;
  const k = u / fly.blinkSeconds;
  const glow: FireflyGlow =
    k < BLINK.dimIn ? 'dim' : k < BLINK.lit ? 'glow' : k < BLINK.dimOut ? 'dim' : 'off';
  return { x, groundY, lift, glow };
}

/** Drift speeds (radians per second): slow and lazy. */
const DRIFT_SPEED = { min: 0.25, max: 0.7 } as const;

/** The fireflies of every swarm, each with its own drift and blink (the same per seed). */
export function createFireflies(
  swarms: readonly { readonly x: number; readonly y: number }[],
  settings: IslandConfig['fireflies'],
  rng: Rng,
): Firefly[] {
  const speed = (): number => rng.range(DRIFT_SPEED.min, DRIFT_SPEED.max);
  const angle = (): number => rng.range(0, TAU);
  return swarms.flatMap((swarm) =>
    Array.from({ length: settings.perSwarm }, (): Firefly => {
      const blinkSeconds = rng.range(settings.minBlinkSeconds, settings.maxBlinkSeconds);
      return {
        centreX: swarm.x,
        centreY: swarm.y,
        speeds: [speed(), speed(), speed(), speed()],
        offsets: [angle(), angle(), angle(), angle()],
        blinkSeconds,
        blinkOffset: rng.range(0, blinkSeconds),
      };
    }),
  );
}
