import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Color, type Scene } from 'three';
import { approach } from '@/shared/engine/math';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { targetLighting } from '../core/systems/dayNight';
import { rainyTint } from '../core/systems/weather';
import { useIslandUiStore } from '../state';
import type { LightingUniforms } from './lighting';

interface DayNightLightingProps {
  readonly state: GameState;
  readonly lighting: LightingUniforms;
  /** The sea colour beyond the map, tinted along with everything else. */
  readonly background: string;
}

/** Writes the eased light into the shared uniforms and tints the background (per frame). */
function applyLight(
  lighting: LightingUniforms,
  scene: Scene,
  base: Color,
  tinted: Color,
  [r = 1, g = 1, b = 1, lights = 0]: readonly number[],
): void {
  lighting.uTint.value.setRGB(r, g, b);
  lighting.uLightsOn.value = lights;
  tinted.setRGB(base.r * r, base.g * g, base.b * b);
  scene.background = tinted;
}

/**
 * Relights the scene every frame from the game clock and the day/night mode:
 * eases the shared tint towards the target (so switching modes fades instead
 * of snapping) and switches window lights. Renders nothing.
 */
export function DayNightLighting({ state, lighting, background }: DayNightLightingProps): null {
  const current = useRef<number[] | null>(null);
  const base = useRef(new Color(background));
  const tinted = useRef(new Color());

  useFrame(({ scene }, deltaSeconds) => {
    const mode = useIslandUiStore.getState().dayNightMode;
    const indoor = state.world.indoor === true;
    const target = targetLighting(mode, state.timeOfDay, indoor);
    // Rain greys the daylight outdoors (rooms keep their lamplight).
    const tint = indoor
      ? target.tint
      : rainyTint(target.tint, state.weather.intensity, ISLAND_CONFIG.weather);
    const goal = [...tint, target.lights];
    // Start at the right light; afterwards ease towards it.
    const now = (current.current ??= goal);
    const sharpness = ISLAND_CONFIG.dayNight.transitionSharpness;
    for (let i = 0; i < now.length; i++) {
      now[i] = approach(now[i] ?? 0, goal[i] ?? 0, sharpness, deltaSeconds);
    }
    applyLight(lighting, scene, base.current, tinted.current, now);
  });
  return null;
}
