import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type JSX } from 'react';
import type { Group } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { villagerSpriteKey } from '../assets/paintPlayer';
import type { Direction } from '../core/entities/player';
import type { Villager } from '../core/entities/villager';
import type { GameState } from '../core/game/gameState';
import { CharacterSprite } from './CharacterSprite';
import type { LightingUniforms } from './lighting';

interface VillagerSpritesProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

function VillagerSprite({
  villager,
  ...props
}: VillagerSpritesProps & { readonly villager: Villager }): JSX.Element {
  const keyFor = useMemo(
    () => (facing: Direction) => villagerSpriteKey(villager.look, facing),
    [villager.look],
  );
  const groupRef = useRef<Group>(null);
  // Indoors for the night: not drawn (nor their shadow).
  useFrame(() => {
    if (groupRef.current) groupRef.current.visible = !villager.hidden;
  });
  return (
    <group ref={groupRef}>
      <CharacterSprite body={villager} spriteKeyFor={keyFor} {...props} />
    </group>
  );
}

/** Every villager, each in their own outfit. */
export function VillagerSprites(props: VillagerSpritesProps): JSX.Element {
  return (
    <>
      {props.state.villagers.map((villager) => (
        <VillagerSprite key={villager.id} villager={villager} {...props} />
      ))}
    </>
  );
}
