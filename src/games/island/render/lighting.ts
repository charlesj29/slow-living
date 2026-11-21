// Uniforms shared by every world material, so one update per frame relights
// the whole scene: the day/night tint, and whether window lights are on.
import { Color } from 'three';

export interface LightingUniforms {
  readonly uTint: { value: Color };
  readonly uLightsOn: { value: number };
}

export function createLightingUniforms(): LightingUniforms {
  return { uTint: { value: new Color(1, 1, 1) }, uLightsOn: { value: 0 } };
}

/** For materials made without shared lighting (e.g. in tests): always daylight. */
export const DAYLIGHT: LightingUniforms = createLightingUniforms();
