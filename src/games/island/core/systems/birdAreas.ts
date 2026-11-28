// Where the little birds live: a patch of open ground at the forest's edge,
// one in front of the studio and one in front of the cottage. Each flock picks
// one of them (at random, from the birds' own rng) and keeps to it. Pure.
import type { Rng } from '@/shared/engine/random';
import { OBJECT_REGISTRY } from '../world/objects';
import { getDoorFrontTile, type World } from '../world/world';

/** A forest edge: open ground with at least this many trees within `FOREST_REACH` tiles. */
const FOREST_TREES = 5;
const FOREST_REACH = 2;

/** Walkable tiles within `radius` tiles of a middle tile. */
function patch(
  world: World,
  walkable: ReadonlySet<number>,
  middle: number,
  radius: number,
): number[] {
  const mx = middle % world.width;
  const my = Math.floor(middle / world.width);
  const tiles: number[] = [];
  for (let y = my - radius; y <= my + radius; y++) {
    for (let x = mx - radius; x <= mx + radius; x++) {
      if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;
      const tile = y * world.width + x;
      if (Math.hypot(x - mx, y - my) <= radius && walkable.has(tile)) tiles.push(tile);
    }
  }
  return tiles;
}

/** Open ground with plenty of trees about: the forest's edge (one picked at random). */
function forestEdge(world: World, walkable: ReadonlySet<number>, rng: Rng): number | null {
  const trees = world.objects
    .filter((object) => OBJECT_REGISTRY[object.kind].category === 'tree')
    .map((object) => ({ x: object.x, y: object.y }));
  const edges = [...walkable].filter((tile) => {
    const x = tile % world.width;
    const y = Math.floor(tile / world.width);
    let near = 0;
    for (const tree of trees) {
      if (Math.abs(tree.x - x) <= FOREST_REACH && Math.abs(tree.y - y) <= FOREST_REACH) near++;
      if (near >= FOREST_TREES) return true;
    }
    return false;
  });
  return edges.length > 0 ? rng.pick(edges) : null;
}

/** The birds' places: the forest edge, before the studio, before the cottage (those this island has). */
export function birdAreas(
  world: World,
  walkable: ReadonlySet<number>,
  rng: Rng,
  radius: number,
): number[][] {
  const doorOf = (kind: string): number | null => {
    const building = world.objects.find((object) => object.kind === kind);
    if (!building) return null;
    const front = getDoorFrontTile(building);
    return front.y * world.width + front.x;
  };
  return [forestEdge(world, walkable, rng), doorOf('studio'), doorOf('cabin')]
    .filter((middle): middle is number => middle !== null)
    .map((middle) => patch(world, walkable, middle, radius))
    .filter((tiles) => tiles.length > 0);
}
