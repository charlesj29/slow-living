// The weather: long clear spells and, now and then, a gentle rain shower that
// comes on and dies away slowly. Pure: timers advance by the fixed step and
// the lengths of spells come from the weather's own rng (so the rest of the
// game's randomness is untouched).
import type { Rng } from '@/shared/engine/random';
import type { IslandConfig } from '../config';

export interface Weather {
  /** Raining now (the shower's intensity follows this slowly). */
  raining: boolean;
  /** Seconds until the weather turns. */
  timeLeft: number;
  /** 0 (dry) .. 1 (full rain), easing in and out over `fadeSeconds`. */
  intensity: number;
}

type WeatherSettings = IslandConfig['weather'];

function spell(raining: boolean, rng: Rng, settings: WeatherSettings): number {
  return raining
    ? rng.range(settings.minRainSeconds, settings.maxRainSeconds)
    : rng.range(settings.minClearSeconds, settings.maxClearSeconds);
}

/** Every visit starts clear. */
export function createWeather(rng: Rng, settings: WeatherSettings): Weather {
  return { raining: false, timeLeft: spell(false, rng, settings), intensity: 0 };
}

export function updateWeather(
  weather: Weather,
  rng: Rng,
  stepSeconds: number,
  settings: WeatherSettings,
): void {
  weather.timeLeft -= stepSeconds;
  if (weather.timeLeft <= 0) {
    weather.raining = !weather.raining;
    weather.timeLeft = spell(weather.raining, rng, settings);
  }
  const step = stepSeconds / settings.fadeSeconds;
  weather.intensity = weather.raining
    ? Math.min(1, weather.intensity + step)
    : Math.max(0, weather.intensity - step);
}

/** Daylight dimmed towards the rain's grey by the shower's intensity. */
export function rainyTint(
  tint: readonly [number, number, number],
  intensity: number,
  settings: WeatherSettings,
): [number, number, number] {
  const k = Math.max(0, Math.min(1, intensity));
  const [r, g, b] = settings.rainTint;
  return [tint[0] * (1 + (r - 1) * k), tint[1] * (1 + (g - 1) * k), tint[2] * (1 + (b - 1) * k)];
}
