import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { PROMPT_KEY } from '../assets/paintUi';
import { ISLAND_CONFIG } from '../core/config';
import { PLAYER_HEIGHT } from '../assets/playerPixels';
import { playerFootY } from '../core/entities/player';
import type { GameState } from '../core/game/gameState';
import type { InteractTarget } from '../core/systems/interaction';
import { OBJECT_REGISTRY } from '../core/world/objects';
import { objectSpriteKey } from './objectSpriteKeys';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { worldYFromMapPx } from './worldSpace';

/** Above every sprite in the world (they top out near z = 32 on a 192-tile map). */
const PROMPT_Z = 60;
const GAP_PX = 2;
/** The key bobs one pixel up and down. */
const BOB_SECONDS = 0.5;

/** Where the arrow goes: centred above the top of the target's sprite (map pixels). */
function promptAnchor(
  target: InteractTarget,
  state: GameState,
  atlas: SpriteAtlas,
): { x: number; topY: number } {
  const tile = ISLAND_CONFIG.map.tileSizePx;
  if (target.kind === 'villager') {
    const { villager } = target;
    const t = state.interpolation;
    const footY = Math.round(
      playerFootY(villager.previousY + (villager.y - villager.previousY) * t, ISLAND_CONFIG.player),
    );
    return {
      x: villager.previousX + (villager.x - villager.previousX) * t,
      topY: footY - PLAYER_HEIGHT,
    };
  }
  const { object } = target;
  const { footprint } = OBJECT_REGISTRY[object.kind];
  const spriteHeight = atlas.frame(objectSpriteKey(state.world, object, atlas)).height;
  return {
    x: (object.x + footprint.width / 2) * tile,
    topY: (object.y + footprint.height) * tile - spriteHeight,
  };
}

interface InteractPromptProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
}

/**
 * A small bobbing arrow pointing down at whatever the player could interact with,
 * hidden while a message is open. Reads the game state every frame (no React).
 */
export function InteractPrompt({ state, atlas }: InteractPromptProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const frame = atlas.frame(PROMPT_KEY);
  const geometry = useMemo(() => createSpriteGeometry(frame), [frame]);
  const material = useMemo(() => createSpriteMaterial(atlas.texture), [atlas]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const target = state.dialog ? null : state.interactTarget;
    mesh.visible = target !== null;
    if (!target) return;
    const anchor = promptAnchor(target, state, atlas);
    const bob = Math.floor(clock.elapsedTime / BOB_SECONDS) % 2;
    mesh.position.set(
      Math.round(anchor.x),
      worldYFromMapPx(anchor.topY) + GAP_PX + bob + frame.height / 2,
      PROMPT_Z,
    );
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} visible={false} />;
}
