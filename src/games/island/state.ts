import { create } from 'zustand';
import { DAY_NIGHT_MODES, type DayNightMode } from './core/systems/dayNight';

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
  /** Which map is shown (mirrored from the game state); the canvas rebuilds when it changes. */
  readonly mapId: string;
  /** Darkened for a door transition (the overlay fades by CSS). */
  readonly isScreenDark: boolean;
  /** Set the first time the player enters the studio (remembered); its marker then goes away. */
  readonly hasVisitedStudio: boolean;
  /** Day/night: follow the clock, or hold day or night (the top-left button). */
  readonly dayNightMode: DayNightMode;
  toggleDebugOverlay: () => void;
  markStartedWalking: () => void;
  setMusicMuted: (muted: boolean) => void;
  toggleMusicMuted: () => void;
  setDialogMessage: (message: string | null) => void;
  setMap: (mapId: string) => void;
  setScreenDark: (dark: boolean) => void;
  setVisitedStudio: (visited: boolean) => void;
  setDayNightMode: (mode: DayNightMode) => void;
  /** Auto → Always day → Always night → Auto. */
  cycleDayNightMode: () => void;
}

export const useIslandUiStore = create<IslandUiState>()((set) => ({
  isDebugOverlayVisible: false,
  hasStartedWalking: false,
  isMusicMuted: false,
  dialogMessage: null,
  mapId: 'island',
  isScreenDark: false,
  hasVisitedStudio: false,
  dayNightMode: 'auto',
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
  setMap: (mapId) => {
    set({ mapId });
  },
  setScreenDark: (dark) => {
    set({ isScreenDark: dark });
  },
  setVisitedStudio: (visited) => {
    set({ hasVisitedStudio: visited });
  },
  setDayNightMode: (mode) => {
    set({ dayNightMode: mode });
  },
  cycleDayNightMode: () => {
    set((state) => {
      const index = DAY_NIGHT_MODES.indexOf(state.dayNightMode);
      return { dayNightMode: DAY_NIGHT_MODES[(index + 1) % DAY_NIGHT_MODES.length] ?? 'auto' };
    });
  },
}));
