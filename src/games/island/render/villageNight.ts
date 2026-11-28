// The village's evening and night, as pure functions of the time of day:
// which house windows have gone dark (one by one, late), whether the market
// stall is open, and how much the chimneys smoke (most at mealtimes).
import { lightsKey } from '../assets/paintLights';
import type { IslandConfig } from '../core/config';
import { OBJECT_REGISTRY } from '../core/world/objects';
import { VILLAGE_HOUSE_KINDS } from '../core/world/village';

/** The village houses' window-light overlays (each house goes to bed in turn). */
export const HOUSE_LIGHT_KEYS: ReadonlySet<string> = new Set(
  VILLAGE_HOUSE_KINDS.map((kind) => lightsKey(OBJECT_REGISTRY[kind].spriteKey)),
);
export const MARKET_STALL_KEY = OBJECT_REGISTRY.market_stall.spriteKey;

type NightSettings = IslandConfig['villageNight'];

const dayFraction = (time: number): number => time - Math.floor(time);
const within = (t: number, [from, to]: readonly [number, number]): boolean => t >= from && t < to;

/**
 * True once house `order` (of `count`) has gone to bed: houses turn in one
 * after another between `lightsOutFrom` and `lightsOutTo`, and stay dark until dawn.
 */
export function isHouseAsleep(
  time: number,
  order: number,
  count: number,
  settings: NightSettings,
): boolean {
  const t = dayFraction(time);
  const step = count > 1 ? (settings.lightsOutTo - settings.lightsOutFrom) / (count - 1) : 0;
  const bedtime = settings.lightsOutFrom + step * order;
  return t >= bedtime || t < settings.wakeAt;
}

export function isStallOpen(time: number, settings: NightSettings): boolean {
  return within(dayFraction(time), [settings.stallOpens, settings.stallCloses]);
}

/** How many smoke puffs each chimney sends up now (of three): most at meals, a wisp at night. */
export function smokePuffs(time: number, settings: NightSettings): number {
  const t = dayFraction(time);
  if (within(t, settings.breakfast) || within(t, settings.dinner)) return 3;
  if (t >= settings.lightsOutTo || t < settings.wakeAt) return 1;
  return 2;
}
