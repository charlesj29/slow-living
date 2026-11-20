import { describe, expect, it } from 'vitest';
import { createPlayer } from '../entities/player';
import { playerFrameIndex, updatePlayerAnimation } from './animation';

const SETTINGS = { walkFrameSeconds: 0.1, runFrameSeconds: 0.05, breathFrameSeconds: 0.5 };

describe('player animation', () => {
  it('shows the standing frame when idle', () => {
    const player = createPlayer({ x: 0, y: 0 }, 16);
    expect(playerFrameIndex(player, SETTINGS)).toBe(0);
  });

  it('steps left, stands, steps right, stands while walking', () => {
    const player = createPlayer({ x: 0, y: 0 }, 16);
    player.moving = true;
    const frames: number[] = [];
    for (let i = 0; i < 4; i++) {
      frames.push(playerFrameIndex(player, SETTINGS));
      updatePlayerAnimation(player, 0.1);
    }
    expect(frames).toEqual([1, 0, 2, 0]);
  });

  it('cycles twice as fast when running', () => {
    const player = createPlayer({ x: 0, y: 0 }, 16);
    player.moving = true;
    player.running = true;
    updatePlayerAnimation(player, 0.05);
    expect(playerFrameIndex(player, SETTINGS)).toBe(0);
  });

  it('breathes while standing still: standing, then the breathing frame, alternating', () => {
    const player = createPlayer({ x: 0, y: 0 }, 16);
    const frames: number[] = [];
    for (let i = 0; i < 4; i++) {
      frames.push(playerFrameIndex(player, SETTINGS));
      updatePlayerAnimation(player, 0.5);
    }
    expect(frames).toEqual([0, 3, 0, 3]);
  });

  it('starts walking from the step frame and resets breathing', () => {
    const player = createPlayer({ x: 0, y: 0 }, 16);
    updatePlayerAnimation(player, 0.6);
    player.moving = true;
    updatePlayerAnimation(player, 0);
    expect(player.idleTime).toBe(0);
    expect(playerFrameIndex(player, SETTINGS)).toBe(1);
  });

  it('restarts the cycle after standing still', () => {
    const player = createPlayer({ x: 0, y: 0 }, 16);
    player.moving = true;
    updatePlayerAnimation(player, 0.25);
    player.moving = false;
    updatePlayerAnimation(player, 1 / 60);
    expect(player.animationTime).toBe(0);
  });
});
