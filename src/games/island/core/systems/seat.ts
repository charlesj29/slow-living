// Benches: sitting down and standing up again. Anyone can sit (the player,
// villagers): on the bench tile nearest them, facing out, feet just in front of
// the bench row (so they're drawn in front of it; the renderer lifts the sitting
// sprite onto the seat). Where they stood is remembered for standing up.
import type { Player } from '../entities/player';
import { OBJECT_REGISTRY } from '../world/objects';
import type { WorldObject } from '../world/world';

/** Sitting, the feet rest just in front of the bench row (so the sitter draws in front of it). */
const SEAT_IN_FRONT_PX = 1;

export function sitOn(body: Player, bench: WorldObject, tileSizePx: number): void {
  const { footprint } = OBJECT_REGISTRY[bench.kind];
  const nearest = Math.floor(body.x / tileSizePx);
  const tileX = Math.min(bench.x + footprint.width - 1, Math.max(bench.x, nearest));
  body.sitting = { standX: body.x, standY: body.y };
  body.x = (tileX + 0.5) * tileSizePx;
  body.y = (bench.y + footprint.height) * tileSizePx + SEAT_IN_FRONT_PX;
  body.previousX = body.x;
  body.previousY = body.y;
  body.facing = 'down';
  body.moving = false;
}

/** Stands up from a bench, back where they were before sitting down. */
export function standUp(body: Player): void {
  if (!body.sitting) return;
  body.x = body.sitting.standX;
  body.y = body.sitting.standY;
  body.previousX = body.x;
  body.previousY = body.y;
  body.sitting = null;
}
