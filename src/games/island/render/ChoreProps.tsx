import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type JSX } from 'react';
import type { Mesh } from 'three';
import type { AtlasFrame } from '@/shared/render/atlasLayout';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import { BROOM_FRAME_COUNT, BROOM_SPRITE, CHORE_KEYS } from '../assets/paintChoreProps';
import type { Villager } from '../core/entities/villager';
import type { GameState } from '../core/game/gameState';
import type { LightingUniforms } from './lighting';
import { createSpriteGeometry, setSpriteGeometryFrame } from './spriteGeometry';
import { createSpriteMaterial, showAnimationFrameAt } from './spriteMaterial';
import { standingSpriteZ, worldYFromMapPx } from './worldSpace';

/** One frame of the sweeping stroke. */
const SWEEP_SECONDS = 0.22;
/**
 * Where the broom's top meets the hands: the villagers' side-view hand sits 7 px
 * above the feet, level with the body's middle (from the feet, map pixels).
 */
const HANDS = { forward: 0, up: 7 } as const;
/** The bobber rides the ripples, dipping now and then. */
const BOB_HZ = 0.7;
/** Props sit a hair in front of (or behind) the villager holding them. */
const IN_FRONT = 0.002;
/** Where a sitting reader's lap is: the sitting sprite is lifted onto the seat. */
const LAP_ABOVE_FEET_PX = 12;

type RodKey = typeof CHORE_KEYS.rodSide | typeof CHORE_KEYS.rodDown | typeof CHORE_KEYS.rodUp;

/** Each facing: which rod, where its top-left goes (from the feet), where the bobber floats, and depth. */
const ROD_BY_FACING = {
  down: { key: CHORE_KEYS.rodDown, rod: [2, -10], bobber: [6, 7], behind: false, mirror: false },
  right: { key: CHORE_KEYS.rodSide, rod: [3, -14], bobber: [13, 0], behind: false, mirror: false },
  left: { key: CHORE_KEYS.rodSide, rod: [-19, -14], bobber: [-17, 0], behind: false, mirror: true },
  up: { key: CHORE_KEYS.rodUp, rod: [2, -30], bobber: [5, -36], behind: true, mirror: false },
} as const satisfies Record<
  string,
  {
    key: RodKey;
    rod: readonly [number, number];
    bobber: readonly [number, number];
    behind: boolean;
    mirror: boolean;
  }
>;

/** Puts a mesh with its sprite's top-left at a map pixel. */
function placeTopLeft(mesh: Mesh, frame: AtlasFrame, left: number, top: number, z: number): void {
  mesh.position.set(left + frame.width / 2, worldYFromMapPx(top) - frame.height / 2, z);
}

interface ChorePropsOfProps {
  readonly villager: Villager;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

function ChorePropsOf({ villager, atlas, lighting }: ChorePropsOfProps): JSX.Element {
  const frames = useMemo(
    () => ({
      broom: atlas.frame(CHORE_KEYS.broom),
      bucket: atlas.frame(CHORE_KEYS.bucket),
      bobber: atlas.frame(CHORE_KEYS.bobber),
      book: atlas.frame(CHORE_KEYS.book),
    }),
    [atlas],
  );
  const geometries = useMemo(
    () => ({
      broom: createSpriteGeometry(frames.broom),
      bucket: createSpriteGeometry(frames.bucket),
      rod: createSpriteGeometry(atlas.frame(CHORE_KEYS.rodDown)),
      bobber: createSpriteGeometry(frames.bobber),
      book: createSpriteGeometry(frames.book),
    }),
    [atlas, frames],
  );
  // The broom sweeps on its own clock; everything else is still.
  const broomMaterial = useMemo(
    () => createSpriteMaterial(atlas.texture, lighting),
    [atlas, lighting],
  );
  const material = useMemo(() => createSpriteMaterial(atlas.texture, lighting), [atlas, lighting]);
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);
  useEffect(() => () => broomMaterial.dispose(), [broomMaterial]);
  useEffect(() => () => material.dispose(), [material]);
  const broom = useRef<Mesh>(null);
  const bucket = useRef<Mesh>(null);
  const rod = useRef<Mesh>(null);
  const bobber = useRef<Mesh>(null);
  const book = useRef<Mesh>(null);
  const shownRod = useRef<RodKey>(CHORE_KEYS.rodDown);

