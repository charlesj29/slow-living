import { describe, expect, it } from 'vitest';
import type { WorldObject } from '../core/world/world';
import { placeObjectSprites, type SpriteSize } from './objectSprites';
import { standingSpriteZ } from './worldSpace';

const TILE = 16;
const SIZES: Readonly<Record<string, SpriteSize>> = {
  tree_oak: { width: 16, height: 32 },
  flower_red: { width: 16, height: 16 },
  cabin: { width: 48, height: 64 },
};
const sizeOf = (key: string): SpriteSize => SIZES[key] ?? { width: 16, height: 16 };
const keyFor = (object: WorldObject): string => object.kind;

function place(objects: WorldObject[]): ReturnType<typeof placeObjectSprites> {
  return placeObjectSprites(objects, TILE, keyFor, sizeOf);
}

describe('placeObjectSprites', () => {
  it('stands a tall sprite on the bottom of its tile, centred', () => {
    const [tree] = place([{ id: 0, kind: 'tree_oak', x: 2, y: 5 }]).get('tree_oak') ?? [];
    expect(tree?.x).toBe(2 * TILE + 8);
    // Bottom of the sprite = bottom of tile row 5 (world y −96); centre is half the height above.
    expect(tree?.y).toBe(-(6 * TILE) + 16);
  });

  it('centres the cabin sprite on its 3×3 footprint, roof extending upwards', () => {
    const [cabin] = place([{ id: 0, kind: 'cabin', x: 10, y: 10 }]).get('cabin') ?? [];
    expect(cabin?.x).toBe(10 * TILE + 24);
    expect(cabin?.y).toBe(-(13 * TILE) + 32);
  });

  it('puts things lower on the map in front (higher z)', () => {
    const groups = place([
      { id: 0, kind: 'tree_oak', x: 4, y: 4 },
      { id: 1, kind: 'tree_oak', x: 4, y: 5 },
    ]);
    const [upper, lower] = groups.get('tree_oak') ?? [];
    expect(lower?.z).toBeGreaterThan(upper?.z ?? Infinity);
  });

  it('keeps flat decorations under every standing sprite', () => {
    const groups = place([
      { id: 0, kind: 'flower_red', x: 4, y: 100 },
      { id: 1, kind: 'tree_oak', x: 4, y: 0 },
    ]);
    const flower = groups.get('flower_red')?.[0];
    const tree = groups.get('tree_oak')?.[0];
    expect(flower?.z).toBeLessThan(tree?.z ?? 0);
  });

  it('sorts a character between a tree above and a tree below it', () => {
    // A character whose feet are 4 px into row 5 stands below the row-4 tree and above the row-5 tree.
    const feet = 5 * TILE + 4;
    expect(standingSpriteZ(feet)).toBeGreaterThan(standingSpriteZ(5 * TILE));
    expect(standingSpriteZ(feet)).toBeLessThan(standingSpriteZ(6 * TILE));
  });
});
