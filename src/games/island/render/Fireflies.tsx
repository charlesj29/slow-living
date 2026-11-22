import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import { createRng } from '@/shared/engine/random';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { FIREFLY_KEYS } from '../assets/paintInsects';
import { ISLAND_CONFIG } from '../core/config';
import type { World } from '../core/world/world';
import { fireflySwarms } from './ambientSpots';
import { createFireflies, fireflyPose } from './insectMotion';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createLightsMaterial } from './spriteMaterial';
import { standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** Keeps the fireflies' rhythm apart from the world's other randomness. */
const FIREFLY_SEED_SALT = 0xf1ef;

interface FirefliesProps {
  readonly world: World;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/**
 * Little swarms of fireflies by the lake at night. They glow by themselves
 * (the window-light material: untinted, and only drawn once the lamps are on),
 * drift slowly, and blink on and off, each in its own rhythm.
 */
export function Fireflies({ world, atlas, lighting }: FirefliesProps): JSX.Element {
  const flies = useMemo(() => {
    const settings = ISLAND_CONFIG.fireflies;
    const swarms = fireflySwarms(world, settings, ISLAND_CONFIG.map.tileSizePx);
    return createFireflies(swarms, settings, createRng(world.generationSeed ^ FIREFLY_SEED_SALT));
  }, [world]);
  const glow = useMemo(() => atlas.frame(FIREFLY_KEYS.glow), [atlas]);
  const geometries = useMemo(
    () => ({
      glow: createSpriteGeometry(glow),
      dim: createSpriteGeometry(atlas.frame(FIREFLY_KEYS.dim)),
    }),
    [atlas, glow],
  );
  const material = useMemo(() => createLightsMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(
    () => () => {
      geometries.glow.dispose();
      geometries.dim.dispose();
    },
    [geometries],
  );
  useEffect(() => () => material.dispose(), [material]);
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const drift = ISLAND_CONFIG.fireflies.driftPx;
    flies.forEach((fly, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const pose = fireflyPose(fly, clock.elapsedTime, drift);
      mesh.visible = pose.glow !== 'off';
      if (pose.glow === 'off') return;
      const geometry = geometries[pose.glow];
      if (mesh.geometry !== geometry) mesh.geometry = geometry;
      const groundY = Math.round(pose.groundY);
      const top = groundY - Math.round(pose.lift) - glow.height;
      mesh.position.set(
        Math.round(pose.x),
        worldYFromMapPx(top) - glow.height / 2,
        standingSpriteZ(groundY),
      );
    });
  });

  return (
    <group>
      {flies.map((_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={geometries.glow}
          material={material}
        />
      ))}
    </group>
  );
}
