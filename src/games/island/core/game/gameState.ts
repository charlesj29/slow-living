// Everything the game simulates, in plain mutable objects. The render layer
// calls `advanceGame` once per frame and reads positions; React never holds
// any of this in state.
import { advanceClock, createFixedStepClock, type FixedStepClock } from '@/shared/engine/fixedStep';
import type { TilePoint } from '@/shared/engine/grid';
import { createInputState, type InputState } from '@/shared/engine/input';
import { approach } from '@/shared/engine/math';
import type { IslandConfig } from '../config';
import { createPlayer, type Player } from '../entities/player';
import type { World } from '../world/world';
import { updatePlayerAnimation } from '../systems/animation';
import { readMovementIntent, type IslandAction } from '../systems/controls';
import { movePlayer } from '../systems/movement';

export interface GameState {
  readonly world: World;
  readonly player: Player;
  readonly input: InputState<IslandAction>;
  readonly clock: FixedStepClock;
  /** 0..1: how far rendering is between the previous and the current logic step. */
  interpolation: number;
  /** Smoothed frames per second, from the frame times the render loop reports. */
  framesPerSecond: number;
}

export function createGameState(world: World, config: IslandConfig): GameState {
  return {
    world,
    player: createPlayer(world.spawn, config.map.tileSizePx),
    input: createInputState<IslandAction>(),
    clock: createFixedStepClock(config.loop.stepsPerSecond, config.loop.maxStepsPerFrame),
    interpolation: 0,
    framesPerSecond: 0,
  };
}

/** One fixed logic step: read input, face, move with collision, animate. */
export function stepGame(state: GameState, stepSeconds: number, config: IslandConfig): void {
  const { player } = state;
  player.previousX = player.x;
  player.previousY = player.y;
  const intent = readMovementIntent(state.input);
  if (intent.facing) player.facing = intent.facing;
  movePlayer(player, intent, state.world, stepSeconds, config.player, config.map.tileSizePx);
  updatePlayerAnimation(player, stepSeconds);
}

/** Runs the fixed steps owed for this frame and records the interpolation factor. */
export function advanceGame(state: GameState, frameSeconds: number, config: IslandConfig): void {
  state.interpolation = advanceClock(state.clock, frameSeconds, (step) =>
    stepGame(state, step, config),
  );
  if (frameSeconds > 0) {
    const instant = 1 / frameSeconds;
    state.framesPerSecond =
      state.framesPerSecond === 0
        ? instant
        : approach(
            state.framesPerSecond,
            instant,
            config.debug.fpsSmoothingSharpness,
            frameSeconds,
          );
  }
}

/** The tile under the player's feet. */
export function playerTile(state: GameState, tileSizePx: number): TilePoint {
  return {
    x: Math.floor(state.player.x / tileSizePx),
    y: Math.floor(state.player.y / tileSizePx),
  };
}

/** Player position between the last two steps, for smooth rendering on any refresh rate. */
export function interpolatedPlayerPosition(state: GameState): { x: number; y: number } {
  const { player, interpolation: t } = state;
  return {
    x: player.previousX + (player.x - player.previousX) * t,
    y: player.previousY + (player.y - player.previousY) * t,
  };
}
