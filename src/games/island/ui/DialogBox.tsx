import type { JSX } from 'react';
import { useIslandUiStore } from '../state';
import './islandUi.css';

/** The message box along the bottom (no reply choices); Space closes it. A small arrow says "more". */
export function DialogBox(): JSX.Element | null {
  const message = useIslandUiStore((state) => state.dialogMessage);
  if (message === null) return null;
  return (
    <div className="island-dialog" role="dialog" aria-live="polite">
      <p className="island-dialog-text">{message}</p>
      <span className="island-dialog-arrow" aria-hidden="true" />
    </div>
  );
}
