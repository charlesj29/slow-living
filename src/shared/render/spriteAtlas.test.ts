import { describe, expect, it } from 'vitest';
import { createPixelCanvas } from './pixelCanvas';
import { buildSpriteAtlas } from './spriteAtlas';

const tile = (): ReturnType<typeof createPixelCanvas> => createPixelCanvas(16, 16);

describe('buildSpriteAtlas', () => {
  const atlas = buildSpriteAtlas([
    { key: 'grass.1', frames: [tile()] },
    { key: 'grass.0', frames: [tile()] },
    { key: 'grass.2', frames: [tile()] },
    { key: 'rock', frames: [tile()] },
  ]);

  it('looks up sprites by key', () => {
    expect(atlas.has('rock')).toBe(true);
    expect(atlas.has('tree')).toBe(false);
    expect(atlas.frame('rock').width).toBe(16);
  });

  it('fails loudly for missing sprites', () => {
    expect(() => atlas.frame('tree')).toThrow(/not in the atlas/);
  });

  it('lists variants in numeric order, or the key itself without variants', () => {
    expect(atlas.variants('grass')).toEqual(['grass.0', 'grass.1', 'grass.2']);
    expect(atlas.variants('rock')).toEqual(['rock']);
  });

  it('uses nearest filtering for crisp pixels', () => {
    expect(atlas.texture.magFilter).toBe(1003); // THREE.NearestFilter
    expect(atlas.texture.generateMipmaps).toBe(false);
  });
});
