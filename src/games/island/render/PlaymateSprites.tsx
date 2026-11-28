import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { BufferGeometry, Mesh } from 'three';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { BUBBLE_KINDS, bubbleKey } from '../assets/paintBubbles';
import { BALL_KEY, KID_FRAMES, kidKey, type KidView } from '../assets/paintPlaymates';
import { DOG_FRAMES, dogKey, type DogView } from '../assets/paintPuppy';
import { SHADOW_KEYS } from '../assets/paintShadows';
import type { BubbleKind } from '../core/entities/villager';
import type { GameState } from '../core/game/gameState';
import { BALL_ARC_PX, type Playmates } from '../core/systems/playmates';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry, setSpriteGeometryFrame } from './spriteGeometry';
import { createShadowMaterial, createSpriteMaterial, setAnimationFrame } from './spriteMaterial';
import { SHADOW_Z, standingSpriteZ, worldYFromMapPx } from './worldSpace';

const WALK_FRAME_SECONDS = 0.16;
const TROT_FRAME_SECONDS = 0.12;
const WAG_FRAME_SECONDS = 0.15;
/** Feet sit this far above the sprites' bottom edge (the outline row). */
const FOOT_INSET_PX = 1;
/** Where the ball sits in the kid's hand (raised when throwing) and the puppy's mouth. */
const HAND = { side: 5, up: 2, raised: 9 } as const;
const MOUTH = { side: 7, up: 5, upFront: 4 } as const;
/** Speech bubbles float above the head; bubbles draw over everything else. */
const BUBBLE_ABOVE = { kid: 24, dog: 18 } as const;
const BUBBLE_Z = 40;
const IN_FRONT = 0.002;

function kidView(p: Playmates): KidView {
  return p.kid.facing === 'up' ? 'back' : p.kid.facing === 'down' ? 'front' : 'side';
}

function kidFrame(p: Playmates, seconds: number): number {
  if (p.kid.moving) return KID_FRAMES.walk[Math.floor(seconds / WALK_FRAME_SECONDS) % 2] ?? 0;
  return p.kid.pose === 'throw'
    ? KID_FRAMES.throw
    : p.kid.pose === 'cheer'
      ? KID_FRAMES.cheer
      : KID_FRAMES.stand;
}

/** The puppy's view: back going up, front coming down, else the side (asleep: always the side). */
function dogViewOf(p: Playmates): DogView {
  if (p.dog.pose === 'sleep') return 'side';
  return p.dog.facing === 'up' ? 'back' : p.dog.facing === 'down' ? 'front' : 'side';
}

function dogFrame(p: Playmates, seconds: number): number {
  const { dog } = p;
  if (dog.moving) return DOG_FRAMES.trot[Math.floor(seconds / TROT_FRAME_SECONDS) % 2] ?? 0;
  if (dog.pose === 'sleep') return DOG_FRAMES.sleep;
  if (dog.pose === 'sniff') return DOG_FRAMES.sniff;
  if (dog.pose === 'wag') {
    return Math.floor(seconds / WAG_FRAME_SECONDS) % 2 === 0 ? DOG_FRAMES.wag : DOG_FRAMES.sit;
  }
  return DOG_FRAMES.sit;
}

