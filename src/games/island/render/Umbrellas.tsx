import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { UMBRELLA_GRIP, UMBRELLA_KEY } from '../assets/paintUmbrella';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { carriesUmbrella } from '../core/systems/rainyDay';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** Where the hand is, from the feet (map pixels): beside the body, at the waist. */
const HAND = { side: 4, up: 6 } as const;
/** A sitting villager is lifted onto the seat. */
const SEAT_LIFT_PX = 8;
/** Held just behind the villager, so the canopy rises over the head without hiding the face. */
const BEHIND = 0.002;

interface UmbrellasProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/** Umbrellas over whoever stays out in the rain (island only). */
export function Umbrellas({ state, atlas, lighting }: UmbrellasProps): JSX.Element {
  const frame = useMemo(() => atlas.frame(UMBRELLA_KEY), [atlas]);
  const geometry = useMemo(() => createSpriteGeometry(frame), [frame]);
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const raining = state.weather.intensity >= ISLAND_CONFIG.rainyDay.shelterAt;
    state.villagers.forEach((villager, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      mesh.visible = carriesUmbrella(villager, raining);
      if (!mesh.visible) return;
      const t = state.interpolation;
      const x = Math.round(villager.previousX + (villager.x - villager.previousX) * t);
      const y = Math.round(villager.previousY + (villager.y - villager.previousY) * t);
      const side = villager.facing === 'left' ? -HAND.side : HAND.side;
      const gripY = y - HAND.up - (villager.sitting ? SEAT_LIFT_PX : 0);
      const left = x + side - UMBRELLA_GRIP.x;
      const top = gripY - UMBRELLA_GRIP.y;
      mesh.position.set(
        left + frame.width / 2,
        worldYFromMapPx(top) - frame.height / 2,
        standingSpriteZ(y) - BEHIND,
      );
    });
  });

  return (
    <group>
      {state.villagers.map((villager, i) => (
        <mesh
          key={villager.id}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={geometry}
          material={material}
          visible={false}
        />
      ))}
    </group>
  );
}
