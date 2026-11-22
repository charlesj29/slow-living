import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Group, Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { CLOUD_SHADOW_KEYS } from '../assets/paintWeather';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import type { World } from '../core/world/world';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createShadowMaterial } from './spriteMaterial';
import { CLOUD_SHADOW_Z, worldYFromMapPx } from './worldSpace';

/** Shadows are a daytime thing; in a shower the sky is one grey and they fade into it. */
const LIGHTS_ON = 0.5;
const RAIN_HIDES = 0.4;
/** The wind's direction (towards the lower left, like the rain) and how far past the map a cloud wraps. */
const WIND = { x: -0.8, y: 0.6 } as const;
const WRAP_MARGIN_PX = 200;
/** Spreads the clouds' starting points over the map (golden-ratio steps never bunch up). */
const SPREAD = 0.618034;

interface CloudShadowsProps {
  readonly world: World;
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/**
 * Big soft cloud shadows drifting slowly over the island with the wind,
 * darkening whatever they pass over (blended; a strict depth test keeps two
 * overlapping clouds from darkening twice). Daytime only, gone in the rain.
 */
export function CloudShadows({ world, state, atlas, lighting }: CloudShadowsProps): JSX.Element {
  const groupRef = useRef<Group>(null);
  const meshes = useRef<(Mesh | null)[]>([]);
  const geometries = useMemo(
    () => CLOUD_SHADOW_KEYS.map((key) => createSpriteGeometry(atlas.frame(key))),
    [atlas],
  );
  const material = useMemo(() => createShadowMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);

  const tile = ISLAND_CONFIG.map.tileSizePx;
  const span = {
    x: world.width * tile + 2 * WRAP_MARGIN_PX,
    y: world.height * tile + 2 * WRAP_MARGIN_PX,
  };
  const clouds = Array.from({ length: ISLAND_CONFIG.clouds.count }, (_, i) => ({
    startX: ((i * SPREAD) % 1) * span.x,
    startY: ((i * SPREAD * 2.3 + 0.21) % 1) * span.y,
    geometry: geometries[i % geometries.length],
  }));

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    group.visible = lighting.uLightsOn.value < LIGHTS_ON && state.weather.intensity < RAIN_HIDES;
    if (!group.visible) return;
    const drift = clock.elapsedTime * ISLAND_CONFIG.clouds.speedPx;
    clouds.forEach((cloud, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      // Drift with the wind and wrap round the map (plus a margin, so they enter from off-map).
      const x = (((cloud.startX + drift * WIND.x) % span.x) + span.x) % span.x;
      const y = (((cloud.startY + drift * WIND.y) % span.y) + span.y) % span.y;
      mesh.position.set(
        Math.round(x - WRAP_MARGIN_PX),
        worldYFromMapPx(Math.round(y - WRAP_MARGIN_PX)),
        CLOUD_SHADOW_Z,
      );
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={cloud.geometry}
          material={material}
          renderOrder={1}
        />
      ))}
    </group>
  );
}
