import { Canvas } from '@react-three/fiber';
import type { JSX } from 'react';
import { ISLAND_CONFIG } from '../core/config';
import { getTileDefinition, TileId } from '../core/world/tiles';
import type { World } from '../core/world/world';
import { FitMapCamera } from './FitMapCamera';
import { WorldColorMap } from './WorldColorMap';

// The canvas background matches deep sea so the map blends into the margin.
const BACKGROUND_COLOR = getTileDefinition(TileId.DeepSea).mapColor;

interface GameCanvasProps {
  readonly world: World;
}

/**
 * Root Three.js canvas for the island. 1 world unit = 1 source pixel, so a
 * tile is `tileSizePx` units wide. Antialiasing is off because it blurs pixel art.
 */
export function GameCanvas({ world }: GameCanvasProps): JSX.Element {
  const { tileSizePx } = ISLAND_CONFIG.map;
  return (
    <Canvas flat gl={{ antialias: false }}>
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <FitMapCamera mapWidthPx={world.width * tileSizePx} mapHeightPx={world.height * tileSizePx} />
      <WorldColorMap world={world} tileSizePx={tileSizePx} />
    </Canvas>
  );
}
