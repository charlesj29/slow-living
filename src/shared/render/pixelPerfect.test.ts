import { describe, expect, it } from 'vitest';
import {
  autoPixelScale,
  clampViewCenter,
  snapCameraCoordinate,
  zoomForPixelScale,
} from './pixelPerfect';

describe('pixel-perfect camera math', () => {
  it('converts a pixel scale to a Three.js zoom in CSS pixels', () => {
    expect(zoomForPixelScale(6, 2)).toBe(3);
    expect(zoomForPixelScale(4, 1.25) * 1.25).toBeCloseTo(4);
  });

  it('snaps to the device-pixel grid', () => {
    expect(snapCameraCoordinate(10.2, 3, 800)).toBeCloseTo(10 + 1 / 3);
    expect(snapCameraCoordinate(-7.49, 2, 800)).toBeCloseTo(-7.5);
  });

  it('shifts half a device pixel when the buffer size is odd', () => {
    expect(snapCameraCoordinate(10, 2, 801)).toBeCloseTo(10.25);
  });

  it('clamps the view inside the bounds, or centres when the view is bigger', () => {
    expect(clampViewCenter(5, 10, 0, 100)).toBe(10);
    expect(clampViewCenter(95, 10, 0, 100)).toBe(90);
    expect(clampViewCenter(50, 10, 0, 100)).toBe(50);
    expect(clampViewCenter(5, 80, 0, 100)).toBe(50);
  });
});

describe('autoPixelScale', () => {
  const options = { targetTilesAcross: 20, minTilesTall: 11, tileSizePx: 16 };

  it('shows about 20 tiles across', () => {
    expect(autoPixelScale(1920, 1080, options)).toBe(6); // 1920 / 320
    expect(autoPixelScale(1280, 720, options)).toBe(4);
  });

  it('keeps enough tiles vertically on wide, short windows', () => {
    expect(autoPixelScale(1920, 400, options)).toBe(2); // 400 / 176
  });

  it('never goes below 1', () => {
    expect(autoPixelScale(100, 100, options)).toBe(1);
  });
});
