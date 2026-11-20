import { describe, expect, it } from 'vitest';
import type { WorldObject } from '../core/world/world';
import { placeObjectShadows, SHADOW_SPECS } from './objectShadows';
import { SHADOW_Z } from './worldSpace';

const TILE = 16;

describe('placeObjectShadows', () => {
  it('puts a shadow under standing things, nudged right (light from the top-left)', () => {
    const tree: WorldObject = { id: 0, kind: 'tree_oak', x: 4, y: 6 };
    const [shadow] = [...placeObjectShadows([tree], TILE).values()].flat();
    const spec = SHADOW_SPECS.tree_oak;
    if (!shadow || !spec) throw new Error('expected a tree shadow');
    expect(shadow.x).toBe((4 + 1) * TILE + spec.offsetX);
    expect(spec.offsetX).toBeGreaterThan(0);
    expect(shadow.y).toBe(-((6 + 1) * TILE + spec.offsetY));
    expect(shadow.z).toBe(SHADOW_Z);
  });

  it('casts no shadow for flat decorations', () => {
    const flowers: WorldObject = { id: 0, kind: 'flower_red', x: 1, y: 1 };
    const tuft: WorldObject = { id: 1, kind: 'grass_tuft', x: 2, y: 1 };
    expect(placeObjectShadows([flowers, tuft], TILE).size).toBe(0);
  });

  it('groups shadows by sprite so each shape is one draw call', () => {
    const objects: WorldObject[] = [
      { id: 0, kind: 'tree_oak', x: 1, y: 1 },
      { id: 1, kind: 'tree_pine', x: 5, y: 1 },
      { id: 2, kind: 'rock', x: 9, y: 1 },
    ];
    const groups = placeObjectShadows(objects, TILE);
    expect(groups.get(SHADOW_SPECS.tree_oak?.key ?? '')).toHaveLength(2);
    expect(groups.get(SHADOW_SPECS.rock?.key ?? '')).toHaveLength(1);
  });

  it('keeps shadows below decorations and standing sprites', () => {
    expect(SHADOW_Z).toBeGreaterThan(0);
    expect(SHADOW_Z).toBeLessThan(0.5);
  });
});
