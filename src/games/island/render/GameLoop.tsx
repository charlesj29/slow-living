import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { ISLAND_CONFIG } from '../core/config';
import {
  advanceGame,
  closePortfolioPanel,
  setOverlayOpen,
  type GameState,
} from '../core/game/gameState';
import { STUDIO_MAP } from '../core/game/mapTravel';
import { useIslandUiStore } from '../state';

/** Runs before the camera and sprites each frame (lowest priority first). */
const LOOP_PRIORITY = -2;

interface GameLoopProps {
  readonly state: GameState;
}

/** Drives the fixed-step simulation from the render loop; renders nothing itself. */
export function GameLoop({ state }: GameLoopProps): null {
  const reportedWalking = useRef(false);
  const shownMessage = useRef<string | null>(null);
  const shownMap = useRef(state.mapId);
  const shownDark = useRef(false);
  const shownPanel = useRef(false);
  const shownOverlay = useRef(false);
  useFrame((_, deltaSeconds) => {
    advanceGame(state, deltaSeconds, ISLAND_CONFIG);
    // Tell the UI once (not every frame) that the player has started walking.
    if (!reportedWalking.current && state.player.moving) {
      reportedWalking.current = true;
      useIslandUiStore.getState().markStartedWalking();
    }
    // Mirror the open message into the UI store only when it changes.
    const message = state.dialog ? (state.dialog.pages[state.dialog.page] ?? null) : null;
    if (message !== shownMessage.current) {
      shownMessage.current = message;
      useIslandUiStore.getState().setDialogMessage(message);
    }
    // The portfolio panel: the game opens it, the UI closes it.
    const ui = useIslandUiStore.getState();
    if (state.panel && !shownPanel.current) {
      shownPanel.current = true;
      ui.openPanel(state.panel);
    } else if (shownPanel.current && ui.panel === null) {
      shownPanel.current = false;
      closePortfolioPanel(state);
    }
    // A page over the game (the Résumé): the game waits while it is open.
    if (ui.isResumeOpen !== shownOverlay.current) {
      shownOverlay.current = ui.isResumeOpen;
      setOverlayOpen(state, ui.isResumeOpen);
    }
    // Door transitions: darken while fading out; swap the map (React rebuilds the scene).
    const dark = state.transition?.phase === 'out';
    if (dark !== shownDark.current) {
      shownDark.current = dark;
      useIslandUiStore.getState().setScreenDark(dark);
    }
    if (state.mapId !== shownMap.current) {
      shownMap.current = state.mapId;
      ui.setMap(state.mapId);
      if (state.mapId === STUDIO_MAP && !ui.hasVisitedStudio) ui.setVisitedStudio(true);
    }
  }, LOOP_PRIORITY);
  return null;
}
