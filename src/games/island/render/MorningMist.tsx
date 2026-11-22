import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Group, Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { MIST_KEYS } from '../assets/paintWeather';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { shownTime } from '../core/systems/dayNight';
import type { World } from '../core/world/world';
import { useIslandUiStore } from '../state';
import { mistSpots, mistThickness } from './dawnAndDusk';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createMistMaterial, setMistOpacity } from './spriteMaterial';
import { MIST_Z, worldYFromMapPx } from './worldSpace';

/** Each bank drifts gently back and forth this far (map pixels), out of step with the others. */
const SWAY_PX = 12;

interface MorningMistProps {
  readonly world: World;
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/**
 * Soft banks of mist over the lake and the meadows round it at dawn: they
 * thicken as the sun comes up, drift slowly, and lift by mid-morning. Drawn
 * from the time of day the scene shows (none while day or night is held).
 */
export function MorningMist({ world, state, atlas, lighting }: MorningMistProps): JSX.Element {
  const settings = ISLAND_CONFIG.mist;
  const groupRef = useRef<Group>(null);
  const meshes = useRef<(Mesh | null)[]>([]);
  const spots = useMemo(
    () => mistSpots(world, settings.patches, ISLAND_CONFIG.map.tileSizePx),
    [world, settings.patches],
  );
  const geometries = useMemo(
    () => MIST_KEYS.map((key) => createSpriteGeometry(atlas.frame(key))),
    [atlas],
  );
  const material = useMemo(() => createMistMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const time = shownTime(useIslandUiStore.getState().dayNightMode, state.timeOfDay);
    const thickness = mistThickness(time, settings);
    group.visible = thickness > 0;
    if (!group.visible) return;
    setMistOpacity(material, thickness * settings.maxOpacity);
    const t = clock.elapsedTime;
    spots.forEach((spot, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      // A slow sway whose top speed is the drift speed.
      const x = spot.x + Math.sin(((t + i * 7) * settings.driftPx) / SWAY_PX) * SWAY_PX;
      mesh.position.set(Math.round(x), worldYFromMapPx(Math.round(spot.y)), MIST_Z);
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {spots.map((_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={geometries[i % geometries.length]}
          material={material}
          renderOrder={2}
        />
      ))}
    </group>
  );
}
