import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import { Vector3, type Mesh } from 'three';
import { pressKey, releaseKey } from '@/shared/engine/input';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { STEER_RING_KEY } from '../assets/paintUi';
import { ISLAND_CONFIG } from '../core/config';
import type { Direction } from '../core/entities/player';
import { tapAt, type GameState } from '../core/game/gameState';
import { noteActivity } from '../core/game/idleTour';
import { ISLAND_KEY_BINDINGS, TOUCH_KEYS } from '../core/systems/controls';
import { steerDirection } from '../core/systems/steer';
import { createSpriteGeometry } from './spriteGeometry';
import { createSpriteMaterial } from './spriteMaterial';
import { GROUND_DECAL_Z, worldYFromMapPx } from './worldSpace';

/** A press that moves less than this (CSS px) and is let go quickly is a tap. */
const TAP_SLOP_PX = 12;
const TAP_MAX_MS = 500;

interface Press {
  readonly id: number;
  readonly touch: boolean;
  readonly startX: number;
  readonly startY: number;
  readonly time: number;
  /** Where the finger is now (CSS px). */
  x: number;
  y: number;
  /** Held or slid: walking towards the finger instead of a tap. */
  steering: boolean;
  /** The way the player is being walked now (a touch key held down), if any. */
  held: Direction | null;
}

interface TapToWalkProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
}

/**
 * Taps, clicks and held fingers on the canvas. A quick tap or click walks
 * there (or up to the thing tapped, to use it) or turns the page of an open
 * message. On phones, a finger held down or slid steers instead: the player
 * walks towards the point under it (following as it slides) and stops when
 * it lets go; a soft ring on the ground shows where. Steering presses the same
 * touch keys the arrows do, so it is the one input path.
 */
export function TapToWalk({ state, atlas }: TapToWalkProps): JSX.Element {
  const canvas = useThree((three) => three.gl.domElement);
  const camera = useThree((three) => three.camera);
  const press = useRef<Press | null>(null);
  const ring = useRef<Mesh>(null);
  const ringGeometry = useMemo(() => createSpriteGeometry(atlas.frame(STEER_RING_KEY)), [atlas]);
  const ringMaterial = useMemo(() => createSpriteMaterial(atlas.texture), [atlas]);
  useEffect(() => () => ringGeometry.dispose(), [ringGeometry]);
  useEffect(() => () => ringMaterial.dispose(), [ringMaterial]);

  useEffect(() => {
    /** The map point under a screen point (world y is map y flipped, both ways). */
    const toMap = (clientX: number, clientY: number): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const ndc = new Vector3(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
        0,
      ).unproject(camera);
      return { x: ndc.x, y: worldYFromMapPx(ndc.y) };
    };
    const stopSteering = (): void => {
      const current = press.current;
      if (current?.held) releaseKey(state.input, ISLAND_KEY_BINDINGS, TOUCH_KEYS[current.held]);
      press.current = null;
    };
    const onDown = (event: PointerEvent): void => {
      if (!event.isPrimary || event.button !== 0) return;
      stopSteering();
      const touch = event.pointerType === 'touch';
      if (touch) canvas.setPointerCapture(event.pointerId);
      press.current = {
        id: event.pointerId,
        touch,
        startX: event.clientX,
        startY: event.clientY,
        time: event.timeStamp,
        x: event.clientX,
        y: event.clientY,
        steering: false,
        held: null,
      };
    };
    const onMove = (event: PointerEvent): void => {
      const current = press.current;
      if (!current || event.pointerId !== current.id) return;
      current.x = event.clientX;
      current.y = event.clientY;
      // A finger that slides is steering (taps barely move).
      const moved = Math.hypot(current.x - current.startX, current.y - current.startY);
      if (current.touch && moved > TAP_SLOP_PX) current.steering = true;
    };
    const onUp = (event: PointerEvent): void => {
      const current = press.current;
      if (!current || event.pointerId !== current.id) return;
      const moved = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
      const quick = event.timeStamp - current.time <= TAP_MAX_MS;
      const wasSteering = current.steering;
      stopSteering();
      if (wasSteering || moved > TAP_SLOP_PX || !quick) return;
      // A tap during the ambient tour just brings the camera back.
      if (noteActivity(state, ISLAND_CONFIG)) return;
      // Taps on phones always walk (there are no keys); mouse and pen clicks only if switched on.
      const canWalk = current.touch || ISLAND_CONFIG.pointer.clickToWalk;
      tapAt(state, toMap(event.clientX, event.clientY), ISLAND_CONFIG, canWalk);
    };
    const onCancel = (): void => stopSteering();
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    return () => {
      stopSteering();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
    };
  }, [canvas, camera, state]);

  // Steering, every frame: the finger stays put on the screen while the island scrolls
  // under it, so the point it holds keeps moving ahead of the player until it lets go.
  useFrame(() => {
    const mesh = ring.current;
    const current = press.current;
    if (mesh) mesh.visible = false;
    if (!current?.touch) return;
    const settings = ISLAND_CONFIG.touch;
    const heldLong = performance.now() - current.time >= settings.holdMs;
    if (!current.steering && heldLong) current.steering = true;
    if (!current.steering) return;
    // Busy (a message, a panel, sitting) or the tour: no walking while that lasts.
    const busy = state.dialog !== null || state.panel !== null || state.overlayOpen;
    if (current.held === null && noteActivity(state, ISLAND_CONFIG)) return;
    const rect = canvas.getBoundingClientRect();
    const ndc = new Vector3(
      ((current.x - rect.left) / rect.width) * 2 - 1,
      -((current.y - rect.top) / rect.height) * 2 + 1,
      0,
    ).unproject(camera);
    const target = { x: ndc.x, y: worldYFromMapPx(ndc.y) };
    const stopPx = settings.stopTiles * ISLAND_CONFIG.map.tileSizePx;
    const way = busy ? null : steerDirection(state.player, target, current.held, stopPx);
    if (way !== current.held) {
      if (current.held) releaseKey(state.input, ISLAND_KEY_BINDINGS, TOUCH_KEYS[current.held]);
      if (way) pressKey(state.input, ISLAND_KEY_BINDINGS, TOUCH_KEYS[way]);
      current.held = way;
    }
    if (mesh && !busy) {
      mesh.visible = true;
      mesh.position.set(
        Math.round(target.x),
        worldYFromMapPx(Math.round(target.y)),
        GROUND_DECAL_Z,
      );
    }
  });

  return <mesh ref={ring} geometry={ringGeometry} material={ringMaterial} visible={false} />;
}
