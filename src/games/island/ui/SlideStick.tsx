import { useCallback, useEffect, useRef, type JSX, type PointerEvent } from 'react';
import { pressKey, releaseKey } from '@/shared/engine/input';
import { ISLAND_CONFIG } from '../core/config';
import type { Direction } from '../core/entities/player';
import { noteActivity } from '../core/game/idleTour';
import type { GameState } from '../core/game/gameState';
import { ISLAND_KEY_BINDINGS, TOUCH_KEYS } from '../core/systems/controls';
import { stickDirection } from './stickDirection';

/** The knob may slide this far from the middle (share of the base's radius). */
const KNOB_TRAVEL = 0.55;

interface SlideStickProps {
  readonly game: GameState;
  /** Out of the way (a message is open, sitting, a panel...): lets go of any direction. */
  readonly hidden: boolean;
}

/**
 * The slide-stick (phones): put a thumb on it and slide the knob to walk. The
 * knob follows the thumb freely; walking goes the way it leans most (four
 * ways, like the keyboard). Letting go springs it back. It presses the same
 * input the arrow keys do. The knob is moved directly (no React render per move).
 */
export function SlideStick({ game, hidden }: SlideStickProps): JSX.Element {
  const knobRef = useRef<HTMLSpanElement>(null);
  const held = useRef<Direction | null>(null);

  const letGo = useCallback((): void => {
    if (held.current) releaseKey(game.input, ISLAND_KEY_BINDINGS, TOUCH_KEYS[held.current]);
    held.current = null;
  }, [game]);

  const hold = useCallback(
    (direction: Direction | null): void => {
      if (direction === held.current) return;
      letGo();
      held.current = direction;
      if (direction) pressKey(game.input, ISLAND_KEY_BINDINGS, TOUCH_KEYS[direction]);
    },
    [game, letGo],
  );

  const placeKnob = (x: number, y: number, springBack: boolean): void => {
    const knob = knobRef.current;
    if (!knob) return;
    knob.classList.toggle('is-springing', springBack);
    knob.style.transform = `translate(${String(x)}px, ${String(y)}px)`;
  };

  const release = useCallback((): void => {
    letGo();
    const knob = knobRef.current;
    if (knob) {
      knob.classList.add('is-springing');
      knob.style.transform = 'translate(0px, 0px)';
    }
  }, [letGo]);

  // Hidden mid-walk (a message opened) or gone: never leave a direction held.
  useEffect(() => {
    if (hidden) release();
  }, [hidden, release]);
  useEffect(() => letGo, [letGo]);

  const follow = (event: PointerEvent<HTMLDivElement>): void => {
    const box = event.currentTarget.getBoundingClientRect();
    const radius = box.width / 2;
    const dx = event.clientX - (box.left + radius);
    const dy = event.clientY - (box.top + radius);
    const reach = radius * KNOB_TRAVEL;
    const distance = Math.hypot(dx, dy);
    const scale = distance > reach ? reach / distance : 1;
    placeKnob(dx * scale, dy * scale, false);
    hold(stickDirection(dx, dy, reach, ISLAND_CONFIG.touch.deadZone));
  };

  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    // During the ambient tour the first touch only brings the camera back.
    if (noteActivity(game, ISLAND_CONFIG)) return;
    follow(event);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) follow(event);
  };

  return (
    <div
      className={`island-stick${hidden ? ' is-hidden' : ''}`}
      role="group"
      aria-label="Slide to walk"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <span ref={knobRef} className="island-stick-knob" />
    </div>
  );
}
