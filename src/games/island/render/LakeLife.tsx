import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { BufferGeometry, Mesh } from 'three';
import type { AtlasFrame } from '@/shared/render/atlasLayout';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { FISH_KEYS, RIPPLE_KEYS, SPLASH_KEYS, WAKE_KEYS } from '../assets/paintLakeLife';
import { DUCK_SPRITE, DUCKLING_SPRITE } from '../assets/paintDucks';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { fishJumpAt, leapSpots } from './fishJumps';
import { leapScene, type Splash } from './fishLeap';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { GROUND_DECAL_Z, standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** A duck's wake shimmers at this pace. */
const WAKE_FRAME_SECONDS = 0.35;
/** The fish is drawn this far up from its middle, so its belly meets the water as it leaves. */
const FISH_BELLY_PX = 3;

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
    () => [...Object.values(FISH_KEYS), ...WAKE_KEYS, ...SPLASH_KEYS, ...RIPPLE_KEYS] as const,
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
  // The fish, the burst splash (crown, rings), the dive splash (crown, rings), then one wake per duck.
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
    // A splash: the crown stands on the water; the rings lie flat on it.
    const splash = (crownSlot: number, s: Splash | null): void => {
      const crownKey = s?.crown != null ? (SPLASH_KEYS[s.crown] ?? null) : null;
      const crown = show(crownSlot, crownKey);
      const crownFrame = crownKey ? frames.get(crownKey) : undefined;
      if (crown && s && crownFrame) {
        placeTopLeft(
          crown,
          crownFrame,
          Math.round(s.x) - Math.floor(crownFrame.width / 2),
          Math.round(s.y) - crownFrame.height + 2,
          standingSpriteZ(s.y),
        );
      }
      const rippleKey = s?.ripple != null ? (RIPPLE_KEYS[s.ripple] ?? null) : null;
      const ripple = show(crownSlot + 1, rippleKey);
      const rippleFrame = rippleKey ? frames.get(rippleKey) : undefined;
      if (ripple && s && rippleFrame) placeCentre(ripple, rippleFrame, s.x, s.y, GROUND_DECAL_Z);
    };

    const jump = fishJumpAt(seconds, spots, ISLAND_CONFIG.lakeLife);
    const scene = jump ? leapScene(jump, ISLAND_CONFIG.lakeLife) : null;
    const leaping = scene?.fish ?? null;
    const fishKey = leaping ? FISH_KEYS[leaping.pose] : null;
    const fish = show(0, fishKey);
    const fishFrame = fishKey ? frames.get(fishKey) : undefined;
    if (fish && leaping && jump && fishFrame) {
      fish.scale.x = jump.toLeft ? 1 : -1;
      placeCentre(
        fish,
        fishFrame,
        leaping.x,
        leaping.waterY - leaping.lift - FISH_BELLY_PX,
        standingSpriteZ(leaping.waterY),
      );
    }
    splash(1, scene?.burst ?? null);
    splash(3, scene?.dive ?? null);

    ducks.forEach((duck, i) => {
      const key = duck.swimming
        ? (WAKE_KEYS[Math.floor(seconds / WAKE_FRAME_SECONDS + duck.id * 0.5) % WAKE_KEYS.length] ??
          null)
        : null;
      const wake = show(5 + i, key);
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
      {Array.from({ length: 5 + ducks.length }, (_, i) => (
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
