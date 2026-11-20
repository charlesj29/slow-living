// Plain metadata about every game, kept separate from the games themselves so
// that listing games never pulls a game's code (and Three.js) into the bundle.

export interface GameInfo {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly path: string;
}

export const GAME_CATALOG: readonly GameInfo[] = [
  {
    id: 'island',
    title: 'Island',
    description:
      'Stroll around a hand-picked island: meadows, forests, trails, a lake with a dock and a cabin.',
    path: '/',
  },
];
