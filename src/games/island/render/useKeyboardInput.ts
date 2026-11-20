import { useEffect } from 'react';
import { clearInput, pressKey, releaseKey, type InputState } from '@/shared/engine/input';
import { ISLAND_KEY_BINDINGS, type IslandAction } from '../core/systems/controls';

/**
 * Feeds browser keyboard events into the game's input state. Bound keys don't
 * scroll the page; losing focus releases everything (key-ups would be missed).
 */
export function useKeyboardInput(input: InputState<IslandAction>): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (pressKey(input, ISLAND_KEY_BINDINGS, event.code)) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      releaseKey(input, ISLAND_KEY_BINDINGS, event.code);
    };
    const onBlur = (): void => {
      clearInput(input);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      clearInput(input);
    };
  }, [input]);
}
