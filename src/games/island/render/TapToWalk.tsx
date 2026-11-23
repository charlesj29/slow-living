import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Vector3 } from 'three';
import { ISLAND_CONFIG } from '../core/config';
import { tapAt, type GameState } from '../core/game/gameState';
import { noteActivity } from '../core/game/idleTour';
import { worldYFromMapPx } from './worldSpace';

/** A press that moves less than this (CSS px) and is let go quickly is a tap. */
const TAP_SLOP_PX = 12;
const TAP_MAX_MS = 500;

interface TapToWalkProps {
  readonly state: GameState;
}

/**
 * Taps and clicks on the canvas: turns the screen point into a map point
 * through the camera and hands it to the game (walk there, interact, or turn
 * the page of an open message). Drags and long presses are ignored.
 */
export function TapToWalk({ state }: TapToWalkProps): null {
  const canvas = useThree((three) => three.gl.domElement);
  const camera = useThree((three) => three.camera);

  useEffect(() => {
    let press: { x: number; y: number; time: number; id: number } | null = null;
    const onDown = (event: PointerEvent): void => {
      if (!event.isPrimary || event.button !== 0) return;
      press = { x: event.clientX, y: event.clientY, time: event.timeStamp, id: event.pointerId };
    };
    const onUp = (event: PointerEvent): void => {
      if (!press || event.pointerId !== press.id) return;
      const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
      const quick = event.timeStamp - press.time <= TAP_MAX_MS;
      press = null;
      if (moved > TAP_SLOP_PX || !quick) return;
      // A tap during the ambient tour just brings the camera back.
      if (noteActivity(state, ISLAND_CONFIG)) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new Vector3(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
        0,
      ).unproject(camera);
      // World y is map y flipped (the same flip both ways). Taps walk unless the D-pad is
      // there instead (phones without it have no other way to move); mouse and pen clicks
      // only if clicking to walk is switched on.
      const { touch, pointer } = ISLAND_CONFIG;
      const canWalk =
        event.pointerType === 'touch' ? !touch.controls || touch.tapToWalk : pointer.clickToWalk;
      tapAt(state, { x: ndc.x, y: worldYFromMapPx(ndc.y) }, ISLAND_CONFIG, canWalk);
    };
    const onCancel = (): void => {
      press = null;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
    };
  }, [canvas, camera, state]);
  return null;
}
