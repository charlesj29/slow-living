// How strong the breeze is right now: a usual light wind, stronger as a shower
// comes on, calmer at night. Pure; the sway shader and the drifting leaves read it.
import type { IslandConfig } from '../core/config';

/** 0..1+: `rain` is the shower's intensity, `night` how far into the night it is (0 day, 1 night). */
export function windStrength(
  rain: number,
  night: number,
  settings: IslandConfig['breeze'],
): number {
  const calm = 1 - (1 - settings.nightCalm) * Math.max(0, Math.min(1, night));
  return (settings.base + settings.rainBoost * Math.max(0, Math.min(1, rain))) * calm;
}
