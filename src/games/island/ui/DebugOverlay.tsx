import { useEffect, useState, type JSX } from 'react';
import { ISLAND_CONFIG } from '../core/config';
import { playerTile, type GameState } from '../core/game/gameState';
import { clockLabel } from '../core/systems/dayNight';
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
  readonly clock: string;
}

function readStats(game: GameState): Readout {
  const tile = playerTile(game, ISLAND_CONFIG.map.tileSizePx);
  return {
    fps: Math.round(game.framesPerSecond),
    tileX: tile.x,
    tileY: tile.y,
    clock: clockLabel(game.timeOfDay),
  };
}

/**
 * F3 toggles a small readout (top-right) of FPS, the player's tile and the time of day. While visible it
 * samples the game state a few times per second (never every frame), so React
 * stays out of the render loop.
 */
export function DebugOverlay({ game }: DebugOverlayProps): JSX.Element | null {
  const isVisible = useIslandUiStore((state) => state.isDebugOverlayVisible);
  const [readout, setReadout] = useState<Readout>(() => readStats(game));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code !== TOGGLE_KEY) return;
      event.preventDefault(); // F3 would otherwise open the browser's find bar
      useIslandUiStore.getState().toggleDebugOverlay();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timer = window.setInterval(() => {
      setReadout(readStats(game));
    }, ISLAND_CONFIG.debug.overlayRefreshMs);
    return () => window.clearInterval(timer);
  }, [isVisible, game]);

  if (!isVisible) return null;
  return (
    <div className="island-hud-panel island-debug-overlay" role="status">
      <div>FPS {readout.fps}</div>
      <div>
        Tile {readout.tileX}, {readout.tileY}
      </div>
      <div>Time {readout.clock}</div>
    </div>
  );
}
