import { floodFill, isOnBorder, labelRegions, toIndex, type GridSize } from '@/shared/engine/grid';
import type { IslandConfig } from '../../config';
import { isLandTile, isWaterTile, TileId } from '../../world/tiles';
import type { GenerationStep } from '../context';

function tileForElevation(elevation: number, thresholds: IslandConfig['terrain']): TileId {
  if (elevation < thresholds.deepSeaMax) return TileId.DeepSea;
  if (elevation < thresholds.shallowSeaMax) return TileId.ShallowSea;
  if (elevation < thresholds.sandMax) return TileId.Sand;
  return TileId.Grass;
}

function distanceToEdge(size: GridSize, x: number, y: number): number {
  return Math.min(x, y, size.width - 1 - x, size.height - 1 - y);
}

/** Only the biggest landmass survives, so the map is one island, not an archipelago. */
function keepLargestLandmass(size: GridSize, terrain: Uint8Array): void {
  const { labels, regionSizes } = labelRegions(size, (i) => isLandTile(terrain[i] ?? 0));
  const largest = regionSizes.indexOf(Math.max(...regionSizes));
  for (let i = 0; i < terrain.length; i++) {
    const label = labels[i] ?? -1;
    if (label !== -1 && label !== largest) {
      terrain[i] = TileId.ShallowSea;
    }
  }
}

/** Water not connected to the map edge would be an accidental lake; fill it with grass. */
function fillInlandWater(size: GridSize, terrain: Uint8Array): void {
  const borderIndexes: number[] = [];
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (isOnBorder(size, x, y)) borderIndexes.push(toIndex(size, x, y));
    }
  }
  const sea = floodFill(size, borderIndexes, (i) => isWaterTile(terrain[i] ?? 0));
  for (let i = 0; i < terrain.length; i++) {
    if (sea[i] === 0 && isWaterTile(terrain[i] ?? 0)) {
      terrain[i] = TileId.Grass;
    }
  }
}

/** Turns elevation into sea / sand / grass and cleans up the result. */
export const assignTerrain: GenerationStep = (context) => {
  const { size, config, elevation } = context;
  const terrain = new Uint8Array(size.width * size.height);

  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const index = toIndex(size, x, y);
      terrain[index] =
        distanceToEdge(size, x, y) < config.island.edgeWaterTiles
          ? TileId.DeepSea
          : tileForElevation(elevation[index] ?? 0, config.terrain);
    }
  }

  keepLargestLandmass(size, terrain);
  fillInlandWater(size, terrain);
  return { ...context, terrain };
};
