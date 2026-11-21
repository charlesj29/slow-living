// Moving between the island and interiors: noticing a door or doormat, and
// running the fade-out → swap → fade-in transition on the fixed step.
import type { IslandConfig } from '../config';
import type { MovementIntent } from '../systems/controls';
import { doorAhead, onDoormat, placePlayer, startTransition } from '../systems/doors';
import { OBJECT_REGISTRY } from '../world/objects';
import { getDoorFrontTile } from '../world/world';
import type { GameState } from './gameState';

export const ISLAND_MAP = 'island';
/** The Developer's Studio's interior id (its marker shows until the first visit). */
export const STUDIO_MAP = 'studio';

/**
 * Starts a transition when the player walks up into an enterable door, or
 * steps onto a doormat indoors. Returns true if one started.
 */
export function checkDoors(
  state: GameState,
  intent: MovementIntent,
  config: IslandConfig,
): boolean {
  const { player, world } = state;
  const tileSizePx = config.map.tileSizePx;
  if (world.indoor) {
    if (!onDoormat(world, player, tileSizePx) || !state.returnPoint) return false;
    state.transition = startTransition({
      mapId: ISLAND_MAP,
      tile: state.returnPoint,
      facing: 'down',
    });
    return true;
  }
  if (intent.dy !== -1) return false;
  const building = doorAhead(world, player, config.player, config.interaction.reachPx, tileSizePx);
  const interiorId = building ? OBJECT_REGISTRY[building.kind].interior : undefined;
  const room = interiorId ? state.maps.get(interiorId) : undefined;
  if (!building || !interiorId || !room) return false;
  state.returnPoint = getDoorFrontTile(building);
  const { x, y } = room.spawn;
  state.transition = startTransition({ mapId: interiorId, tile: { x, y }, facing: 'up' });
  return true;
}

/** Advances an ongoing transition; swaps the map when the screen is fully dark. */
export function stepTransition(state: GameState, stepSeconds: number, config: IslandConfig): void {
  const transition = state.transition;
  if (!transition) return;
  transition.elapsed += stepSeconds;
  if (transition.elapsed < config.doors.fadeSeconds) return;
  if (transition.phase === 'out') {
    const next = state.maps.get(transition.to.mapId);
    if (next) {
      state.world = next;
      state.mapId = transition.to.mapId;
      placePlayer(state.player, transition.to.tile, transition.to.facing, config.map.tileSizePx);
    }
    transition.phase = 'in';
    transition.elapsed = 0;
    return;
  }
  state.transition = null;
}
