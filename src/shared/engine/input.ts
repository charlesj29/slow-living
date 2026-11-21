// Device-independent input state: physical keys are mapped to game actions
// through bindings, and actions remember the order they were pressed in (so a
// game can let the most recent direction win). Pure; the DOM listener that
// feeds it lives in the render layer.

/** Maps `KeyboardEvent.code` values to actions. */
export type KeyBindings<Action extends string> = Readonly<Record<string, Action>>;

export interface InputState<Action extends string> {
  /** Held actions, oldest press first. */
  readonly held: Action[];
  /** How many bound keys hold each action (two keys can share one action). */
  readonly keyCounts: Map<Action, number>;
  readonly pressedKeys: Set<string>;
  /**
   * Fresh presses (not key repeats) since the game last cleared them, for
   * one-shot actions like "interact"; the fixed step consumes them.
   */
  readonly presses: Action[];
}

export function createInputState<Action extends string>(): InputState<Action> {
  return { held: [], keyCounts: new Map(), pressedKeys: new Set(), presses: [] };
}

/** Returns true if the key is bound (so the caller can prevent default browser behaviour). */
export function pressKey<Action extends string>(
  state: InputState<Action>,
  bindings: KeyBindings<Action>,
  code: string,
): boolean {
  const action = bindings[code];
  if (action === undefined) return false;
  if (state.pressedKeys.has(code)) return true; // key repeat
  state.pressedKeys.add(code);
  state.presses.push(action);
  const count = state.keyCounts.get(action) ?? 0;
  state.keyCounts.set(action, count + 1);
  if (count === 0) state.held.push(action);
  return true;
}

export function releaseKey<Action extends string>(
  state: InputState<Action>,
  bindings: KeyBindings<Action>,
  code: string,
): void {
  const action = bindings[code];
  if (action === undefined || !state.pressedKeys.delete(code)) return;
  const count = (state.keyCounts.get(action) ?? 1) - 1;
  state.keyCounts.set(action, count);
  if (count === 0) {
    const index = state.held.indexOf(action);
    if (index !== -1) state.held.splice(index, 1);
  }
}

/** Releases everything (e.g. when the window loses focus and key-ups would be missed). */
export function clearInput<Action extends string>(state: InputState<Action>): void {
  state.held.length = 0;
  state.keyCounts.clear();
  state.pressedKeys.clear();
  state.presses.length = 0;
}

/** True (once) if the action was freshly pressed since presses were last cleared. */
export function consumePress<Action extends string>(
  state: InputState<Action>,
  action: Action,
): boolean {
  const index = state.presses.indexOf(action);
  if (index === -1) return false;
  state.presses.splice(index, 1);
  return true;
}

/** Forgets presses nobody consumed (called at the end of each logic step). */
export function clearPresses<Action extends string>(state: InputState<Action>): void {
  state.presses.length = 0;
}

export function isHeld<Action extends string>(state: InputState<Action>, action: Action): boolean {
  return state.held.includes(action);
}

/** The most recently pressed of `candidates` that is still held. */
export function latestHeld<Action extends string, Candidate extends Action>(
  state: InputState<Action>,
  candidates: readonly Candidate[],
): Candidate | undefined {
  for (let i = state.held.length - 1; i >= 0; i--) {
    const action = state.held[i];
    const match = candidates.find((candidate) => candidate === action);
    if (match !== undefined) return match;
  }
  return undefined;
}
