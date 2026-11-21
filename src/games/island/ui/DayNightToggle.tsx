import { useEffect, type JSX, type MouseEvent } from 'react';
import { DAY_NIGHT_MODES, type DayNightMode } from '../core/systems/dayNight';
import { useIslandUiStore } from '../state';
import './islandUi.css';

const STORAGE_KEY = 'island.dayNightMode';

const LABELS: Readonly<Record<DayNightMode, string>> = {
  auto: 'Day and night: automatic',
  day: 'Day and night: always day',
  night: 'Day and night: always night',
};

function readStoredMode(): DayNightMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return DAY_NIGHT_MODES.find((mode) => mode === stored) ?? 'auto';
  } catch {
    return 'auto'; // storage blocked: start on the automatic cycle
  }
}

function storeMode(mode: DayNightMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Not remembering the choice is fine.
  }
}

/** 16×16 pixel shapes, as SVG paths of 1-px rectangles. */
const ICONS: Readonly<Record<DayNightMode, readonly string[]>> = {
  // Sun: a square core with eight rays.
  day: [
    'M7 1h2v2H7zM7 13h2v2H7zM1 7h2v2H1zM13 7h2v2h-2zM3 3h2v2H3zM11 11h2v2h-2zM11 3h2v2h-2zM3 11h2v2H3zM5 5h6v6H5z',
  ],
  // Moon: a crescent opening to the right.
  night: ['M6 2h4v1H6zM4 3h4v1H4zM3 4h3v1H3zM2 5h3v6H2zM3 11h3v1H3zM4 12h4v1H4zM6 13h4v1H6z'],
  // Auto: half day (filled), half night (outline).
  auto: [
    'M6 3h2v1H6zM4 4h4v1H4zM3 5h5v6H3zM4 11h4v1H4zM6 12h2v1H6z',
    'M8 3h2v1H8zM10 4h2v1h-2zM12 5h1v6h-1zM10 11h2v1h-2zM8 12h2v1H8z',
  ],
};

function ModeIcon({ mode }: { readonly mode: DayNightMode }): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges" fill="currentColor">
      {ICONS[mode].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/**
 * Top-left button above the music toggle: Auto (time passes) → Always day →
 * Always night. The choice is remembered for the next visit.
 */
export function DayNightToggle(): JSX.Element {
  const mode = useIslandUiStore((state) => state.dayNightMode);

  useEffect(() => {
    useIslandUiStore.getState().setDayNightMode(readStoredMode());
  }, []);
  useEffect(() => {
    storeMode(mode);
  }, [mode]);

  const cycle = (event: MouseEvent<HTMLButtonElement>): void => {
    event.currentTarget.blur(); // or Space (interact) would press it again
    useIslandUiStore.getState().cycleDayNightMode();
  };

  return (
    <button
      type="button"
      className="island-hud-button island-day-night-toggle"
      onClick={cycle}
      aria-label={`${LABELS[mode]} (click to change)`}
      title={LABELS[mode]}
    >
      <ModeIcon mode={mode} />
    </button>
  );
}
