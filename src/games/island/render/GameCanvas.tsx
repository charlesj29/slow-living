import { Canvas } from '@react-three/fiber';
import type { JSX } from 'react';

const SEA_COLOR = '#1f4e79';
const CAMERA_DISTANCE = 100;
const INITIAL_ZOOM = 1;

/**
 * Root Three.js canvas for the island. Orthographic camera looking straight
 * down the Z axis gives a true 2D top-down view. Antialiasing is off because
 * it blurs pixel art.
 */
export function GameCanvas(): JSX.Element {
  return (
    <Canvas
      orthographic
      flat
      gl={{ antialias: false }}
      camera={{ position: [0, 0, CAMERA_DISTANCE], zoom: INITIAL_ZOOM }}
    >
      <color attach="background" args={[SEA_COLOR]} />
    </Canvas>
  );
}
