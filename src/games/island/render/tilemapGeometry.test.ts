import { describe, expect, it } from 'vitest';
import type { AtlasFrame } from '@/shared/render/atlasLayout';
import { buildChunkGeometryData } from './tilemapGeometry';

const frame = (frameCount: number): AtlasFrame => ({
  x: 1,
  y: 1,
  width: 16,
  height: 16,
  frameCount,
  u0: 0.1,
  u1: 0.2,
  vTop: 0.3,
  vBottom: 0.4,
  frameStrideU: 0.1,
});

describe('buildChunkGeometryData', () => {
  const region = { left: 2, top: 3, width: 2, height: 1 };
  // Tile (2,3) has a base + overlay; tile (3,3) is animated water.
  const layersAt = (x: number): string[] => (x === 2 ? ['grass', 'edge'] : ['water']);
  const frameOf = (key: string): AtlasFrame => frame(key === 'water' ? 3 : 1);
  const data = buildChunkGeometryData(region, 16, layersAt, frameOf);

  it('emits one quad per tile layer', () => {
    expect(data.quadCount).toBe(3);
    expect(data.positions).toHaveLength(3 * 4 * 3);
    expect(data.indices).toHaveLength(3 * 6);
  });

  it('positions quads on the tile grid with y flipped (map y down, world y up)', () => {
    // First vertex of the first quad: top-left of tile (2, 3).
    expect([...data.positions.slice(0, 3)]).toEqual([32, -48, 0]);
    // Last vertex of the first quad: bottom-right.
    expect([...data.positions.slice(9, 12)]).toEqual([48, -64, 0]);
  });

  it('maps the sprite frame onto each quad upright', () => {
    expect([...data.uvs.slice(0, 8)].map((v) => +v.toFixed(2))).toEqual([
      0.1, 0.3, 0.2, 0.3, 0.1, 0.4, 0.2, 0.4,
    ]);
  });

  it('marks only animated sprites with a frame stride', () => {
    expect([...data.animStrides.slice(0, 8)]).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect([...data.animStrides.slice(8, 12)].map((v) => +v.toFixed(2))).toEqual([
      0.1, 0.1, 0.1, 0.1,
    ]);
  });

  it('winds triangles counter-clockwise towards the camera', () => {
    const [a, b, c] = [...data.indices.slice(0, 3)].map((i) => [
      data.positions[i * 3] ?? 0,
      data.positions[i * 3 + 1] ?? 0,
    ]);
    if (!a || !b || !c) throw new Error('missing vertices');
    const cross =
      ((b[0] ?? 0) - (a[0] ?? 0)) * ((c[1] ?? 0) - (a[1] ?? 0)) -
      ((b[1] ?? 0) - (a[1] ?? 0)) * ((c[0] ?? 0) - (a[0] ?? 0));
    expect(cross).toBeGreaterThan(0);
  });
});
