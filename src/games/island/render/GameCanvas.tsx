import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, type JSX } from 'react';
import type { WebGLRenderer } from 'three';
import { createIslandAtlas } from '../assets/islandSprites';
import { WATER_FRAME_COUNT } from '../assets/paintTiles';
import { ISLAND_CONFIG } from '../core/config';
import { interpolatedPlayerPosition, type GameState } from '../core/game/gameState';
import { FollowCamera } from './FollowCamera';
import { GameLoop } from './GameLoop';
import { PlayerSprite } from './PlayerSprite';
import { Tilemap } from './Tilemap';
import { useKeyboardInput } from './useKeyboardInput';
import { WorldObjects } from './WorldObjects';
import { worldYFromMapPx } from './worldSpace';

const BACKGROUND_COLOR = '#1f4e79';

declare global {
  interface Window {
    /** Dev only: lets performance/cleanup checks read `renderer.info` from the console. */
    __islandRenderer?: WebGLRenderer;
  }
}

function exposeRendererInDev({ gl }: { gl: WebGLRenderer }): void {
  if (import.meta.env.DEV) window.__islandRenderer = gl;
}

/** The camera looks at the player's body rather than their feet. */
const CAMERA_LOOK_ABOVE_FEET_PX = 8;

interface GameCanvasProps {
  readonly game: GameState;
}

/**
 * Root Three.js canvas for the island. 1 world unit = 1 source pixel.
 * `flat` + `linear` turn off tone mapping and colour-space conversion, so
 * painted palette colours reach the screen unchanged; antialiasing is off
 * because it blurs pixel art.
 */
export function GameCanvas({ game }: GameCanvasProps): JSX.Element {
  const { world } = game;
  const { tileSizePx, chunkSizeTiles } = ISLAND_CONFIG.map;
  const atlas = useMemo(() => createIslandAtlas(), []);
  useEffect(() => () => atlas.dispose(), [atlas]);

  useKeyboardInput(game.input);

  const mapWidthPx = world.width * tileSizePx;
  const mapHeightPx = world.height * tileSizePx;
  const bounds = useMemo(
    () => ({ minX: 0, maxX: mapWidthPx, minY: worldYFromMapPx(mapHeightPx), maxY: 0 }),
    [mapWidthPx, mapHeightPx],
  );
  const followTarget = useCallback(() => {
    const { x, y } = interpolatedPlayerPosition(game);
    return { x, y: worldYFromMapPx(y - CAMERA_LOOK_ABOVE_FEET_PX) };
  }, [game]);

  return (
    <Canvas flat linear gl={{ antialias: false }} onCreated={exposeRendererInDev}>
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <GameLoop state={game} />
      <FollowCamera getTarget={followTarget} bounds={bounds} tileSizePx={tileSizePx} />
      <Tilemap
        world={world}
        atlas={atlas}
        tileSizePx={tileSizePx}
        chunkSizeTiles={chunkSizeTiles}
        waterFrameSeconds={ISLAND_CONFIG.render.waterFrameSeconds}
        waterFrameCount={WATER_FRAME_COUNT}
      />
      <WorldObjects
        world={world}
        atlas={atlas}
        tileSizePx={tileSizePx}
        flowerFrameSeconds={ISLAND_CONFIG.render.flowerFrameSeconds}
      />
      <PlayerSprite state={game} atlas={atlas} />
    </Canvas>
  );
}
