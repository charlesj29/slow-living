import { describe, expect, it } from 'vitest';
import { pressKey } from '@/shared/engine/input';
import { ISLAND_CONFIG as LIVE_CONFIG, type IslandConfig } from '../config';
import { cameraFocus, noteActivity } from '../game/idleTour';
import { createGameState, stepGame, type GameState } from '../game/gameState';
import { generateValidWorld } from '../generation/testUtils';
import { ISLAND_KEY_BINDINGS } from './controls';
import { tourPoint, tourStops } from './tour';

const STEP = 1 / 60;
/** The tour switched on, whatever the local config says (it can be switched off there). */
const ISLAND_CONFIG: IslandConfig = {
  ...LIVE_CONFIG,
  tour: { ...LIVE_CONFIG.tour, enabled: true },
};
const TILE = ISLAND_CONFIG.map.tileSizePx;
const settings = ISLAND_CONFIG.tour;

function wait(state: GameState, seconds: number): void {
  for (let i = 0; i < seconds / STEP; i++) stepGame(state, STEP, ISLAND_CONFIG);
}

describe('tour stops', () => {
  it.each([46, 1, 7])(
    'visits the lake, village, cottage, workspace and a beach (seed %i)',
    (seed) => {
      const state = createGameState(generateValidWorld(seed), ISLAND_CONFIG);
      expect(state.tourStops).toHaveLength(5);
      for (const stop of state.tourStops) {
        expect(stop.x).toBeGreaterThan(0);
        expect(stop.y).toBeGreaterThan(0);
        expect(stop.x).toBeLessThan(state.world.width * TILE);
        expect(stop.y).toBeLessThan(state.world.height * TILE);
      }
    },
  );

  it('has none without landmarks or a lake', () => {
    const world = generateValidWorld(46);
    const empty = { ...world, terrain: new Uint8Array(world.terrain.length) };
    expect(tourStops(empty, { studio: null, village: null, cottage: null }, TILE)).toEqual([]);
  });
});

describe('tourPoint', () => {
  const stops = [
    { x: 0, y: 0 },
    { x: 140, y: 0 },
    { x: 140, y: 140 },
  ];

  it('glides from where it began to the nearest stop, then pauses there', () => {
    const tour = { seconds: 0, from: { x: -70, y: 0 } };
    expect(tourPoint(tour, stops, settings)).toEqual({ x: -70, y: 0 });
    const arrive = 70 / settings.speedPx;
    expect(tourPoint({ ...tour, seconds: arrive + 0.1 }, stops, settings)).toEqual(stops[0]);
    expect(
      tourPoint({ ...tour, seconds: arrive + settings.holdSeconds - 0.1 }, stops, settings),
    ).toEqual(stops[0]);
  });

  it('moves smoothly and slowly the whole way round', () => {
    let previous = tourPoint({ seconds: 0, from: { x: 10, y: 10 } }, stops, settings);
    for (let t = STEP; t < 120; t += STEP) {
      const point = tourPoint({ seconds: t, from: { x: 10, y: 10 } }, stops, settings);
      const speed = Math.hypot(point.x - previous.x, point.y - previous.y) / STEP;
      // Eased glides peak at 1.5× the average speed.
      expect(speed).toBeLessThanOrEqual(settings.speedPx * 1.5 + 0.01);
      previous = point;
    }
  });
});

describe('the idle tour', () => {
  it('starts after the idle time on the island, then any key brings the camera back', () => {
    const state = createGameState(generateValidWorld(46), ISLAND_CONFIG);
    wait(state, settings.idleSeconds - 1);
    expect(state.tour).toBeNull();
    wait(state, 2);
    expect(state.tour).not.toBeNull();
    const before = { x: state.player.x, y: state.player.y };
    wait(state, 20);
    const player = { x: state.player.x, y: state.player.y };
    // The camera has gone off on its tour; the player stays put.
    expect(player).toEqual(before);
    expect(cameraFocus(state, player, ISLAND_CONFIG)).not.toEqual(player);

    expect(noteActivity(state, ISLAND_CONFIG)).toBe(true);
    expect(state.tour).toBeNull();
    wait(state, settings.returnSeconds + 0.1);
    expect(cameraFocus(state, player, ISLAND_CONFIG)).toEqual(player);
  });

  it('ends on a key press without that key also acting', () => {
    const state = createGameState(generateValidWorld(46), ISLAND_CONFIG);
    wait(state, settings.idleSeconds + 1);
    const before = { x: state.player.x, y: state.player.y };
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'Space');
    stepGame(state, STEP, ISLAND_CONFIG);
    expect(state.tour).toBeNull();
    expect(state.dialog).toBeNull();
    expect({ x: state.player.x, y: state.player.y }).toEqual(before);
  });

  it('never starts when switched off in the config', () => {
    const off = { ...ISLAND_CONFIG, tour: { ...ISLAND_CONFIG.tour, enabled: false } };
    const state = createGameState(generateValidWorld(46), off);
    for (let i = 0; i < (settings.idleSeconds + 5) / STEP; i++) stepGame(state, STEP, off);
    expect(state.tour).toBeNull();
  });

  it('never starts indoors or while a message is open', () => {
    const state = createGameState(generateValidWorld(46), ISLAND_CONFIG);
    Object.assign(state, { mapId: 'cottage' });
    wait(state, settings.idleSeconds + 5);
    expect(state.tour).toBeNull();
  });
});
