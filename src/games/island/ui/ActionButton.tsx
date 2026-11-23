import { useEffect, useState, type JSX, type MouseEvent } from 'react';
import { pressKey, releaseKey } from '@/shared/engine/input';
import { ISLAND_CONFIG } from '../core/config';
import { noteActivity } from '../core/game/idleTour';
import type { GameState } from '../core/game/gameState';
import { ISLAND_KEY_BINDINGS, TOUCH_KEYS } from '../core/systems/controls';
import { actionLabel } from './actionLabel';

/** How often the button checks what's in reach (ms): quick enough to feel instant. */
const LABEL_REFRESH_MS = 150;

/**
 * The interact button (phones): a small round button with just the word
 * inside (Talk, Read, Look, Sit, Stand). It only shows when something is in
 * reach (or you're sitting); messages continue with a tap on the screen.
 */
export function ActionButton({
  game,
  hidden,
}: {
  readonly game: GameState;
  readonly hidden: boolean;
}): JSX.Element {
  const [label, setLabel] = useState<string | null>(() => actionLabel(game));

  useEffect(() => {
    const timer = window.setInterval(() => {
      // While a message is open, tapping the screen turns its pages instead.
      setLabel(game.dialog ? null : actionLabel(game));
    }, LABEL_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [game]);

  // On the click (finger lifted), not on touch-down: acting on touch-down opened the
  // workspace panel under the finger, and the tap's own click then landed on the panel's
  // backdrop and closed it again at once.
  const onPress = (event: MouseEvent<HTMLButtonElement>): void => {
    event.currentTarget.blur();
    if (noteActivity(game, ISLAND_CONFIG)) return;
    // A press, like tapping Space: the next game step picks it up.
    pressKey(game.input, ISLAND_KEY_BINDINGS, TOUCH_KEYS.interact);
    releaseKey(game.input, ISLAND_KEY_BINDINGS, TOUCH_KEYS.interact);
  };

  const isShown = !hidden && label !== null;
  return (
    <button
      type="button"
      className={`island-action${isShown ? '' : ' is-hidden'}`}
      onClick={onPress}
      aria-hidden={!isShown}
      tabIndex={isShown ? 0 : -1}
    >
      {label ?? ''}
    </button>
  );
}
