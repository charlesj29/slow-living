import { beforeEach, describe, expect, it } from 'vitest';
import { useIslandUiStore } from './state';

describe('island UI store', () => {
  beforeEach(() => {
    useIslandUiStore.setState({
      isDebugOverlayVisible: false,
      hasStartedWalking: false,
      isMusicMuted: false,
      dialogMessage: null,
      dayNightMode: 'auto',
    });
  });

  it('toggles the debug overlay', () => {
    useIslandUiStore.getState().toggleDebugOverlay();
    expect(useIslandUiStore.getState().isDebugOverlayVisible).toBe(true);
    useIslandUiStore.getState().toggleDebugOverlay();
    expect(useIslandUiStore.getState().isDebugOverlayVisible).toBe(false);
  });

  it('mutes and unmutes the music', () => {
    useIslandUiStore.getState().toggleMusicMuted();
    expect(useIslandUiStore.getState().isMusicMuted).toBe(true);
    useIslandUiStore.getState().toggleMusicMuted();
    expect(useIslandUiStore.getState().isMusicMuted).toBe(false);
    useIslandUiStore.getState().setMusicMuted(true);
    expect(useIslandUiStore.getState().isMusicMuted).toBe(true);
  });

  it('shows and clears the dialog message', () => {
    useIslandUiStore.getState().setDialogMessage("It's empty.");
    expect(useIslandUiStore.getState().dialogMessage).toBe("It's empty.");
    useIslandUiStore.getState().setDialogMessage(null);
    expect(useIslandUiStore.getState().dialogMessage).toBeNull();
  });

  it('cycles the day/night mode: auto, day, night, auto', () => {
    const modes = [0, 1, 2].map(() => {
      useIslandUiStore.getState().cycleDayNightMode();
      return useIslandUiStore.getState().dayNightMode;
    });
    expect(modes).toEqual(['day', 'night', 'auto']);
  });

  it('remembers that the player has started walking', () => {
    expect(useIslandUiStore.getState().hasStartedWalking).toBe(false);
    useIslandUiStore.getState().markStartedWalking();
    useIslandUiStore.getState().markStartedWalking();
    expect(useIslandUiStore.getState().hasStartedWalking).toBe(true);
  });
});
