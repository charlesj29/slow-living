// Packs sprite images into one atlas image. Pure (no Three.js) so it is unit-tested.
import { createPixelCanvas, getPixel, setPixel, type PixelCanvas } from './pixelCanvas';

/** A sprite to pack. Several frames make an animation strip (all frames the same size). */
export interface SpriteSource {
  readonly key: string;
  readonly frames: readonly PixelCanvas[];
}

/** Where a sprite lives in the atlas, in pixels (top-left origin) and UVs. */
export interface AtlasFrame {
  readonly x: number;
  readonly y: number;
  /** Size of one frame in pixels. */
  readonly width: number;
  readonly height: number;
  readonly frameCount: number;
  readonly u0: number;
  readonly u1: number;
  /** v of the sprite's top row and bottom row (texture row 0 is v = 0). */
  readonly vTop: number;
  readonly vBottom: number;
  /** u distance between consecutive animation frames. */
  readonly frameStrideU: number;
}

export interface AtlasLayout {
  readonly image: PixelCanvas;
  readonly frames: ReadonlyMap<string, AtlasFrame>;
}

function nextPowerOfTwo(value: number): number {
  let result = 1;
  while (result < value) result *= 2;
  return result;
}

/**
 * Copies the strip's border pixels one pixel outwards. With nearest filtering,
 * sampling exactly on a sprite edge can pick the neighbouring texel; extruding
 * makes that neighbour the same colour, so tiles never show seams.
 */
function extrudeBorder(
  image: PixelCanvas,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  for (let px = x - 1; px <= x + width; px++) {
    const sx = Math.min(Math.max(px, x), x + width - 1);
    setPixel(image, px, y - 1, getPixel(image, sx, y));
    setPixel(image, px, y + height, getPixel(image, sx, y + height - 1));
  }
  for (let py = y; py < y + height; py++) {
    setPixel(image, x - 1, py, getPixel(image, x, py));
    setPixel(image, x + width, py, getPixel(image, x + width - 1, py));
  }
}

/** Shelf packing (tallest first) into a power-of-two image with `padding` px around each strip. */
export function layoutAtlas(sources: readonly SpriteSource[], padding = 1): AtlasLayout {
  const strips = sources.map((source) => {
    const first = source.frames[0];
    if (!first) throw new Error(`Sprite "${source.key}" has no frames`);
    for (const frame of source.frames) {
      if (frame.width !== first.width || frame.height !== first.height) {
        throw new Error(`Sprite "${source.key}" has frames of different sizes`);
      }
    }
    return {
      source,
      frameWidth: first.width,
      height: first.height,
      width: first.width * source.frames.length,
    };
  });
  const keys = new Set<string>();
  for (const strip of strips) {
    if (keys.has(strip.source.key)) throw new Error(`Duplicate sprite key "${strip.source.key}"`);
    keys.add(strip.source.key);
  }

  const totalArea = strips.reduce(
    (sum, s) => sum + (s.width + 2 * padding) * (s.height + 2 * padding),
    0,
  );
  const widest = Math.max(...strips.map((s) => s.width + 2 * padding));
  const atlasWidth = nextPowerOfTwo(Math.max(widest, Math.ceil(Math.sqrt(totalArea))));

  const placements: { strip: (typeof strips)[number]; x: number; y: number }[] = [];
  let cursorX = 0;
  let cursorY = 0;
  let shelfHeight = 0;
  for (const strip of [...strips].sort((a, b) => b.height - a.height)) {
    const paddedWidth = strip.width + 2 * padding;
    if (cursorX + paddedWidth > atlasWidth) {
      cursorX = 0;
      cursorY += shelfHeight;
      shelfHeight = 0;
    }
    placements.push({ strip, x: cursorX + padding, y: cursorY + padding });
    cursorX += paddedWidth;
    shelfHeight = Math.max(shelfHeight, strip.height + 2 * padding);
  }
  const atlasHeight = nextPowerOfTwo(cursorY + shelfHeight);

  const image = createPixelCanvas(atlasWidth, atlasHeight);
  const frames = new Map<string, AtlasFrame>();
  for (const { strip, x, y } of placements) {
    strip.source.frames.forEach((frame, index) => {
      const frameX = x + index * strip.frameWidth;
      for (let py = 0; py < frame.height; py++) {
        for (let px = 0; px < frame.width; px++) {
          setPixel(image, frameX + px, y + py, getPixel(frame, px, py));
        }
      }
    });
    if (padding > 0) extrudeBorder(image, x, y, strip.width, strip.height);
    frames.set(strip.source.key, {
      x,
      y,
      width: strip.frameWidth,
      height: strip.height,
      frameCount: strip.source.frames.length,
      u0: x / atlasWidth,
      u1: (x + strip.frameWidth) / atlasWidth,
      vTop: y / atlasHeight,
      vBottom: (y + strip.height) / atlasHeight,
      frameStrideU: strip.frameWidth / atlasWidth,
    });
  }
  return { image, frames };
}
