import { describe, expect, it } from 'vitest';
import {
  clampViewCenter,
  pixelScaleFor,
  snapCameraCoordinate,
  zoomForPixelScale,
} from './pixelPerfect';

describe('pixel-perfect camera math', () => {
  it('rounds to whole device pixels per source pixel (at least 1)', () => {
    expect(pixelScaleFor(3, 1)).toBe(3);
    expect(pixelScaleFor(3, 1.25)).toBe(4);
    expect(pixelScaleFor(3, 2)).toBe(6);
    expect(pixelScaleFor(0.2, 1)).toBe(1);
  });

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
