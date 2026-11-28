// What a leaping fish looks like at a moment of its leap: the fish itself
// (only once it has cleared the water, nose up, level, then nose down), a
// small splash where it bursts out, and a bigger one the instant it dives back
// in: a crown of foam and droplets, then rings spreading over the water. Pure.
import type { IslandConfig } from '../core/config';
import { LEAP_TRAVEL_PX, type FishJump } from './fishJumps';

type LakeSettings = IslandConfig['lakeLife'];

/** The fish shows once it is this high out of the water (map pixels). */
export const EMERGE_PX = 4;
/** How long each crown frame lasts (burst, spread, fall), and each ring after it. */
const CROWN_SECONDS = [0.1, 0.13, 0.15] as const;
const RIPPLE_SECONDS = 0.26;
/** The rings start once the crown has burst. */
const RIPPLES_FROM = CROWN_SECONDS[0];
/** Rising nose-up until here, level until here, then falling nose-down (fraction of the leap). */
const LEVEL_FROM = 0.35;
const FALL_FROM = 0.65;
/** A splash: all three crown frames and rings for the dive, two of each as it bursts out. */
const BIG = { crowns: 3, ripples: 3 } as const;
const SMALL = { crowns: 2, ripples: 2 } as const;

/** How long the dive's splash lasts, from the moment the fish touches the water. */
export const DIVE_SPLASH_SECONDS = RIPPLES_FROM + BIG.ripples * RIPPLE_SECONDS;

export interface Splash {
  /** Map pixels: where it is on the water. */
  readonly x: number;
  readonly y: number;
  /** Which crown frame and which ring show (null: none any more). */
  readonly crown: number | null;
  readonly ripple: number | null;
}

export interface LeapScene {
  readonly fish: {
    readonly x: number;
    readonly waterY: number;
    readonly lift: number;
    readonly pose: 'up' | 'level' | 'down';
  } | null;
  readonly burst: Splash | null;
  readonly dive: Splash | null;
}

function splashAt(
  since: number,
  size: typeof BIG | typeof SMALL,
  x: number,
  y: number,
): Splash | null {
  if (since < 0) return null;
  let crown: number | null = null;
  let end = 0;
  for (let i = 0; i < size.crowns; i++) {
    end += CROWN_SECONDS[i] ?? 0;
    if (since < end) {
      crown = i;
      break;
    }
  }
  const r = Math.floor((since - RIPPLES_FROM) / RIPPLE_SECONDS);
  const ripple = since >= RIPPLES_FROM && r < size.ripples ? r : null;
  return crown === null && ripple === null ? null : { x, y, crown, ripple };
}

/** The leap's fraction at which the fish dips back under (it shows only above `EMERGE_PX`). */
export function diveAt(settings: LakeSettings): number {
  return 1 - Math.asin(Math.min(1, EMERGE_PX / settings.fishJumpHeightPx)) / Math.PI;
}

export function leapScene(jump: FishJump, settings: LakeSettings): LeapScene {
  const p = jump.progress;
  const dir = jump.toLeft ? -1 : 1;
  const lift = Math.sin(Math.PI * Math.min(1, p)) * settings.fishJumpHeightPx;
  const under = diveAt(settings);
  const inAir = p < under && lift >= EMERGE_PX;
  const fish = inAir
    ? ({
        x: jump.x + dir * LEAP_TRAVEL_PX * p,
        waterY: jump.y,
        lift,
        pose: p < LEVEL_FROM ? 'up' : p < FALL_FROM ? 'level' : 'down',
      } as const)
    : null;
  const seconds = settings.fishJumpSeconds;
  return {
    fish,
    burst: splashAt(p * seconds, SMALL, jump.x, jump.y),
    dive: splashAt((p - under) * seconds, BIG, jump.x + dir * LEAP_TRAVEL_PX * under, jump.y),
  };
}
