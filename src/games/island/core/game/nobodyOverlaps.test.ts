import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../config';
import { generateValidWorld } from '../generation/testUtils';
import { createGameState, stepGame, type GameState } from './gameState';

/** Feet closer than this (map pixels, across and up-down) count as walking through each other. */
const TOO_CLOSE = { x: 8, y: 5 } as const;
/** Villagers' positions are the middle of their feet box; their feet are this much lower. */
const VILLAGER_FEET_PX = 4;

function feet(state: GameState): { x: number; y: number }[] {
  const p = state.playmates;
  return [
    ...state.villagers.filter((v) => !v.hidden).map((v) => ({ x: v.x, y: v.y + VILLAGER_FEET_PX })),
    ...state.rabbits,
    ...(p && !p.kid.hidden ? [p.kid] : []),
    ...(p ? [p.dog] : []),
  ];
}

function overlapsDuring(time: number, seconds: number): number {
  const state = createGameState(generateValidWorld(46), ISLAND_CONFIG);
  Object.assign(state, { timeOfDay: time });
  let overlaps = 0;
  for (let i = 0; i < seconds * 60; i++) {
    stepGame(state, 1 / 60, ISLAND_CONFIG);
    if (i % 10 !== 0) continue;
    const all = feet(state);
    for (let a = 0; a < all.length; a++) {
      for (let b = a + 1; b < all.length; b++) {
        const A = all[a];
        const B = all[b];
        if (A && B && Math.abs(A.x - B.x) < TOO_CLOSE.x && Math.abs(A.y - B.y) < TOO_CLOSE.y) {
          overlaps++;
        }
      }
    }
  }
  return overlaps;
}

describe('nobody walks through anybody', () => {
  it.each([
    ['in the morning', 0.3],
    ['at the evening gathering', 0.74],
  ])('villagers, rabbits, the kid and the puppy keep apart %s', (_, time) => {
    expect(overlapsDuring(time, 90)).toBe(0);
  });
});
