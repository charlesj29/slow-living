// All tunable numbers for the island game live here. Generation, movement and
// rendering read from this object instead of hard-coding values.
import type { FractalNoiseOptions } from '@/shared/engine/noise';

export interface IslandConfig {
  readonly map: {
    /** Size of a generated map (the baked map file defines the live world's size). */
    readonly widthTiles: number;
    readonly heightTiles: number;
    readonly tileSizePx: number;
    /** Map files store terrain in square chunks of this many tiles, so the world can grow. */
    readonly chunkSizeTiles: number;
  };
  readonly generation: {
    /** Attempts (original seed + derived retry seeds) before giving up. */
    readonly maxAttempts: number;
    /** Seed used by `npm run bake:island` when none is given. */
    readonly authoringSeed: number;
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
    /** Preferred maximum distance from the lake, so the cabin overlooks it. */
    readonly maxLakeDistanceTiles: number;
  };
  readonly dock: {
    readonly lengthTiles: number;
  };
  readonly paths: {
    /** Bends trails; higher = more winding. */
    readonly meanderNoise: FractalNoiseOptions;
    readonly meanderStrength: number;
    readonly grassCost: number;
    readonly sandCost: number;
    /** Walking an existing trail is cheap, so trails merge instead of running in parallel. */
    readonly existingPathCost: number;
    /** Number of beach destinations for trails from the cabin. */
    readonly beachTrails: number;
  };
  readonly rocks: {
    readonly clusterNoise: FractalNoiseOptions;
    readonly clusterThreshold: number;
    readonly clusterDensity: number;
    readonly scatteredChance: number;
  };
  readonly trees: {
    readonly forestNoise: FractalNoiseOptions;
    /** Forest noise above this value counts as forest. */
    readonly forestThreshold: number;
    /**
     * Forest cores (forest noise above denseThreshold) become dense, interlocking
     * canopy, but only where the low-frequency character noise is above
     * characterThreshold — so some forests are dense and others stay loose.
     */
    readonly denseThreshold: number;
    readonly characterNoise: FractalNoiseOptions;
    readonly characterThreshold: number;
    /** Chance of a tree on a free tile in loose forest. */
    readonly looseDensity: number;
    /** Share of loose-forest and meadow trees that are big (2×2) rather than small. */
    readonly bigTreeShare: number;
    readonly meadowTreeChance: number;
    readonly meadowBushChance: number;
    /** Low-frequency noise that groups oaks and pines into stands. */
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
  readonly render: {
    /** Handheld-like framing: pick the whole-number scale that shows about this many tiles across. */
    readonly targetTilesAcross: number;
    /** ...but never fewer than this many tiles top to bottom (wide, short windows). */
    readonly minTilesTall: number;
    readonly minPixelScale: number;
    readonly maxPixelScale: number;
    readonly waterFrameSeconds: number;
    readonly flowerFrameSeconds: number;
    /** Temporary free-look camera (until the player follow camera in M3). */
    readonly lookSpeedTilesPerSecond: number;
  };
  readonly validation: {
    readonly minLandShare: number;
    readonly maxLandShare: number;
    /** Share of walkable land the player must be able to reach from spawn. */
    readonly minReachableShare: number;
  };
}

const noise = (scale: number, octaves = 1): FractalNoiseOptions => ({
  scale,
  octaves,
  persistence: 0.5,
  lacunarity: 2,
});

export const ISLAND_CONFIG: IslandConfig = {
  map: { widthTiles: 192, heightTiles: 192, tileSizePx: 16, chunkSizeTiles: 32 },
  generation: { maxAttempts: 10, authoringSeed: 1 },
  island: { noise: noise(0.016, 5), radialWeight: 0.55, edgeWaterTiles: 6 },
  terrain: { deepSeaMax: 0.38, shallowSeaMax: 0.43, sandMax: 0.46 },
  lake: {
    minRadius: 10,
    maxRadius: 13,
    shapeNoise: noise(0.12, 2),
    shapeNoiseAmount: 0.38,
    shallowWidthTiles: 1,
    shoreWidthTiles: 1,
    minCoastGapTiles: 4,
  },
  cabin: {
    marginTiles: 1,
    frontClearanceTiles: 3,
    minWaterDistanceTiles: 4,
    maxLakeDistanceTiles: 22,
  },
  dock: { lengthTiles: 4 },
  paths: {
    meanderNoise: noise(0.06, 2),
    meanderStrength: 4,
    grassCost: 1,
    sandCost: 3,
    existingPathCost: 0.4,
    beachTrails: 2,
  },
  rocks: {
    clusterNoise: noise(0.07, 2),
    clusterThreshold: 0.72,
    clusterDensity: 0.25,
    scatteredChance: 0.002,
  },
  trees: {
    forestNoise: noise(0.032, 3),
    forestThreshold: 0.56,
    denseThreshold: 0.62,
    characterNoise: noise(0.012),
    characterThreshold: 0.45,
    looseDensity: 0.2,
    bigTreeShare: 0.6,
    meadowTreeChance: 0.005,
    meadowBushChance: 0.008,
    speciesNoise: noise(0.022),
  },
  decorations: {
    flowerPatchNoise: noise(0.07, 2),
    flowerPatchThreshold: 0.66,
    flowerPatchDensity: 0.35,
    scatteredFlowerChance: 0.01,
    flowerColorNoise: noise(0.04),
    grassTuftChance: 0.05,
  },
  render: {
    targetTilesAcross: 20,
    minTilesTall: 11,
    minPixelScale: 1,
    maxPixelScale: 12,
    waterFrameSeconds: 0.5,
    flowerFrameSeconds: 0.6,
    lookSpeedTilesPerSecond: 14,
  },
  validation: { minLandShare: 0.2, maxLandShare: 0.65, minReachableShare: 0.3 },
};
