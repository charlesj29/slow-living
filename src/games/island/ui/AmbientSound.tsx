import { useEffect, useMemo, useRef } from 'react';
import { createAmbiencePlayer } from '@/shared/audio/ambiencePlayer';
import { ISLAND_CONFIG } from '../core/config';
import type { GameState } from '../core/game/gameState';
import { cameraFocus } from '../core/game/idleTour';
import { ISLAND_MAP } from '../core/game/mapTravel';
import { targetLighting } from '../core/systems/dayNight';
import { seaDistances, soundscapeLevels } from '../core/systems/soundscape';
import { useIslandUiStore } from '../state';

/**
 * Nature sounds under the music (surf, birds, crickets, rain, the fire). They
 * start with the music on the first key press or click, and the same mute
 * button (M) silences both. The mix is sampled from the game a few times a
 * second (never per frame) from where the camera looks: the player, or the
 * ambient tour. Renders nothing.
 */
export function AmbientSound({ game }: { readonly game: GameState }): null {
  const isMuted = useIslandUiStore((state) => state.isMusicMuted);
  const hasGestureRef = useRef(false);
  const island = game.maps.get(ISLAND_MAP) ?? game.world;
  const seaDistance = useMemo(() => seaDistances(island), [island]);
  const player = useMemo(
    () =>
      createAmbiencePlayer({
        volume: ISLAND_CONFIG.ambience.volume,
        fadeSeconds: ISLAND_CONFIG.music.fadeSeconds,
        fadeInSeconds: ISLAND_CONFIG.music.fadeInSeconds,
      }),
    [],
  );

  useEffect(() => {
    const onFirstGesture = (): void => {
      hasGestureRef.current = true;
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
      if (!useIslandUiStore.getState().isMusicMuted) void player.start();
    };
    window.addEventListener('pointerdown', onFirstGesture);
    window.addEventListener('keydown', onFirstGesture);
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
      player.dispose();
    };
  }, [player]);

  useEffect(() => {
    player.setMuted(isMuted);
    // Arrived muted, unmuted later: start now (the click was the gesture).
    if (!isMuted && hasGestureRef.current) void player.start();
  }, [player, isMuted]);

  useEffect(() => {
    const settings = ISLAND_CONFIG.ambience;
    const sample = (): void => {
      const mode = useIslandUiStore.getState().dayNightMode;
      const night = targetLighting(mode, game.timeOfDay).lights;
      const where = cameraFocus(game, { x: game.player.x, y: game.player.y }, ISLAND_CONFIG);
      player.setLevels(
        soundscapeLevels(
          { world: game.world, x: where.x, y: where.y },
          night,
          game.weather.intensity,
          seaDistance,
          settings,
          ISLAND_CONFIG.map.tileSizePx,
        ),
      );
    };
    sample();
    const timer = window.setInterval(sample, settings.sampleMs);
    return () => window.clearInterval(timer);
  }, [game, player, seaDistance]);

  return null;
}
