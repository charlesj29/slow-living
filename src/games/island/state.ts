import { create } from 'zustand';
import { DAY_NIGHT_MODES, type DayNightMode } from './core/systems/dayNight';
import type { PanelOpen } from './core/systems/interaction';

/**
 * Quiet moments: resting on a bench (the buttons fade, the music softens) or
 * the ambient tour (the buttons hide).
 */
export type CalmMode = 'resting' | 'touring' | null;

/** The camera's zoom, as the F3 readout shows it. */
export interface CameraInfo {
  /** Screen pixels per art pixel (the 2D "distance": higher = closer). */
  readonly pixelScale: number;
  /** Zoom steps away from the automatic scale (+ / −). */
  readonly zoomOffset: number;
  /** How much of the map fits on screen, in tiles. */
  readonly tilesAcross: number;
  readonly tilesTall: number;
}

/**
 * UI-facing state only (things the HUD/overlays show or control). The world and
 * entities live in plain mutable objects owned by the game loop, never here,
 * so React does not re-render every frame.
 */
export interface IslandUiState {
  /** F3 overlay with FPS and the player's tile. */
  readonly isDebugOverlayVisible: boolean;
  /** Set once the player first walks; the controls hint fades out after that. */
  readonly hasStartedWalking: boolean;
  /** Background music muted (the toggle button and M; remembered by the UI across visits). */
  readonly isMusicMuted: boolean;
  /** The open interaction message (mirrored from the game state by the loop), or null. */
  readonly dialogMessage: string | null;
  /** The open portfolio panel and its page (opened by the game, paged and closed by the UI). */
  readonly panel: PanelOpen | null;
  /** Which map is shown (mirrored from the game state); the canvas rebuilds when it changes. */
  readonly mapId: string;
  /** Darkened for a door transition (the overlay fades by CSS). */
  readonly isScreenDark: boolean;
  /** Set the first time the player enters the studio (remembered); its marker then goes away. */
  readonly hasVisitedStudio: boolean;
  /** Zoom steps away from the automatic scale (+ closer); null until the camera sets its default. */
  readonly zoomOffset: number | null;
  /** What the camera shows (for the F3 readout); set by the camera when it changes. */
  readonly camera: CameraInfo | null;
  /** The Résumé page is open over the game. */
  readonly isResumeOpen: boolean;
  /** Day/night: follow the clock, or hold day or night (the top-left button). */
  readonly dayNightMode: DayNightMode;
  /** Resting or touring (mirrored from the game state by the loop). */
  readonly calmMode: CalmMode;
  toggleDebugOverlay: () => void;
  markStartedWalking: () => void;
  setMusicMuted: (muted: boolean) => void;
  toggleMusicMuted: () => void;
  setDialogMessage: (message: string | null) => void;
  openPanel: (panel: PanelOpen) => void;
  setPanelPage: (page: number) => void;
  closePanel: () => void;
  setMap: (mapId: string) => void;
  setScreenDark: (dark: boolean) => void;
  setVisitedStudio: (visited: boolean) => void;
  setZoomOffset: (offset: number) => void;
  /** One or more zoom steps (+ closer); ignored until the camera has set a default. */
  zoomBy: (steps: number) => void;
  setResumeOpen: (open: boolean) => void;
  setCamera: (camera: CameraInfo) => void;
  setDayNightMode: (mode: DayNightMode) => void;
  /** Auto → Always day → Always night → Auto. */
  cycleDayNightMode: () => void;
  setCalmMode: (mode: CalmMode) => void;
}

export const useIslandUiStore = create<IslandUiState>()((set) => ({
  isDebugOverlayVisible: false,
  hasStartedWalking: false,
  isMusicMuted: false,
  dialogMessage: null,
  panel: null,
  mapId: 'island',
  isScreenDark: false,
  hasVisitedStudio: false,
  zoomOffset: null,
  isResumeOpen: false,
  camera: null,
  dayNightMode: 'auto',
  calmMode: null,
  toggleDebugOverlay: () => {
    set((state) => ({ isDebugOverlayVisible: !state.isDebugOverlayVisible }));
  },
  markStartedWalking: () => {
    set({ hasStartedWalking: true });
  },
  setMusicMuted: (muted) => {
    set({ isMusicMuted: muted });
  },
  toggleMusicMuted: () => {
    set((state) => ({ isMusicMuted: !state.isMusicMuted }));
  },
  setDialogMessage: (message) => {
    set({ dialogMessage: message });
  },
  openPanel: (panel) => {
    set({ panel });
  },
  setPanelPage: (page) => {
    set((state) => (state.panel ? { panel: { ...state.panel, page } } : {}));
  },
  closePanel: () => {
    set({ panel: null });
  },
  setMap: (mapId) => {
    set({ mapId });
  },
  setScreenDark: (dark) => {
    set({ isScreenDark: dark });
  },
  setVisitedStudio: (visited) => {
    set({ hasVisitedStudio: visited });
  },
  setZoomOffset: (offset) => {
    set({ zoomOffset: offset });
  },
  zoomBy: (steps) => {
    set((state) => (state.zoomOffset === null ? {} : { zoomOffset: state.zoomOffset + steps }));
  },
  setCamera: (camera) => {
    set({ camera });
  },
  setResumeOpen: (open) => {
    set({ isResumeOpen: open });
  },
  setDayNightMode: (mode) => {
    set({ dayNightMode: mode });
  },
  setCalmMode: (mode) => {
    set({ calmMode: mode });
  },
  cycleDayNightMode: () => {
    set((state) => {
      const index = DAY_NIGHT_MODES.indexOf(state.dayNightMode);
      return { dayNightMode: DAY_NIGHT_MODES[(index + 1) % DAY_NIGHT_MODES.length] ?? 'auto' };
    });
  },
}));
