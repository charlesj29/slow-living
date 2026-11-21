import type { JSX } from 'react';
import { ISLAND_CONFIG } from '../core/config';
import { useIslandUiStore } from '../state';
import './islandUi.css';

/** A full-screen black veil for door transitions; CSS fades it in and out. */
export function ScreenFade(): JSX.Element {
  const isDark = useIslandUiStore((state) => state.isScreenDark);
  return (
    <div
      className={isDark ? 'island-fade is-dark' : 'island-fade'}
      style={{ transitionDuration: `${String(ISLAND_CONFIG.doors.fadeSeconds)}s` }}
      aria-hidden="true"
    />
  );
}
