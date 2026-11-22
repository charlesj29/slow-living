import type { JSX } from 'react';
import { ISLAND_CONFIG } from '../core/config';
import { isTouchFirst } from '../device';
import { useIslandUiStore } from '../state';
import './islandUi.css';

interface Control {
  readonly keys: string;
  readonly action: string;
}

const KEYBOARD_CONTROLS: readonly Control[] = [
  { keys: 'WASD / ←↑↓→', action: 'Walk' },
  { keys: 'Shift', action: 'Run' },
  { keys: 'Space', action: 'Interact' },
  { keys: '+ / −', action: 'Zoom' },
  { keys: 'M', action: 'Music' },
  { keys: 'R', action: 'New Island' },
];

const TOUCH_CONTROLS: readonly Control[] = [
  { keys: 'Tap', action: 'Walk' },
  { keys: 'Tap people & things', action: 'Interact' },
];

/**
 * The controls as a small list (bottom right). It dims once the player starts
 * walking, but stays readable for later.
 */
export function ControlsHint(): JSX.Element {
  const hasStartedWalking = useIslandUiStore((state) => state.hasStartedWalking);
  // Out of the way while a message is open (it can overlap the message box on small screens).
  const isMessageOpen = useIslandUiStore((state) => state.dialogMessage !== null);
  const all = isTouchFirst() ? TOUCH_CONTROLS : KEYBOARD_CONTROLS;
  // No zoom line when zoom is switched off.
  const controls = ISLAND_CONFIG.render.zoomEnabled
    ? all
    : all.filter((control) => control.action !== 'zoom');
  return (
    <ul
      className={`island-hud-panel island-controls-hint${hasStartedWalking ? ' is-dimmed' : ''}${isMessageOpen ? ' is-hidden' : ''}`}
      aria-label="Controls"
    >
      {controls.map((control) => (
        <li key={control.action}>
          <kbd>{control.keys}</kbd>
          <span>{control.action}</span>
        </li>
      ))}
    </ul>
  );
}
