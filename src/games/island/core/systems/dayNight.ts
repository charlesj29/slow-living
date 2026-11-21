// The time of day and the light it gives. Time is a fraction of a day
// (0 = midnight, 0.5 = noon) that the fixed step advances; the light is a
// colour the whole scene is multiplied by, plus whether windows are lit.
// Pure: rendering only applies the numbers.

export type DayNightMode = 'auto' | 'day' | 'night';

export const DAY_NIGHT_MODES: readonly DayNightMode[] = ['auto', 'day', 'night'];

export interface Lighting {
  /** Multiplier for every painted colour (1, 1, 1 = full daylight). */
  readonly tint: readonly [r: number, g: number, b: number];
  /** 0..1: how "on" the window lights are (they switch on above one half). */
  readonly lights: number;
}

interface Keyframe extends Lighting {
  readonly time: number;
}

const NIGHT: Lighting = { tint: [0.4, 0.46, 0.78], lights: 1 };
const DAWN: Lighting = { tint: [0.96, 0.76, 0.78], lights: 0.6 };
const DAY: Lighting = { tint: [1, 1, 1], lights: 0 };
const DUSK: Lighting = { tint: [1, 0.74, 0.56], lights: 0.7 };

/** Long days and nights with short, warm dawns and dusks in between. */
const KEYFRAMES: readonly Keyframe[] = [
  { time: 0, ...NIGHT },
  { time: 0.2, ...NIGHT },
  { time: 0.25, ...DAWN },
  { time: 0.31, ...DAY },
  { time: 0.71, ...DAY },
  { time: 0.77, ...DUSK },
  { time: 0.83, ...NIGHT },
  { time: 1, ...NIGHT },
];

export const NOON = 0.5;
export const MIDNIGHT = 0;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Eases in and out, so colour changes start and end gently. */
const smooth = (t: number): number => t * t * (3 - 2 * t);

export function advanceTimeOfDay(
  time: number,
  stepSeconds: number,
  dayLengthSeconds: number,
): number {
  const next = time + stepSeconds / dayLengthSeconds;
  return next - Math.floor(next);
}

/** The light at a time of day, blended smoothly between keyframes. */
export function lightingAt(time: number): Lighting {
  const t = time - Math.floor(time);
  for (let i = 1; i < KEYFRAMES.length; i++) {
    const to = KEYFRAMES[i];
    const from = KEYFRAMES[i - 1];
    if (!to || !from || t > to.time) continue;
    const span = to.time - from.time;
    const k = span > 0 ? smooth((t - from.time) / span) : 1;
    return {
      tint: [
        lerp(from.tint[0], to.tint[0], k),
        lerp(from.tint[1], to.tint[1], k),
        lerp(from.tint[2], to.tint[2], k),
      ],
      lights: lerp(from.lights, to.lights, k),
    };
  }
  return NIGHT;
}

/** What the scene should look like: the clock in Auto, otherwise a fixed noon or midnight. */
const INDOOR_DAY: Lighting = { tint: [1, 0.98, 0.95], lights: 0 };
const INDOOR_NIGHT: Lighting = { tint: [0.84, 0.74, 0.62], lights: 1 };

/**
 * Indoors the night isn't blue: as it gets dark outside the lamps come on,
 * so the room turns a warm, slightly dimmer lamplight.
 */
function indoorLighting(outdoor: Lighting): Lighting {
  const k = outdoor.lights;
  const mix = (i: 0 | 1 | 2): number => lerp(INDOOR_DAY.tint[i], INDOOR_NIGHT.tint[i], k);
  return { tint: [mix(0), mix(1), mix(2)], lights: k };
}

export function targetLighting(mode: DayNightMode, time: number, indoor = false): Lighting {
  const outdoor =
    mode === 'day' ? lightingAt(NOON) : mode === 'night' ? lightingAt(MIDNIGHT) : lightingAt(time);
  return indoor ? indoorLighting(outdoor) : outdoor;
}

/** "HH:MM" for a time of day (the debug overlay shows it). */
export function clockLabel(time: number): string {
  const minutes = Math.floor((time - Math.floor(time)) * 24 * 60);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
