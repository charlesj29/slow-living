// When the visitor leaves the island alone (no keys, no taps, nothing open),
// an idle timer runs; after `tour.idleSeconds` the ambient tour starts. Any
// input ends it, and the camera glides back to the player. Pure: the fixed
// step advances the timers; input reports itself through `noteActivity`.
import { clearPresses } from '@/shared/engine/input';
import type { IslandConfig } from '../config';
import { returnPoint, tourPoint, type PixelPoint } from '../systems/tour';
import type { GameState } from './gameState';
import { ISLAND_MAP } from './mapTravel';

/** Something on screen or in hand that means the visitor is busy, not idle. */
function isBusy(state: GameState): boolean {
  return (
    state.input.held.length > 0 ||
    state.input.presses.length > 0 ||
    state.autoWalk !== null ||
    state.dialog !== null ||
    state.panel !== null ||
    state.overlayOpen ||
    state.transition !== null ||
    state.mapId !== ISLAND_MAP
  );
}

function endTour(state: GameState, config: IslandConfig): void {
  if (!state.tour) return;
  state.tourReturn = { seconds: 0, from: tourPoint(state.tour, state.tourStops, config.tour) };
  state.tour = null;
  state.idleSeconds = 0;
}

/**
 * Any key or tap: the visitor is back. Resets the idle timer and ends a tour
 * (returns true then, so the caller can swallow that input: it only wakes the
 * camera, it doesn't also walk or interact).
 */
export function noteActivity(state: GameState, config: IslandConfig): boolean {
  state.idleSeconds = 0;
  if (!state.tour) return false;
  endTour(state, config);
  return true;
}

/** One fixed step of the idle timer, the tour and the glide back. */
export function stepIdleTour(state: GameState, stepSeconds: number, config: IslandConfig): void {
  if (state.tourReturn) {
    state.tourReturn.seconds += stepSeconds;
    if (state.tourReturn.seconds >= config.tour.returnSeconds) state.tourReturn = null;
  }
  const busy = isBusy(state);
  if (state.tour) {
    if (!busy) {
      state.tour.seconds += stepSeconds;
      return;
    }
    endTour(state, config);
    // The key that ended the tour only wakes the camera.
    clearPresses(state.input);
    return;
  }
  if (busy) {
    state.idleSeconds = 0;
    return;
  }
  state.idleSeconds += stepSeconds;
  if (state.idleSeconds >= config.tour.idleSeconds && state.tourStops.length > 0) {
    state.tour = { seconds: 0, from: { x: state.player.x, y: state.player.y } };
  }
}

/** What the camera should look at: the tour, the glide back, or the player. */
export function cameraFocus(
  state: GameState,
  playerFocus: PixelPoint,
  config: IslandConfig,
): PixelPoint {
  if (state.tour) return tourPoint(state.tour, state.tourStops, config.tour);
  if (state.tourReturn) return returnPoint(state.tourReturn, playerFocus, config.tour);
  return playerFocus;
}
