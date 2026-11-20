import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, type JSX } from 'react';
import { Object3D, type InstancedMesh } from 'three';
import type { AtlasFrame } from '@/shared/render/atlasLayout';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { FLOWER_FRAME_COUNT } from '../assets/paintObjects';
import type { World } from '../core/world/world';
import { placeObjectSprites, type SpriteInstance } from './objectSprites';
import { objectSpriteKey } from './objectSpriteKeys';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial, showAnimationFrameAt, type SpriteMaterial } from './spriteMaterial';

interface SpriteBatchProps {
  readonly frame: AtlasFrame;
  readonly material: SpriteMaterial;
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
      // Instances span the whole map; per-batch culling isn't worth it for ~40 batches.
      frustumCulled={false}
    />
  );
}

interface WorldObjectsProps {
  readonly world: World;
  readonly atlas: SpriteAtlas;
  readonly tileSizePx: number;
  readonly flowerFrameSeconds: number;
}

/** Trees, bushes, rocks, flowers, tufts, fence, mailbox and cabin: one instanced mesh per sprite. */
export function WorldObjects({
  world,
  atlas,
  tileSizePx,
  flowerFrameSeconds,
}: WorldObjectsProps): JSX.Element {
  const material = useMemo(() => createSpriteMaterial(atlas.texture), [atlas]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    showAnimationFrameAt(material, clock.elapsedTime, flowerFrameSeconds, FLOWER_FRAME_COUNT);
  });

  const batches = useMemo(
    () => [
      ...placeObjectSprites(
        world.objects,
        tileSizePx,
        (object) => objectSpriteKey(world, object, atlas),
        atlas.frame,
      ),
    ],
    [world, atlas, tileSizePx],
  );

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
