// Builds the vertex data for one tilemap chunk: one textured quad per tile
// layer, all in a single geometry (one draw call per chunk). Pure typed-array
// output, so it is unit-tested without WebGL.
import type { AtlasFrame } from '@/shared/render/atlasLayout';
import { TERRAIN_Z, worldYFromMapPx } from './worldSpace';

export interface ChunkGeometryData {
  readonly positions: Float32Array;
  readonly uvs: Float32Array;
  /** Per vertex: u offset per animation frame (0 for static sprites). */
  readonly animStrides: Float32Array;
  /** Per vertex: 1 where soft grass patches may shade the quad, else 0. */
  readonly patchables: Float32Array;
  readonly indices: Uint32Array;
  readonly quadCount: number;
}

export interface ChunkRegion {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

const VERTICES_PER_QUAD = 4;
const INDICES_PER_QUAD = 6;

export function buildChunkGeometryData(
  region: ChunkRegion,
  tileSizePx: number,
  layersAt: (x: number, y: number) => readonly string[],
  frameOf: (key: string) => AtlasFrame,
  isPatchable: (key: string) => boolean = () => false,
): ChunkGeometryData {
  const quads: { x: number; y: number; frame: AtlasFrame; patchable: boolean }[] = [];
  for (let y = region.top; y < region.top + region.height; y++) {
    for (let x = region.left; x < region.left + region.width; x++) {
      for (const key of layersAt(x, y)) {
        quads.push({ x, y, frame: frameOf(key), patchable: isPatchable(key) });
      }
    }
  }

  const positions = new Float32Array(quads.length * VERTICES_PER_QUAD * 3);
  const uvs = new Float32Array(quads.length * VERTICES_PER_QUAD * 2);
  const animStrides = new Float32Array(quads.length * VERTICES_PER_QUAD);
  const patchables = new Float32Array(quads.length * VERTICES_PER_QUAD);
  const indices = new Uint32Array(quads.length * INDICES_PER_QUAD);

  quads.forEach(({ x, y, frame, patchable }, quad) => {
    const left = x * tileSizePx;
    const right = left + tileSizePx;
    const top = worldYFromMapPx(y * tileSizePx);
    const bottom = worldYFromMapPx((y + 1) * tileSizePx);
    const stride = frame.frameCount > 1 ? frame.frameStrideU : 0;
    // Vertex order: top-left, top-right, bottom-left, bottom-right.
    const corners = [
      [left, top, frame.u0, frame.vTop],
      [right, top, frame.u1, frame.vTop],
      [left, bottom, frame.u0, frame.vBottom],
      [right, bottom, frame.u1, frame.vBottom],
    ] as const;
    corners.forEach(([px, py, u, v], corner) => {
      const vertex = quad * VERTICES_PER_QUAD + corner;
      positions.set([px, py, TERRAIN_Z], vertex * 3);
      uvs.set([u, v], vertex * 2);
      animStrides[vertex] = stride;
      patchables[vertex] = patchable ? 1 : 0;
    });
    const base = quad * VERTICES_PER_QUAD;
    // Counter-clockwise when seen from the camera (+z).
    indices.set([base, base + 2, base + 1, base + 1, base + 2, base + 3], quad * INDICES_PER_QUAD);
  });

  return { positions, uvs, animStrides, patchables, indices, quadCount: quads.length };
}
