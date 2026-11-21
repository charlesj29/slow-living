import type { GridSize, TilePoint } from '@/shared/engine/grid';
import { cellCount } from '@/shared/engine/grid';
import { createRng, deriveSeed, type Rng } from '@/shared/engine/random';
import type { IslandConfig } from '../config';
import { TileId } from '../world/tiles';
import type { Village } from '../world/village';
import { NO_OBJECT, type WorldObject } from '../world/world';

/**
 * Data flowing through the generation pipeline. Steps never mutate the
 * context they receive: they copy what they change and return a new context.
 */
export interface GenerationContext {
  /** Seed of this attempt. */
  readonly seed: number;
  readonly config: IslandConfig;
  readonly size: GridSize;
  /** 0..1 height map from shapeIsland; drives terrain thresholds. */
  readonly elevation: Float32Array;
  readonly terrain: Uint8Array;
  readonly objects: readonly WorldObject[];
  /** Object id per tile, or NO_OBJECT. */
  readonly occupancy: Int32Array;
  /** 1 = keep free of trees and decorations (around the cabin, in front of the door). */
  readonly reserved: Uint8Array;
  readonly lakeCenter: TilePoint | null;
  /** Shore tile where the dock starts; trails lead here. */
  readonly dockRoot: TilePoint | null;
  readonly cabin: WorldObject | null;
  readonly spawn: TilePoint | null;
  readonly village: Village | null;
}

export type GenerationStep = (context: GenerationContext) => GenerationContext;

export function createInitialContext(seed: number, config: IslandConfig): GenerationContext {
  const size = { width: config.map.widthTiles, height: config.map.heightTiles };
  const cells = cellCount(size);
  return {
    seed,
    config,
    size,
    elevation: new Float32Array(cells),
    terrain: new Uint8Array(cells).fill(TileId.DeepSea),
    objects: [],
    occupancy: new Int32Array(cells).fill(NO_OBJECT),
    reserved: new Uint8Array(cells),
    lakeCenter: null,
    dockRoot: null,
    cabin: null,
    spawn: null,
    village: null,
  };
}

/** Each step gets its own random stream so tweaking one step doesn't reshuffle the others. */
export function createStepRng(context: GenerationContext, stepName: string): Rng {
  return createRng(deriveSeed(context.seed, stepName));
}
