import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { ISLAND_CONFIG } from '../core/config';
import { advanceGame, type GameState } from '../core/game/gameState';
import { useIslandUiStore } from '../state';

/** Runs before the camera and sprites each frame (lowest priority first). */
const LOOP_PRIORITY = -2;

interface GameLoopProps {
  readonly state: GameState;
}

/** Drives the fixed-step simulation from the render loop; renders nothing itself. */
export function GameLoop({ state }: GameLoopProps): null {
  const reportedWalking = useRef(false);
  useFrame((_, deltaSeconds) => {
    advanceGame(state, deltaSeconds, ISLAND_CONFIG);
    // Tell the UI once (not every frame) that the player has started walking.
    if (!reportedWalking.current && state.player.moving) {
      reportedWalking.current = true;
      useIslandUiStore.getState().markStartedWalking();
    }
  }, LOOP_PRIORITY);
  return null;
}
