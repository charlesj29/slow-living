import { useEffect, useLayoutEffect, useMemo, useRef, type JSX } from 'react';
import {
  BufferAttribute,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  type InstancedMesh,
} from 'three';
import type { AtlasFrame } from '@/shared/render/atlasLayout';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { OBJECT_REGISTRY } from '../core/world/objects';
import type { World, WorldObject } from '../core/world/world';
import { placeObjectSprites, type SpriteInstance } from './objectSprites';
import { variantKeyAt } from './spriteCatalog';

/** A plane the size of the sprite, with UVs pointing at its atlas frame. */
function createSpriteGeometry(frame: AtlasFrame): PlaneGeometry {
  const geometry = new PlaneGeometry(frame.width, frame.height);
  // PlaneGeometry vertex order: top-left, top-right, bottom-left, bottom-right.
  geometry.setAttribute(
    'uv',
    new BufferAttribute(
      new Float32Array([
        frame.u0,
        frame.vTop,
        frame.u1,
        frame.vTop,
        frame.u0,
        frame.vBottom,
        frame.u1,
        frame.vBottom,
      ]),
      2,
    ),
  );
  return geometry;
}

interface SpriteBatchProps {
  readonly frame: AtlasFrame;
  readonly material: MeshBasicMaterial;
  readonly instances: readonly SpriteInstance[];
}

/** All copies of one sprite in a single draw call. */
function SpriteBatch({ frame, material, instances }: SpriteBatchProps): JSX.Element {
  const meshRef = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => createSpriteGeometry(frame), [frame]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const placer = new Object3D();
    instances.forEach((instance, index) => {
      placer.position.set(instance.x, instance.y, instance.z);
      placer.updateMatrix();
      mesh.setMatrixAt(index, placer.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [instances]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instances.length]}
      // Instances span the whole map; per-instance culling isn't worth it for ~10 batches.
      frustumCulled={false}
    />
  );
}

interface WorldObjectsProps {
  readonly world: World;
  readonly atlas: SpriteAtlas;
  readonly tileSizePx: number;
}

/** Trees, rocks, flowers, tufts and the cabin: one instanced mesh per sprite. */
export function WorldObjects({ world, atlas, tileSizePx }: WorldObjectsProps): JSX.Element {
  const material = useMemo(
    () => new MeshBasicMaterial({ map: atlas.texture, alphaTest: 0.5 }),
    [atlas],
  );
  useEffect(() => () => material.dispose(), [material]);

  const batches = useMemo(() => {
    const spriteKeyFor = (object: WorldObject): string =>
      variantKeyAt(atlas, OBJECT_REGISTRY[object.kind].spriteKey, object.x, object.y);
    return [...placeObjectSprites(world.objects, tileSizePx, spriteKeyFor, atlas.frame)];
  }, [world, atlas, tileSizePx]);

  return (
    <group>
      {batches.map(([key, instances]) => (
        <SpriteBatch
          key={`${key}:${String(instances.length)}`}
          frame={atlas.frame(key)}
          material={material}
          instances={instances}
        />
      ))}
    </group>
  );
}
