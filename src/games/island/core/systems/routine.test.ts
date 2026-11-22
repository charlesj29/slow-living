import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG, type IslandConfig } from '../config';
import { createGameState, setHeldTime, stepGame, type GameState } from '../game/gameState';
import { generateValidWorld } from '../generation/testUtils';
import { MIDNIGHT } from './dayNight';
import { villagerGreeting } from './guidance';
import { activityAt } from './routine';

const STEP = 1 / 30;
const TILE = ISLAND_CONFIG.map.tileSizePx;
/** The clock stands still, so the village stays in one part of the day. */
const STILL: IslandConfig = {
  ...ISLAND_CONFIG,
  dayNight: { ...ISLAND_CONFIG.dayNight, dayLengthSeconds: 1e9 },
};

function villageAt(time: number, seed = 46): GameState {
  const state = createGameState(generateValidWorld(seed), STILL);
  // The player waits indoors, so nobody has to walk round them.
  Object.assign(state, { mapId: 'cottage', timeOfDay: time });
  return state;
}

function wait(state: GameState, seconds: number): void {
  for (let i = 0; i < seconds / STEP; i++) stepGame(state, STEP, STILL);
}

const byRole = (state: GameState, role: string) => {
  const villager = state.villagers.find((v) => v.role === role);
  if (!villager) throw new Error(`no ${role}`);
  return villager;
};

describe('activityAt', () => {
  const schedule = ISLAND_CONFIG.villagerDay.keeper;
  it('follows the schedule and wraps past midnight', () => {
    expect(activityAt(schedule, 0.25)).toBe('water');
    expect(activityAt(schedule, 0.4)).toBe('sweep');
    expect(activityAt(schedule, 0.75)).toBe('gather');
    expect(activityAt(schedule, 0.9)).toBe('home');
    expect(activityAt(schedule, 0.05)).toBe('home');
  });
});

describe('the village day', () => {
  it('finds the stall, the well, the dock end, the plaza bench and room to gather', () => {
    const places = villageAt(0.3).routinePlaces;
    expect(places.stall).not.toBeNull();
    expect(places.well).not.toBeNull();
    expect(places.dock).not.toBeNull();
    expect(places.bench).not.toBeNull();
    expect(places.gather.length).toBeGreaterThanOrEqual(3);
  });

  it.each([46, 1, 7])('sends everyone to their morning chores (seed %i)', (seed) => {
    const state = villageAt(0.3, seed);
    wait(state, 90);
    for (const villager of state.villagers) {
      expect(villager.hidden).toBe(false);
      if (!villager.errand) continue;
      expect(villager.atErrand, `${villager.role} doing ${villager.activity}`).toBe(true);
      expect(Math.floor(villager.x / TILE)).toBe(villager.errand.goal.x);
    }
    expect(byRole(state, 'baker').activity).toBe('bake');
    expect(byRole(state, 'owl').activity).toBe('fish');
  });

  it('sends the others home at night, while the night owl sits on the plaza bench', () => {
    const state = villageAt(0.95);
    wait(state, 90);
    expect(byRole(state, 'baker').hidden).toBe(true);
    expect(byRole(state, 'keeper').hidden).toBe(true);
    const owl = byRole(state, 'owl');
    expect(owl.hidden).toBe(false);
    expect(owl.sitting).not.toBeNull();
  });

  it('keeps the held night of the day/night button', () => {
    const state = villageAt(0.3);
    setHeldTime(state, MIDNIGHT);
    wait(state, 90);
    expect(byRole(state, 'baker').hidden).toBe(true);
  });

  it('comes back out of the front door in the morning', () => {
    const state = villageAt(0.95);
    wait(state, 60);
    const baker = byRole(state, 'baker');
    expect(baker.hidden).toBe(true);
    state.timeOfDay = 0.3;
    wait(state, 1);
    expect(baker.hidden).toBe(false);
    expect(Math.floor(baker.y / TILE)).toBeLessThanOrEqual(baker.door.y + 1);
  });
});

describe('greetings', () => {
  it('fit what the villager is doing, else the time of day', () => {
    expect(villagerGreeting('bake', 'morning')).toMatch(/bread/);
    expect(villagerGreeting('fish', 'morning')).toMatch(/biting/);
    expect(villagerGreeting('wander', 'afternoon')).toBe('Good afternoon!');
    expect(villagerGreeting('owl', 'night')).toMatch(/stars/);
    expect(villagerGreeting('owl', 'evening')).toMatch(/evening/i);
  });
});

describe('who lives where', () => {
  it('puts the baker in the bakery when the village has one', () => {
    let checked = 0;
    for (const seed of [46, 1, 2, 3, 7, 12]) {
      const state = villageAt(0.3, seed);
      const bakery = state.world.objects.find((o) => o.kind === 'house_bakery');
      if (!bakery) continue;
      const baker = byRole(state, 'baker');
      expect(baker.door.x).toBeGreaterThanOrEqual(bakery.x);
      expect(baker.door.x).toBeLessThan(bakery.x + 5);
      expect(baker.door.y).toBe(bakery.y + 3);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });
});