interface PlaymateSpritesProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/** The village kid, their puppy, the ball and their little bubbles (island only). */
export function PlaymateSprites({
  state,
  atlas,
  lighting,
}: PlaymateSpritesProps): JSX.Element | null {
  const p = state.playmates;
  const kidFrameSize = atlas.frame(kidKey('front'));
  const dogFrameSize = atlas.frame(dogKey('side'));
  const ballFrame = atlas.frame(BALL_KEY);
  const geometries = useMemo(
    () => ({
      kid: createSpriteGeometry(atlas.frame(kidKey('front'))),
      dog: createSpriteGeometry(atlas.frame(dogKey('side'))),
      ball: createSpriteGeometry(atlas.frame(BALL_KEY)),
      shadow: createSpriteGeometry(atlas.frame(SHADOW_KEYS.small)),
      tinyShadow: createSpriteGeometry(atlas.frame(SHADOW_KEYS.tiny)),
      bubbles: new Map<BubbleKind, BufferGeometry>(
        BUBBLE_KINDS.map((kind) => [kind, createSpriteGeometry(atlas.frame(bubbleKey(kind)))]),
      ),
    }),
    [atlas],
  );
  const materials = useMemo(
    () => ({
      kid: createSpriteMaterial(atlas.texture, lighting),
      dog: createSpriteMaterial(atlas.texture, lighting),
      still: createSpriteMaterial(atlas.texture, lighting),
      bubble: createSpriteMaterial(atlas.texture),
      shadow: createShadowMaterial(atlas.texture, lighting),
    }),
    [atlas, lighting],
  );
  useEffect(
    () => () => {
      const { bubbles, ...rest } = geometries;
      Object.values(rest).forEach((g) => g.dispose());
      bubbles.forEach((g) => g.dispose());
    },
    [geometries],
  );
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);
  const kid = useRef<Mesh>(null);
  const dog = useRef<Mesh>(null);
  const ball = useRef<Mesh>(null);
  const kidShadow = useRef<Mesh>(null);
  const dogShadow = useRef<Mesh>(null);
  const ballShadow = useRef<Mesh>(null);
  const bubble = useRef<Mesh>(null);
  const shownView = useRef<KidView>('front');
  const dogSide = useRef<'left' | 'right'>('left');
  const shownDogView = useRef<DogView>('side');

  useFrame(({ clock }) => {
    if (!p || !kid.current || !dog.current || !ball.current) return;
    if (!kidShadow.current || !dogShadow.current || !ballShadow.current || !bubble.current) return;
    const seconds = clock.elapsedTime;
    const t = state.interpolation;
    const at = (m: Playmates['kid'] | Playmates['dog']): [number, number] => [
      Math.round(m.previousX + (m.x - m.previousX) * t),
      Math.round(m.previousY + (m.y - m.previousY) * t),
    ];

    // The kid: front, back or side (mirrored to the right).
    const [kx, ky] = at(p.kid);
    kid.current.visible = !p.kid.hidden;
    kidShadow.current.visible = !p.kid.hidden;
    const view = kidView(p);
    if (view !== shownView.current) {
      setSpriteGeometryFrame(geometries.kid, atlas.frame(kidKey(view)));
      shownView.current = view;
    }
    setAnimationFrame(materials.kid, kidFrame(p, seconds));
    kid.current.scale.x = p.kid.facing === 'right' ? -1 : 1;
    kid.current.position.set(
      kx,
      worldYFromMapPx(ky + FOOT_INSET_PX) + kidFrameSize.height / 2,
      standingSpriteZ(ky),
    );
    kidShadow.current.position.set(kx + 1, worldYFromMapPx(ky), SHADOW_Z);

    // The puppy: seen from the side, keeping its last sideways look when going up or down.
    const [dx, dy] = at(p.dog);
    if (p.dog.facing === 'left' || p.dog.facing === 'right') dogSide.current = p.dog.facing;
    const dogView = dogViewOf(p);
    if (dogView !== shownDogView.current) {
      setSpriteGeometryFrame(geometries.dog, atlas.frame(dogKey(dogView)));
      shownDogView.current = dogView;
    }
    setAnimationFrame(materials.dog, dogFrame(p, seconds));
    dog.current.scale.x = dogView === 'side' && dogSide.current === 'right' ? -1 : 1;
    dog.current.position.set(
      dx,
      worldYFromMapPx(dy + FOOT_INSET_PX) + dogFrameSize.height / 2,
      standingSpriteZ(dy),
    );
    dogShadow.current.position.set(dx + 1, worldYFromMapPx(dy), SHADOW_Z);

    // The ball: in the kid's hand, the puppy's mouth, flying, or on the grass.
    const b = p.ball;
    const kidSide = p.kid.facing === 'left' ? -1 : 1;
    const dogFacing = dogSide.current === 'left' ? -1 : 1;
    let bx = Math.round(b.x);
    let by = Math.round(b.y);
    let lift = 0;
    let z = standingSpriteZ(by);
    if (b.holder === 'kid') {
      bx = kx + kidSide * HAND.side;
      by = ky;
      lift = p.kid.pose === 'throw' ? HAND.raised : HAND.up;
      z = standingSpriteZ(ky) + (p.kid.facing === 'up' ? -IN_FRONT : IN_FRONT);
    } else if (b.holder === 'dog') {
      // In the mouth: to the side, or in front of (or hidden behind) the head.
      bx = dogView === 'side' ? dx + dogFacing * MOUTH.side : dx;
      by = dy;
      lift = dogView === 'side' ? MOUTH.up : MOUTH.upFront;
      z = standingSpriteZ(dy) + (dogView === 'back' ? -IN_FRONT : IN_FRONT);
    } else if (b.flight) {
      lift = Math.round(Math.sin(Math.PI * b.flight.t) * BALL_ARC_PX);
    }
    ball.current.visible = !(b.holder === 'kid' && p.kid.hidden);
    ball.current.position.set(
      bx - Math.floor(ballFrame.width / 2) + ballFrame.width / 2,
      worldYFromMapPx(by - lift) + ballFrame.height / 2,
      z,
    );
    ballShadow.current.visible = b.holder === 'none';
    ballShadow.current.position.set(bx, worldYFromMapPx(by), SHADOW_Z);

    // A heart over whoever is happy.
    const speech = p.bubble;
    bubble.current.visible = speech !== null && !(speech.who === 'kid' && p.kid.hidden);
    if (speech) {
      const geometry = geometries.bubbles.get(speech.kind);
      if (geometry && bubble.current.geometry !== geometry) bubble.current.geometry = geometry;
      const [sx, sy] = speech.who === 'kid' ? [kx, ky] : [dx, dy];
      const above = speech.who === 'kid' ? BUBBLE_ABOVE.kid : BUBBLE_ABOVE.dog;
      bubble.current.position.set(sx + 6, worldYFromMapPx(sy - above), BUBBLE_Z);
    }
  });

  if (!p) return null;
  return (
    <group>
      <mesh ref={kidShadow} geometry={geometries.shadow} material={materials.shadow} />
      <mesh ref={dogShadow} geometry={geometries.shadow} material={materials.shadow} />
      <mesh ref={ballShadow} geometry={geometries.tinyShadow} material={materials.shadow} />
      <mesh ref={kid} geometry={geometries.kid} material={materials.kid} />
      <mesh ref={dog} geometry={geometries.dog} material={materials.dog} />
      <mesh ref={ball} geometry={geometries.ball} material={materials.still} />
      <mesh
        ref={bubble}
        geometry={geometries.bubbles.get('heart')}
        material={materials.bubble}
        visible={false}
      />
    </group>
  );
}
