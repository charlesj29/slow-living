import { useEffect, useMemo, type JSX } from 'react';
import type { World } from '../core/world/world';
import { createWorldColorTexture } from './worldColorTexture';

interface WorldColorMapProps {
  readonly world: World;
  readonly tileSizePx: number;
}

/** The whole map as a single textured plane (one draw call), centred on the origin. */
export function WorldColorMap({ world, tileSizePx }: WorldColorMapProps): JSX.Element {
  const texture = useMemo(() => createWorldColorTexture(world), [world]);

  // R3F disposes JSX-declared geometry/material itself; this texture was created by hand.
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh>
      <planeGeometry args={[world.width * tileSizePx, world.height * tileSizePx]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
