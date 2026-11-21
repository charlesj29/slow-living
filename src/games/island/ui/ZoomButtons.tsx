import type { JSX, MouseEvent } from 'react';
import { isTouchFirst } from '../device';
import { useIslandUiStore } from '../state';
import './islandUi.css';

/** + / − on phones and tablets (no keyboard there); the camera clamps the zoom. */
export function ZoomButtons(): JSX.Element | null {
  if (!isTouchFirst()) return null;
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
