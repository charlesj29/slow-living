// The village puppy, soft and round like the rabbits: a chubby tan pup with
// floppy ears, a cream muzzle and a curly tail. Three views, like the kid:
// side (facing left; mirrored for right), front (coming towards you) and back
// (going away), each with six frames: sit, wag, two trot steps, sniff (nose
// down) and asleep (curled up; always drawn from the side).
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { hexToRgba, type Rgba } from '@/shared/render/pixelCanvas';
import { capsule, ellipse, outline, put, softCanvas, softGrid, type SoftGrid } from './softShapes';

export const DOG_FRAMES = { sit: 0, wag: 1, trot: [2, 3], sniff: 4, sleep: 5 } as const;
export const DOG_FRAME_COUNT = 6;
export const DOG_VIEWS = ['side', 'front', 'back'] as const;
export type DogView = (typeof DOG_VIEWS)[number];
export const dogKey = (view: DogView): string => `dog_${view}`;

const DOG_W = 17;
const DOG_H = 13;
/** The middle of the front and back views. */
const MID = 8;

/** Curled up asleep, seen from the side. */
function sleeping(): SoftGrid {
  const g = softGrid(DOG_W, DOG_H);
  capsule(g, 13, 9.4, 11, 11.4, 1.1, 'w'); // the tail curled round
  ellipse(g, 8.6, 9.4, 5.6, 2.6, 'w', 's');
  ellipse(g, 4.4, 9.6, 3.1, 2.4, 'w');
  capsule(g, 5.6, 8, 6.6, 10, 1, 'k');
  ellipse(g, 2.6, 10.4, 1.5, 1.1, 'b');
  put(g, 1.2, 10, 'n');
  put(g, 3.4, 9.4, 'o'); // a closed eye
  put(g, 4.2, 10.6, 'p');
  outline(g);
  return g;
}

/** The puppy facing left; paws on the bottom row. */
function side(frame: number): SoftGrid {
  if (frame === DOG_FRAMES.sleep) return sleeping();
  const g = softGrid(DOG_W, DOG_H);
  const sitting = frame === DOG_FRAMES.sit || frame === DOG_FRAMES.wag;
  const sniffing = frame === DOG_FRAMES.sniff;
  // The tail: up and curled, swishing the other way when wagging.
  const tailTip = frame === DOG_FRAMES.wag ? [15.4, 6.4] : [14.6, 3.8];
  capsule(g, 12.6, sitting ? 8.6 : 7, tailTip[0] ?? 0, tailTip[1] ?? 0, 1.1, 'w');
  if (sitting) {
    ellipse(g, 11, 10.4, 2.6, 1.8, 'w', 's'); // the haunch
    capsule(g, 6.8, 9, 6.8, 11.8, 0.9, 'w');
    capsule(g, 8.4, 9, 8.4, 11.8, 0.9, 's');
    ellipse(g, 9.4, 8.2, 3.6, 3.2, 'w', 's');
    ellipse(g, 8.4, 9.6, 1.8, 1.6, 'b');
  } else {
    const step = frame === DOG_FRAMES.trot[0] ? 1 : frame === DOG_FRAMES.trot[1] ? -1 : 0;
    capsule(g, 5.8, 9.5, 5.8 - step, 11.8, 0.9, 'w');
    capsule(g, 7.4, 9.5, 7.4 + step, 11.8, 0.9, 's');
    capsule(g, 11, 9.5, 11 + step, 11.8, 0.9, 's');
    capsule(g, 12.6, 9.5, 12.6 - step, 11.8, 0.9, 'w');
    ellipse(g, 9.2, 8.2, 4.8, 3, 'w', 's');
    ellipse(g, 8.6, 9.6, 2.8, 1.3, 'b');
  }
  const hx = sitting ? 5.6 : sniffing ? 4 : 4.6;
  const hy = sitting ? 4.6 : sniffing ? 8.2 : 5.8;
  ellipse(g, hx, hy, 3.3, 3, 'w');
  capsule(g, hx + 1.2, hy - 2, hx + 2, hy + 0.6, 1, 'k'); // a floppy ear
  ellipse(g, hx - 2.2, hy + 1, 1.6, 1.2, 'b'); // the muzzle
  put(g, hx - 3.4, hy + 0.4, 'n');
  put(g, hx - 0.9, hy - 0.6, 'e');
  put(g, hx - 0.2, hy + 1.2, 'p');
  outline(g);
  return g;
}

/** Which way the legs are stepping: 0 still, ±1 mid-trot. */
const stepOf = (frame: number): number =>
  frame === DOG_FRAMES.trot[0] ? 1 : frame === DOG_FRAMES.trot[1] ? -1 : 0;

