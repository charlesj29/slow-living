import { describe, expect, it } from 'vitest';
import { clearInput, createInputState, isHeld, latestHeld, pressKey, releaseKey } from './input';

type Action = 'up' | 'right' | 'run';
const BINDINGS = { ArrowUp: 'up', KeyW: 'up', ArrowRight: 'right', ShiftLeft: 'run' } as const;

describe('input state', () => {
  it('maps bound keys to actions and ignores unbound keys', () => {
    const state = createInputState<Action>();
    expect(pressKey(state, BINDINGS, 'ArrowUp')).toBe(true);
    expect(pressKey(state, BINDINGS, 'KeyQ')).toBe(false);
    expect(isHeld(state, 'up')).toBe(true);
    releaseKey(state, BINDINGS, 'ArrowUp');
    expect(isHeld(state, 'up')).toBe(false);
  });

  it('keeps an action held while any of its keys is down', () => {
    const state = createInputState<Action>();
    pressKey(state, BINDINGS, 'ArrowUp');
    pressKey(state, BINDINGS, 'KeyW');
    releaseKey(state, BINDINGS, 'ArrowUp');
    expect(isHeld(state, 'up')).toBe(true);
    releaseKey(state, BINDINGS, 'KeyW');
    expect(isHeld(state, 'up')).toBe(false);
  });

  it('ignores key repeat and stray key-ups', () => {
    const state = createInputState<Action>();
    pressKey(state, BINDINGS, 'ArrowUp');
    pressKey(state, BINDINGS, 'ArrowUp');
    releaseKey(state, BINDINGS, 'ArrowRight');
    releaseKey(state, BINDINGS, 'ArrowUp');
    expect(isHeld(state, 'up')).toBe(false);
  });

  it('reports the most recently pressed held action', () => {
    const state = createInputState<Action>();
    pressKey(state, BINDINGS, 'ArrowRight');
    pressKey(state, BINDINGS, 'ArrowUp');
    expect(latestHeld(state, ['up', 'right'])).toBe('up');
    releaseKey(state, BINDINGS, 'ArrowUp');
    expect(latestHeld(state, ['up', 'right'])).toBe('right');
  });

  it('clears everything', () => {
    const state = createInputState<Action>();
    pressKey(state, BINDINGS, 'ShiftLeft');
    clearInput(state);
    expect(isHeld(state, 'run')).toBe(false);
    expect(pressKey(state, BINDINGS, 'ShiftLeft')).toBe(true);
    expect(isHeld(state, 'run')).toBe(true);
  });
});
