import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, type JSX } from 'react';
import { PixelPerfectCamera, type CameraBounds } from '@/shared/render/PixelPerfectCamera';
import { autoPixelScale } from '@/shared/render/pixelPerfect';
import { ISLAND_CONFIG } from '../core/config';

// TEMPORARY (M2): lets you look around the island with the keyboard until M3
// adds the player and the follow camera. M3 replaces this component.

const PAN_KEYS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [0, 1],
  KeyW: [0, 1],
  ArrowDown: [0, -1],
  KeyS: [0, -1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};
const ZOOM_IN_KEYS = new Set(['Equal', 'NumpadAdd']);
const ZOOM_OUT_KEYS = new Set(['Minus', 'NumpadSubtract']);
const MAX_FRAME_SECONDS = 0.1;

interface FreeLookCameraProps {
  /** Starting point (world units). */
  readonly start: { readonly x: number; readonly y: number };
  readonly bounds: CameraBounds;
  readonly tileSizePx: number;
}

export function FreeLookCamera({ start, bounds, tileSizePx }: FreeLookCameraProps): JSX.Element {
  const settings = ISLAND_CONFIG.render;
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);
  // Zoom = automatic handheld-like scale for the window size, nudged by +/−.
  const [zoomOffset, setZoomOffset] = useState(0);
  const autoScale = autoPixelScale(size.width * dpr, size.height * dpr, {
    targetTilesAcross: settings.targetTilesAcross,
    minTilesTall: settings.minTilesTall,
    tileSizePx,
  });
  const pixelScale = Math.min(
    settings.maxPixelScale,
    Math.max(settings.minPixelScale, autoScale + zoomOffset),
  );
  const focus = useRef({ x: start.x, y: start.y });
  const held = useRef(new Set<string>());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code in PAN_KEYS) {
        held.current.add(event.code);
        event.preventDefault();
      } else if (ZOOM_IN_KEYS.has(event.code)) {
        setZoomOffset((offset) => offset + 1);
      } else if (ZOOM_OUT_KEYS.has(event.code)) {
        setZoomOffset((offset) => offset - 1);
      }
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      held.current.delete(event.code);
    };
    const onBlur = (): void => held.current.clear();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Runs before the camera's own frame callback (lower priority first).
  useFrame((_, delta) => {
    let dx = 0;
    let dy = 0;
    for (const code of held.current) {
      const direction = PAN_KEYS[code];
      if (direction) {
        dx += direction[0];
        dy += direction[1];
      }
    }
    const step = settings.lookSpeedTilesPerSecond * tileSizePx * Math.min(delta, MAX_FRAME_SECONDS);
    const f = focus.current;
    f.x = Math.min(Math.max(f.x + dx * step, bounds.minX), bounds.maxX);
    f.y = Math.min(Math.max(f.y + dy * step, bounds.minY), bounds.maxY);
  }, -1);

  return (
    <PixelPerfectCamera pixelScale={pixelScale} getFocus={() => focus.current} bounds={bounds} />
  );
}
