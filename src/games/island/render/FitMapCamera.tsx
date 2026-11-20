import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { JSX } from 'react';

const CAMERA_DISTANCE = 100;
const NEAR_PLANE = 0.1;
const FAR_PLANE = 1000;
/** Leaves a small border of sea around the map. */
const FIT_PADDING = 0.95;

interface FitMapCameraProps {
  readonly mapWidthPx: number;
  readonly mapHeightPx: number;
}

/**
 * Top-down orthographic camera zoomed so the whole map fits the canvas.
 * Temporary overview camera for M1; M3 replaces it with a follow camera.
 */
export function FitMapCamera({ mapWidthPx, mapHeightPx }: FitMapCameraProps): JSX.Element {
  const size = useThree((state) => state.size);
  const zoom = Math.min(size.width / mapWidthPx, size.height / mapHeightPx) * FIT_PADDING;
  return (
    <OrthographicCamera
      makeDefault
      position={[0, 0, CAMERA_DISTANCE]}
      zoom={zoom}
      near={NEAR_PLANE}
      far={FAR_PLANE}
    />
  );
}
