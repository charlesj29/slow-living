import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, type JSX } from 'react';
import { Object3D, type InstancedMesh } from 'three';
import type { AtlasFrame } from '@/shared/render/atlasLayout';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { lightsKey } from '../assets/paintLights';
import { FIRE_FRAME_COUNT } from '../assets/paintFurniture';
import { SLEEPING_CAT_FRAME_COUNT, SLEEPING_CAT_KEY } from '../assets/paintCat';
import { FLOWER_FRAME_COUNT } from '../assets/paintObjects';
import { ISLAND_CONFIG } from '../core/config';
import type { World } from '../core/world/world';
import type { LightingUniforms } from './lighting';
import { LanternLights } from './LanternLights';
import { placeObjectShadows } from './objectShadows';
import { placeObjectSprites, type SpriteInstance } from './objectSprites';
import { objectSpriteKey } from './objectSpriteKeys';
import { createSpriteGeometry } from './spriteGeometry';
import {
  createLightsMaterial,
  createShadowMaterial,
  createSpriteMaterial,
  showAnimationFrameAt,
  type SpriteMaterial,
} from './spriteMaterial';

/** Sprites animated on the fire's clock (faster than the flowers' sway). */
const FIRE_SPRITE_KEYS: ReadonlySet<string> = new Set(['fireplace', 'fireplace_small']);

/** The sleeping cat breathes slowly (its strip is one long, calm loop). */
const CAT_FRAME_SECONDS = 0.38;

/** Lamp posts' glow comes on one by one (a wave at dusk), not with the windows. */
const LANTERN_LIGHTS_KEY = lightsKey('lamp_post');

/** Window lights sit a hair in front of their building so they win the depth test. */
const LIGHTS_Z_OFFSET = 0.001;

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
  readonly lighting: LightingUniforms;
}

/**
 * Trees, bushes, rocks, flowers, tufts, fence, mailbox and cabin — one instanced
 * mesh per sprite — plus their soft shadows (one blended instanced mesh per shadow shape).
 */
export function WorldObjects({
  world,
  atlas,
  tileSizePx,
  flowerFrameSeconds,
  lighting,
}: WorldObjectsProps): JSX.Element {
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  const shadowMaterial = useMemo(
    () => createShadowMaterial(atlas.texture, lighting),
    [atlas, lighting],
  );
  const lightsMaterial = useMemo(
    () => createLightsMaterial(atlas.texture, lighting),
    [atlas, lighting],
  );
  // The fireplace flickers on its own clock: a second pair of materials.
  const fireMaterial = useMemo(
    () => createSpriteMaterial(atlas.texture, lighting),
    [atlas, lighting],
  );
  const fireLightsMaterial = useMemo(
    () => createLightsMaterial(atlas.texture, lighting),
    [atlas, lighting],
  );
  const catMaterial = useMemo(
    () => createSpriteMaterial(atlas.texture, lighting),
    [atlas, lighting],
  );
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => catMaterial.dispose(), [catMaterial]);
  useEffect(() => () => shadowMaterial.dispose(), [shadowMaterial]);
  useEffect(() => () => lightsMaterial.dispose(), [lightsMaterial]);
  useEffect(() => () => fireMaterial.dispose(), [fireMaterial]);
  useEffect(() => () => fireLightsMaterial.dispose(), [fireLightsMaterial]);

  useFrame(({ clock }) => {
    showAnimationFrameAt(material, clock.elapsedTime, flowerFrameSeconds, FLOWER_FRAME_COUNT);
    const fireSeconds = ISLAND_CONFIG.render.fireFrameSeconds;
    showAnimationFrameAt(fireMaterial, clock.elapsedTime, fireSeconds, FIRE_FRAME_COUNT);
    showAnimationFrameAt(fireLightsMaterial, clock.elapsedTime, fireSeconds, FIRE_FRAME_COUNT);
    showAnimationFrameAt(
      catMaterial,
      clock.elapsedTime,
      CAT_FRAME_SECONDS,
      SLEEPING_CAT_FRAME_COUNT,
    );
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
  // Buildings with window lights get an overlay batch just in front of them.
  const lightsBatches = useMemo(
    () =>
      batches
        .filter(([key]) => atlas.has(lightsKey(key)))
        .map(([key, instances]) => {
          const lit = instances.map((i) => ({ ...i, z: i.z + LIGHTS_Z_OFFSET }));
          return [lightsKey(key), lit] as const;
        }),
    [batches, atlas],
  );
  const shadowBatches = useMemo(
    () => [...placeObjectShadows(world.objects, tileSizePx)],
    [world, tileSizePx],
  );

  return (
    <group>
      {shadowBatches.map(([key, instances]) => (
        <SpriteBatch
          key={`shadow:${key}:${String(instances.length)}`}
          frame={atlas.frame(key)}
          material={shadowMaterial}
          instances={instances}
        />
      ))}
      {batches.map(([key, instances]) => (
        <SpriteBatch
          key={`${key}:${String(instances.length)}`}
          frame={atlas.frame(key)}
          material={
            FIRE_SPRITE_KEYS.has(key)
              ? fireMaterial
              : key === SLEEPING_CAT_KEY
                ? catMaterial
                : material
          }
          instances={instances}
        />
      ))}
      {lightsBatches
        .filter(([key]) => key === LANTERN_LIGHTS_KEY)
        .map(([key, instances]) => (
          <LanternLights
            key={`lanterns:${String(instances.length)}`}
            world={world}
            frame={atlas.frame(key)}
            instances={instances}
            material={lightsMaterial}
            lighting={lighting}
          />
        ))}
      {lightsBatches
        .filter(([key]) => key !== LANTERN_LIGHTS_KEY)
        .map(([key, instances]) => (
          <SpriteBatch
            key={`lights:${key}:${String(instances.length)}`}
            frame={atlas.frame(key)}
            material={
              FIRE_SPRITE_KEYS.has(key.replace(/_lights$/, ''))
                ? fireLightsMaterial
                : lightsMaterial
            }
            instances={instances}
          />
        ))}
    </group>
  );
}
