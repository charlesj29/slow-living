import { describe, expect, it } from 'vitest';
import { createPlayer, type Player } from '../entities/player';
import {
  PLAYER_FRAMES,
  playerFrameIndex,
  updatePlayerAnimation,
  type AnimationSettings,
} from './animation';

const TILE = 16;
const SETTINGS: AnimationSettings = {
  walkCyclePx: 40,
  runCyclePx: 60,
  breathCycleSeconds: 2,
  breathHoldSeconds: 1.2,
  blinkEverySeconds: 3,
  blinkSeconds: 0.2,
  walkSpeedTilesPerSecond: 4,
};

/** Moves the player `dx` pixels in one step and updates the animation. */
function walk(player: Player, dx: number): void {
  player.previousX = player.x;
  player.previousY = player.y;
  player.x += dx;
  updatePlayerAnimation(player, 1 / 60, SETTINGS, TILE);
}

function moving(running = false): Player {
  const player = createPlayer({ x: 5, y: 5 }, TILE);
  player.moving = true;
  player.running = running;
  return player;
}

describe('player animation', () => {
  it('shows the standing frame when it first stops', () => {
    expect(playerFrameIndex(createPlayer({ x: 0, y: 0 }, TILE), SETTINGS)).toBe(
      PLAYER_FRAMES.stand,
    );
  });

  it('starts walking on the first step frame, not the standing pose', () => {
    expect(playerFrameIndex(moving(), SETTINGS)).toBe(PLAYER_FRAMES.walkStart + 1);
  });

  it('advances the walk cycle by distance walked: one frame per eighth of a cycle', () => {
    const player = moving();
    const frames: number[] = [];
    for (let i = 0; i < 8; i++) {
      frames.push(playerFrameIndex(player, SETTINGS) - PLAYER_FRAMES.walkStart);
      walk(player, SETTINGS.walkCyclePx / 8);
    }
    expect(frames).toEqual([1, 2, 3, 4, 5, 6, 7, 0]);
  });

  it('holds the frame while not covering ground fast (no foot sliding)', () => {
    const player = moving();
    walk(player, 1);
    walk(player, 1);
    expect(playerFrameIndex(player, SETTINGS)).toBe(PLAYER_FRAMES.walkStart + 1);
  });

  it('uses the run cycle with its longer stride when running', () => {
    const player = moving(true);
    walk(player, SETTINGS.runCyclePx / 8);
    expect(playerFrameIndex(player, SETTINGS)).toBe(PLAYER_FRAMES.runStart + 2);
  });

  it('walks in place against an obstacle', () => {
    const player = moving();
    for (let i = 0; i < 10; i++) walk(player, 0);
    expect(player.strideDistance).toBeGreaterThan(0);
  });

  it('breathes slowly while standing: hold, then the breath frame', () => {
    const player = createPlayer({ x: 0, y: 0 }, TILE);
    updatePlayerAnimation(player, 1, SETTINGS, TILE);
    expect(playerFrameIndex(player, SETTINGS)).toBe(PLAYER_FRAMES.stand);
    updatePlayerAnimation(player, 0.5, SETTINGS, TILE);
    expect(playerFrameIndex(player, SETTINGS)).toBe(PLAYER_FRAMES.breath);
    updatePlayerAnimation(player, 0.6, SETTINGS, TILE);
    expect(playerFrameIndex(player, SETTINGS)).toBe(PLAYER_FRAMES.stand);
  });

  it('blinks now and then while standing', () => {
    const player = createPlayer({ x: 0, y: 0 }, TILE);
    // 2.9 s: in the hold part of the third breath and inside the blink window.
    updatePlayerAnimation(player, 2.9, SETTINGS, TILE);
    expect(playerFrameIndex(player, SETTINGS)).toBe(PLAYER_FRAMES.blink);
  });

  it('resets the stride when stopping and the idle time when moving again', () => {
    const player = moving();
    walk(player, 10);
    player.moving = false;
    updatePlayerAnimation(player, 1 / 60, SETTINGS, TILE);
    expect(player.strideDistance).toBe(0);
    player.moving = true;
    walk(player, 1);
    expect(player.idleTime).toBe(0);
  });
});
