import { create } from 'zustand';

/**
 * UI-facing state only (things the HUD/overlays show or control). The world and
 * entities live in plain mutable objects owned by the game loop, never here,
 * so React does not re-render every frame.
 */
export interface IslandUiState {
  /** Seed of the current world; null until the first world is generated. */
  readonly seed: number | null;
  readonly isDebugOverlayVisible: boolean;
  setSeed: (seed: number) => void;
  toggleDebugOverlay: () => void;
}

export const useIslandUiStore = create<IslandUiState>()((set) => ({
  seed: null,
  isDebugOverlayVisible: false,
  setSeed: (seed) => {
    set({ seed });
  },
  toggleDebugOverlay: () => {
    set((state) => ({ isDebugOverlayVisible: !state.isDebugOverlayVisible }));
  },
}));
