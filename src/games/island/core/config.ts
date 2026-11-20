// All tunable numbers for the island game live here. Generation, movement and
// rendering read from this object instead of hard-coding values.

export const ISLAND_CONFIG = {
  map: {
    widthTiles: 128,
    heightTiles: 128,
    tileSizePx: 16,
  },
} as const;

export type IslandConfig = typeof ISLAND_CONFIG;
