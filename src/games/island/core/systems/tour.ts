// The ambient tour: after a while with no input, the camera leaves the player
// and glides slowly between the island's nice places (the lake, the village,
// the cottage, the workspace, the beach), pausing at each, round and round.
// Any input ends it and the camera glides back. Pure: the tour is a path in
// map pixels as a function of time; the camera only follows it.
import { EIGHT_DIRECTIONS, forEachNeighbor } from '@/shared/engine/grid';
import type { IslandConfig } from '../config';
import { isLandTile, isLakeTile, getTileDefinition } from '../world/tiles';
import type { World } from '../world/world';
import type { Landmarks } from './guidance';

export interface PixelPoint {
  readonly x: number;
  readonly y: number;
}

export interface Tour {
  /** Seconds since the tour began. */
  seconds: number;
  /** Where the camera was when it began (the player). */
  readonly from: PixelPoint;
}

export interface TourReturn {
  /** Seconds since the tour ended. */
  seconds: number;
  /** Where the camera was when it ended. */
  readonly from: PixelPoint;
}

type TourSettings = IslandConfig['tour'];

const smoothstep = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: PixelPoint, b: PixelPoint, t: number): PixelPoint => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
const centreOf = (world: World, tile: number, tileSizePx: number): PixelPoint => ({
  x: ((tile % world.width) + 0.5) * tileSizePx,
  y: (Math.floor(tile / world.width) + 0.5) * tileSizePx,
});

/** The middle of the lake (the average of its tiles), or null without one. */
function lakeCentre(world: World, tileSizePx: number): PixelPoint | null {
  let x = 0;
  let y = 0;
  let count = 0;
  world.terrain.forEach((tile, index) => {
    if (!isLakeTile(tile)) return;
    const c = centreOf(world, index, tileSizePx);
    x += c.x;
    y += c.y;
    count += 1;
  });
  return count > 0 ? { x: x / count, y: y / count } : null;
}

/** The beach nearest to `near`: open land touching the sea. */
function beachNear(world: World, near: PixelPoint, tileSizePx: number): PixelPoint | null {
  let best: PixelPoint | null = null;
  let bestDistance = Infinity;
  world.terrain.forEach((tile, index) => {
    if (!isLandTile(tile) || world.blocked[index] !== 0) return;
    let bySea = false;
    forEachNeighbor(world, index, EIGHT_DIRECTIONS, (next) => {
      bySea ||= getTileDefinition(world.terrain[next] ?? 0).waterBody === 'sea';
    });
    if (!bySea) return;
    const c = centreOf(world, index, tileSizePx);
    const distance = Math.hypot(c.x - near.x, c.y - near.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = c;
    }
  });
  return best;
}

/**
 * The places the tour visits (map pixels), in an order that goes round them
 * (sorted by angle about their middle), so the glide never zigzags.
 */
export function tourStops(world: World, landmarks: Landmarks, tileSizePx: number): PixelPoint[] {
  const tile = (point: { x: number; y: number } | null): PixelPoint | null =>
    point ? { x: (point.x + 0.5) * tileSizePx, y: (point.y + 0.5) * tileSizePx } : null;
  const places = [
    lakeCentre(world, tileSizePx),
    tile(landmarks.village),
    tile(landmarks.cottage),
    tile(landmarks.studio),
  ].filter((p): p is PixelPoint => p !== null);
  if (places.length === 0) return [];
  const middle = {
    x: places.reduce((sum, p) => sum + p.x, 0) / places.length,
    y: places.reduce((sum, p) => sum + p.y, 0) / places.length,
  };
  const beach = beachNear(world, middle, tileSizePx);
  if (beach) places.push(beach);
  return places.sort(
    (a, b) =>
      Math.atan2(a.y - middle.y, a.x - middle.x) - Math.atan2(b.y - middle.y, b.x - middle.x),
  );
}

/** Seconds to glide from a to b. */
const glideSeconds = (a: PixelPoint, b: PixelPoint, settings: TourSettings): number =>
  Math.hypot(b.x - a.x, b.y - a.y) / settings.speedPx;

/** Where the tour's camera is: gliding to the nearest stop first, then round the stops. */
export function tourPoint(
  tour: Tour,
  stops: readonly PixelPoint[],
  settings: TourSettings,
): PixelPoint {
  const first = nearestIndex(stops, tour.from);
  const start = stops[first];
  if (!start) return tour.from;
  let t = tour.seconds;
  const approach = glideSeconds(tour.from, start, settings);
  if (t < approach) return lerp(tour.from, start, smoothstep(t / approach));
  t -= approach;
  const legs = stops.map((_, i) => {
    const from = stops[(first + i) % stops.length] ?? start;
    const to = stops[(first + i + 1) % stops.length] ?? start;
    return { from, to, glide: glideSeconds(from, to, settings) };
  });
  const cycle = legs.reduce((sum, leg) => sum + settings.holdSeconds + leg.glide, 0);
  t = cycle > 0 ? t % cycle : 0;
  for (const leg of legs) {
    if (t < settings.holdSeconds) return leg.from;
    t -= settings.holdSeconds;
    if (t < leg.glide) return lerp(leg.from, leg.to, smoothstep(t / leg.glide));
    t -= leg.glide;
  }
  return start;
}

function nearestIndex(stops: readonly PixelPoint[], to: PixelPoint): number {
  let best = 0;
  stops.forEach((stop, i) => {
    const current = stops[best];
    if (
      current &&
      Math.hypot(stop.x - to.x, stop.y - to.y) < Math.hypot(current.x - to.x, current.y - to.y)
    ) {
      best = i;
    }
  });
  return best;
}

/** The camera's way back from where the tour ended to `target` (the player). */
export function returnPoint(
  back: TourReturn,
  target: PixelPoint,
  settings: TourSettings,
): PixelPoint {
  return lerp(back.from, target, smoothstep(Math.min(1, back.seconds / settings.returnSeconds)));
}
