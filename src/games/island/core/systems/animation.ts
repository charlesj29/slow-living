import type { Player } from '../entities/player';

/** Sprite frames per direction: 0 = standing, 1 = left step, 2 = right step. */
export const PLAYER_FRAME_COUNT = 3;
/** Walking alternates steps with the standing pose in between. */
const WALK_CYCLE = [1, 0, 2, 0] as const;

export interface AnimationSettings {
  readonly walkFrameSeconds: number;
  readonly runFrameSeconds: number;
}

export function updatePlayerAnimation(player: Player, stepSeconds: number): void {
  player.animationTime = player.moving ? player.animationTime + stepSeconds : 0;
}

/** Which sprite frame to show: standing when idle, otherwise the walk cycle (faster when running). */
export function playerFrameIndex(player: Player, settings: AnimationSettings): number {
  if (!player.moving) return 0;
  const frameSeconds = player.running ? settings.runFrameSeconds : settings.walkFrameSeconds;
  return WALK_CYCLE[Math.floor(player.animationTime / frameSeconds) % WALK_CYCLE.length] ?? 0;
}
