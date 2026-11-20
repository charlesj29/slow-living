// All tunable numbers for the island game live here. Generation, movement and
// rendering read from this object instead of hard-coding values.
import type { FractalNoiseOptions } from '@/shared/engine/noise';

export interface IslandConfig {
  readonly map: {
    readonly widthTiles: number;
    readonly heightTiles: number;
    readonly tileSizePx: number;
  };
  readonly generation: {
    /** Attempts (original seed + derived retry seeds) before giving up. */
    readonly maxAttempts: number;
  };
  readonly island: {
    readonly noise: FractalNoiseOptions;
    /** 0 = pure noise, 1 = pure radial gradient. Higher = rounder island. */
    readonly radialWeight: number;
    /** Tiles from the map edge that are always deep sea. */
    readonly edgeWaterTiles: number;
  };
  /** Elevation thresholds (0..1): below deepSeaMax is deep sea, etc.; above sandMax is grass. */
  readonly terrain: {
    readonly deepSeaMax: number;
    readonly shallowSeaMax: number;
    readonly sandMax: number;
  };
  readonly lake: {
    readonly minRadius: number;
    readonly maxRadius: number;
    readonly shapeNoise: FractalNoiseOptions;
    /** How much the noise bends the lake edge, as a fraction of the radius. */
    readonly shapeNoiseAmount: number;
    readonly shallowWidthTiles: number;
    readonly shoreWidthTiles: number;
    /** Extra grass tiles required between the lake shore and the coast. */
    readonly minCoastGapTiles: number;
  };
  readonly cabin: {
    /** Grass ring around the cabin kept free of trees. */
    readonly marginTiles: number;
    /** Clear grass rows in front of (below) the door. */
    readonly frontClearanceTiles: number;
    readonly minWaterDistanceTiles: number;
  };
  readonly trees: {
    readonly forestNoise: FractalNoiseOptions;
    /** Forest noise above this value counts as forest. */
    readonly forestThreshold: number;
    /** Chance of a tree on a free forest tile. */
    readonly forestDensity: number;
    /** Chance of a lone tree on a free meadow tile. */
    readonly loneTreeChance: number;
    /** Low-frequency noise that groups tree species into stands. */
    readonly speciesNoise: FractalNoiseOptions;
  };
  readonly decorations: {
    readonly flowerPatchNoise: FractalNoiseOptions;
    readonly flowerPatchThreshold: number;
    readonly flowerPatchDensity: number;
    readonly scatteredFlowerChance: number;
    /** Picks the dominant flower colour of a patch. */
    readonly flowerColorNoise: FractalNoiseOptions;
    readonly grassTuftChance: number;
  };
  readonly validation: {
    readonly minLandShare: number;
    readonly maxLandShare: number;
    /** Share of walkable land the player must be able to reach from spawn. */
    readonly minReachableShare: number;
  };
}

const singleOctave = (scale: number): FractalNoiseOptions => ({
  scale,
  octaves: 1,
  persistence: 0.5,
  lacunarity: 2,
});

export const ISLAND_CONFIG: IslandConfig = {
  map: {
    widthTiles: 128,
    heightTiles: 128,
    tileSizePx: 16,
  },
  generation: {
    maxAttempts: 10,
  },
  island: {
    noise: { scale: 0.025, octaves: 5, persistence: 0.5, lacunarity: 2 },
    radialWeight: 0.55,
    edgeWaterTiles: 4,
  },
  terrain: {
    deepSeaMax: 0.38,
    shallowSeaMax: 0.43,
    sandMax: 0.46,
  },
  lake: {
    minRadius: 5,
    maxRadius: 8,
    shapeNoise: { scale: 0.18, octaves: 2, persistence: 0.5, lacunarity: 2 },
    shapeNoiseAmount: 0.3,
    shallowWidthTiles: 1,
    shoreWidthTiles: 1,
    minCoastGapTiles: 3,
  },
  cabin: {
    marginTiles: 1,
    frontClearanceTiles: 3,
    minWaterDistanceTiles: 3,
  },
  trees: {
    forestNoise: { scale: 0.045, octaves: 3, persistence: 0.5, lacunarity: 2 },
    forestThreshold: 0.57,
    forestDensity: 0.7,
    loneTreeChance: 0.012,
    speciesNoise: singleOctave(0.03),
  },
  decorations: {
    flowerPatchNoise: { scale: 0.09, octaves: 2, persistence: 0.5, lacunarity: 2 },
    flowerPatchThreshold: 0.66,
    flowerPatchDensity: 0.35,
    scatteredFlowerChance: 0.01,
    flowerColorNoise: singleOctave(0.05),
    grassTuftChance: 0.05,
  },
  validation: {
    minLandShare: 0.2,
    maxLandShare: 0.65,
    minReachableShare: 0.3,
  },
};
