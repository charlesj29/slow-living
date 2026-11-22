import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { STALL_LOAVES } from '../assets/paintPlaza';
import { STEAM_KEYS } from '../assets/paintSmoke';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { OBJECT_REGISTRY } from '../core/world/objects';
import type { World } from '../core/world/world';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** Each wisp rises this far (map pixels) over its life, then a short pause. */
const RISE_PX = 9;
const LIFE_SECONDS = 2.2;
/** Wisps per loaf, taking turns. */
const WISPS_PER_LOAF = 2;
/** The steam sits just in front of the stall. */
const IN_FRONT = 0.003;

interface BreadSteamProps {
  readonly world: World;
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/**
 * Thin curls of steam rising from the fresh loaves on the market stall's
 * counter, while the baker is at the stall in the morning.
 */
export function BreadSteam({ world, state, atlas, lighting }: BreadSteamProps): JSX.Element | null {
  const stall = useMemo(
    () => world.objects.find((object) => object.kind === 'market_stall'),
    [world],
  );
  const geometries = useMemo(
    () => STEAM_KEYS.map((key) => createSpriteGeometry(atlas.frame(key))),
    [atlas],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);
  const meshes = useRef<(Mesh | null)[]>([]);

  // Where each wisp starts: above the middle of a loaf (map pixels), and the stall's depth.
  const origins = useMemo(() => {
    if (!stall) return [];
    const tile = ISLAND_CONFIG.map.tileSizePx;
    const { footprint, spriteKey } = OBJECT_REGISTRY[stall.kind];
    const frame = atlas.frame(spriteKey);
    const footY = (stall.y + footprint.height) * tile;
    const left = (stall.x + footprint.width / 2) * tile - frame.width / 2;
    const top = footY - frame.height;
    return STALL_LOAVES.xs.flatMap((x) =>
      Array.from({ length: WISPS_PER_LOAF }, (_, i) => ({
        x: left + x + Math.floor(STALL_LOAVES.width / 2) - 1,
        y: top + STALL_LOAVES.top - 2,
        z: standingSpriteZ(footY) + IN_FRONT,
        phase: (i / WISPS_PER_LOAF + x * 0.13) % 1,
      })),
    );
  }, [stall, atlas]);

  useFrame(({ clock }) => {
    const baking = state.villagers.some((v) => v.activity === 'bake' && v.atErrand && !v.hidden);
    origins.forEach((origin, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const age = (clock.elapsedTime / LIFE_SECONDS + origin.phase) % 1;
      // Rises for most of its life, then a gap before the next curl.
      mesh.visible = baking && age < 0.8;
      if (!mesh.visible) return;
      const geometry = geometries[Math.floor(age * 4) % geometries.length];
      if (geometry && mesh.geometry !== geometry) mesh.geometry = geometry;
      mesh.position.set(origin.x, worldYFromMapPx(Math.round(origin.y - age * RISE_PX)), origin.z);
    });
  });

  if (!stall) return null;
  return (
    <group>
      {origins.map((_, i) => (
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
