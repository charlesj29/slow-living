import type { JSX } from 'react';
import './islandUi.css';

/**
 * Shown only on touch-first devices (via a CSS media query), since walking
 * needs a keyboard for now. Touch controls are on the roadmap.
 */
export function KeyboardNotice(): JSX.Element {
  return <div className="island-hud-panel island-keyboard-notice">Best played with a keyboard</div>;
}
