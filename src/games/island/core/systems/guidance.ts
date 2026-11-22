// Guidance towards the studio: villager hints and signpost texts, filled in
// with directions for this island. Pure: positions in, pages out.
import type { TilePoint } from '@/shared/engine/grid';
import {
  ACTIVITY_GREETINGS,
  SIGN_LABELS,
  TIME_GREETINGS,
  VILLAGER_TALKS,
  type SignPlace,
} from '../content/guidance';
import type { Activity } from '../entities/villager';
import type { DayPhase } from './dayNight';
import { getDoorFrontTile, type World } from '../world/world';
import { arrowToken, headingTo } from './compass';

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
  greeting?: string,
): readonly string[] {
  const talks = VILLAGER_TALKS[look % VILLAGER_TALKS.length] ?? [];
  const pages = talks[timesTalked % Math.max(1, talks.length)] ?? ['Hi!'];
  const direction = studio ? headingTo(at, studio) : 'nearby';
  const said = pages.map((page) => page.replaceAll('{studio}', direction));
  return greeting ? [greeting, ...said] : said;
}

/**
 * How a villager says hello: about what they're doing (baking, fishing...),
 * else for the time of day. The night owl greets the evening, then the night.
 */
export function villagerGreeting(activity: Activity, phase: DayPhase): string {
  const forActivity = activity === 'owl' ? undefined : ACTIVITY_GREETINGS[activity];
  return forActivity ?? TIME_GREETINGS[phase] ?? 'Hi!';
}

/** A signpost's message: one line per place it points to, with an arrow showing the way. */
export function signpostPages(at: TilePoint, landmarks: Landmarks): readonly string[] {
  const lines = (Object.keys(SIGN_LABELS) as SignPlace[]).flatMap((place) => {
    const target = landmarks[place];
    if (!target || Math.hypot(target.x - at.x, target.y - at.y) < NEARBY_TILES) return [];
    return [`${arrowToken(headingTo(at, target))} ${SIGN_LABELS[place]}`];
  });
  return [lines.length > 0 ? lines.join('\n') : 'Welcome to the island!'];
}
