import { describe, expect, it } from 'vitest';
import { OBJECT_KINDS, OBJECT_REGISTRY } from '../core/world/objects';
import { TILE_DEFINITIONS } from '../core/world/tiles';
import { createIslandAtlas, paintIslandSprites } from './islandSprites';
import { TILE_PX } from './paint';
import { PLAYER_FRAME_COUNT } from '../core/systems/animation';
import { FLOWER_FRAME_COUNT } from './paintObjects';
import { fenceSpriteKey } from './paintStructures';
import { WATER_FRAME_COUNT } from './paintTiles';
import { EDGE_MATERIALS } from './paintTransitions';

describe('island sprites', () => {
  const atlas = createIslandAtlas();

  it('has a sprite (or variants) for every tile in the registry', () => {
    for (const tile of TILE_DEFINITIONS) {
      if (tile.underlay !== undefined) continue; // drawn via orientation-specific sprites
      for (const key of atlas.variants(tile.spriteKey)) {
        expect(atlas.has(key), key).toBe(true);
        expect(atlas.frame(key).width).toBe(TILE_PX);
        expect(atlas.frame(key).height).toBe(TILE_PX);
      }
    }
    expect(atlas.has('tile_dock_h')).toBe(true);
    expect(atlas.has('tile_dock_v')).toBe(true);
  });

  it('has a sprite (or variants) for every object kind', () => {
    for (const kind of OBJECT_KINDS) {
      const keys = atlas.variants(OBJECT_REGISTRY[kind].spriteKey);
      for (const key of keys) expect(atlas.has(key), key).toBe(true);
    }
  });

  it('sizes standing sprites to their footprint plus height above it', () => {
    expect(atlas.frame('tree_oak.0')).toMatchObject({ width: 32, height: 32 });
    expect(atlas.frame('tree_pine.0')).toMatchObject({ width: 32, height: 32 });
    expect(atlas.frame('tree_small.0')).toMatchObject({ width: 16, height: 32 });
    expect(atlas.frame('bush.0')).toMatchObject({ width: 16, height: 16 });
    expect(atlas.frame('mailbox')).toMatchObject({ width: 16, height: 24 });
    expect(atlas.frame('cabin')).toMatchObject({ width: 80, height: 64 });
    expect(atlas.frame('rock.0')).toMatchObject({ width: 16, height: 16 });
  });

  it('has every shoreline overlay for every edge material', () => {
    for (const material of EDGE_MATERIALS) {
      for (const direction of ['n', 'e', 's', 'w'])
        expect(atlas.has(`edge_${material}_${direction}`)).toBe(true);
      for (const direction of ['ne', 'se', 'sw', 'nw'])
        expect(atlas.has(`corner_${material}_${direction}`)).toBe(true);
    }
  });

  it('animates only water, flowers and the player, each with its frame count', () => {
    for (const source of paintIslandSprites()) {
      const isWater = /^tile_(deep_sea|shallow_sea|lake_water|lake_shallow)\./.test(source.key);
      const isFlower = source.key.startsWith('flower_');
      const isPlayer = source.key.startsWith('player_');
      const expected = isWater
        ? WATER_FRAME_COUNT
        : isFlower
          ? FLOWER_FRAME_COUNT
          : isPlayer
            ? PLAYER_FRAME_COUNT
            : 1;
      expect(source.frames.length, source.key).toBe(expected);
    }
  });

  it('has a fence piece for every connection pattern', () => {
    for (let mask = 0; mask < 16; mask++) {
      const key = fenceSpriteKey(!!(mask & 1), !!(mask & 2), !!(mask & 4), !!(mask & 8));
      expect(atlas.has(key), key).toBe(true);
    }
  });

  it('paints identical pixels every time', () => {
    const first = paintIslandSprites();
    const second = paintIslandSprites();
    expect(second.map((s) => s.frames.map((f) => [...f.data]))).toEqual(
      first.map((s) => s.frames.map((f) => [...f.data])),
    );
  });
});
