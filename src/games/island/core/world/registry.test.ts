import { describe, expect, it } from 'vitest';
import { OBJECT_KINDS, OBJECT_REGISTRY } from './objects';
import { getTileDefinition, TILE_DEFINITIONS, TileId } from './tiles';

describe('tile registry', () => {
  it('is indexed by tile id with no gaps', () => {
    TILE_DEFINITIONS.forEach((definition, index) => {
      expect(definition.id).toBe(index);
    });
    expect(TILE_DEFINITIONS).toHaveLength(Object.keys(TileId).length);
  });

  it('has unique keys and sprite keys', () => {
    const keys = TILE_DEFINITIONS.map((d) => d.key);
    const spriteKeys = TILE_DEFINITIONS.map((d) => d.spriteKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(spriteKeys).size).toBe(spriteKeys.length);
  });

  it('throws for unknown ids', () => {
    expect(() => getTileDefinition(99)).toThrow(RangeError);
  });
});

describe('object registry', () => {
  it('defines every kind under its own key', () => {
    for (const kind of OBJECT_KINDS) {
      expect(OBJECT_REGISTRY[kind].kind).toBe(kind);
    }
  });

  it('gives the cabin a door on its bottom row', () => {
    const { door, footprint } = OBJECT_REGISTRY.cabin;
    expect(door).toBeDefined();
    expect(door?.y).toBe(footprint.height - 1);
  });
});
