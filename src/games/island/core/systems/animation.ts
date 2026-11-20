import type { Player } from '../entities/player';

/** Sprite frames per direction: 0 = standing, 1 = left step, 2 = right step, 3 = breathing. */
export const PLAYER_FRAME_COUNT = 4;
const BREATHING_FRAME = 3;
/** Walking alternates steps with the standing pose in between. */
const WALK_CYCLE = [1, 0, 2, 0] as const;

export interface AnimationSettings {
  readonly walkFrameSeconds: number;
  readonly runFrameSeconds: number;
  /** How long each half of the idle breathing cycle lasts. */
  readonly breathFrameSeconds: number;
}

export function updatePlayerAnimation(player: Player, stepSeconds: number): void {
  player.animationTime = player.moving ? player.animationTime + stepSeconds : 0;
  player.idleTime = player.moving ? 0 : player.idleTime + stepSeconds;
}

/**
 * Which sprite frame to show: the walk cycle while moving (faster when
 * running); standing still alternates standing and breathing.
 */
export function playerFrameIndex(player: Player, settings: AnimationSettings): number {
  if (!player.moving) {
    return Math.floor(player.idleTime / settings.breathFrameSeconds) % 2 === 1
      ? BREATHING_FRAME
      : 0;
  }
  const frameSeconds = player.running ? settings.runFrameSeconds : settings.walkFrameSeconds;
  return WALK_CYCLE[Math.floor(player.animationTime / frameSeconds) % WALK_CYCLE.length] ?? 0;
}
