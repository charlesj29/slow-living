import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { HOUSE_CHIMNEY_TOPS } from '../assets/paintHouses';
import { SMOKE_KEYS } from '../assets/paintSmoke';
import { STUDIO_CHIMNEY_TOP } from '../assets/paintStudio';
import { ISLAND_CONFIG } from '../core/config';
import { OBJECT_REGISTRY } from '../core/world/objects';
import type { World } from '../core/world/world';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** Where smoke leaves each chimney, in sprite pixels from the sprite's top-left. */
const CHIMNEY_TOPS: Readonly<Record<string, { x: number; y: number }>> = {
  cabin: { x: 80, y: 1 }, // the cottage's chimney (paintCabin)
  ...HOUSE_CHIMNEY_TOPS,
  ...(STUDIO_CHIMNEY_TOP ? { studio: STUDIO_CHIMNEY_TOP } : {}),
};

/** Puffs in the air per chimney at once, and how a puff rises and drifts. */
const PUFFS_PER_CHIMNEY = 3;
const RISE_PX = 22;
const DRIFT_PX = 6;
const SWAY_PX = 1.5;
/** Smoke stays just in front of its own building. */
const SMOKE_Z_OFFSET = 0.002;

interface Puff {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** 0..1: where in its life this puff starts, so puffs follow each other. */
  readonly phase: number;
}

interface ChimneySmokeProps {
  readonly world: World;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/** Chimney tops of every building that has one (map pixels), with the building's depth. */
function chimneyPuffs(world: World, atlas: SpriteAtlas): Puff[] {
  const tile = ISLAND_CONFIG.map.tileSizePx;
  return world.objects.flatMap((object, n) => {
    const top = CHIMNEY_TOPS[object.kind];
    if (!top) return [];
    const { footprint, spriteKey } = OBJECT_REGISTRY[object.kind];
    const frame = atlas.frame(spriteKey);
    const footY = (object.y + footprint.height) * tile;
    const left = (object.x + footprint.width / 2) * tile - frame.width / 2;
    const x = left + top.x;
    const y = footY - frame.height + top.y;
    const z = standingSpriteZ(footY) + SMOKE_Z_OFFSET;
    // Each chimney starts at its own point in the cycle, so they don't puff in step.
    const offset = (n * 0.37) % 1;
    return Array.from({ length: PUFFS_PER_CHIMNEY }, (_, i) => ({
      x,
      y,
      z,
      phase: (offset + i / PUFFS_PER_CHIMNEY) % 1,
    }));
  });
}

/**
 * Soft smoke rising from the chimneys of the cottage, the village houses and
 * the studio: each puff grows as it rises and drifts with the wind, then
 * starts again. Tinted with the day/night light like everything else.
 */
export function ChimneySmoke({ world, atlas, lighting }: ChimneySmokeProps): JSX.Element {
  const puffs = useMemo(() => chimneyPuffs(world, atlas), [world, atlas]);
  const geometries = useMemo(
    () => SMOKE_KEYS.map((key) => createSpriteGeometry(atlas.frame(key))),
    [atlas],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const life = ISLAND_CONFIG.render.smokePuffSeconds;
    puffs.forEach((puff, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const age = (clock.elapsedTime / life + puff.phase) % 1;
      const size = Math.min(geometries.length - 1, Math.floor(age * geometries.length));
      const geometry = geometries[size];
      if (geometry && mesh.geometry !== geometry) mesh.geometry = geometry;
      const sway = Math.sin(age * Math.PI * 2 + puff.phase * 6) * SWAY_PX;
      const x = puff.x + age * DRIFT_PX + sway;
      const y = puff.y - age * RISE_PX;
      mesh.position.set(Math.round(x), worldYFromMapPx(Math.round(y)), puff.z);
    });
  });

  return (
    <group>
      {puffs.map((puff, i) => (
        <mesh
          key={`${String(puff.x)}:${String(puff.y)}:${String(i)}`}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={geometries[0]}
          material={material}
        />
      ))}
    </group>
  );
}
