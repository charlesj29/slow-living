import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Group, Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { BUTTERFLY_COLORS, butterflyKey } from '../assets/paintInsects';
import { ISLAND_CONFIG } from '../core/config';
import type { World } from '../core/world/world';
import { butterflyRoutes, type ButterflyRoute } from './ambientSpots';
import { butterflyPose } from './insectMotion';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial, setAnimationFrame } from './spriteMaterial';
import { standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** Butterflies are out while the lamps are off (day, early dusk); they rest at night. */
const LIGHTS_ON = 0.5;

interface ButterflyProps {
  readonly route: ButterflyRoute;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

function Butterfly({ route, atlas, lighting }: ButterflyProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const color = BUTTERFLY_COLORS[route.colorIndex] ?? 'orange';
  const frame = atlas.frame(butterflyKey(color));
  const geometry = useMemo(() => createSpriteGeometry(frame), [frame]);
  // Its own material: each butterfly beats its wings in its own time.
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const pose = butterflyPose(route, clock.elapsedTime, ISLAND_CONFIG.butterflies);
    setAnimationFrame(material, pose.frame);
    const groundY = Math.round(pose.groundY);
    const top = groundY - Math.round(pose.lift) - frame.height;
    mesh.position.set(
      Math.round(pose.x),
      worldYFromMapPx(top) - frame.height / 2,
      standingSpriteZ(groundY),
    );
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

interface ButterfliesProps {
  readonly world: World;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/** A few butterflies flitting between flowers near the start (daytime only). */
export function Butterflies({ world, atlas, lighting }: ButterfliesProps): JSX.Element {
  const groupRef = useRef<Group>(null);
  const routes = useMemo(
    () =>
      butterflyRoutes(
        world,
        ISLAND_CONFIG.butterflies,
        BUTTERFLY_COLORS.length,
        ISLAND_CONFIG.map.tileSizePx,
      ),
    [world],
  );

  useFrame(() => {
    if (groupRef.current) groupRef.current.visible = lighting.uLightsOn.value < LIGHTS_ON;
  });

  return (
    <group ref={groupRef}>
      {routes.map((route, i) => (
        <Butterfly key={i} route={route} atlas={atlas} lighting={lighting} />
      ))}
    </group>
  );
}
