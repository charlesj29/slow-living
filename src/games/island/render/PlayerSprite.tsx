import type { JSX } from 'react';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { playerSpriteKey } from '../assets/paintPlayer';
import type { GameState } from '../core/game/gameState';
import { CharacterSprite } from './CharacterSprite';
import type { LightingUniforms } from './lighting';

interface PlayerSpriteProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/** The explorer. */
export function PlayerSprite({ state, atlas, lighting }: PlayerSpriteProps): JSX.Element {
  return (
    <CharacterSprite
      body={state.player}
      spriteKeyFor={playerSpriteKey}
      state={state}
      atlas={atlas}
      lighting={lighting}
    />
  );
}
