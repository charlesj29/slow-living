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
    description: 'Explore a procedurally generated island: meadows, forests, a lake and a cabin.',
    path: '/games/island',
  },
];
