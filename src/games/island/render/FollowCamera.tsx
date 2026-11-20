import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, type JSX } from 'react';
import { approach } from '@/shared/engine/math';
import { PixelPerfectCamera, type CameraBounds } from '@/shared/render/PixelPerfectCamera';
import { autoPixelScale } from '@/shared/render/pixelPerfect';
import { ISLAND_CONFIG } from '../core/config';

const ZOOM_IN_KEYS = new Set(['Equal', 'NumpadAdd']);
const ZOOM_OUT_KEYS = new Set(['Minus', 'NumpadSubtract']);
/** After the game loop (−2), before rendering. */
const CAMERA_PRIORITY = -1;

interface Point {
  readonly x: number;
  readonly y: number;
}

interface FollowCameraProps {
  /** Called every frame: the world point to follow. */
  readonly getTarget: () => Point;
  readonly bounds: CameraBounds;
  readonly tileSizePx: number;
}

/**
 * Smoothly follows a target, stays inside the map and keeps the pixel-perfect
 * handheld-like zoom: automatic for the window size, starting `defaultZoomSteps` out (the
 * user's preferred framing), adjusted with + / −.
 */
export function FollowCamera({ getTarget, bounds, tileSizePx }: FollowCameraProps): JSX.Element {
  const settings = ISLAND_CONFIG.render;
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);
  const [zoomOffset, setZoomOffset] = useState(settings.defaultZoomSteps);
  const autoScale = autoPixelScale(size.width * dpr, size.height * dpr, {
    targetTilesAcross: settings.targetTilesAcross,
    minTilesTall: settings.minTilesTall,
    tileSizePx,
  });
  const pixelScale = Math.min(
    settings.maxPixelScale,
    Math.max(settings.minPixelScale, autoScale + zoomOffset),
  );
  const focus = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Keep the offset within what can actually be shown, so pressing past a
    // limit doesn't pile up presses that the opposite key must undo first.
    const lowest = settings.minPixelScale - autoScale;
    const highest = settings.maxPixelScale - autoScale;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (ZOOM_IN_KEYS.has(event.code)) {
        setZoomOffset((offset) => Math.min(highest, Math.max(lowest, offset) + 1));
      } else if (ZOOM_OUT_KEYS.has(event.code)) {
        setZoomOffset((offset) => Math.max(lowest, Math.min(highest, offset) - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [autoScale, settings.minPixelScale, settings.maxPixelScale]);

  useFrame((_, deltaSeconds) => {
    const target = getTarget();
    // Start on the target (no swoop on load), then ease towards it.
    focus.current ??= { x: target.x, y: target.y };
    const f = focus.current;
    f.x = approach(f.x, target.x, settings.cameraFollowSharpness, deltaSeconds);
    f.y = approach(f.y, target.y, settings.cameraFollowSharpness, deltaSeconds);
  }, CAMERA_PRIORITY);

  return (
    <PixelPerfectCamera
      pixelScale={pixelScale}
      getFocus={() => focus.current ?? getTarget()}
      bounds={bounds}
    />
  );
}
