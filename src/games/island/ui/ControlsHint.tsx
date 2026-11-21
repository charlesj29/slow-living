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
  { keys: 'WASD / ←↑↓→', action: 'walk' },
  { keys: 'Shift', action: 'run' },
  { keys: 'Space', action: 'interact' },
  { keys: '+ / −', action: 'zoom' },
  { keys: 'M', action: 'music' },
  { keys: 'R', action: 'new island' },
];

const TOUCH_CONTROLS: readonly Control[] = [
  { keys: 'Tap', action: 'walk' },
  { keys: 'Tap people & things', action: 'interact' },
];

/**
 * The controls as a small list (bottom right). It dims once the player starts
 * walking, but stays readable for later.
 */
export function ControlsHint(): JSX.Element {
  const hasStartedWalking = useIslandUiStore((state) => state.hasStartedWalking);
  const all = isTouchFirst() ? TOUCH_CONTROLS : KEYBOARD_CONTROLS;
  // No zoom line when zoom is switched off.
  const controls = ISLAND_CONFIG.render.zoomEnabled
    ? all
    : all.filter((control) => control.action !== 'zoom');
  return (
    <ul
      className={`island-hud-panel island-controls-hint${hasStartedWalking ? ' is-dimmed' : ''}`}
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
