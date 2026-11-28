import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { SHADOW_KEYS } from '../assets/paintShadows';
import { RABBIT_FRAMES, rabbitKey, type RabbitView } from '../assets/paintRabbits';
import type { GameState } from '../core/game/gameState';
import type { Rabbit } from '../core/systems/rabbits';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry, setSpriteGeometryFrame } from './spriteGeometry';
import { createShadowMaterial, createSpriteMaterial, setAnimationFrame } from './spriteMaterial';
import { SHADOW_Z, standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** How high a hop arcs (pixels): small, so it reads as a bounce, not a jump. */
const HOP_HEIGHT_PX = 3;
/** Where each hop frame starts (fraction of the hop): crouch, push off, airborne, land. */
const HOP_FRAME_STARTS = [0, 0.15, 0.4, 0.78] as const;
/** Nibbling alternates its two frames at this pace; sitting twitches an ear now and then. */
const NIBBLE_FRAME_SECONDS = 0.22;
const TWITCH_EVERY_SECONDS = 2.6;
const TWITCH_SECONDS = 0.18;
/** The feet are this far above the sprite's bottom edge. */
const FOOT_INSET_PX = 1;

function viewOf(rabbit: Rabbit): RabbitView {
  return rabbit.facing === 'up' ? 'back' : rabbit.facing === 'down' ? 'front' : 'side';
}

/** Which frame of its strip a rabbit shows now. */
function rabbitFrame(rabbit: Rabbit, seconds: number): number {
  if (rabbit.hop) {
    let index = 0;
    HOP_FRAME_STARTS.forEach((start, i) => {
      if (rabbit.hop && rabbit.hop.t >= start) index = i;
    });
    return RABBIT_FRAMES.hop[index] ?? RABBIT_FRAMES.sit;
  }
  if (rabbit.idle === 'nibble') {
    return (
      RABBIT_FRAMES.nibble[Math.floor(seconds / NIBBLE_FRAME_SECONDS) % 2] ?? RABBIT_FRAMES.sit
    );
  }
  if (rabbit.idle === 'alert') return RABBIT_FRAMES.sit;
  if (rabbit.idle === 'huddle') return RABBIT_FRAMES.huddle;
  if (rabbit.idle === 'sleep') return RABBIT_FRAMES.sleep;
  const twitching = (seconds + rabbit.id * 1.1) % TWITCH_EVERY_SECONDS < TWITCH_SECONDS;
  return twitching ? RABBIT_FRAMES.twitch : RABBIT_FRAMES.sit;
}

interface RabbitSpriteProps {
  readonly rabbit: Rabbit;
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

function RabbitSprite({ rabbit, state, atlas, lighting }: RabbitSpriteProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const shadowRef = useRef<Mesh>(null);
  const frame = atlas.frame(rabbitKey(rabbit.color, 'side'));
  const geometry = useMemo(() => createSpriteGeometry(frame), [frame]);
  const shownView = useRef<RabbitView>('side');
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  const shadowGeometry = useMemo(
    () => createSpriteGeometry(atlas.frame(SHADOW_KEYS.small)),
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
    if (!mesh) return;
    setAnimationFrame(material, rabbitFrame(rabbit, clock.elapsedTime));
    const t = state.interpolation;
    const x = Math.round(rabbit.previousX + (rabbit.x - rabbit.previousX) * t);
    const footY = Math.round(rabbit.previousY + (rabbit.y - rabbit.previousY) * t);
    // The body arcs during a hop; depth and the shadow stay with the ground.
    const lift = rabbit.hop ? Math.round(Math.sin(Math.PI * rabbit.hop.t) * HOP_HEIGHT_PX) : 0;
    // The view for the way it faces: side (mirrored to the right), back going up, front going down.
    const view = viewOf(rabbit);
    if (view !== shownView.current) {
      setSpriteGeometryFrame(geometry, atlas.frame(rabbitKey(rabbit.color, view)));
      shownView.current = view;
    }
    mesh.scale.x = rabbit.facing === 'right' ? -1 : 1;
    mesh.position.set(
      x,
      worldYFromMapPx(footY + FOOT_INSET_PX - lift) + frame.height / 2,
      standingSpriteZ(footY),
    );
    shadowRef.current?.position.set(x + 1, worldYFromMapPx(footY), SHADOW_Z);
  });

  return (
    <>
      <mesh ref={shadowRef} geometry={shadowGeometry} material={shadowMaterial} />
      <mesh ref={meshRef} geometry={geometry} material={material} />
    </>
  );
}

interface RabbitSpritesProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/** The wild rabbits round the village (shown on the island only). */
export function RabbitSprites({ state, atlas, lighting }: RabbitSpritesProps): JSX.Element {
  return (
    <group>
      {state.rabbits.map((rabbit) => (
        <RabbitSprite
          key={rabbit.id}
          rabbit={rabbit}
          state={state}
          atlas={atlas}
          lighting={lighting}
        />
      ))}
    </group>
  );
}
