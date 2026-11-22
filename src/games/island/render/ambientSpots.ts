// Where the purely decorative wildlife lives: which flowers the butterflies
// visit and where the fireflies swarm. Picked from the world once (no
// randomness: the same island always gets the same spots), nearest the
// player's start first, and spread out so they never bunch up.
import type { TilePoint } from '@/shared/engine/grid';
import { hashCoords } from '@/shared/engine/random';
import type { IslandConfig } from '../core/config';
import { OBJECT_REGISTRY } from '../core/world/objects';
import { isLakeTile, isLandTile } from '../core/world/tiles';
import type { World } from '../core/world/world';

export interface ButterflyRoute {
  /** The two flowers it flies between (map pixels, tile centres). */
  readonly from: { readonly x: number; readonly y: number };
  readonly to: { readonly x: number; readonly y: number };
  /** Which of the butterfly colours, and where in its cycle it starts (0..1). */
  readonly colorIndex: number;
  readonly phase: number;
}

/** A butterfly would rather fly at least this far (tiles) to its second flower. */
const MIN_FLIGHT_TILES = 2;
/** How near (tiles) the lake a firefly swarm may be. */
const LAKE_REACH_TILES = 2;

const distance2 = (a: TilePoint, b: TilePoint): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/** Up to `count` tiles from `candidates`, nearest to `from` first, each `minSpacing` from the others. */
export function spreadSpots(
  candidates: readonly TilePoint[],
  from: TilePoint,
  count: number,
  minSpacingTiles: number,
): TilePoint[] {
  const sorted = [...candidates].sort(
    (a, b) => distance2(a, from) - distance2(b, from) || a.y - b.y || a.x - b.x,
  );
  const chosen: TilePoint[] = [];
  for (const spot of sorted) {
    if (chosen.length >= count) break;
    if (chosen.every((other) => distance2(spot, other) >= minSpacingTiles ** 2)) chosen.push(spot);
  }
  return chosen;
}

function flowerTiles(world: World): TilePoint[] {
  return world.objects
    .filter((object) => OBJECT_REGISTRY[object.kind].category === 'flower')
    .map(({ x, y }) => ({ x, y }));
}

const centre = (tile: TilePoint, tileSizePx: number): { x: number; y: number } => ({
  x: (tile.x + 0.5) * tileSizePx,
  y: (tile.y + 0.5) * tileSizePx,
});

/** Each butterfly's two flowers: one near the start, and a neighbour a short flight away. */
export function butterflyRoutes(
  world: World,
  settings: IslandConfig['butterflies'],
  colorCount: number,
  tileSizePx: number,
): ButterflyRoute[] {
  const flowers = flowerTiles(world);
  const homes = spreadSpots(flowers, world.spawn, settings.count, settings.minSpacingTiles);
  return homes.map((home, i) => {
    const within = (minTiles: number): TilePoint[] =>
      flowers.filter((f) => {
        const d2 = distance2(f, home);
        return d2 >= minTiles ** 2 && d2 <= settings.hopRangeTiles ** 2;
      });
    // Rather a flower a couple of tiles off; else the next one over; else it loops back home.
    const near = within(MIN_FLIGHT_TILES);
    const choices = near.length > 0 ? near : within(1);
    // Any of them will do; a hash keeps the choice the same for the same island.
    const away =
      choices.sort(
        (a, b) => hashCoords(a.x, a.y, i) - hashCoords(b.x, b.y, i) || a.x - b.x || a.y - b.y,
      )[0] ?? home;
    return {
      from: centre(home, tileSizePx),
      to: centre(away, tileSizePx),
      colorIndex: i % colorCount,
      phase: (i * 0.37) % 1,
    };
  });
}

/** True for open land with lake water within reach. */
function isLakeside(world: World, x: number, y: number): boolean {
  const index = y * world.width + x;
  if (world.blocked[index] !== 0 || !isLandTile(world.terrain[index] ?? 0)) return false;
  for (let dy = -LAKE_REACH_TILES; dy <= LAKE_REACH_TILES; dy++) {
    for (let dx = -LAKE_REACH_TILES; dx <= LAKE_REACH_TILES; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) continue;
      if (isLakeTile(world.terrain[ny * world.width + nx] ?? 0)) return true;
    }
  }
  return false;
}

/** Centres (map pixels) of the firefly swarms: by the lake, else among the flowers. */
export function fireflySwarms(
  world: World,
  settings: IslandConfig['fireflies'],
  tileSizePx: number,
): { x: number; y: number }[] {
  const lakeside: TilePoint[] = [];
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) if (isLakeside(world, x, y)) lakeside.push({ x, y });
  }
  const spots = spreadSpots(lakeside, world.spawn, settings.swarms, settings.minSpacingTiles);
  const more = spreadSpots(
    flowerTiles(world).filter((f) =>
      spots.every((s) => distance2(f, s) >= settings.minSpacingTiles ** 2),
    ),
    world.spawn,
    settings.swarms - spots.length,
    settings.minSpacingTiles,
  );
  return [...spots, ...more].map((tile) => centre(tile, tileSizePx));
}
