import { describe, expect, it } from 'vitest';
import { layoutAtlas, type SpriteSource } from './atlasLayout';
import { createPixelCanvas, fillRect, getPixel, hexToRgba, type PixelCanvas } from './pixelCanvas';

function solid(width: number, height: number, hex: string): PixelCanvas {
  const canvas = createPixelCanvas(width, height);
  fillRect(canvas, 0, 0, width, height, hexToRgba(hex));
  return canvas;
}

const SOURCES: SpriteSource[] = [
  { key: 'a', frames: [solid(16, 16, '#ff0000')] },
  { key: 'tall', frames: [solid(16, 32, '#00ff00')] },
  {
    key: 'water',
    frames: [solid(16, 16, '#0000ff'), solid(16, 16, '#0000aa'), solid(16, 16, '#000055')],
  },
  { key: 'big', frames: [solid(48, 64, '#ffff00')] },
];

describe('layoutAtlas', () => {
  const { image, frames } = layoutAtlas(SOURCES);

  it('produces a power-of-two image', () => {
    expect(Math.log2(image.width) % 1).toBe(0);
    expect(Math.log2(image.height) % 1).toBe(0);
  });

  it('places strips without overlapping, padding included', () => {
    const rects = [...frames.values()].map((f) => ({
      left: f.x - 1,
      top: f.y - 1,
      right: f.x + f.width * f.frameCount + 1,
      bottom: f.y + f.height + 1,
    }));
    for (const [i, a] of rects.entries()) {
      expect(a.right).toBeLessThanOrEqual(image.width);
      expect(a.bottom).toBeLessThanOrEqual(image.height);
      for (const b of rects.slice(i + 1)) {
        const overlaps =
          a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        expect(overlaps).toBe(false);
      }
    }
  });

  it('copies pixels and extrudes the border by one pixel', () => {
    const frame = frames.get('a');
    if (!frame) throw new Error('missing frame');
    expect(getPixel(image, frame.x, frame.y)).toEqual(hexToRgba('#ff0000'));
    expect(getPixel(image, frame.x - 1, frame.y)).toEqual(hexToRgba('#ff0000'));
    expect(getPixel(image, frame.x + 16, frame.y + 15)).toEqual(hexToRgba('#ff0000'));
  });

  it('describes frames with UVs (texture row 0 = v 0) and animation strides', () => {
    const water = frames.get('water');
    if (!water) throw new Error('missing frame');
    expect(water.frameCount).toBe(3);
    expect(water.width).toBe(16);
    expect(water.u0).toBeCloseTo(water.x / image.width);
    expect(water.u1 - water.u0).toBeCloseTo(16 / image.width);
    expect(water.frameStrideU).toBeCloseTo(16 / image.width);
    expect(water.vBottom).toBeGreaterThan(water.vTop);
    expect(getPixel(image, water.x + 16, water.y)).toEqual(hexToRgba('#0000aa'));
  });

  it('rejects duplicate keys and mismatched frame sizes', () => {
    expect(() => layoutAtlas([SOURCES[0] as SpriteSource, SOURCES[0] as SpriteSource])).toThrow(
      /Duplicate/,
    );
    expect(() =>
      layoutAtlas([{ key: 'x', frames: [solid(16, 16, '#000000'), solid(8, 8, '#000000')] }]),
    ).toThrow(/different sizes/);
  });
});
