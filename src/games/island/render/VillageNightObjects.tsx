import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { MARKET_STALL_CLOSED_KEY } from '../assets/paintPlaza';
import { ISLAND_CONFIG } from '../core/config';
import type { SpriteInstance } from './objectSprites';
import { createSpriteGeometry } from './spriteGeometry';
import type { SpriteMaterial } from './spriteMaterial';
import { isHouseAsleep, isStallOpen, MARKET_STALL_KEY } from './villageNight';

type Batch = readonly [key: string, instances: readonly SpriteInstance[]];

interface HouseLightsProps {
  readonly atlas: SpriteAtlas;
  /** The house light batches (one sprite key each), with where each house's overlay goes. */
  readonly batches: readonly Batch[];
  /** The window-light material (untinted, hidden while the lamps are off). */
  readonly material: SpriteMaterial;
  /** The time of day the scene shows. */
  readonly sceneTime: () => number;
}

/**
 * The village houses' windows: lit in the evening like every window, then dark
 * one house after another late at night (left to right), until dawn. One mesh
 * per house, so each can go to bed on its own.
 */
export function HouseLights({
  atlas,
  batches,
  material,
  sceneTime,
}: HouseLightsProps): JSX.Element {
  const houses = useMemo(
    () =>
      batches
        .flatMap(([key, instances]) => instances.map((instance) => ({ key, instance })))
        .sort((a, b) => a.instance.x - b.instance.x),
    [batches],
  );
  const geometries = useMemo(
    () => new Map(batches.map(([key]) => [key, createSpriteGeometry(atlas.frame(key))])),
    [atlas, batches],
  );
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const t = sceneTime();
    houses.forEach((_, order) => {
      const mesh = meshes.current[order];
      if (mesh) mesh.visible = !isHouseAsleep(t, order, houses.length, ISLAND_CONFIG.villageNight);
    });
  });

  return (
    <group>
      {houses.map(({ key, instance }, order) => (
        <mesh
          key={`${key}:${String(order)}`}
          ref={(mesh) => {
            meshes.current[order] = mesh;
          }}
          geometry={geometries.get(key)}
          material={material}
          position={[instance.x, instance.y, instance.z]}
        />
      ))}
    </group>
  );
}

interface MarketStallProps {
  readonly atlas: SpriteAtlas;
  readonly instances: readonly SpriteInstance[];
  readonly material: SpriteMaterial;
  readonly sceneTime: () => number;
}

/** The market stall: open by day; awning rolled up and crates covered at night. */
export function MarketStall({
  atlas,
  instances,
  material,
  sceneTime,
}: MarketStallProps): JSX.Element {
  const open = useMemo(() => createSpriteGeometry(atlas.frame(MARKET_STALL_KEY)), [atlas]);
  const closed = useMemo(() => createSpriteGeometry(atlas.frame(MARKET_STALL_CLOSED_KEY)), [atlas]);
  useEffect(() => () => open.dispose(), [open]);
  useEffect(() => () => closed.dispose(), [closed]);
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const geometry = isStallOpen(sceneTime(), ISLAND_CONFIG.villageNight) ? open : closed;
    for (const mesh of meshes.current)
      if (mesh && mesh.geometry !== geometry) mesh.geometry = geometry;
  });

  return (
    <group>
      {instances.map((instance, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={open}
          material={material}
          position={[instance.x, instance.y, instance.z]}
        />
      ))}
    </group>
  );
}
