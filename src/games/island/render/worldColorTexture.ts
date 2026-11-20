import { DataTexture, NearestFilter, RGBAFormat, SRGBColorSpace } from 'three';
import { OBJECT_REGISTRY } from '../core/world/objects';
import { TILE_DEFINITIONS } from '../core/world/tiles';
import type { World } from '../core/world/world';

type Rgb = readonly [number, number, number];

const BYTES_PER_PIXEL = 4;
const OPAQUE = 255;
const SPAWN_MARKER_COLOR: Rgb = [255, 0, 255];

function parseHexColor(hex: string): Rgb {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/**
 * One texel per tile, coloured from the registries' map colours: a cheap way
 * to see a whole generated map (M1 preview; M2 replaces it with sprites).
 */
export function createWorldColorTexture(world: World): DataTexture {
  const { width, height } = world;
  const pixels = new Uint8Array(width * height * BYTES_PER_PIXEL);
  const tileColors = TILE_DEFINITIONS.map((definition) => parseHexColor(definition.mapColor));

  // World rows grow downwards but texture rows grow upwards, so flip y.
  const paint = (x: number, y: number, color: Rgb): void => {
    const offset = ((height - 1 - y) * width + x) * BYTES_PER_PIXEL;
    pixels[offset] = color[0];
    pixels[offset + 1] = color[1];
    pixels[offset + 2] = color[2];
    pixels[offset + 3] = OPAQUE;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      paint(x, y, tileColors[world.terrain[y * width + x] ?? 0] ?? SPAWN_MARKER_COLOR);
    }
  }
  for (const object of world.objects) {
    const { footprint, mapColor } = OBJECT_REGISTRY[object.kind];
    const color = parseHexColor(mapColor);
    for (let dy = 0; dy < footprint.height; dy++) {
      for (let dx = 0; dx < footprint.width; dx++) {
        paint(object.x + dx, object.y + dy, color);
      }
    }
  }
  paint(world.spawn.x, world.spawn.y, SPAWN_MARKER_COLOR);

  const texture = new DataTexture(pixels, width, height, RGBAFormat);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
