import { useFrame } from '@react-three/fiber';
import { ISLAND_CONFIG } from '../core/config';
import { advanceGame, type GameState } from '../core/game/gameState';

/** Runs before the camera and sprites each frame (lowest priority first). */
const LOOP_PRIORITY = -2;

interface GameLoopProps {
  readonly state: GameState;
}

/** Drives the fixed-step simulation from the render loop; renders nothing itself. */
export function GameLoop({ state }: GameLoopProps): null {
  useFrame((_, deltaSeconds) => {
    advanceGame(state, deltaSeconds, ISLAND_CONFIG);
  }, LOOP_PRIORITY);
  return null;
}
