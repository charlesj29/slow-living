import { describe, expect, it } from 'vitest';
import { CARDINAL_DIRECTIONS, forEachNeighbor, toIndex } from '@/shared/engine/grid';
import { VILLAGER_TALKS } from '../content/guidance';
import { validContext } from '../generation/testUtils';
import { TileId } from '../world/tiles';
import { villageTiles } from '../world/village';
import { headingTo } from './compass';
import { signpostPages, villagerTalk, type Landmarks } from './guidance';

describe('headingTo', () => {
  it('names all eight directions (north is up the map)', () => {
    const o = { x: 10, y: 10 };
    expect(headingTo(o, { x: 20, y: 10 })).toBe('east');
    expect(headingTo(o, { x: 10, y: 0 })).toBe('north');
    expect(headingTo(o, { x: 0, y: 10 })).toBe('west');
    expect(headingTo(o, { x: 10, y: 20 })).toBe('south');
    expect(headingTo(o, { x: 18, y: 2 })).toBe('north-east');
    expect(headingTo(o, { x: 2, y: 18 })).toBe('south-west');
    expect(headingTo(o, { x: 19, y: 12 })).toBe('east');
  });
});

describe('villagerTalk', () => {
  const studio = { x: 40, y: 10 };

  it('takes turns through the conversations and starts over', () => {
    const talks = VILLAGER_TALKS[0] ?? [];
    const first = villagerTalk(0, 0, { x: 10, y: 10 }, studio);
    const second = villagerTalk(0, 1, { x: 10, y: 10 }, studio);
    expect(first).not.toEqual(second);
    expect(villagerTalk(0, talks.length, { x: 10, y: 10 }, studio)).toEqual(first);
  });

  it('fills in where the studio is from where the villager stands', () => {
    expect(villagerTalk(0, 0, { x: 10, y: 10 }, studio).join(' ')).toContain('east of here');
    expect(villagerTalk(0, 0, { x: 70, y: 10 }, studio).join(' ')).toContain('west of here');
    for (const talks of VILLAGER_TALKS) {
      for (const pages of talks) for (const page of pages) expect(page.length).toBeLessThan(120);
    }
  });

  it('every villager hints at the studio in their first conversation', () => {
    VILLAGER_TALKS.forEach((_, look) => {
      expect(villagerTalk(look, 0, { x: 0, y: 0 }, studio).join(' ')).toMatch(/studio/i);
    });
  });
});

describe('signpostPages', () => {
  const landmarks: Landmarks = {
    studio: { x: 30, y: 10 },
    village: { x: 0, y: 10 },
    cottage: { x: 12, y: 10 },
  };

  it('points to each landmark, skipping the one it stands by', () => {
    const [text] = signpostPages({ x: 10, y: 10 }, landmarks);
    expect(text).toContain("[[arrow:east]] Charles's Workspace");
    expect(text).toContain('[[arrow:west]] The Village');
    expect(text).not.toMatch(/cottage/i);
  });
});

describe('placeSignposts', () => {
  it('puts a signpost near the trail just outside the village gate', () => {
    for (const seed of [1, 46, 99]) {
      const context = validContext(seed);
      const village = context.village;
      expect(village).not.toBeNull();
      if (!village) continue;
      const inside = new Set(villageTiles(village, context.size));
      const gate = toIndex(context.size, village.gate.x, village.gate.y);
      let outside = -1;
      forEachNeighbor(context.size, gate, CARDINAL_DIRECTIONS, (n) => {
        if (!inside.has(n) && context.terrain[n] === TileId.Path) outside = n;
      });
      const signs = context.objects.filter((object) => object.kind === 'sign');
      const ox = outside % context.size.width;
      const oy = Math.floor(outside / context.size.width);
      const byGate = signs.some(
        (sign) => Math.max(Math.abs(sign.x - ox), Math.abs(sign.y - oy)) <= 2,
      );
      expect(byGate).toBe(true);
    }
  });
});
