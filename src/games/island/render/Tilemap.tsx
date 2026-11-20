import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, type JSX } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import type { World } from '../core/world/world';
import { spriteCatalogFor } from './spriteCatalog';
import { tileLayersAt } from './tileLayers';
import { buildChunkGeometryData } from './tilemapGeometry';
import { createSpriteMaterial, showAnimationFrameAt } from './spriteMaterial';

interface TilemapProps {
  readonly world: World;
  readonly atlas: SpriteAtlas;
  readonly tileSizePx: number;
  readonly chunkSizeTiles: number;
  readonly waterFrameSeconds: number;
  /** Frames in every animated tile strip. */
  readonly waterFrameCount: number;
}

function buildChunkGeometries(props: TilemapProps): BufferGeometry[] {
  const { world, atlas, tileSizePx, chunkSizeTiles } = props;
  const catalog = spriteCatalogFor(atlas);
  const geometries: BufferGeometry[] = [];
  for (let top = 0; top < world.height; top += chunkSizeTiles) {
    for (let left = 0; left < world.width; left += chunkSizeTiles) {
      const region = {
        left,
        top,
        width: Math.min(chunkSizeTiles, world.width - left),
        height: Math.min(chunkSizeTiles, world.height - top),
      };
      const data = buildChunkGeometryData(
        region,
        tileSizePx,
        (x, y) => tileLayersAt(world, x, y, catalog),
        atlas.frame,
      );
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(data.positions, 3));
      geometry.setAttribute('uv', new BufferAttribute(data.uvs, 2));
      geometry.setAttribute('animStride', new BufferAttribute(data.animStrides, 1));
      geometry.setIndex(new BufferAttribute(data.indices, 1));
      geometry.computeBoundingSphere(); // lets Three.js skip chunks outside the view
      geometries.push(geometry);
    }
  }
  return geometries;
}

/** The terrain: one merged mesh per chunk, sharing one material and the atlas texture. */
export function Tilemap(props: TilemapProps): JSX.Element {
  const { atlas, waterFrameSeconds, waterFrameCount } = props;
  // Rebuilt only when the world or atlas changes (props are stable otherwise).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geometries = useMemo(() => buildChunkGeometries(props), [props.world, props.atlas]);
  const material = useMemo(() => createSpriteMaterial(atlas.texture), [atlas]);

  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    showAnimationFrameAt(material, clock.elapsedTime, waterFrameSeconds, waterFrameCount);
  });

  return (
    <group>
      {geometries.map((geometry) => (
        <mesh key={geometry.uuid} geometry={geometry} material={material} />
      ))}
    </group>
  );
}
