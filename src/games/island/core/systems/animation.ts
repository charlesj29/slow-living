import type { Player } from '../entities/player';

/**
 * Frame layout of each direction's sprite strip: three idle frames, then an
 * 8-frame walk cycle and an 8-frame run cycle (two steps each), then sitting.
 */
export const PLAYER_FRAMES = {
  stand: 0,
  breath: 1,
  blink: 2,
  walkStart: 3,
  runStart: 11,
  cycleLength: 8,
  /** Sitting on a bench (shorter legs: the knees point at the viewer). */
  sit: 19,
} as const;
export const PLAYER_FRAME_COUNT = PLAYER_FRAMES.sit + 1;

export interface AnimationSettings {
  /** Distance covered by one full walk cycle (two steps), so feet don't slide. */
  readonly walkCyclePx: number;
  readonly runCyclePx: number;
  /** One breath: standing, then sinking a pixel for the rest of the cycle. */
  readonly breathCycleSeconds: number;
  readonly breathHoldSeconds: number;
  readonly blinkEverySeconds: number;
  readonly blinkSeconds: number;
  readonly walkSpeedTilesPerSecond: number;
}

/**
 * Advances the step cycle by the distance actually walked (so strides match
 * the ground), or by walking speed when pushing against an obstacle (walking
 * in place). Standing still resets it and counts idle time instead.
 */
export function updatePlayerAnimation(
  player: Player,
  stepSeconds: number,
  settings: AnimationSettings,
  tileSizePx: number,
): void {
  if (!player.moving) {
    player.strideDistance = 0;
    player.idleTime += stepSeconds;
    return;
  }
  player.idleTime = 0;
  const moved = Math.hypot(player.x - player.previousX, player.y - player.previousY);
  const inPlace = settings.walkSpeedTilesPerSecond * tileSizePx * stepSeconds;
  player.strideDistance += moved > 0 ? moved : inPlace;
}

function idleFrame(idleTime: number, settings: AnimationSettings): number {
  const inBreath = idleTime % settings.breathCycleSeconds;
  if (inBreath >= settings.breathHoldSeconds) return PLAYER_FRAMES.breath;
  const sinceBlink = idleTime % settings.blinkEverySeconds;
  return sinceBlink >= settings.blinkEverySeconds - settings.blinkSeconds
    ? PLAYER_FRAMES.blink
    : PLAYER_FRAMES.stand;
}

/**
 * Which sprite frame to show. Moving: the walk or run cycle at the point the
 * stride has reached; it starts one frame in, so the first step shows at once.
 * Standing: a slow breath with the occasional blink.
 */
export function playerFrameIndex(player: Player, settings: AnimationSettings): number {
  if (player.sitting) return PLAYER_FRAMES.sit;
  if (!player.moving) return idleFrame(player.idleTime, settings);
  const cyclePx = player.running ? settings.runCyclePx : settings.walkCyclePx;
  const { cycleLength } = PLAYER_FRAMES;
  const phase = (Math.floor((player.strideDistance / cyclePx) * cycleLength) + 1) % cycleLength;
  return (player.running ? PLAYER_FRAMES.runStart : PLAYER_FRAMES.walkStart) + phase;
}
