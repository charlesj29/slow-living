import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { BufferGeometry, Mesh } from 'three';
import type { AtlasFrame } from '@/shared/render/atlasLayout';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { WATER_LIGHT_KEYS } from '../assets/paintWaterLights';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import {
  glintSpots,
  moonSpot,
  shootingStarAt,
  starSpots,
  twinkle,
  within,
  type WaterSpot,
} from './waterLights';
import { GROUND_DECAL_Z, worldYFromMapPx } from './worldSpace';

/** Clouds hide the sky: above this much rain, nothing shines on the water. */
const CLOUDED_OVER = 0.2;
/** How often the moon's ripples shift, and how far a shooting star flies (map pixels). */
const MOON_SHIMMER_SECONDS = 0.7;
const SHOOTING_STAR_TRAVEL = { x: 44, y: 22 } as const;

type Key = (typeof WATER_LIGHT_KEYS)[keyof typeof WATER_LIGHT_KEYS];

interface NightWaterProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  /** The time of day the scene shows. */
  readonly sceneTime: () => number;
}

/** Puts a sprite's middle on a map pixel, its edges on whole pixels. */
function place(mesh: Mesh, frame: AtlasFrame, x: number, y: number): void {
  const left = Math.round(x) - Math.floor(frame.width / 2);
  const top = Math.round(y) - Math.floor(frame.height / 2);
  mesh.position.set(
    left + frame.width / 2,
    worldYFromMapPx(top) - frame.height / 2,
    GROUND_DECAL_Z,
  );
}

function show(mesh: Mesh | null | undefined, geometry: BufferGeometry | null): void {
  if (!mesh) return;
  mesh.visible = geometry !== null;
  if (geometry && mesh.geometry !== geometry) mesh.geometry = geometry;
}

/**
 * Light on the water: at night the stars and the moon are reflected on the sea
 * and the lake, twinkling, and now and then a shooting star streaks across the
 * lake; at sunrise and sunset the low sun sparkles gold on it. Drawn untinted
 * (they are light, not paint) and only under a clear sky.
 */
export function NightWater({ state, atlas, sceneTime }: NightWaterProps): JSX.Element {
  const settings = ISLAND_CONFIG.waterLights;
  const tile = ISLAND_CONFIG.map.tileSizePx;
  const world = state.world;
  const stars = useMemo(() => starSpots(world, settings, tile), [world, settings, tile]);
  const glints = useMemo(() => glintSpots(world, settings, tile), [world, settings, tile]);
  const moon = useMemo(() => moonSpot(world, tile), [world, tile]);
  const frames = useMemo(() => {
    const entries = Object.values(WATER_LIGHT_KEYS).map((key) => [key, atlas.frame(key)] as const);
    return new Map<Key, AtlasFrame>(entries);
  }, [atlas]);
  const geometries = useMemo(
    () => new Map([...frames].map(([key, frame]) => [key, createSpriteGeometry(frame)])),
    [frames],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture), [atlas]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);
  // One mesh per light, in this order: the stars, the sparkles, the moon, the shooting star.
  const meshes = useRef<(Mesh | null)[]>([]);
  const moonSlot = stars.length + glints.length;
  const streakSlot = moonSlot + 1;

  const geometry = (key: Key): BufferGeometry | null => geometries.get(key) ?? null;
  const frame = (key: Key): AtlasFrame | undefined => frames.get(key);

  useFrame(({ clock }) => {
    const seconds = clock.elapsedTime;
    const time = sceneTime();
    const clear = state.weather.intensity < CLOUDED_OVER;
    const night = clear && within(time, settings.night);
    const golden = clear && (within(time, settings.dawn) || within(time, settings.dusk));

    const lights = (
      firstSlot: number,
      spots: readonly WaterSpot[],
      on: boolean,
      period: number,
      bright: Key,
      dim: Key,
    ): void =>
      spots.forEach((spot, i) => {
        const mesh = meshes.current[firstSlot + i];
        const glow = on ? twinkle(seconds, spot.phase, period) : 'off';
        const key = glow === 'bright' ? bright : dim;
        const shape = frame(key);
        show(mesh, glow === 'off' ? null : geometry(key));
        if (mesh && shape && glow !== 'off') place(mesh, shape, spot.x, spot.y);
      });
    lights(0, stars, night, settings.twinkleSeconds, 'water_star_bright', 'water_star_dim');
    lights(
      stars.length,
      glints,
      golden,
      settings.twinkleSeconds / 2,
      'water_glint_bright',
      'water_glint_dim',
    );

    const moonKey: Key =
      Math.floor(seconds / MOON_SHIMMER_SECONDS) % 2 === 0 ? 'water_moon_a' : 'water_moon_b';
    const moonShape = frame(moonKey);
    const moonMesh = meshes.current[moonSlot];
    show(moonMesh, night && moon ? geometry(moonKey) : null);
    if (moonMesh && moon && moonShape) place(moonMesh, moonShape, moon.x, moon.y);

    const streak = night ? shootingStarAt(seconds, settings) : null;
    const from = streak ? glints[streak.index % Math.max(1, glints.length)] : undefined;
    const streakShape = frame('water_shooting_star');
    const streakMesh = meshes.current[streakSlot];
    show(streakMesh, streak && from ? geometry('water_shooting_star') : null);
    if (streak && from && streakMesh && streakShape) {
      place(
        streakMesh,
        streakShape,
        from.x + SHOOTING_STAR_TRAVEL.x * (streak.progress - 0.5),
        from.y + SHOOTING_STAR_TRAVEL.y * (streak.progress - 0.5),
      );
    }
  });

  return (
    <group>
      {Array.from({ length: streakSlot + 1 }, (_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={geometries.get('water_star_dim')}
          material={material}
          visible={false}
        />
      ))}
    </group>
  );
}
