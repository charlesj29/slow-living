import { useEffect, useState, type JSX } from 'react';
import { ISLAND_CONFIG } from '../core/config';
import { playerTile, type GameState } from '../core/game/gameState';
import { useIslandUiStore } from '../state';
import './islandUi.css';

const TOGGLE_KEY = 'F3';

interface DebugOverlayProps {
  readonly game: GameState;
}

interface Readout {
  readonly fps: number;
  readonly tileX: number;
  readonly tileY: number;
}

function readStats(game: GameState): Readout {
  const tile = playerTile(game, ISLAND_CONFIG.map.tileSizePx);
  return { fps: Math.round(game.framesPerSecond), tileX: tile.x, tileY: tile.y };
}

/**
 * A small readout under the clock (top right): the FPS, and with
 * `debug.fpsOnly` off also the player's tile and the camera (zoom level, zoom
 * step, tiles on screen). Always there with `debug.alwaysShowFps`; otherwise
 * F3 toggles it, on the dev server only. While visible it samples the game state a few times
 * per second (never every frame), so React stays out of the render loop.
 */
export function DebugOverlay({ game }: DebugOverlayProps): JSX.Element | null {
  const isVisible = useIslandUiStore((state) => state.isDebugOverlayVisible);
  const camera = useIslandUiStore((state) => state.camera);
  const [readout, setReadout] = useState<Readout>(() => readStats(game));

  const isShown = ISLAND_CONFIG.debug.alwaysShowFps || (import.meta.env.DEV && isVisible);

  useEffect(() => {
    if (!import.meta.env.DEV) return; // F3 is a dev-server tool
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code !== TOGGLE_KEY) return;
      event.preventDefault(); // F3 would otherwise open the browser's find bar
      useIslandUiStore.getState().toggleDebugOverlay();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isShown) return;
    const timer = window.setInterval(() => {
      setReadout(readStats(game));
    }, ISLAND_CONFIG.debug.overlayRefreshMs);
    return () => window.clearInterval(timer);
  }, [isShown, game]);

  if (!isShown) return null;
  return (
    <div className="island-hud-panel island-debug-overlay" role="status">
      <div>FPS {readout.fps}</div>
      {!ISLAND_CONFIG.debug.fpsOnly && (
        <>
          <div>
            Tile {readout.tileX}, {readout.tileY}
          </div>
          {camera && (
            <>
              <div>
                Zoom ×{camera.pixelScale} (step {camera.zoomOffset > 0 ? '+' : ''}
                {camera.zoomOffset})
              </div>
              <div>
                View {camera.tilesAcross} × {camera.tilesTall} tiles
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
