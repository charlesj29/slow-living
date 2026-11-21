import { useCallback, useEffect, useLayoutEffect, useRef, type JSX, type MouseEvent } from 'react';
import { ISLAND_CONFIG } from '../core/config';
import { useIslandUiStore } from '../state';
import './islandUi.css';

const NEW_ISLAND_KEY = 'KeyR';

type Destination = 'new' | 'home';

interface IslandSwitcherProps {
  /** On the default island the Home button is hidden. */
  readonly isHome: boolean;
  readonly onNewIsland: () => void;
  readonly onHome: () => void;
}

function DiceIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M3 2h10v1h1v10h-1v1H3v-1H2V3h1zM4 4v2h2V4zM10 4v2h2V4zM7 7v2h2V7zM4 10v2h2v-2zM10 10v2h2v-2z"
      />
    </svg>
  );
}

function HomeIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges" fill="currentColor">
      <path d="M7 2h2v1h1v1h1v1h1v1h1v1h1v2h-1v5H9v-4H7v4H3V9H2V7h1V6h1V5h1V4h1V3h1z" />
    </svg>
  );
}

/**
 * Another island (dice button or R, for every visitor) and back to the default
 * one (Home). The screen fades out first; the page then swaps the island.
 */
export function IslandSwitcher({ isHome, onNewIsland, onHome }: IslandSwitcherProps): JSX.Element {
  const timer = useRef<number | null>(null);
  // The latest callbacks, so `travel` and the key listener stay stable.
  const actions = useRef({ onNewIsland, onHome });
  useLayoutEffect(() => {
    actions.current = { onNewIsland, onHome };
  });

  const travel = useCallback((to: Destination): void => {
    if (timer.current !== null) return; // already on the way
    useIslandUiStore.getState().setScreenDark(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      if (to === 'new') actions.current.onNewIsland();
      else actions.current.onHome();
    }, ISLAND_CONFIG.doors.fadeSeconds * 1000);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code !== NEW_ISLAND_KEY || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // Not while reading: the Résumé or a portfolio panel is open.
      const ui = useIslandUiStore.getState();
      if (ui.isResumeOpen || ui.panel) return;
      travel('new');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [travel]);

  // Let go of focus after a click, or Space (interact) would press the button again.
  const onNewClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.currentTarget.blur();
    travel('new');
  };
  const onHomeClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.currentTarget.blur();
    travel('home');
  };

  return (
    <>
      <button
        type="button"
        className="island-hud-button island-new-island"
        onClick={onNewClick}
        aria-label="Visit another island (R)"
        title="Visit another island (R)"
      >
        <DiceIcon />
      </button>
      {!isHome && (
        <button
          type="button"
          className="island-hud-button island-home"
          onClick={onHomeClick}
          aria-label="Back to the home island"
          title="Back to the home island"
        >
          <HomeIcon />
        </button>
      )}
    </>
  );
}
