import { isInBounds, toIndex, type GridSize } from '@/shared/engine/grid';
import { OBJECT_REGISTRY, type ObjectKind } from '../world/objects';
import { NO_OBJECT, type WorldObject } from '../world/world';
import type { GenerationContext } from './context';

/** Mutable working copy of a context's objects, used inside a single step. */
export interface ObjectLayer {
  readonly size: GridSize;
  readonly objects: WorldObject[];
  readonly occupancy: Int32Array;
}

export function copyObjectLayer(context: GenerationContext): ObjectLayer {
  return {
    size: context.size,
    objects: [...context.objects],
    occupancy: context.occupancy.slice(),
  };
}

export function isAreaFree(
  layer: ObjectLayer,
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      if (!isInBounds(layer.size, x + dx, y + dy)) {
        return false;
      }
      if (layer.occupancy[toIndex(layer.size, x + dx, y + dy)] !== NO_OBJECT) {
        return false;
      }
    }
  }
  return true;
}

/** Adds an object and marks its footprint as occupied. Caller checks `isAreaFree` first. */
export function addObject(layer: ObjectLayer, kind: ObjectKind, x: number, y: number): WorldObject {
  const object: WorldObject = { id: layer.objects.length, kind, x, y };
  const { footprint } = OBJECT_REGISTRY[kind];
  for (let dy = 0; dy < footprint.height; dy++) {
    for (let dx = 0; dx < footprint.width; dx++) {
      layer.occupancy[toIndex(layer.size, x + dx, y + dy)] = object.id;
    }
  }
  layer.objects.push(object);
  return object;
}
