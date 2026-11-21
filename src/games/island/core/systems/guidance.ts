// Guidance towards the studio: villager hints and signpost texts, filled in
// with directions for this island. Pure: positions in, pages out.
import type { TilePoint } from '@/shared/engine/grid';
import { SIGN_LABELS, VILLAGER_TALKS, type SignPlace } from '../content/guidance';
import { getDoorFrontTile, type World } from '../world/world';
import { headingTo } from './compass';

/** The places worth pointing to on an island (null when the island has none). */
export type Landmarks = Readonly<Record<SignPlace, TilePoint | null>>;

/** A sign this close to a place doesn't point to it (you're already there). */
const NEARBY_TILES = 6;

export function findLandmarks(world: World): Landmarks {
  const studio = world.objects.find((object) => object.kind === 'studio');
  return {
    studio: studio ? getDoorFrontTile(studio) : null,
    village: world.village?.gate ?? null,
    cottage: world.cabin ? getDoorFrontTile(world.cabin) : null,
  };
}

/** What a villager says the `timesTalked`-th time (conversations take turns). */
export function villagerTalk(
  look: number,
  timesTalked: number,
  at: TilePoint,
  studio: TilePoint | null,
): readonly string[] {
  const talks = VILLAGER_TALKS[look % VILLAGER_TALKS.length] ?? [];
  const pages = talks[timesTalked % Math.max(1, talks.length)] ?? ['Hi!'];
  const direction = studio ? headingTo(at, studio) : 'nearby';
  return pages.map((page) => page.replaceAll('{studio}', direction));
}

/** A signpost's message: one line per place it points to, with its direction. */
export function signpostPages(at: TilePoint, landmarks: Landmarks): readonly string[] {
  const lines = (Object.keys(SIGN_LABELS) as SignPlace[]).flatMap((place) => {
    const target = landmarks[place];
    if (!target || Math.hypot(target.x - at.x, target.y - at.y) < NEARBY_TILES) return [];
    return [`${SIGN_LABELS[place]}: ${headingTo(at, target)}`];
  });
  return [lines.length > 0 ? lines.join('\n') : 'Welcome to the island!'];
}
