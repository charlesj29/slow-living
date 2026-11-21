import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { STUDIO_MARKER_KEY } from '../assets/paintUi';
import { ISLAND_CONFIG } from '../core/config';
import { OBJECT_REGISTRY } from '../core/world/objects';
import type { World } from '../core/world/world';
import { useIslandUiStore } from '../state';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { worldYFromMapPx } from './worldSpace';

/** In front of every sprite (like the interact arrow). */
const MARKER_Z = 60;
/** Space between the studio's roof top and the star. */
const GAP_PX = 6;
/** The star floats up and down by this much, once per period. */
const BOB_PX = 2;
const BOB_SECONDS = 1.6;

interface StudioMarkerProps {
  readonly world: World;
  readonly atlas: SpriteAtlas;
}

/**
 * A gold star floating over the Developer's Studio until the visitor has been
 * inside once (remembered), so first-time visitors know where to go. Not
 * tinted at night, so it stays easy to spot.
 */
export function StudioMarker({ world, atlas }: StudioMarkerProps): JSX.Element | null {
  const meshRef = useRef<Mesh>(null);
  const studio = world.objects.find((object) => object.kind === 'studio');
  const frame = atlas.frame(STUDIO_MARKER_KEY);
  const geometry = useMemo(() => createSpriteGeometry(frame), [frame]);
  const material = useMemo(() => createSpriteMaterial(atlas.texture), [atlas]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || !studio) return;
    mesh.visible = !useIslandUiStore.getState().hasVisitedStudio;
    if (!mesh.visible) return;
    const tile = ISLAND_CONFIG.map.tileSizePx;
    const { footprint, spriteKey } = OBJECT_REGISTRY.studio;
    const roofTopY = (studio.y + footprint.height) * tile - atlas.frame(spriteKey).height;
    const bob = Math.round(BOB_PX * Math.sin((clock.elapsedTime * 2 * Math.PI) / BOB_SECONDS));
    mesh.position.set(
      Math.round((studio.x + footprint.width / 2) * tile),
      worldYFromMapPx(roofTopY) + GAP_PX + BOB_PX + bob + frame.height / 2,
      MARKER_Z,
    );
  });

  if (!studio) return null;
  return <mesh ref={meshRef} geometry={geometry} material={material} visible={false} />;
}
