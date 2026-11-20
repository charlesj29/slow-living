import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { playerSpriteKey } from '../assets/paintPlayer';
import { ISLAND_CONFIG } from '../core/config';
import { playerFootY } from '../core/entities/player';
import { interpolatedPlayerPosition, type GameState } from '../core/game/gameState';
import { playerFrameIndex } from '../core/systems/animation';
import { createSpriteGeometry, setSpriteGeometryFrame } from './spriteGeometry';
import { createSpriteMaterial, setAnimationFrame } from './spriteMaterial';
import { standingSpriteZ, worldYFromMapPx } from './worldSpace';

interface PlayerSpriteProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
}

/**
 * Draws the player from the simulation state every frame: interpolated
 * position snapped to whole pixels (crisp), the strip for the facing
 * direction, the walk-cycle frame, and depth from the feet so crowns, the
 * cabin roof and fences cover the player when standing behind them.
 */
export function PlayerSprite({ state, atlas }: PlayerSpriteProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const shownKey = useRef('');
  const geometry = useMemo(
    () => createSpriteGeometry(atlas.frame(playerSpriteKey(state.player.facing))),
    [atlas, state],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture), [atlas]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const key = playerSpriteKey(state.player.facing);
    const frame = atlas.frame(key);
    if (shownKey.current !== key) {
      setSpriteGeometryFrame(geometry, frame);
      shownKey.current = key;
    }
    setAnimationFrame(material, playerFrameIndex(state.player, ISLAND_CONFIG.player));
    const { x, y } = interpolatedPlayerPosition(state);
    const footY = Math.round(playerFootY(y, ISLAND_CONFIG.player));
    mesh.position.set(
      Math.round(x),
      worldYFromMapPx(footY) + frame.height / 2,
      standingSpriteZ(footY),
    );
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}
