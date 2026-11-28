import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import { hashCoords } from '@/shared/engine/random';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { PUDDLE_KEYS, RAINBOW_KEY } from '../assets/paintWeather';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { wetness } from '../core/systems/puddles';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createMistMaterial, createSpriteMaterial, setMistOpacity } from './spriteMaterial';
import { GROUND_DECAL_Z, RAIN_Z, worldYFromMapPx } from './worldSpace';

/** Puddles show from this wet on, at the sizes small, medium and brimming. */
const PUDDLE_LEVELS = [0.04, 0.35, 0.7] as const;
/** The rainbow: when it shows (times of day), how bright at most, and how it fades in and out. */
const RAINBOW_DAY = [0.28, 0.78] as const;
const RAINBOW_OPACITY = 0.5;
const RAINBOW_FADE_IN_SECONDS = 6;
const RAINBOW_FADE_OUT_SECONDS = 12;
/** Where the rainbow hangs in the view: up and to the right, like a far-off sky. */
const RAINBOW_VIEW = { x: 0.68, y: 0.16 } as const;

interface AfterRainProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
  /** The time of day the scene shows: the rainbow comes out by day only. */
  readonly sceneTime: () => number;
}

/**
 * After a shower: puddles that fill while it rains and dry up slowly once it
 * stops, and (by day) a soft rainbow in the sky for a little while.
 */
export function AfterRain({ state, atlas, lighting, sceneTime }: AfterRainProps): JSX.Element {
  const settings = ISLAND_CONFIG.afterRain;
  const tile = ISLAND_CONFIG.map.tileSizePx;
  const camera = useThree((three) => three.camera);
  const size = useThree((three) => three.size);
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
  const rainbowGeometry = useMemo(() => createSpriteGeometry(atlas.frame(RAINBOW_KEY)), [atlas]);
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  const rainbowMaterial = useMemo(
    () => createMistMaterial(atlas.texture, lighting),
    [atlas, lighting],
  );
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => rainbowGeometry.dispose(), [rainbowGeometry]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => rainbowMaterial.dispose(), [rainbowMaterial]);
  const meshes = useRef<(Mesh | null)[]>([]);
  const rainbow = useRef<Mesh>(null);

  useFrame(() => {
    const wet = wetness(state.weather, settings);
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

    // The rainbow: in the sky (it keeps its place in the view) for a while after a daytime shower.
    const mesh = rainbow.current;
    if (!mesh) return;
    const since = state.weather.sinceRain;
    const t = sceneTime() % 1;
    const day = t >= RAINBOW_DAY[0] && t < RAINBOW_DAY[1];
    const out = !state.weather.raining && day && since < settings.rainbowSeconds;
    mesh.visible = out;
    if (!out) return;
    const fadeIn = Math.min(1, since / RAINBOW_FADE_IN_SECONDS);
    const fadeOut = Math.min(1, (settings.rainbowSeconds - since) / RAINBOW_FADE_OUT_SECONDS);
    setMistOpacity(rainbowMaterial, RAINBOW_OPACITY * Math.min(fadeIn, fadeOut));
    const viewWidth = size.width / camera.zoom;
    const viewHeight = size.height / camera.zoom;
    mesh.position.set(
      Math.round(camera.position.x - viewWidth / 2 + viewWidth * RAINBOW_VIEW.x),
      Math.round(camera.position.y + viewHeight / 2 - viewHeight * RAINBOW_VIEW.y),
      RAIN_Z - 1,
    );
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
      <mesh ref={rainbow} geometry={rainbowGeometry} material={rainbowMaterial} visible={false} />
    </group>
  );
}
