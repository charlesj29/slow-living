import type { JSX } from 'react';
import type { GameState } from '../core/game/gameState';
import { useIslandUiStore } from '../state';
import { ActionButton } from './ActionButton';
import './touchControls.css';

/**
 * Phones: a small interact button that pops up when something is in reach
 * (bottom right), quiet and see-through, so the island stays the main thing.
 * Walking needs no controls of its own: tap to walk there, or hold a finger
 * down and the player follows it (see `render/TapToWalk`). Messages continue
 * with a tap on the screen; the button hides during the ambient tour.
 */
export function TouchControls({ game }: { readonly game: GameState }): JSX.Element {
  const isMessageOpen = useIslandUiStore((state) => state.dialogMessage !== null);
  const calmMode = useIslandUiStore((state) => state.calmMode);
  const isPanelOpen = useIslandUiStore((state) => state.panel !== null);
  const isResumeOpen = useIslandUiStore((state) => state.isResumeOpen);
  const covered = isPanelOpen || isResumeOpen || calmMode === 'touring';
  return (
    <div className="island-touch-controls">
      <ActionButton game={game} hidden={covered || isMessageOpen} />
    </div>
  );
}
