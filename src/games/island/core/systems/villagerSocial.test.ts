import { describe, expect, it } from 'vitest';
import { createRng } from '@/shared/engine/random';
import { ISLAND_CONFIG } from '../config';
import { createPlayer } from '../entities/player';
import { createVillager, type Villager } from '../entities/villager';
import { updateSocial } from './villagerSocial';

const TILE = ISLAND_CONFIG.map.tileSizePx;
const STEP = 1 / 30;
const settings = ISLAND_CONFIG.social;

function villagerAt(id: number, x: number, y: number): Villager {
  const v = createVillager(id, id, { x, y }, [], TILE);
  v.activity = 'wander';
  return v;
}

function run(villagers: Villager[], seconds: number, playerAt?: { x: number; y: number }): void {
  const rng = createRng(4);
  const player = playerAt ? createPlayer(playerAt, TILE) : null;
  for (let i = 0; i < seconds / STEP; i++) {
    updateSocial(villagers, player, rng, STEP, settings, TILE);
  }
}

describe('village social life', () => {
  it('two strolling villagers who meet stop to chat, facing each other, with a bubble', () => {
    const a = villagerAt(0, 5, 5);
    const b = villagerAt(1, 6, 5);
    run([a, b], 0.1);
    expect(a.chat?.partner).toBe(1);
    expect(b.chat?.partner).toBe(0);
    expect(a.facing).toBe('right');
    expect(b.facing).toBe('left');
    expect(a.bubble ?? b.bubble).not.toBeNull();
  });

  it('say goodbye after a while and wait before chatting again', () => {
    const a = villagerAt(0, 5, 5);
    const b = villagerAt(1, 6, 5);
    run([a, b], settings.chatSeconds + 0.5);
    expect(a.chat).toBeNull();
    expect(a.chatCooldown).toBeGreaterThan(0);
  });

  it('do not stop for a chat in the middle of a chore, or when far apart', () => {
    const baker = villagerAt(0, 5, 5);
    baker.activity = 'bake';
    const keeper = villagerAt(1, 6, 5);
    const far = villagerAt(2, 20, 20);
    run([baker, keeper, far], 0.5);
    expect(baker.chat).toBeNull();
    expect(keeper.chat).toBeNull();
    expect(far.chat).toBeNull();
  });

  it('wave at the player who comes near, then not again for a while', () => {
    const v = villagerAt(0, 5, 5);
    run([v], 0.1, { x: 6, y: 5 });
    expect(v.bubble?.kind).toBe('wave');
    expect(v.facing).toBe('right');
    expect(v.waveCooldown).toBeGreaterThan(settings.waveCooldownSeconds - 1);
  });

  it('hum now and then at a chore', () => {
    const v = villagerAt(0, 5, 5);
    v.activity = 'sweep';
    v.atErrand = true;
    v.humIn = 0.1;
    run([v], 0.3);
    expect(v.bubble?.kind).toBe('note');
  });
});

describe('the evening gathering', () => {
  it('chats across the wider circle round the well', () => {
    const a = villagerAt(0, 5, 5);
    const b = villagerAt(1, 9, 5);
    a.activity = 'gather';
    b.activity = 'owl';
    run([a, b], 0.1);
    expect(a.chat?.partner).toBe(1);
  });

  it('while strolling, they have to actually meet', () => {
    const a = villagerAt(0, 5, 5);
    const b = villagerAt(1, 9, 5);
    run([a, b], 0.1);
    expect(a.chat).toBeNull();
  });
});
