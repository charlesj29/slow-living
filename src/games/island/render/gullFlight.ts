// Seagulls over the sea: each glides in a lazy loop round its own spot off
// the coast, flapping a few beats now and then. Pure: the spots come from a
// hash of the tiles (the same island, the same gulls), the pose from the time.
import { hashCoords } from '@/shared/engine/random';
import type { IslandConfig } from '../core/config';
import { getTileDefinition, isLandTile } from '../core/world/tiles';
import type { World } from '../core/world/world';

type BirdSettings = IslandConfig['birds'];

export interface GullSpot {
  /** Map pixels: the middle of its loop. */
  readonly x: number;
  readonly y: number;
  readonly phase: number;
}

/** Off the coast: sea with land this close (tiles), so the gulls are seen from the shore. */
const COAST_REACH_TILES = 4;
/** Gulls keep at least this far apart (tiles). */
const GULL_SPACING_TILES = 14;
/** A few wing beats every so often: how often, for how long, and how fast. */
const FLAP_EVERY_SECONDS = 6;
const FLAP_FOR_SECONDS = 1.1;
const FLAP_BEAT_SECONDS = 0.18;
/** Loops are flattened, as seen from above at an angle. */
const LOOP_SQUASH = 0.6;

function nearLand(world: World, x: number, y: number): boolean {
  for (let dy = -COAST_REACH_TILES; dy <= COAST_REACH_TILES; dy++) {
    for (let dx = -COAST_REACH_TILES; dx <= COAST_REACH_TILES; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      if (tx < 0 || ty < 0 || tx >= world.width || ty >= world.height) continue;
      if (isLandTile(world.terrain[ty * world.width + tx] ?? 0)) return true;
    }
  }
  return false;
}

export function gullSpots(world: World, count: number, tileSizePx: number): GullSpot[] {
  const coast: { x: number; y: number; rank: number }[] = [];
  world.terrain.forEach((id, i) => {
    if (getTileDefinition(id).waterBody !== 'sea') return;
    const x = i % world.width;
    const y = Math.floor(i / world.width);
    if (nearLand(world, x, y)) coast.push({ x, y, rank: hashCoords(x, y, 0x6011) });
  });
  coast.sort((a, b) => a.rank - b.rank);
  const chosen: typeof coast = [];
  for (const spot of coast) {
    if (chosen.length >= count) break;
    if (chosen.every((c) => Math.hypot(c.x - spot.x, c.y - spot.y) >= GULL_SPACING_TILES)) {
      chosen.push(spot);
    }
  }
  return chosen.map(({ x, y, rank }) => ({
    x: (x + 0.5) * tileSizePx,
    y: (y + 0.5) * tileSizePx,
    phase: (rank % 1000) / 1000,
  }));
}

export interface GullPose {
  readonly x: number;
  readonly y: number;
  readonly flapping: boolean;
}

export function gullPose(spot: GullSpot, seconds: number, settings: BirdSettings): GullPose {
  const angle = 2 * Math.PI * (seconds / settings.gullLoopSeconds + spot.phase);
  const radius = settings.gullLoopPx;
  const beat = (seconds + spot.phase * FLAP_EVERY_SECONDS) % FLAP_EVERY_SECONDS;
  const flapping = beat < FLAP_FOR_SECONDS && Math.floor(beat / FLAP_BEAT_SECONDS) % 2 === 1;
  return {
    x: spot.x + Math.cos(angle) * radius,
    y: spot.y + Math.sin(angle) * radius * LOOP_SQUASH,
    flapping,
  };
}
