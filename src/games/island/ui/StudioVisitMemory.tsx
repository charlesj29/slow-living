import { useEffect } from 'react';
import { useIslandUiStore } from '../state';

const STORAGE_KEY = 'island.visitedStudio';

function readStoredVisit(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false; // storage blocked: the marker just shows again
  }
}

function storeVisit(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Not remembering the visit is fine.
  }
}

/**
 * Remembers across visits that the studio has been seen, so its marker
 * doesn't come back. Renders nothing.
 */
export function StudioVisitMemory(): null {
  const visited = useIslandUiStore((state) => state.hasVisitedStudio);
  useEffect(() => {
    if (readStoredVisit()) useIslandUiStore.getState().setVisitedStudio(true);
  }, []);
  useEffect(() => {
    if (visited) storeVisit();
  }, [visited]);
  return null;
}