/** Two legs, one lifted (shorter) while trotting. */
function legs(g: SoftGrid, frame: number, spread: number, letter: string): void {
  const step = stepOf(frame);
  capsule(g, MID - spread, 9.6, MID - spread, step > 0 ? 11 : 11.8, 0.9, letter);
  capsule(g, MID + spread, 9.6, MID + spread, step < 0 ? 11 : 11.8, 0.9, letter);
}

/** Floppy ears hanging either side of the head. */
function ears(g: SoftGrid, hy: number): void {
  capsule(g, MID - 2.6, hy - 2, MID - 3.6, hy + 0.8, 1, 'k');
  capsule(g, MID + 2.6, hy - 2, MID + 3.6, hy + 0.8, 1, 'k');
}

/** Coming towards you: round face, both eyes, muzzle and nose, paws in front. */
function front(frame: number): SoftGrid {
  if (frame === DOG_FRAMES.sleep) return sleeping();
  const g = softGrid(DOG_W, DOG_H);
  const sitting = frame === DOG_FRAMES.sit || frame === DOG_FRAMES.wag;
  // The tail peeps out behind, swishing from side to side when wagging.
  const swish = frame === DOG_FRAMES.wag ? 1 : -1;
  capsule(g, MID + swish * 2.4, 8, MID + swish * 5, 5.6, 1, 'w');
  ellipse(g, MID, sitting ? 9.2 : 8.8, 3.8, 3, 'w', 's');
  legs(g, frame, 1.6, 'w');
  ellipse(g, MID, sitting ? 9.6 : 9.4, 1.8, 1.8, 'b'); // the chest
  const hy = frame === DOG_FRAMES.sniff ? 7 : sitting ? 4.4 : 5;
  ellipse(g, MID, hy, 3.5, 3.1, 'w');
  ears(g, hy);
  ellipse(g, MID, hy + 1.5, 1.7, 1.2, 'b'); // the muzzle
  put(g, MID, hy + 0.9, 'n');
  if (frame !== DOG_FRAMES.sniff) {
    put(g, MID - 1.5, hy - 0.4, 'e');
    put(g, MID + 1.5, hy - 0.4, 'e');
  }
  put(g, MID - 2.4, hy + 1.2, 'p');
  put(g, MID + 2.4, hy + 1.2, 'p');
  outline(g);
  return g;
}

/** Going away: the back of the head and ears, the curly tail on top. */
function back(frame: number): SoftGrid {
  if (frame === DOG_FRAMES.sleep) return sleeping();
  const g = softGrid(DOG_W, DOG_H);
  const sitting = frame === DOG_FRAMES.sit || frame === DOG_FRAMES.wag;
  const hy = frame === DOG_FRAMES.sniff ? 6.4 : sitting ? 4.2 : 4.8;
  // With the nose down, the head dips behind the body.
  if (frame === DOG_FRAMES.sniff) {
    ellipse(g, MID, hy, 3.4, 3, 'w');
    ears(g, hy);
  }
  legs(g, frame, 1.8, 's');
  ellipse(g, MID, sitting ? 9.2 : 8.8, 3.9, 3.1, 'w', 's');
  if (frame !== DOG_FRAMES.sniff) {
    // Ringed in outline, so the head stands out against the body behind it.
    ellipse(g, MID, hy, 4.2, 3.8, 'o');
    ellipse(g, MID, hy, 3.3, 2.9, 'w');
    ears(g, hy);
  }
  // The curly tail (darker, with a cream tip) over the back, swishing when wagging.
  const tip = frame === DOG_FRAMES.wag ? MID - 2.2 : MID + 2.2;
  capsule(g, MID, 10, tip, 7.6, 1.1, 'k');
  capsule(g, tip, 7.6, tip + (tip < MID ? 1 : -1), 6.4, 0.8, 'k');
  put(g, tip + (tip < MID ? 1 : -1), 6.2, 'b');
  outline(g);
  return g;
}

const DOG_COLORS: Readonly<Record<string, Rgba>> = {
  o: hexToRgba('#5a3624'),
  w: hexToRgba('#f0b878'),
  s: hexToRgba('#d4955a'),
  b: hexToRgba('#fff3e2'),
  k: hexToRgba('#c47a44'),
  e: hexToRgba('#2a1a14'),
  n: hexToRgba('#3a2420'),
  p: hexToRgba('#f5a6a0'),
};

const DRAW: Readonly<Record<DogView, (frame: number) => SoftGrid>> = { side, front, back };

export function paintPuppySprites(): SpriteSource[] {
  return DOG_VIEWS.map((view) => ({
    key: dogKey(view),
    frames: Array.from({ length: DOG_FRAME_COUNT }, (_, frame) =>
      softCanvas(DRAW[view](frame), DOG_COLORS),
    ),
  }));
}
