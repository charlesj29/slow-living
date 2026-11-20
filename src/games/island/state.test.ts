import { beforeEach, describe, expect, it } from 'vitest';
import { useIslandUiStore } from './state';

describe('island UI store', () => {
  beforeEach(() => {
    useIslandUiStore.setState({ isDebugOverlayVisible: false, hasStartedWalking: false });
  });

  it('toggles the debug overlay', () => {
    useIslandUiStore.getState().toggleDebugOverlay();
    expect(useIslandUiStore.getState().isDebugOverlayVisible).toBe(true);
    useIslandUiStore.getState().toggleDebugOverlay();
    expect(useIslandUiStore.getState().isDebugOverlayVisible).toBe(false);
  });

  it('remembers that the player has started walking', () => {
    expect(useIslandUiStore.getState().hasStartedWalking).toBe(false);
    useIslandUiStore.getState().markStartedWalking();
    useIslandUiStore.getState().markStartedWalking();
    expect(useIslandUiStore.getState().hasStartedWalking).toBe(true);
  });
});
