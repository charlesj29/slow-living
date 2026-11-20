// Math for a pixel-perfect orthographic camera. World units are source pixels.
// Sprites stay crisp only when one source pixel covers a whole number of
// device pixels and the camera sits exactly on the device-pixel grid.

/** Whole device pixels per source pixel, aiming for `cssScale` CSS pixels per source pixel. */
export function pixelScaleFor(cssScale: number, devicePixelRatio: number): number {
  return Math.max(1, Math.round(cssScale * devicePixelRatio));
}

/** Three.js zoom (CSS pixels per world unit) that yields `pixelScale` device pixels per world unit. */
export function zoomForPixelScale(pixelScale: number, devicePixelRatio: number): number {
  return pixelScale / devicePixelRatio;
}

/**
 * Snaps a camera coordinate to the device-pixel grid. When the drawing buffer
 * has an odd number of device pixels, the view centre falls in the middle of a
 * device pixel, so the camera shifts by half a device pixel to compensate.
 */
export function snapCameraCoordinate(
  value: number,
  pixelScale: number,
  bufferPixels: number,
): number {
  const halfPixelShift = (bufferPixels % 2) * 0.5;
  return (Math.round(value * pixelScale) + halfPixelShift) / pixelScale;
}

/**
 * Keeps the view inside the bounds. If the view is larger than the bounds on
 * an axis, it centres on that axis instead.
 */
export function clampViewCenter(
  center: number,
  halfView: number,
  min: number,
  max: number,
): number {
  if (max - min <= halfView * 2) return (min + max) / 2;
  return Math.min(Math.max(center, min + halfView), max - halfView);
}
