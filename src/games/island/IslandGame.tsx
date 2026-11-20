import type { JSX } from 'react';
import { GameCanvas } from './render/GameCanvas';

/** Composes the game's render layer (canvas) and UI layer (HUD, overlays). */
export function IslandGame(): JSX.Element {
  return <GameCanvas />;
}
