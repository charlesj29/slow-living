import type { JSX, MouseEvent } from 'react';
import { ISLAND_CONFIG } from '../core/config';
import { isTouchFirst } from '../device';
import { useIslandUiStore } from '../state';
import './islandUi.css';

/** + / − on phones and tablets (no keyboard there); hidden when zoom is switched off (config). */
export function ZoomButtons(): JSX.Element | null {
  if (!isTouchFirst() || !ISLAND_CONFIG.render.zoomEnabled) return null;
  const zoom =
    (steps: number) =>
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.currentTarget.blur();
      useIslandUiStore.getState().zoomBy(steps);
    };
  return (
    <div className="island-zoom-buttons">
      <button type="button" className="island-hud-button" onClick={zoom(1)} aria-label="Zoom in">
        +
      </button>
      <button type="button" className="island-hud-button" onClick={zoom(-1)} aria-label="Zoom out">
        −
      </button>
    </div>
  );
}
