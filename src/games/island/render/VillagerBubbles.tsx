import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { BUBBLE_KINDS, BUBBLE_SPRITE, bubbleKey } from '../assets/paintBubbles';
import type { BubbleKind, Villager } from '../core/entities/villager';
import type { GameState } from '../core/game/gameState';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { worldYFromMapPx } from './worldSpace';

/** The bubble's tail sits just above the head: villagers are 24 px tall, lifted 8 on a seat. */
const HEAD_ABOVE_FEET_PX = 25;
const SEAT_LIFT_PX = 8;
/** A little to the side of the head, so the tail points at the speaker. */
const BESIDE_HEAD_PX = 6;
/** Above everything on the ground (trees, roofs), below the weather. */
const BUBBLE_Z = 40;

interface BubbleProps {
  readonly villager: Villager;
  readonly state: GameState;
  readonly geometries: ReadonlyMap<BubbleKind, ReturnType<typeof createSpriteGeometry>>;
  readonly material: ReturnType<typeof createSpriteMaterial>;
}

function Bubble({ villager, state, geometries, material }: BubbleProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const bubble = villager.bubble;
    mesh.visible = bubble !== null && !villager.hidden;
    if (!bubble || villager.hidden) return;
    const geometry = geometries.get(bubble.kind);
    if (geometry && mesh.geometry !== geometry) mesh.geometry = geometry;
    const t = state.interpolation;
    const x = Math.round(villager.previousX + (villager.x - villager.previousX) * t);
    const y = Math.round(villager.previousY + (villager.y - villager.previousY) * t);
    const lift = villager.sitting ? SEAT_LIFT_PX : 0;
    const bottom = y - HEAD_ABOVE_FEET_PX - lift;
    mesh.position.set(
      x + BESIDE_HEAD_PX,
      worldYFromMapPx(bottom) + BUBBLE_SPRITE.height / 2,
      BUBBLE_Z,
    );
  });
  return (
    <mesh ref={meshRef} geometry={geometries.get('dots')} material={material} visible={false} />
  );
}

interface VillagerBubblesProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
}

/** The speech bubbles over villagers' heads: chatting, humming, waving (island only). */
export function VillagerBubbles({ state, atlas }: VillagerBubblesProps): JSX.Element {
  const geometries = useMemo(
    () =>
      new Map(
        BUBBLE_KINDS.map((kind) => [kind, createSpriteGeometry(atlas.frame(bubbleKey(kind)))]),
      ),
    [atlas],
  );
  // Not tinted by the night: the bubbles stay as readable as the message box.
  const material = useMemo(() => createSpriteMaterial(atlas.texture), [atlas]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group>
      {state.villagers.map((villager) => (
        <Bubble
          key={villager.id}
          villager={villager}
          state={state}
          geometries={geometries}
          material={material}
        />
      ))}
    </group>
  );
}
