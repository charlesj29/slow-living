import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { BIRD_FRAMES, birdKey, GULL_KEYS } from '../assets/paintBirds';
import { SHADOW_KEYS } from '../assets/paintShadows';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import type { Bird } from '../core/systems/birds';
import { gullPose, gullSpots } from './gullFlight';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createShadowMaterial, createSpriteMaterial, setAnimationFrame } from './spriteMaterial';
import { within } from './waterLights';
import { SHADOW_Z, standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** Above roofs and trees while flying; seagulls higher still (below the mist and clouds). */
const FLYING_Z = 42;
const GULL_Z = 45;
/** Seagulls fly high: their shadow falls this far below them on the water. */
const GULL_SHADOW_DROP_PX = 22;
/** Wing beats while flying; pecks and blinks while idling. */
const FLAP_SECONDS = 0.09;
const PECK_SECONDS = 0.28;
const BLINK_EVERY_SECONDS = 3.1;
const BLINK_SECONDS = 0.14;

function birdFrame(bird: Bird, seconds: number): number {
  if (bird.flight?.kind === 'fly') {
    return Math.floor(seconds / FLAP_SECONDS) % 2 === 0
      ? BIRD_FRAMES.wingsUp
      : BIRD_FRAMES.wingsDown;
  }
  if (bird.flight) return BIRD_FRAMES.stand;
  const offset = bird.id * 0.7;
  if (bird.idle === 'peck' && Math.floor((seconds + offset) / PECK_SECONDS) % 3 === 0) {
    return BIRD_FRAMES.peck;
  }
  return (seconds + offset) % BLINK_EVERY_SECONDS < BLINK_SECONDS
    ? BIRD_FRAMES.blink
    : BIRD_FRAMES.stand;
}

interface BirdSpriteProps {
  readonly bird: Bird;
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
  readonly awake: () => boolean;
}

function BirdSprite({ bird, state, atlas, lighting, awake }: BirdSpriteProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const shadowRef = useRef<Mesh>(null);
  const frame = atlas.frame(birdKey(bird.color));
  const geometry = useMemo(() => createSpriteGeometry(frame), [frame]);
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  const shadowGeometry = useMemo(
    () => createSpriteGeometry(atlas.frame(SHADOW_KEYS.tiny)),
    [atlas],
  );
  const shadowMaterial = useMemo(
    () => createShadowMaterial(atlas.texture, lighting),
    [atlas, lighting],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => shadowGeometry.dispose(), [shadowGeometry]);
  useEffect(() => () => shadowMaterial.dispose(), [shadowMaterial]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const shadow = shadowRef.current;
    if (!mesh || !shadow) return;
    const shown = awake();
    mesh.visible = shown;
    shadow.visible = shown;
    if (!shown) return;
    setAnimationFrame(material, birdFrame(bird, clock.elapsedTime));
    const t = state.interpolation;
    const x = Math.round(bird.previousX + (bird.x - bird.previousX) * t);
    const footY = Math.round(bird.previousY + (bird.y - bird.previousY) * t);
    const flight = bird.flight;
    const lift = flight ? Math.round(Math.sin(Math.PI * flight.t) * flight.height) : 0;
    mesh.scale.x = bird.facing === 'right' ? -1 : 1;
    mesh.position.set(
      x,
      worldYFromMapPx(footY - lift) + frame.height / 2,
      flight?.kind === 'fly' ? FLYING_Z : standingSpriteZ(footY),
    );
    shadow.position.set(x, worldYFromMapPx(footY), SHADOW_Z);
  });

  return (
    <>
      <mesh ref={shadowRef} geometry={shadowGeometry} material={shadowMaterial} />
      <mesh ref={meshRef} geometry={geometry} material={material} />
    </>
  );
}

interface SeagullsProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
  readonly awake: () => boolean;
}

function Seagulls({ state, atlas, lighting, awake }: SeagullsProps): JSX.Element {
  const settings = ISLAND_CONFIG.birds;
  const spots = useMemo(
    () =>
      settings.enabled ? gullSpots(state.world, settings.gulls, ISLAND_CONFIG.map.tileSizePx) : [],
    [state.world, settings],
  );
  const geometries = useMemo(
    () => ({
      glide: createSpriteGeometry(atlas.frame(GULL_KEYS.glide)),
      flap: createSpriteGeometry(atlas.frame(GULL_KEYS.flap)),
      shadow: createSpriteGeometry(atlas.frame(SHADOW_KEYS.tiny)),
    }),
    [atlas],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  const shadowMaterial = useMemo(
    () => createShadowMaterial(atlas.texture, lighting),
    [atlas, lighting],
  );
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => shadowMaterial.dispose(), [shadowMaterial]);
  // Two meshes per gull: its shadow, then the gull.
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const shown = awake();
    spots.forEach((spot, i) => {
      const shadow = meshes.current[i * 2];
      const gull = meshes.current[i * 2 + 1];
      if (!shadow || !gull) return;
      shadow.visible = shown;
      gull.visible = shown;
      if (!shown) return;
      const pose = gullPose(spot, clock.elapsedTime, settings);
      const geometry = pose.flapping ? geometries.flap : geometries.glide;
      if (gull.geometry !== geometry) gull.geometry = geometry;
      const x = Math.round(pose.x);
      const y = Math.round(pose.y);
      gull.position.set(x + 0.5, worldYFromMapPx(y) - 0.5, GULL_Z);
      shadow.position.set(x + 4, worldYFromMapPx(y + GULL_SHADOW_DROP_PX), SHADOW_Z);
    });
  });

  return (
    <group>
      {spots.flatMap((_, i) => [
        <mesh
          key={`shadow:${String(i)}`}
          ref={(mesh) => {
            meshes.current[i * 2] = mesh;
          }}
          geometry={geometries.shadow}
          material={shadowMaterial}
        />,
        <mesh
          key={`gull:${String(i)}`}
          ref={(mesh) => {
            meshes.current[i * 2 + 1] = mesh;
          }}
          geometry={geometries.glide}
          material={material}
        />,
      ])}
    </group>
  );
}

interface BirdSpritesProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
  /** The time of day the scene shows: birds are out by day only. */
  readonly sceneTime: () => number;
}

/** The village's little birds and the seagulls over the sea (island only, by day). */
export function BirdSprites({ state, atlas, lighting, sceneTime }: BirdSpritesProps): JSX.Element {
  const awake = (): boolean => within(sceneTime(), ISLAND_CONFIG.birds.awake);
  return (
    <group>
      {state.birds.map((bird) => (
        <BirdSprite
          key={bird.id}
          bird={bird}
          state={state}
          atlas={atlas}
          lighting={lighting}
          awake={awake}
        />
      ))}
      <Seagulls state={state} atlas={atlas} lighting={lighting} awake={awake} />
    </group>
  );
}
