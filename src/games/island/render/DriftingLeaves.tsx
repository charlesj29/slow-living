import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Group, Mesh } from 'three';
import { createRng } from '@/shared/engine/random';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { LEAF_COLOURS, LEAF_KEYS } from '../assets/paintWeather';
import { ISLAND_CONFIG } from '../core/config';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { RAIN_Z, worldYFromMapPx } from './worldSpace';

/** Leaves drift across a bit more than the screen, so they never pop in at an edge. */
const VIEW_MARGIN_PX = 24;
/** Each leaf flips between its two shapes this often as it tumbles. */
const FLUTTER_SECONDS = 0.35;
/** Leaves are a daytime thing (the lamps are off). */
const LIGHTS_ON = 0.5;
const LEAF_SEED = 0x1eaf;

interface DriftingLeavesProps {
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
  /** How strong the breeze is now: more leaves in stronger wind. */
  readonly windStrength: () => number;
}

/**
 * Leaves carried across the island by the breeze, tumbling and bobbing as
 * they go: more when it's windy, none at night. Each leaf drifts through the
 * world (its pattern repeats every screenful), so walking past them leaves
 * them behind instead of carrying them along. Purely drawn.
 */
export function DriftingLeaves({
  atlas,
  lighting,
  windStrength,
}: DriftingLeavesProps): JSX.Element {
  const settings = ISLAND_CONFIG.breeze;
  const camera = useThree((three) => three.camera);
  const size = useThree((three) => three.size);
  const groupRef = useRef<Group>(null);
  const meshes = useRef<(Mesh | null)[]>([]);
  // Up to twice the usual number, for a gusty shower.
  const leaves = useMemo(() => {
    const rng = createRng(LEAF_SEED);
    return Array.from({ length: settings.leaves * 2 }, () => ({
      fx: rng.next(),
      fy: rng.next(),
      speed: rng.range(0.7, 1.3),
      bob: rng.range(0, Math.PI * 2),
      colour: rng.int(0, LEAF_COLOURS - 1),
    }));
  }, [settings.leaves]);
  const geometries = useMemo(
    () => LEAF_KEYS.map((key) => createSpriteGeometry(atlas.frame(key))),
    [atlas],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    group.visible = lighting.uLightsOn.value < LIGHTS_ON;
    if (!group.visible) return;
    const t = clock.elapsedTime;
    const width = size.width / camera.zoom + 2 * VIEW_MARGIN_PX;
    const height = size.height / camera.zoom + 2 * VIEW_MARGIN_PX;
    const left = camera.position.x - width / 2;
    const top = -camera.position.y - height / 2;
    // The pattern repeats every screenful, anchored to the world (not to the camera).
    const wrap = (value: number, start: number, period: number): number =>
      start + ((((value - start) % period) + period) % period);
    const shown = Math.round(settings.leaves * windStrength());
    leaves.forEach((leaf, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      mesh.visible = i < shown;
      if (!mesh.visible) return;
      // Blown left with the wind (like the rain), sinking slowly and bobbing as it goes.
      const travel = t * settings.leafSpeedPx * leaf.speed;
      const x = wrap(leaf.fx * width - travel, left, width);
      const y = wrap(
        leaf.fy * height + travel * 0.25 + Math.sin(t * 1.3 + leaf.bob) * 6,
        top,
        height,
      );
      const flip = Math.floor(t / FLUTTER_SECONDS + leaf.bob) % 2;
      const geometry = geometries[leaf.colour * 2 + flip];
      if (geometry && mesh.geometry !== geometry) mesh.geometry = geometry;
      mesh.position.set(Math.round(x), worldYFromMapPx(Math.round(y)), RAIN_Z);
    });
  });

  return (
    <group ref={groupRef}>
      {leaves.map((_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={geometries[0]}
          material={material}
          visible={false}
        />
      ))}
    </group>
  );
}
