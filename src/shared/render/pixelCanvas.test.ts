import { describe, expect, it } from 'vitest';
import {
  blit,
  createPixelCanvas,
  getPixel,
  hexToRgba,
  rotate90,
  rotateTimes,
  setPixel,
  TRANSPARENT,
} from './pixelCanvas';

const RED = hexToRgba('#ff0000');
const BLUE = hexToRgba('#0000ff');

describe('pixelCanvas', () => {
  it('parses hex colours', () => {
    expect(hexToRgba('#102030')).toEqual([16, 32, 48, 255]);
  });

  it('sets and reads pixels, ignoring out-of-bounds writes', () => {
    const canvas = createPixelCanvas(2, 2);
    setPixel(canvas, 1, 0, RED);
    setPixel(canvas, 5, 5, RED);
    setPixel(canvas, -1, 0, RED);
    expect(getPixel(canvas, 1, 0)).toEqual(RED);
    expect(getPixel(canvas, 0, 0)).toEqual(TRANSPARENT);
    expect(getPixel(canvas, 9, 9)).toEqual(TRANSPARENT);
  });

  it('rotates 90° clockwise', () => {
    const canvas = createPixelCanvas(3, 2);
    setPixel(canvas, 0, 0, RED); // top-left -> top-right
    setPixel(canvas, 2, 1, BLUE); // bottom-right -> bottom-left
    const rotated = rotate90(canvas);
    expect([rotated.width, rotated.height]).toEqual([2, 3]);
    expect(getPixel(rotated, 1, 0)).toEqual(RED);
    expect(getPixel(rotated, 0, 2)).toEqual(BLUE);
    expect(rotateTimes(canvas, 4)).toEqual(canvas);
  });

  it('blits opaque pixels only', () => {
    const target = createPixelCanvas(2, 1);
    setPixel(target, 0, 0, BLUE);
    setPixel(target, 1, 0, BLUE);
    const source = createPixelCanvas(2, 1);
    setPixel(source, 1, 0, RED);
    blit(source, target, 0, 0);
    expect(getPixel(target, 0, 0)).toEqual(BLUE);
    expect(getPixel(target, 1, 0)).toEqual(RED);
  });
});
