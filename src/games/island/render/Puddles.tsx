import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import { hashCoords } from '@/shared/engine/random';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { PUDDLE_KEYS } from '../assets/paintWeather';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { wetness } from '../core/systems/puddles';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { GROUND_DECAL_Z, worldYFromMapPx } from './worldSpace';

/** Puddles show from this wet on, at the sizes small, medium and brimming. */
const PUDDLE_LEVELS = [0.04, 0.35, 0.7] as const;

interface PuddlesProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/**
 * Puddles on the village paths and in the kid's field: they fill while it
 * rains and shrink step by step as they dry up once it stops (island only).
 */
export function Puddles({ state, atlas, lighting }: PuddlesProps): JSX.Element {
  const tile = ISLAND_CONFIG.map.tileSizePx;
  const width = state.world.width;
  // Each puddle sits a little off its tile's middle, and some stay smaller than others.
  const puddles = useMemo(
    () =>
      state.puddles.map((t) => {
        const rank = hashCoords(t % width, Math.floor(t / width), 0x9d2);
        return {
          x: ((t % width) + 0.5) * tile + ((rank % 7) - 3),
          y: (Math.floor(t / width) + 0.5) * tile + (((rank >>> 4) % 5) - 2),
          smaller: (rank >>> 8) % 3 === 0,
        };
      }),
    [state.puddles, width, tile],
  );
  const geometries = useMemo(
    () => PUDDLE_KEYS.map((key) => createSpriteGeometry(atlas.frame(key))),
    [atlas],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const wet = wetness(state.weather, ISLAND_CONFIG.afterRain);
    const level = PUDDLE_LEVELS.reduce((n, at) => (wet >= at ? n + 1 : n), 0);
    puddles.forEach((puddle, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const shown = level - (puddle.smaller ? 1 : 0);
      const geometry = geometries[shown - 1];
      mesh.visible = geometry !== undefined;
      if (!geometry) return;
      if (mesh.geometry !== geometry) mesh.geometry = geometry;
      mesh.position.set(
        Math.round(puddle.x),
        worldYFromMapPx(Math.round(puddle.y)),
        GROUND_DECAL_Z,
      );
    });
  });

  return (
    <group>
      {puddles.map((_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={geometries[0]}
          material={material}
          visible={false}
        />
      ))}
    </group>
  );
}
