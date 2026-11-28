import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { BufferGeometry, Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { UMBRELLA_GRIP, UMBRELLA_KEYS } from '../assets/paintUmbrella';
import { ISLAND_CONFIG } from '../core/config';
import { playerFootY } from '../core/entities/player';
import type { Villager } from '../core/entities/villager';
import type { GameState } from '../core/game/gameState';
import { carriesUmbrella } from '../core/systems/rainyDay';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** Where the hand is, from the feet (map pixels): beside the body at the waist, or in the lap. */
const HAND = { side: 4, up: 6, sittingSide: 3, sittingUp: 11 } as const;
/** The canopy is drawn just behind the villager (over the head), the handle just in front. */
const LAYER = 0.002;

interface UmbrellasProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/** Puts both layers' grip on the hand (mirrored for the left hand). */
function hold(
  mesh: Mesh,
  villager: Villager,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
): void {
  const sitting = villager.sitting !== null;
  const left = villager.facing === 'left';
  const handX = x + (left ? -1 : 1) * (sitting ? HAND.sittingSide : HAND.side);
  const handY = y - (sitting ? HAND.sittingUp : HAND.up);
  mesh.scale.x = left ? -1 : 1;
  mesh.position.set(
    handX - UMBRELLA_GRIP.x + w / 2,
    worldYFromMapPx(handY - UMBRELLA_GRIP.y) - h / 2,
    z,
  );
}

/**
 * Umbrellas over whoever stays out in the rain (island only): the canopy over
 * the head, the handle in the hand; leaning back over the shoulder when sitting.
 */
export function Umbrellas({ state, atlas, lighting }: UmbrellasProps): JSX.Element {
  const size = useMemo(() => atlas.frame(UMBRELLA_KEYS.canopy), [atlas]);
  const geometries = useMemo(
    () =>
      new Map<string, BufferGeometry>(
        Object.values(UMBRELLA_KEYS).map((key) => [key, createSpriteGeometry(atlas.frame(key))]),
      ),
    [atlas],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => material.dispose(), [material]);
  // Two meshes per villager: the canopy, then the handle.
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const raining = state.weather.intensity >= ISLAND_CONFIG.rainyDay.shelterAt;
    state.villagers.forEach((villager, i) => {
      const canopy = meshes.current[i * 2];
      const handle = meshes.current[i * 2 + 1];
      if (!canopy || !handle) return;
      const shown = carriesUmbrella(villager, raining);
      canopy.visible = shown;
      handle.visible = shown;
      if (!shown) return;
      const sitting = villager.sitting !== null;
      const canopyGeometry = geometries.get(
        sitting ? UMBRELLA_KEYS.canopyLeaning : UMBRELLA_KEYS.canopy,
      );
      const handleGeometry = geometries.get(
        sitting ? UMBRELLA_KEYS.handleLeaning : UMBRELLA_KEYS.handle,
      );
      if (canopyGeometry && canopy.geometry !== canopyGeometry) canopy.geometry = canopyGeometry;
      if (handleGeometry && handle.geometry !== handleGeometry) handle.geometry = handleGeometry;
      const t = state.interpolation;
      const x = Math.round(villager.previousX + (villager.x - villager.previousX) * t);
      const y = Math.round(villager.previousY + (villager.y - villager.previousY) * t);
      // The same depth as the villager (their feet), so the layers sit just behind and in front.
      const z = standingSpriteZ(Math.round(playerFootY(y, ISLAND_CONFIG.player)));
      // Seen from behind, the handle is hidden behind the body too.
      const away = villager.facing === 'up';
      hold(canopy, villager, x, y, z - LAYER, size.width, size.height);
      hold(handle, villager, x, y, away ? z - LAYER : z + LAYER, size.width, size.height);
    });
  });

  return (
    <group>
      {state.villagers.flatMap((villager, i) =>
        [0, 1].map((layer) => (
          <mesh
            key={`${String(villager.id)}:${String(layer)}`}
            ref={(mesh) => {
              meshes.current[i * 2 + layer] = mesh;
            }}
            geometry={geometries.get(layer === 0 ? UMBRELLA_KEYS.canopy : UMBRELLA_KEYS.handle)}
            material={material}
            visible={false}
          />
        )),
      )}
    </group>
  );
}
