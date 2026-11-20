import { describe, expect, it } from 'vitest';
import { NO_OBJECT, type WorldObject } from '../core/world/world';
import { objectSpriteKey, type ObjectLayout } from './objectSpriteKeys';

/** A 4×3 layout with the given objects (all 1×1). */
function layout(objects: WorldObject[]): ObjectLayout {
  const width = 4;
  const occupancy = new Int32Array(width * 3).fill(NO_OBJECT);
  for (const object of objects) occupancy[object.y * width + object.x] = object.id;
  return { width, height: 3, objects, occupancy };
}

const atlas = { variants: (base: string): string[] => [`${base}.0`, `${base}.1`] };
const fence = (id: number, x: number, y: number): WorldObject => ({ id, kind: 'fence', x, y });

describe('objectSpriteKey', () => {
  it('connects fence pieces to neighbouring fences', () => {
    const objects = [fence(0, 0, 0), fence(1, 1, 0), fence(2, 2, 0), fence(3, 2, 1)];
    const world = layout(objects);
    expect(objectSpriteKey(world, objects[0] as WorldObject, atlas)).toBe('fence_e');
    expect(objectSpriteKey(world, objects[1] as WorldObject, atlas)).toBe('fence_ew');
    expect(objectSpriteKey(world, objects[2] as WorldObject, atlas)).toBe('fence_sw');
    expect(objectSpriteKey(world, objects[3] as WorldObject, atlas)).toBe('fence_n');
  });

  it('uses the plain post for a lone fence', () => {
    const objects = [fence(0, 1, 1)];
    expect(objectSpriteKey(layout(objects), objects[0] as WorldObject, atlas)).toBe('fence');
  });

  it('picks a stable variant for other objects', () => {
    const rock: WorldObject = { id: 0, kind: 'rock', x: 3, y: 2 };
    const world = layout([rock]);
    const key = objectSpriteKey(world, rock, atlas);
    expect(['rock.0', 'rock.1']).toContain(key);
    expect(objectSpriteKey(world, rock, atlas)).toBe(key);
  });
});
