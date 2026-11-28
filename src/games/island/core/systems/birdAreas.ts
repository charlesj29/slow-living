// Where the little birds live: a patch of open ground before the studio, one
// before the cottage and one round the village well. There is a flock in each,
// so the birds are scattered over the island rather than all in one spot. Pure.
import { getDoorFrontTile, type World } from '../world/world';

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

/** The birds' places: before the studio, before the cottage, round the well (those this island has). */
export function birdAreas(world: World, walkable: ReadonlySet<number>, radius: number): number[][] {
  const doorOf = (kind: string): number | null => {
    const building = world.objects.find((object) => object.kind === kind);
    if (!building) return null;
    const front = getDoorFrontTile(building);
    return front.y * world.width + front.x;
  };
  const well = world.objects.find((object) => object.kind === 'well');
  const village = well ? well.y * world.width + well.x : null;
  return [doorOf('studio'), doorOf('cabin'), village]
    .filter((middle): middle is number => middle !== null)
    .map((middle) => patch(world, walkable, middle, radius))
    .filter((tiles) => tiles.length > 0);
}
