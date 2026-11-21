import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { ANIMAL_FRAMES } from '../assets/paintAnimals';
import type { GameState } from '../core/game/gameState';
import type { Animal } from '../core/systems/animals';
import type { LightingUniforms } from './lighting';
import { PLAYER_SHADOW } from './objectShadows';
import { createSpriteGeometry } from './spriteGeometry';
import { createShadowMaterial, createSpriteMaterial, setAnimationFrame } from './spriteMaterial';
import { SHADOW_Z, standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** Walk frames change this often; a resting chicken pecks now and then. */
const WALK_FRAME_SECONDS = 0.18;
const PECK_EVERY_SECONDS = 1.3;
const PECK_SECONDS = 0.35;
/** A resting cat dozes off after this long. */
const CAT_DOZE_SECONDS = 3;
/** The feet are this far above the sprite's bottom edge. */
const FOOT_INSET_PX = 1;

/** Which frame of its strip an animal shows now. */
function animalFrame(animal: Animal, seconds: number): number {
  const stride = Math.floor(seconds / WALK_FRAME_SECONDS) % 2;
  if (animal.kind === 'chicken') {
    const frames = ANIMAL_FRAMES.chicken;
    if (animal.target) return frames.walk[stride] ?? frames.stand;
    const pecking = (seconds + animal.id * 0.7) % PECK_EVERY_SECONDS < PECK_SECONDS;
    return pecking ? frames.peck : frames.stand;
  }
  const frames = ANIMAL_FRAMES.cat;
  if (animal.target) return frames.walk[stride] ?? frames.sit;
  return animal.restedFor > CAT_DOZE_SECONDS ? frames.sleep : frames.sit;
}

interface AnimalSpriteProps {
  readonly animal: Animal;
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

function AnimalSprite({ animal, state, atlas, lighting }: AnimalSpriteProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const shadowRef = useRef<Mesh>(null);
  const frame = atlas.frame(`animal_${animal.kind}`);
  const geometry = useMemo(() => createSpriteGeometry(frame), [frame]);
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  const shadowGeometry = useMemo(
    () => createSpriteGeometry(atlas.frame(PLAYER_SHADOW.key)),
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
    setAnimationFrame(material, animalFrame(animal, clock.elapsedTime));
    const t = state.interpolation;
    const x = Math.round(animal.previousX + (animal.x - animal.previousX) * t);
    const footY = Math.round(animal.previousY + (animal.y - animal.previousY) * t);
    mesh.scale.x = animal.facing === 'right' ? -1 : 1;
    mesh.position.set(
      x,
      worldYFromMapPx(footY + FOOT_INSET_PX) + frame.height / 2,
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

interface AnimalSpritesProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/** The village's chickens and cat (shown on the island only). */
export function AnimalSprites({ state, atlas, lighting }: AnimalSpritesProps): JSX.Element {
  return (
    <group>
      {state.animals.map((animal) => (
        <AnimalSprite
          key={animal.id}
          animal={animal}
          state={state}
          atlas={atlas}
          lighting={lighting}
        />
      ))}
    </group>
  );
}
