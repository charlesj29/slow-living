import { OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { JSX } from 'react';
import { Vector2 } from 'three';
import { clampViewCenter, snapCameraCoordinate, zoomForPixelScale } from './pixelPerfect';

const CAMERA_Z = 100;
const NEAR_PLANE = 0.1;
const FAR_PLANE = 200;

export interface CameraBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

interface PixelPerfectCameraProps {
  /** Whole device pixels per world unit (source pixel). */
  readonly pixelScale: number;
  /** Called every frame: the world point to centre on. */
  readonly getFocus: () => { readonly x: number; readonly y: number };
  /** The view never shows anything outside these world bounds. */
  readonly bounds: CameraBounds;
}

const bufferSize = new Vector2();

/**
 * Top-down orthographic camera that keeps pixel art crisp: integer device
 * pixels per source pixel, position snapped to the device-pixel grid (with a
 * half-pixel fix for odd canvas sizes), clamped to the given bounds.
 */
export function PixelPerfectCamera({
  pixelScale,
  getFocus,
  bounds,
}: PixelPerfectCameraProps): JSX.Element {
  const dpr = useThree((state) => state.viewport.dpr);

  useFrame(({ camera, gl }) => {
    const focus = getFocus();
    gl.getDrawingBufferSize(bufferSize);
    const halfWidth = bufferSize.x / 2 / pixelScale;
    const halfHeight = bufferSize.y / 2 / pixelScale;
    const x = clampViewCenter(focus.x, halfWidth, bounds.minX, bounds.maxX);
    const y = clampViewCenter(focus.y, halfHeight, bounds.minY, bounds.maxY);
    camera.position.x = snapCameraCoordinate(x, pixelScale, bufferSize.x);
    camera.position.y = snapCameraCoordinate(y, pixelScale, bufferSize.y);
  });

  return (
    <OrthographicCamera
      makeDefault
      position={[0, 0, CAMERA_Z]}
      zoom={zoomForPixelScale(pixelScale, dpr)}
      near={NEAR_PLANE}
      far={FAR_PLANE}
    />
  );
}
