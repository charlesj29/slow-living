import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, type JSX } from 'react';
import type { WebGLRenderer } from 'three';
import { createIslandAtlas } from '../assets/islandSprites';
import { WATER_FRAME_COUNT } from '../assets/paintTiles';
import { ISLAND_CONFIG } from '../core/config';
import { interpolatedPlayerPosition, type GameState } from '../core/game/gameState';
import { ISLAND_MAP } from '../core/game/mapTravel';
import { useIslandUiStore } from '../state';
import { FollowCamera } from './FollowCamera';
import { DayNightLighting } from './DayNightLighting';
import { GameLoop } from './GameLoop';
import { InteractPrompt } from './InteractPrompt';
import { createLightingUniforms } from './lighting';
import { PlayerSprite } from './PlayerSprite';
import { Tilemap } from './Tilemap';
import { VillagerSprites } from './VillagerSprites';
import { useKeyboardInput } from './useKeyboardInput';
import { WorldObjects } from './WorldObjects';
import { worldYFromMapPx } from './worldSpace';

const BACKGROUND_COLOR = '#1f4e79';
/** Round a small room: dark, like the space beyond the walls. */
const INDOOR_BACKGROUND = '#140e0a';

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
  // Re-render (and rebuild the scene) when the player goes through a door.
  const mapId = useIslandUiStore((state) => state.mapId);
  const world = game.maps.get(mapId) ?? game.world;
  const background = world.indoor ? INDOOR_BACKGROUND : BACKGROUND_COLOR;
  const { tileSizePx, chunkSizeTiles } = ISLAND_CONFIG.map;
  const atlas = useMemo(() => createIslandAtlas(), []);
  useEffect(() => () => atlas.dispose(), [atlas]);
  // One set of lighting uniforms shared by every world material.
  const lighting = useMemo(() => createLightingUniforms(), []);

  useKeyboardInput(game.input);

  const mapWidthPx = world.width * tileSizePx;
  const mapHeightPx = world.height * tileSizePx;
  const bounds = useMemo(
    () => ({ minX: 0, maxX: mapWidthPx, minY: worldYFromMapPx(mapHeightPx), maxY: 0 }),
    [mapWidthPx, mapHeightPx],
  );
  const roomArea = useMemo(
    () => ({ widthPx: mapWidthPx, heightPx: mapHeightPx }),
    [mapWidthPx, mapHeightPx],
  );
  const followTarget = useCallback(() => {
    const { x, y } = interpolatedPlayerPosition(game);
    return { x, y: worldYFromMapPx(y - CAMERA_LOOK_ABOVE_FEET_PX) };
  }, [game]);

  return (
    <Canvas flat linear gl={{ antialias: false }} onCreated={exposeRendererInDev}>
      <color attach="background" args={[background]} />
      <GameLoop state={game} />
      <DayNightLighting
        key={`light:${mapId}`}
        state={game}
        lighting={lighting}
        background={background}
      />
      <FollowCamera
        getTarget={followTarget}
        bounds={bounds}
        tileSizePx={tileSizePx}
        fitArea={world.indoor ? roomArea : undefined}
      />
      <Tilemap
        key={`tiles:${mapId}`}
        world={world}
        atlas={atlas}
        tileSizePx={tileSizePx}
        chunkSizeTiles={chunkSizeTiles}
        waterFrameSeconds={ISLAND_CONFIG.render.waterFrameSeconds}
        waterFrameCount={WATER_FRAME_COUNT}
        lighting={lighting}
      />
      <WorldObjects
        key={`objects:${mapId}`}
        world={world}
        atlas={atlas}
        tileSizePx={tileSizePx}
        flowerFrameSeconds={ISLAND_CONFIG.render.flowerFrameSeconds}
        lighting={lighting}
      />
      <PlayerSprite state={game} atlas={atlas} lighting={lighting} />
      {mapId === ISLAND_MAP && <VillagerSprites state={game} atlas={atlas} lighting={lighting} />}
      <InteractPrompt state={game} atlas={atlas} />
    </Canvas>
  );
}
