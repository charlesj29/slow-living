import { BufferAttribute, PlaneGeometry } from 'three';
import type { AtlasFrame } from '@/shared/render/atlasLayout';

const VERTICES_PER_QUAD = 4;

/** A plane the size of one sprite frame, UV-mapped to it (animated by the sprite material if a strip). */
export function createSpriteGeometry(frame: AtlasFrame): PlaneGeometry {
  const geometry = new PlaneGeometry(frame.width, frame.height);
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(VERTICES_PER_QUAD * 2), 2));
  geometry.setAttribute('animStride', new BufferAttribute(new Float32Array(VERTICES_PER_QUAD), 1));
  setSpriteGeometryFrame(geometry, frame);
  return geometry;
}

/** Points an existing sprite geometry at another frame of the same size (e.g. a new facing). */
export function setSpriteGeometryFrame(geometry: PlaneGeometry, frame: AtlasFrame): void {
  const uv = geometry.getAttribute('uv') as BufferAttribute;
  // PlaneGeometry vertex order: top-left, top-right, bottom-left, bottom-right.
  uv.array.set([
    frame.u0,
    frame.vTop,
    frame.u1,
    frame.vTop,
    frame.u0,
    frame.vBottom,
    frame.u1,
    frame.vBottom,
  ]);
  uv.needsUpdate = true;
  const strides = geometry.getAttribute('animStride') as BufferAttribute;
  strides.array.fill(frame.frameCount > 1 ? frame.frameStrideU : 0);
  strides.needsUpdate = true;
}
