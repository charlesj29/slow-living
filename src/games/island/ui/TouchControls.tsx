import type { JSX } from 'react';
import type { GameState } from '../core/game/gameState';
import { useIslandUiStore } from '../state';
import { ActionButton } from './ActionButton';
import { SlideStick } from './SlideStick';
import './touchControls.css';

/**
 * Phones: the slide-stick (bottom left), a small interact button that pops up
 * when something is in reach (bottom right), and a short hint that fades after
 * the first steps. Messages continue with a tap on the screen. The stick steps
 * aside while you can't walk; everything hides during the ambient tour.
 */
export function TouchControls({ game }: { readonly game: GameState }): JSX.Element {
  const isMessageOpen = useIslandUiStore((state) => state.dialogMessage !== null);
  const calmMode = useIslandUiStore((state) => state.calmMode);
  const isPanelOpen = useIslandUiStore((state) => state.panel !== null);
  const isResumeOpen = useIslandUiStore((state) => state.isResumeOpen);
  const hasStartedWalking = useIslandUiStore((state) => state.hasStartedWalking);
  const covered = isPanelOpen || isResumeOpen || calmMode === 'touring';
  return (
    <div className="island-touch-controls">
      <SlideStick game={game} hidden={covered || isMessageOpen || calmMode === 'resting'} />
      <ActionButton game={game} hidden={covered || isMessageOpen} />
      <p
        className={`island-touch-hint${hasStartedWalking || isMessageOpen || covered ? ' is-hidden' : ''}`}
      >
        Slide the stick to walk
      </p>
    </div>
  );
}
