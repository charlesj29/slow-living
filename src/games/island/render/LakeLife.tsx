import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { BufferGeometry, Mesh } from 'three';
import type { AtlasFrame } from '@/shared/render/atlasLayout';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { FISH_KEYS, WAKE_KEYS } from '../assets/paintLakeLife';
import { DUCK_SPRITE, DUCKLING_SPRITE } from '../assets/paintDucks';
import { RAIN_RING_KEYS } from '../assets/paintWeather';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { fishJumpAt, LEAP_TRAVEL_PX, leapSpots } from './fishJumps';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { GROUND_DECAL_Z, standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** Each splash-ring frame lasts this long; a duck's wake shimmers at this pace. */
const RING_FRAME_SECONDS = 0.3;
const WAKE_FRAME_SECONDS = 0.35;
/** Rising nose-up until here, level until here, then falling nose-down (fraction of the leap). */
const LEAP_LEVEL_FROM = 0.35;
const LEAP_FALL_FROM = 0.65;

/** Puts a sprite's top-left at a map pixel. */
function placeTopLeft(mesh: Mesh, frame: AtlasFrame, left: number, top: number, z: number): void {
  mesh.position.set(left + frame.width / 2, worldYFromMapPx(top) - frame.height / 2, z);
}

/** Puts a sprite's middle on a map pixel (its edges on whole pixels). */
function placeCentre(mesh: Mesh, frame: AtlasFrame, x: number, y: number, z: number): void {
  placeTopLeft(
    mesh,
    frame,
    Math.round(x) - Math.floor(frame.width / 2),
    Math.round(y) - Math.floor(frame.height / 2),
    z,
  );
}

interface LakeLifeProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/**
 * Life on the lake: now and then a fish leaps out and dives back in with a
 * splash of spreading rings, and paddling ducks leave a little wake.
 */
export function LakeLife({ state, atlas, lighting }: LakeLifeProps): JSX.Element {
  const spots = useMemo(() => leapSpots(state.world, ISLAND_CONFIG.map.tileSizePx), [state.world]);
  const keys = useMemo(
    () => [...Object.values(FISH_KEYS), ...WAKE_KEYS, ...RAIN_RING_KEYS] as const,
    [],
  );
  const frames = useMemo(
    () => new Map<string, AtlasFrame>(keys.map((key) => [key, atlas.frame(key)])),
    [atlas, keys],
  );
  const geometries = useMemo(
    () => new Map([...frames].map(([key, frame]) => [key, createSpriteGeometry(frame)])),
    [frames],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);
  // The fish, its take-off splash and its landing splash, then one wake per duck.
  const meshes = useRef<(Mesh | null)[]>([]);
  const ducks = state.ducks?.ducks ?? [];

  useFrame(({ clock }) => {
    const seconds = clock.elapsedTime;
    const show = (i: number, key: string | null): Mesh | null => {
      const mesh = meshes.current[i] ?? null;
      const geometry: BufferGeometry | undefined = key ? geometries.get(key) : undefined;
      if (!mesh) return null;
      mesh.visible = geometry !== undefined;
      if (geometry && mesh.geometry !== geometry) mesh.geometry = geometry;
      return geometry ? mesh : null;
    };
    const ring = (sinceSeconds: number): string | null =>
      RAIN_RING_KEYS[Math.floor(sinceSeconds / RING_FRAME_SECONDS)] ?? null;

    const jump = fishJumpAt(seconds, spots, ISLAND_CONFIG.lakeLife);
    const leap = ISLAND_CONFIG.lakeLife;
    const p = jump?.progress ?? 0;
    const dir = jump?.toLeft ? -1 : 1;
    const fishKey =
      !jump || p >= 1
        ? null
        : p < LEAP_LEVEL_FROM
          ? FISH_KEYS.up
          : p < LEAP_FALL_FROM
            ? FISH_KEYS.level
            : FISH_KEYS.down;
    const fish = show(0, fishKey);
    if (fish && jump && fishKey) {
      const groundY = jump.y;
      const x = jump.x + dir * LEAP_TRAVEL_PX * p;
      const lift = Math.sin(Math.PI * p) * leap.fishJumpHeightPx;
      fish.scale.x = jump.toLeft ? 1 : -1;
      const frame = frames.get(fishKey);
      if (frame) placeCentre(fish, frame, x, groundY - lift - 3, standingSpriteZ(groundY));
    }
    const takeOffKey = jump ? ring(p * leap.fishJumpSeconds) : null;
    const takeOff = show(1, takeOffKey);
    const takeOffFrame = takeOffKey ? frames.get(takeOffKey) : undefined;
    if (takeOff && jump && takeOffFrame)
      placeCentre(takeOff, takeOffFrame, jump.x, jump.y, GROUND_DECAL_Z);
    const landKey = jump && p >= 1 ? ring((p - 1) * leap.fishJumpSeconds) : null;
    const land = show(2, landKey);
    const landFrame = landKey ? frames.get(landKey) : undefined;
    if (land && jump && landFrame) {
      placeCentre(land, landFrame, jump.x + dir * LEAP_TRAVEL_PX, jump.y, GROUND_DECAL_Z);
    }

    ducks.forEach((duck, i) => {
      const key = duck.swimming
        ? (WAKE_KEYS[Math.floor(seconds / WAKE_FRAME_SECONDS + duck.id * 0.5) % WAKE_KEYS.length] ??
          null)
        : null;
      const wake = show(3 + i, key);
      const frame = key ? frames.get(key) : undefined;
      if (!wake || !frame) return;
      const t = state.interpolation;
      const x = Math.round(duck.previousX + (duck.x - duck.previousX) * t);
      const y = Math.round(duck.previousY + (duck.y - duck.previousY) * t);
      // From the tail, trailing behind (ducks face left unless mirrored).
      const half = (duck.kind === 'mother' ? DUCK_SPRITE : DUCKLING_SPRITE).width / 2;
      const right = duck.facing === 'right';
      wake.scale.x = right ? -1 : 1;
      const left = right ? x - half + 2 - frame.width : x + half - 2;
      placeTopLeft(wake, frame, left, y - 1, GROUND_DECAL_Z);
    });
  });

  return (
    <group>
      {Array.from({ length: 3 + ducks.length }, (_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={geometries.get(FISH_KEYS.level)}
          material={material}
          visible={false}
        />
      ))}
    </group>
  );
}
