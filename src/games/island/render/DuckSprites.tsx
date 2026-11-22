import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { DUCK_FRAMES, DUCK_KEYS, DUCK_SPRITE, DUCKLING_SPRITE } from '../assets/paintDucks';
import type { GameState } from '../core/game/gameState';
import { isDabbling, type Duck, type DuckFamily } from '../core/systems/ducks';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial, setAnimationFrame } from './spriteMaterial';
import { standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** The ripple moves quicker while paddling than while floating; dabbling wiggles the tail. */
const SWIM_FRAME_SECONDS = 0.3;
const FLOAT_FRAME_SECONDS = 0.7;
const DABBLE_FRAME_SECONDS = 0.22;

function duckFrame(duck: Duck, family: DuckFamily, seconds: number): number {
  if (duck.kind === 'mother' && isDabbling(family)) {
    return DUCK_FRAMES.dabble[Math.floor(seconds / DABBLE_FRAME_SECONDS) % 2] ?? 0;
  }
  const pace = duck.swimming ? SWIM_FRAME_SECONDS : FLOAT_FRAME_SECONDS;
  // Each duck's ripple runs a little out of step with the others.
  return DUCK_FRAMES.swim[Math.floor(seconds / pace + duck.id * 0.5) % 2] ?? 0;
}

interface DuckSpriteProps {
  readonly duck: Duck;
  readonly family: DuckFamily;
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

function DuckSprite({ duck, family, state, atlas, lighting }: DuckSpriteProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const isMother = duck.kind === 'mother';
  const size = isMother ? DUCK_SPRITE : DUCKLING_SPRITE;
  const geometry = useMemo(
    () => createSpriteGeometry(atlas.frame(isMother ? DUCK_KEYS.mother : DUCK_KEYS.duckling)),
    [atlas, isMother],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    setAnimationFrame(material, duckFrame(duck, family, clock.elapsedTime));
    const t = state.interpolation;
    const x = Math.round(duck.previousX + (duck.x - duck.previousX) * t);
    const y = Math.round(duck.previousY + (duck.y - duck.previousY) * t);
    mesh.scale.x = duck.facing === 'right' ? -1 : 1;
    // The waterline row sits on the duck's position.
    const bottom = y - size.waterline + size.height;
    mesh.position.set(x, worldYFromMapPx(bottom) + size.height / 2, standingSpriteZ(y));
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

interface DuckSpritesProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/** The duck family on the lake (shown on the island only). */
export function DuckSprites({ state, atlas, lighting }: DuckSpritesProps): JSX.Element | null {
  const family = state.ducks;
  if (!family) return null;
  return (
    <group>
      {family.ducks.map((duck) => (
        <DuckSprite
          key={duck.id}
          duck={duck}
          family={family}
          state={state}
          atlas={atlas}
          lighting={lighting}
        />
      ))}
    </group>
  );
}
