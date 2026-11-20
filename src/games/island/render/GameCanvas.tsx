import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, type JSX } from 'react';
import { createIslandAtlas } from '../assets/islandSprites';
import { WATER_FRAME_COUNT } from '../assets/paintTiles';
import { ISLAND_CONFIG } from '../core/config';
import type { World } from '../core/world/world';
import { FreeLookCamera } from './FreeLookCamera';
import { Tilemap } from './Tilemap';
import { WorldObjects } from './WorldObjects';
import { worldYFromMapPx } from './worldSpace';

const BACKGROUND_COLOR = '#1f4e79';

interface GameCanvasProps {
  readonly world: World;
}

/**
 * Root Three.js canvas for the island. 1 world unit = 1 source pixel.
 * `flat` + `linear` turn off tone mapping and colour-space conversion, so
 * painted palette colours reach the screen unchanged; antialiasing is off
 * because it blurs pixel art.
 */
export function GameCanvas({ world }: GameCanvasProps): JSX.Element {
  const { tileSizePx, chunkSizeTiles } = ISLAND_CONFIG.map;
  const atlas = useMemo(() => createIslandAtlas(), []);
  useEffect(() => () => atlas.dispose(), [atlas]);

  const mapWidthPx = world.width * tileSizePx;
  const mapHeightPx = world.height * tileSizePx;
  const bounds = useMemo(
    () => ({ minX: 0, maxX: mapWidthPx, minY: worldYFromMapPx(mapHeightPx), maxY: 0 }),
    [mapWidthPx, mapHeightPx],
  );
  const start = useMemo(
    () => ({
      x: (world.spawn.x + 0.5) * tileSizePx,
      y: worldYFromMapPx((world.spawn.y + 0.5) * tileSizePx),
    }),
    [world, tileSizePx],
  );

  return (
    <Canvas flat linear gl={{ antialias: false }}>
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <FreeLookCamera start={start} bounds={bounds} tileSizePx={tileSizePx} />
      <Tilemap
        world={world}
        atlas={atlas}
        tileSizePx={tileSizePx}
        chunkSizeTiles={chunkSizeTiles}
        waterFrameSeconds={ISLAND_CONFIG.render.waterFrameSeconds}
        waterFrameCount={WATER_FRAME_COUNT}
      />
      <WorldObjects world={world} atlas={atlas} tileSizePx={tileSizePx} />
    </Canvas>
  );
}
