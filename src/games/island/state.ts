import { create } from 'zustand';

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
  toggleDebugOverlay: () => void;
  markStartedWalking: () => void;
  setMusicMuted: (muted: boolean) => void;
  toggleMusicMuted: () => void;
}

export const useIslandUiStore = create<IslandUiState>()((set) => ({
  isDebugOverlayVisible: false,
  hasStartedWalking: false,
  isMusicMuted: false,
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
}));