  useFrame(({ clock }) => {
    const working = villager.atErrand && !villager.hidden;
    const doing = working ? villager.activity : null;
    const x = Math.round(villager.x);
    const y = Math.round(villager.y);
    const z = standingSpriteZ(y);
    const t = clock.elapsedTime;

    if (broom.current) {
      broom.current.visible = doing === 'sweep';
      if (doing === 'sweep') {
        showAnimationFrameAt(broomMaterial, t, SWEEP_SECONDS, BROOM_FRAME_COUNT);
        // Side on, sweeping the ground in front; mirrored when facing left.
        const left = villager.facing === 'left';
        broom.current.scale.x = left ? -1 : 1;
        const broomLeft = left ? x - HANDS.forward - BROOM_SPRITE.width : x + HANDS.forward;
        placeTopLeft(broom.current, frames.broom, broomLeft, y - HANDS.up, z + IN_FRONT);
      }
    }
    if (bucket.current) {
      bucket.current.visible = doing === 'water';
      if (doing === 'water')
        placeTopLeft(bucket.current, frames.bucket, x + 5, y - 7, z + IN_FRONT);
    }
    const fishing = doing === 'fish';
    if (rod.current && bobber.current) {
      rod.current.visible = fishing;
      bobber.current.visible = fishing;
      if (fishing) {
        const pose = ROD_BY_FACING[villager.facing];
        if (pose.key !== shownRod.current) {
          setSpriteGeometryFrame(geometries.rod, atlas.frame(pose.key));
          shownRod.current = pose.key;
        }
        const rodFrame = atlas.frame(pose.key);
        rod.current.scale.x = pose.mirror ? -1 : 1;
        const depth = pose.behind ? z - IN_FRONT : z + IN_FRONT;
        placeTopLeft(rod.current, rodFrame, x + pose.rod[0], y + pose.rod[1], depth);
        const bob = Math.sin(t * Math.PI * 2 * BOB_HZ) > 0.55 ? 1 : 0;
        placeTopLeft(
          bobber.current,
          frames.bobber,
          x + pose.bobber[0],
          y + pose.bobber[1] + bob,
          standingSpriteZ(y + pose.bobber[1]),
        );
      }
    }
    if (book.current) {
      const reading = (doing === 'read' || doing === 'owl') && villager.sitting !== null;
      book.current.visible = reading;
      if (reading) {
        placeTopLeft(book.current, frames.book, x - 3, y - LAP_ABOVE_FEET_PX, z + IN_FRONT);
      }
    }
  });

  return (
    <group>
      <mesh ref={broom} geometry={geometries.broom} material={broomMaterial} visible={false} />
      <mesh ref={bucket} geometry={geometries.bucket} material={material} visible={false} />
      <mesh ref={rod} geometry={geometries.rod} material={material} visible={false} />
      <mesh ref={bobber} geometry={geometries.bobber} material={material} visible={false} />
      <mesh ref={book} geometry={geometries.book} material={material} visible={false} />
    </group>
  );
}

interface ChorePropsProps {
  readonly state: GameState;
  readonly atlas: SpriteAtlas;
  readonly lighting: LightingUniforms;
}

/** The brooms, buckets, rods and books of the villagers' day (island only). */
export function ChoreProps({ state, atlas, lighting }: ChorePropsProps): JSX.Element {
  return (
    <group>
      {state.villagers.map((villager) => (
        <ChorePropsOf key={villager.id} villager={villager} atlas={atlas} lighting={lighting} />
      ))}
    </group>
  );
}
