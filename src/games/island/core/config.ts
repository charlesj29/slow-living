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
    /**
     * Authoring hint: put the cabin on the suitable site nearest this tile (its top-left)
     * instead of a random one, so the landmark stays put when the cabin's size or the
     * placement rules change. null = random.
     */
    readonly anchor: { readonly x: number; readonly y: number } | null;
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
    /** Share of broadleaf big trees that are great (wide-crowned) forest trees. */
    readonly giantShare: number;
    readonly meadowTreeChance: number;
    readonly meadowBushChance: number;
    /** Low-frequency noise that groups oaks and pines into stands. */
    readonly speciesNoise: FractalNoiseOptions;
  };
  /** Rocky ledges where the grass drops straight down to a beach (south-facing coasts). */
  readonly ledges: {
    /** Runs of ledge follow this noise along the coast. */
    readonly noise: FractalNoiseOptions;
    readonly threshold: number;
    /** Shorter runs are dropped (a lone ledge tile looks like a mistake). */
    readonly minRunTiles: number;
  };
  /** Stumps and fallen branches near trees. */
  readonly deadwood: {
    readonly searchRadiusTiles: number;
    /** Trees within the radius needed before a tile counts as woodland. */
    readonly minNearbyTrees: number;
    readonly stumpChance: number;
    readonly branchChance: number;
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
  readonly loop: {
    /** Fixed logic rate; rendering interpolates between steps. */
    readonly stepsPerSecond: number;
    /** After a stall, run at most this many steps in one frame (no catch-up burst). */
    readonly maxStepsPerFrame: number;
  };
  readonly player: {
    readonly walkSpeedTilesPerSecond: number;
    readonly runSpeedTilesPerSecond: number;
    /** Collision box around the feet (the body above can overlap things behind it). */
    readonly hitboxWidthPx: number;
    readonly hitboxHeightPx: number;
    /** When walking into an obstacle's corner by up to this many px, slide around it. */
    readonly cornerSlidePx: number;
    /** Distance one full walk / run cycle (two steps) covers, so the feet don't slide. */
    readonly walkCyclePx: number;
    readonly runCyclePx: number;
    /** Idle: one slow breath (standing for breathHoldSeconds, then sinking a pixel). */
    readonly breathCycleSeconds: number;
    readonly breathHoldSeconds: number;
    /** A blink of blinkSeconds every blinkEverySeconds (not a multiple of the breath, so they drift). */
    readonly blinkEverySeconds: number;
    readonly blinkSeconds: number;
  };
  readonly dayNight: {
    /** Real seconds for one full day (dawn, day, dusk, night). */
    readonly dayLengthSeconds: number;
    /** Time of day when the game starts (0 = midnight, 0.5 = noon). */
    readonly startTime: number;
    /** How quickly the light follows a change of mode (higher = faster). */
    readonly transitionSharpness: number;
  };
  readonly interaction: {
    /** How far past the feet hitbox, in the facing direction, the player can reach. */
    readonly reachPx: number;
  };
  readonly music: {
    /** 0..1 master volume: background music should sit under the game, not over it. */
    readonly volume: number;
    readonly fadeSeconds: number;
    /** The first start fades in gently instead of bursting in. */
    readonly fadeInSeconds: number;
  };
  readonly debug: {
    /** How quickly the FPS readout follows frame-time changes (higher = jumpier). */
    readonly fpsSmoothingSharpness: number;
    /** How often the F3 overlay refreshes its text. */
    readonly overlayRefreshMs: number;
  };
  readonly render: {
    /** Handheld-like framing: pick the whole-number scale that shows about this many tiles across. */
    readonly targetTilesAcross: number;
    /** ...but never fewer than this many tiles top to bottom (wide, short windows). */
    readonly minTilesTall: number;
    /**
     * Zoom steps applied on load, relative to the automatic framing (negative = further out).
     * The user's preferred view is three steps out (as if pressing "−" three times).
     */
    readonly defaultZoomSteps: number;
    readonly minPixelScale: number;
    readonly maxPixelScale: number;
    readonly waterFrameSeconds: number;
    readonly flowerFrameSeconds: number;
    /** Soft, dithered patches of slightly deeper grass (shaded in the tilemap shader). */
    readonly grassPatches: {
      readonly noise: FractalNoiseOptions;
      readonly threshold: number;
      readonly shade: number;
      readonly ditherSpread: number;
    };
    /** How quickly the camera catches up with the player (higher = snappier). */
    readonly cameraFollowSharpness: number;
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
    anchor: { x: 113, y: 105 },
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
    giantShare: 0.3,
    meadowTreeChance: 0.005,
    meadowBushChance: 0.008,
    speciesNoise: noise(0.022),
  },
  ledges: { noise: noise(0.05, 2), threshold: 0.35, minRunTiles: 2 },
  deadwood: { searchRadiusTiles: 2, minNearbyTrees: 2, stumpChance: 0.015, branchChance: 0.03 },
  decorations: {
    flowerPatchNoise: noise(0.07, 2),
    flowerPatchThreshold: 0.66,
    flowerPatchDensity: 0.35,
    scatteredFlowerChance: 0.01,
    flowerColorNoise: noise(0.04),
    grassTuftChance: 0.05,
  },
  loop: { stepsPerSecond: 60, maxStepsPerFrame: 5 },
  player: {
    walkSpeedTilesPerSecond: 4,
    runSpeedTilesPerSecond: 7.5,
    hitboxWidthPx: 10,
    hitboxHeightPx: 6,
    cornerSlidePx: 5,
    walkCyclePx: 40,
    runCyclePx: 60,
    breathCycleSeconds: 2.6,
    breathHoldSeconds: 1.5,
    blinkEverySeconds: 3.7,
    blinkSeconds: 0.14,
  },
  dayNight: { dayLengthSeconds: 720, startTime: 0.33, transitionSharpness: 2.5 },
  interaction: { reachPx: 8 },
  music: { volume: 0.55, fadeSeconds: 0.4, fadeInSeconds: 3 },
  debug: { fpsSmoothingSharpness: 3, overlayRefreshMs: 250 },
  render: {
    targetTilesAcross: 20,
    minTilesTall: 11,
    defaultZoomSteps: -3,
    minPixelScale: 1,
    maxPixelScale: 12,
    waterFrameSeconds: 0.5,
    flowerFrameSeconds: 0.6,
    grassPatches: { noise: noise(0.07, 2), threshold: 0.55, shade: 0.92, ditherSpread: 0.14 },
    cameraFollowSharpness: 8,
  },
  validation: { minLandShare: 0.2, maxLandShare: 0.65, minReachableShare: 0.3 },
};
