import { useMemo, type JSX } from 'react';
import { ISLAND_CONFIG } from './core/config';
import { generateWorld } from './core/generation/generateWorld';
import { GameCanvas } from './render/GameCanvas';
import { GenerationErrorPanel } from './ui/GenerationErrorPanel';
import { SeedLabel } from './ui/SeedLabel';

export interface IslandGameProps {
  /** World seed; the same seed always produces the same island. */
  readonly seed: number;
}

/** Composes the game's render layer (canvas) and UI layer (HUD, overlays). */
export function IslandGame({ seed }: IslandGameProps): JSX.Element {
  // Generation is pure and takes ~20 ms, so it is fine to run during render.
  const result = useMemo(() => generateWorld(seed, ISLAND_CONFIG), [seed]);

  if (!result.ok) {
    return (
      <GenerationErrorPanel seed={result.seed} attempts={result.attempts} issues={result.issues} />
    );
  }
  return (
    <>
      <GameCanvas world={result.world} />
      <SeedLabel seed={seed} />
    </>
  );
}
