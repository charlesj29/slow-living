import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import { Object3D, type InstancedMesh, type Mesh } from 'three';
import { createRng, hashCoords } from '@/shared/engine/random';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { RAIN_DROP_KEY, RAIN_RING_KEYS } from '../assets/paintWeather';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { isLakeTile } from '../core/world/tiles';
import type { World } from '../core/world/world';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { GROUND_DECAL_Z, RAIN_Z, worldYFromMapPx } from './worldSpace';

/** Streaks fall a little faster or slower than each other, so the rain never looks like a grid. */
const SPEED_SPREAD = { min: 0.8, max: 1.2 } as const;
/** Rain covers a bit more than the screen, so streaks never pop in at the edges. */
const VIEW_MARGIN_PX = 24;
/** One ring on the lake: a splash, then two widening rings. */
const RING_SECONDS = 0.75;
const RAIN_SEED = 0x7a1;
/** `dropDensity` is per this many square map pixels. */
const DENSITY_AREA_PX = 1000;

interface Drop {
  readonly fx: number;
  readonly fy: number;
  readonly speed: number;
}

interface RainProps {
  readonly world: World;
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/**
 * A gentle shower: slanting streaks falling over the screen and rings
 * spreading on the lake, more of both the harder it rains (the weather's
 * intensity), none when it's dry. Purely drawn: it doesn't touch the game.
 */
export function Rain({ world, state, atlas, lighting }: RainProps): JSX.Element {
  const settings = ISLAND_CONFIG.weather;
  const camera = useThree((three) => three.camera);
  const size = useThree((three) => three.size);
  const drops = useMemo((): Drop[] => {
    const rng = createRng(RAIN_SEED);
    return Array.from({ length: settings.maxDrops }, () => ({
      fx: rng.next(),
      fy: rng.next(),
      speed: rng.range(SPEED_SPREAD.min, SPEED_SPREAD.max),
    }));
  }, [settings.maxDrops]);
  const lakeTiles = useMemo(() => {
    const tiles: number[] = [];
    world.terrain.forEach((tile, index) => {
      if (isLakeTile(tile)) tiles.push(index);
    });
    return tiles;
  }, [world]);
  const dropGeometry = useMemo(() => createSpriteGeometry(atlas.frame(RAIN_DROP_KEY)), [atlas]);
  const ringGeometries = useMemo(
    () => RAIN_RING_KEYS.map((key) => createSpriteGeometry(atlas.frame(key))),
    [atlas],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => dropGeometry.dispose(), [dropGeometry]);
  useEffect(() => () => ringGeometries.forEach((g) => g.dispose()), [ringGeometries]);
  useEffect(() => () => material.dispose(), [material]);
  const dropsRef = useRef<InstancedMesh>(null);
  const placer = useMemo(() => new Object3D(), []);
  const ringMeshes = useRef<(Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const intensity = state.weather.intensity;
    // The visible part of the map (map pixels), plus a margin.
    const width = size.width / camera.zoom + 2 * VIEW_MARGIN_PX;
    const height = size.height / camera.zoom + 2 * VIEW_MARGIN_PX;
    const left = camera.position.x - width / 2;
    const top = -camera.position.y - height / 2;
    // As dense on a big screen as on a phone: the count follows the area in view.
    const full = Math.min(drops.length, (width * height * settings.dropDensity) / DENSITY_AREA_PX);
    const shown = Math.round(full * intensity);
    const batch = dropsRef.current;
    if (batch) {
      batch.count = shown;
      for (let i = 0; i < shown; i++) {
        const drop = drops[i];
        if (!drop) break;
        // Falling and blown left, wrapping round the view.
        const x = (((drop.fx * width - t * settings.windPx * drop.speed) % width) + width) % width;
        const y = (drop.fy * height + t * settings.fallSpeedPx * drop.speed) % height;
        placer.position.set(Math.round(left + x), worldYFromMapPx(Math.round(top + y)), RAIN_Z);
        placer.updateMatrix();
        batch.setMatrixAt(i, placer.matrix);
      }
      batch.instanceMatrix.needsUpdate = true;
    }

    const tile = ISLAND_CONFIG.map.tileSizePx;
    const rings = lakeTiles.length > 0 ? Math.round(settings.lakeRings * intensity) : 0;
    ringMeshes.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.visible = i < rings;
      if (!mesh.visible) return;
      // Each ring lands somewhere new on the lake every cycle, staggered from the others.
      const cycleTime = t / RING_SECONDS + i / settings.lakeRings;
      const cycle = Math.floor(cycleTime);
      const hash = hashCoords(i, cycle, RAIN_SEED);
      const at = lakeTiles[hash % lakeTiles.length] ?? 0;
      const frame = Math.min(ringGeometries.length - 1, Math.floor((cycleTime - cycle) * 3));
      const geometry = ringGeometries[frame];
      if (geometry && mesh.geometry !== geometry) mesh.geometry = geometry;
      const x = (at % world.width) * tile + 4 + (hash % 9);
      const y = Math.floor(at / world.width) * tile + 4 + ((hash >>> 8) % 9);
      mesh.position.set(x, worldYFromMapPx(y), GROUND_DECAL_Z);
    });
  });

  return (
    <group>
      <instancedMesh
        ref={dropsRef}
        args={[dropGeometry, material, drops.length]}
        count={0}
        // The streaks always fill the view, wherever the camera is.
        frustumCulled={false}
      />
      {Array.from({ length: settings.lakeRings }, (_, i) => (
        <mesh
          key={`ring${String(i)}`}
          ref={(mesh) => {
            ringMeshes.current[i] = mesh;
          }}
          geometry={ringGeometries[0]}
          material={material}
          visible={false}
        />
      ))}
    </group>
  );
}
