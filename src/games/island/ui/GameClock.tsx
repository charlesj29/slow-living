import { useEffect, useState, type JSX } from 'react';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { clockLabel, dayPhase, shownTime, type DayPhase } from '../core/systems/dayNight';
import { useIslandUiStore } from '../state';
import './islandUi.css';

/** Above this the clock shows the rain cloud instead of the sun or moon. */
const RAINY = 0.3;

type ClockIcon = DayPhase | 'rain';

const PHASE_NAMES: Readonly<Record<DayPhase, string>> = {
  dawn: 'Dawn',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

interface ClockFace {
  readonly time: string;
  readonly phase: DayPhase;
  readonly icon: ClockIcon;
}

function readClock(game: GameState): ClockFace {
  const time = shownTime(useIslandUiStore.getState().dayNightMode, game.timeOfDay);
  const phase = dayPhase(time);
  return {
    time: clockLabel(time),
    phase,
    icon: game.weather.intensity > RAINY ? 'rain' : phase,
  };
}

/** 16×16 pixel-art icons, one rect per run of pixels: [x, y, width, height, colour]. */
type Pixels = readonly (readonly [number, number, number, number, string])[];

const SUN = '#f6c445';
const SUN_LIGHT = '#fde58a';
const RAY = '#f29a2e';
const MOON = '#f3e6b4';
const MOON_SHADE = '#d4c48a';
const HORIZON = '#b86b3c';
const CLOUD = '#e8edf2';
const CLOUD_SHADE = '#a9b4c2';
const DROP = '#5aa2e0';

// prettier-ignore
const ICONS: Readonly<Record<ClockIcon, Pixels>> = {
  morning: [
    [7, 0, 2, 2, RAY], [7, 14, 2, 2, RAY], [0, 7, 2, 2, RAY], [14, 7, 2, 2, RAY],
    [2, 2, 2, 2, RAY], [12, 2, 2, 2, RAY], [2, 12, 2, 2, RAY], [12, 12, 2, 2, RAY],
    [6, 4, 4, 1, SUN], [5, 5, 6, 1, SUN], [4, 6, 8, 4, SUN], [5, 10, 6, 1, SUN], [6, 11, 4, 1, SUN],
    [6, 5, 2, 2, SUN_LIGHT],
  ],
  afternoon: [
    [7, 0, 2, 2, RAY], [7, 14, 2, 2, RAY], [0, 7, 2, 2, RAY], [14, 7, 2, 2, RAY],
    [2, 2, 2, 2, RAY], [12, 2, 2, 2, RAY], [2, 12, 2, 2, RAY], [12, 12, 2, 2, RAY],
    [6, 4, 4, 1, SUN], [5, 5, 6, 1, SUN], [4, 6, 8, 4, SUN], [5, 10, 6, 1, SUN], [6, 11, 4, 1, SUN],
    [6, 5, 2, 2, SUN_LIGHT],
  ],
  dawn: [
    [7, 2, 2, 2, RAY], [2, 5, 2, 2, RAY], [12, 5, 2, 2, RAY],
    [6, 6, 4, 1, SUN], [5, 7, 6, 1, SUN], [4, 8, 8, 3, SUN], [6, 7, 2, 2, SUN_LIGHT],
    [0, 11, 16, 2, HORIZON], [3, 13, 10, 1, HORIZON],
  ],
  evening: [
    [7, 3, 2, 2, RAY], [2, 6, 2, 2, RAY], [12, 6, 2, 2, RAY],
    [6, 7, 4, 1, RAY], [5, 8, 6, 1, RAY], [4, 9, 8, 2, RAY], [6, 8, 2, 2, SUN],
    [0, 11, 16, 2, HORIZON], [3, 13, 10, 1, HORIZON],
  ],
  night: [
    [6, 2, 4, 1, MOON], [4, 3, 4, 1, MOON], [3, 4, 4, 2, MOON], [2, 6, 4, 4, MOON],
    [3, 10, 4, 2, MOON], [4, 12, 5, 1, MOON], [6, 13, 5, 1, MOON], [9, 12, 3, 1, MOON],
    [3, 7, 1, 3, MOON_SHADE], [12, 3, 1, 1, MOON], [14, 7, 1, 1, MOON], [11, 9, 1, 1, MOON],
  ],
  rain: [
    [5, 2, 4, 1, CLOUD], [3, 3, 8, 1, CLOUD], [2, 4, 12, 2, CLOUD], [1, 6, 14, 2, CLOUD],
    [2, 8, 12, 1, CLOUD_SHADE], [10, 3, 3, 1, CLOUD],
    [4, 10, 1, 2, DROP], [8, 11, 1, 2, DROP], [12, 10, 1, 2, DROP], [6, 13, 1, 2, DROP], [10, 14, 1, 2, DROP],
  ],
};

function ClockIconImage({ icon }: { readonly icon: ClockIcon }): JSX.Element {
  return (
    <svg
      className="island-clock-icon"
      viewBox="0 0 16 16"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {ICONS[icon].map(([x, y, width, height, fill], i) => (
        <rect key={i} x={x} y={y} width={width} height={height} fill={fill} />
      ))}
    </svg>
  );
}

/**
 * The island clock, top right: a little parchment plaque (like the message
 * box) with a pixel sun, moon or rain cloud, the time and the part of the day.
 * It shows the held noon or midnight when the day/night button holds one, and
 * samples the game a few times a second (never per frame).
 */
export function GameClock({ game }: { readonly game: GameState }): JSX.Element {
  const [face, setFace] = useState<ClockFace>(() => readClock(game));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFace(readClock(game));
    }, ISLAND_CONFIG.debug.overlayRefreshMs);
    return () => window.clearInterval(timer);
  }, [game]);

  return (
    <div
      className={`island-clock${face.phase === 'night' ? ' is-night' : ''}`}
      role="timer"
      aria-label={`${PHASE_NAMES[face.phase]}, ${face.time}`}
    >
      <ClockIconImage icon={face.icon} />
      <div className="island-clock-text">
        <span className="island-clock-time">{face.time}</span>
        <span className="island-clock-phase">{PHASE_NAMES[face.phase]}</span>
      </div>
    </div>
  );
}
