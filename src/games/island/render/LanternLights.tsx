import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { AtlasFrame } from '@/shared/render/atlasLayout';
import { ISLAND_CONFIG } from '../core/config';
import type { World } from '../core/world/world';
import { lanternThresholds } from './dawnAndDusk';
import type { LightingUniforms } from './lighting';
import type { SpriteInstance } from './objectSprites';
import { createSpriteGeometry } from './spriteGeometry';
import type { SpriteMaterial } from './spriteMaterial';
import { worldYFromMapPx } from './worldSpace';

interface LanternLightsProps {
  readonly world: World;
  /** The lamp posts' light overlay sprite, and where each lamp's overlay goes. */
  readonly frame: AtlasFrame;
  readonly instances: readonly SpriteInstance[];
  /** The window-light material (untinted, hidden while the lamps are off). */
  readonly material: SpriteMaterial;
  readonly lighting: LightingUniforms;
}

/**
 * The lamp posts' glow, lit one by one: as the evening light rises, each lamp
 * comes on at its own point, nearest the village well first, then outwards
 * along the paths (and they go out the same way at dawn).
 */
export function LanternLights({
  world,
  frame,
  instances,
  material,
  lighting,
}: LanternLightsProps): JSX.Element {
  const geometry = useMemo(() => createSpriteGeometry(frame), [frame]);
  const thresholds = useMemo(() => {
    const tile = ISLAND_CONFIG.map.tileSizePx;
    const well = world.objects.find((object) => object.kind === 'well');
    const gate = world.village?.gate;
    const from = well ?? gate;
    // World units: x as on the map, y flipped.
    const origin = from
      ? { x: (from.x + 1) * tile, y: worldYFromMapPx((from.y + 0.5) * tile) }
      : { x: 0, y: 0 };
    return lanternThresholds(instances, origin, ISLAND_CONFIG.lanterns);
  }, [world, instances]);
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const evening = lighting.uLightsOn.value;
    thresholds.forEach((threshold, i) => {
      const mesh = meshes.current[i];
      if (mesh) mesh.visible = evening >= threshold;
    });
  });

  return (
    <group>
      {instances.map((instance, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={geometry}
          material={material}
          position={[instance.x, instance.y, instance.z]}
          visible={false}
        />
      ))}
    </group>
  );
}
