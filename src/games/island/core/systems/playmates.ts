// A village kid and a puppy. By day they play in a field just outside the village: fetch (the kid
// throws the ball, the puppy dashes after it and brings it back, the kid
// cheers), chase (the kid runs about, the puppy at their heels) and a rest
// (the puppy sits wagging). When the player comes near, the puppy trots over,
// sniffs and wags with a heart, then goes back to play. At dusk they go home:
// the kid indoors, the puppy curled up asleep by the door. In the rain the kid
// goes indoors too and the puppy waits by the door, out of the rain. Pure: the fixed
// step moves them; randomness comes from the rng passed in.
import type { Rng } from '@/shared/engine/random';
import type { IslandConfig } from '../config';
import type { BubbleKind } from '../entities/villager';
import type { Player } from '../entities/player';
import { villagerSpawns } from '../world/village';
import type { World } from '../world/world';
import {
  besideTile,
  centreOf,
  facingTowards,
  routeTo,
  stepAlong,
  tileDistance,
  tileOf,
  type Ground,
  type Mate,
} from './playmateMotion';
import { tileUnder, type Spot } from './bodies';
import { playField } from './playField';
import { pickPuddles } from './puddles';

type PlaySettings = IslandConfig['playmates'];

export type KidPose = 'stand' | 'throw' | 'cheer';
export type DogPose = 'sit' | 'wag' | 'sniff' | 'sleep';
export type PlayMode = 'rest' | 'fetch' | 'chase' | 'greet' | 'home' | 'splash';
type FetchPhase = 'aim' | 'run' | 'bring' | 'cheer';

export interface Ball {
  /** Map pixels, while it flies or lies on the ground (otherwise it's in a hand or a mouth). */
  x: number;
  y: number;
  holder: 'kid' | 'dog' | 'none';
  flight: {
    readonly fromX: number;
    readonly fromY: number;
    readonly toX: number;
    readonly toY: number;
    readonly seconds: number;
    t: number;
  } | null;
}

export interface Playmates {
  readonly kid: Mate & { pose: KidPose; hidden: boolean };
  readonly dog: Mate & { pose: DogPose };
  readonly ball: Ball;
  mode: PlayMode;
  phase: FetchPhase;
  /** Seconds left of the current rest, chase, pose or greeting step. */
  timer: number;
  throwsLeft: number;
  greetCooldown: number;
  bubble: { readonly who: 'kid' | 'dog'; readonly kind: BubbleKind; seconds: number } | null;
  /** The kid's front door (tile), and where the puppy sleeps beside it. */
  readonly door: number;
  readonly bed: number;
  /** Where they play: open ground round the well. */
  readonly playground: readonly number[];
  /** Where puddles form in the field after rain; the one the kid is splashing in; how wet it is. */
  readonly puddles: readonly number[];
  splashAt: number | null;
  wet: number;
  readonly ground: Ground;
}

/** How high a thrown ball arcs (map pixels) and how fast it flies (map pixels per second). */
export const BALL_ARC_PX = 14;
const BALL_SPEED_PX = 90;
const AIM_SECONDS = 0.7;
const CHEER_SECONDS = 1.3;
const SNIFF_SECONDS = 1.2;
const WAG_SECONDS = 1.8;
const HEART_SECONDS = 1.6;
/** While chasing, the puppy looks again for the kid this often (seconds). */
const FOLLOW_EVERY_SECONDS = 0.5;
/** The kid runs a little in a chase. */
const CHASE_PACE = 1.4;
/** A greeting is given up if the player walks this far off (tiles). */
const GREET_GIVE_UP_TILES = 7;
const THROW_TRIES = 16;
/** Puddles this full tempt the kid out to splash; a jump lasts this long. */
const SPLASH_WET = 0.3;
const SPLASH_JUMP_SECONDS = 0.35;
const PUDDLE_SALT = 0x5b1a;

const dayFraction = (time: number): number => time - Math.floor(time);
const within = (time: number, [from, to]: readonly [number, number]): boolean => {
  const t = dayFraction(time);
  return from <= to ? t >= from && t < to : t >= from || t < to;
};

function mateAt(x: number, y: number, speedPx: number): Mate {
  return {
    x,
    y,
    previousX: x,
    previousY: y,
    facing: 'down',
    route: [],
    speedPx,
    moving: false,
    avoid: null,
    waitTime: 0,
  };
}

export function createPlaymates(
  world: World,
  walkable: ReadonlySet<number>,
  settings: PlaySettings,
  tileSizePx: number,
  fieldPuddles = 0,
): Playmates | null {
  if (!settings.enabled || !world.village) return null;
  // The village doors: passed through, never sat on (whoever lives there comes and goes).
  const doorTiles = villagerSpawns(world).map((p) => p.y * world.width + p.x);
  const ground: Ground = {
    world,
    walkable,
    tileSizePx,
    occupied: new Set(),
    keepClear: new Set(doorTiles),
  };
  const well = world.objects.find((object) => object.kind === 'well');
  const centre = well ? { x: well.x + 1, y: well.y + 1 } : null;
  const near = (tile: number, point: { x: number; y: number }): number =>
    Math.hypot((tile % world.width) - point.x, Math.floor(tile / world.width) - point.y);
  // The kid lives in the house nearest the well, and plays in a field just outside the village.
  const doors = doorTiles.filter((tile) => walkable.has(tile));
  const door = centre ? doors.sort((a, b) => near(a, centre) - near(b, centre))[0] : doors[0];
  if (door === undefined) return null;
  const playground = playField(world, walkable, door, settings);
  if (playground.length === 0) return null;
  const doorCentre = centreOf(door, ground);
  const bed = besideTile(door, { x: doorCentre.x - tileSizePx, y: doorCentre.y }, ground) ?? door;
  const bedCentre = centreOf(bed, ground);
  // They start out in their field (the island opens mid-morning), the puppy beside the kid.
  const start = playground.reduce((best, tile) =>
    tileDistance(tile, door, ground) < tileDistance(best, door, ground) ? tile : best,
  );
  const startCentre = centreOf(start, ground);
  const pup = besideTile(start, startCentre, ground);
  const pupCentre = pup === null ? bedCentre : centreOf(pup, ground);
  return {
    kid: {
      ...mateAt(startCentre.x, startCentre.y, settings.kidSpeedTilesPerSecond * tileSizePx),
      pose: 'stand',
      hidden: false,
    },
    dog: {
      ...mateAt(pupCentre.x, pupCentre.y, settings.dogSpeedTilesPerSecond * tileSizePx),
      pose: 'sit',
    },
    ball: { x: startCentre.x, y: startCentre.y, holder: 'kid', flight: null },
    mode: 'rest',
    phase: 'aim',
    timer: settings.restSeconds,
    throwsLeft: 0,
    greetCooldown: 0,
    bubble: null,
    door,
    bed,
    playground,
    puddles: pickPuddles(world, playground, fieldPuddles, PUDDLE_SALT),
    splashAt: null,
    wet: 0,
    ground,
  };
}

function say(p: Playmates, who: 'kid' | 'dog', kind: BubbleKind): void {
  p.bubble = { who, kind, seconds: HEART_SECONDS };
}

/** The puppy goes to sit beside the kid (true once there). */
function dogToKid(p: Playmates, stepSeconds: number): boolean {
  const kidTile = tileOf(p.kid, p.ground);
  const dogTile = tileOf(p.dog, p.ground);
  if (p.dog.route.length === 0 && tileDistance(dogTile, kidTile, p.ground) > 1.01) {
    const spot = besideTile(kidTile, p.dog, p.ground);
    if (spot !== null) routeTo(p.dog, spot, p.ground);
  }
  const there =
    stepAlong(p.dog, stepSeconds, p.ground) &&
    tileDistance(tileOf(p.dog, p.ground), kidTile, p.ground) <= 1.01;
  if (there) p.dog.facing = facingTowards(p.dog, p.kid);
  return there;
}

function startMode(p: Playmates, mode: PlayMode, rng: Rng, settings: PlaySettings): void {
  p.mode = mode;
  p.kid.pose = 'stand';
  p.dog.speedPx = settings.dogSpeedTilesPerSecond * p.ground.tileSizePx;
  p.kid.speedPx = settings.kidSpeedTilesPerSecond * p.ground.tileSizePx;
  if (mode === 'rest') p.timer = settings.restSeconds;
  if (mode === 'chase') {
    p.timer = settings.chaseSeconds;
    p.kid.speedPx *= CHASE_PACE;
  }
  if (mode === 'fetch') {
    p.phase = 'aim';
    p.timer = AIM_SECONDS;
    p.throwsLeft = rng.int(settings.throwsPerGame.min, settings.throwsPerGame.max);
  }
  if (mode === 'greet') p.timer = 0;
  if (mode === 'splash') {
    p.timer = settings.splashSeconds;
    const here = tileOf(p.kid, p.ground);
    p.splashAt = p.puddles.reduce<number | null>(
      (best, t) =>
        best === null || tileDistance(t, here, p.ground) < tileDistance(best, here, p.ground)
          ? t
          : best,
      null,
    );
    if (p.splashAt !== null) routeTo(p.kid, p.splashAt, p.ground);
  }
}

/** Somewhere to throw the ball: playground a few tiles off that the puppy can reach. */
function throwTarget(p: Playmates, rng: Rng, settings: PlaySettings): number | null {
  const from = tileOf(p.kid, p.ground);
  for (let i = 0; i < THROW_TRIES; i++) {
    const tile = rng.pick(p.playground);
    const d = tileDistance(from, tile, p.ground);
    if (d >= settings.throwTiles.min && d <= settings.throwTiles.max) return tile;
  }
  return null;
}

function updateFetch(p: Playmates, rng: Rng, stepSeconds: number, settings: PlaySettings): void {
  const { kid, dog, ball } = p;
  switch (p.phase) {
    case 'aim': {
      if (!dogToKid(p, stepSeconds)) return;
      p.timer -= stepSeconds;
      kid.pose = p.timer < AIM_SECONDS / 2 ? 'throw' : 'stand';
      if (p.timer > 0) return;
      const target = throwTarget(p, rng, settings);
      if (target === null || !routeTo(dog, target, p.ground)) {
        startMode(p, 'rest', rng, settings);
        return;
      }
      const to = centreOf(target, p.ground);
      kid.facing = facingTowards(kid, to);
      ball.holder = 'none';
      ball.flight = {
        fromX: kid.x,
        fromY: kid.y,
        toX: to.x,
        toY: to.y,
        seconds: Math.max(0.4, Math.hypot(to.x - kid.x, to.y - kid.y) / BALL_SPEED_PX),
        t: 0,
      };
      dog.speedPx = settings.dogRunSpeedTilesPerSecond * p.ground.tileSizePx;
      p.phase = 'run';
      return;
    }
    case 'run': {
      if (ball.flight) {
        const f = ball.flight;
        f.t = Math.min(1, f.t + stepSeconds / f.seconds);
        ball.x = f.fromX + (f.toX - f.fromX) * f.t;
        ball.y = f.fromY + (f.toY - f.fromY) * f.t;
        if (f.t >= 1) ball.flight = null;
      }
      kid.pose = 'stand';
      const arrived = stepAlong(dog, stepSeconds, p.ground);
      if (!arrived || ball.flight) return;
      ball.holder = 'dog';
      dog.speedPx = settings.dogSpeedTilesPerSecond * p.ground.tileSizePx;
      p.phase = 'bring';
      return;
    }
    case 'bring': {
      if (!dogToKid(p, stepSeconds)) return;
      ball.holder = 'kid';
      kid.pose = 'cheer';
      kid.facing = facingTowards(kid, dog);
      dog.pose = 'wag';
      say(p, 'kid', 'heart');
      p.phase = 'cheer';
      p.timer = CHEER_SECONDS;
      return;
    }
    case 'cheer': {
      p.timer -= stepSeconds;
      if (p.timer > 0) return;
      kid.pose = 'stand';
      p.throwsLeft -= 1;
      if (p.throwsLeft > 0) {
        p.phase = 'aim';
        p.timer = AIM_SECONDS;
      } else startMode(p, rng.chance(0.5) ? 'chase' : 'rest', rng, settings);
    }
  }
}

function updateRest(p: Playmates, rng: Rng, stepSeconds: number, settings: PlaySettings): void {
  const kidTile = tileOf(p.kid, p.ground);
  // Out of the house in the morning: off to play first.
  if (!p.playground.includes(kidTile) && p.kid.route.length === 0) {
    const field = rng.pick(p.playground);
    // If the puppy is the only thing in the way, squeeze past rather than wait for ever.
    if (!routeTo(p.kid, field, p.ground)) {
      const avoid = p.kid.avoid;
      p.kid.avoid = null;
      routeTo(p.kid, field, p.ground);
      p.kid.avoid = avoid;
    }
  }
  stepAlong(p.kid, stepSeconds, p.ground);
  // While the kid walks, the puppy waits (trotting alongside it kept stepping into the kid's way);
  // once the kid is there, it comes to sit beside them.
  if (p.kid.route.length > 0) {
    stepAlong(p.dog, stepSeconds, p.ground);
    return;
  }
  if (dogToKid(p, stepSeconds)) p.dog.pose = Math.floor(p.timer * 2) % 3 === 0 ? 'wag' : 'sit';
  p.timer -= stepSeconds;
  if (p.timer > 0) return;
  // After a shower, off to splash in a puddle; otherwise fetch or chase.
  const splashy = p.wet > SPLASH_WET && p.puddles.length > 0 && rng.chance(0.7);
  startMode(p, splashy ? 'splash' : rng.chance(0.65) ? 'fetch' : 'chase', rng, settings);
}

function updateChase(p: Playmates, rng: Rng, stepSeconds: number, settings: PlaySettings): void {
  if (stepAlong(p.kid, stepSeconds, p.ground)) routeTo(p.kid, rng.pick(p.playground), p.ground);
  // The puppy keeps re-aiming for the kid's heels.
  const before = p.timer;
  p.timer -= stepSeconds;
  if (Math.floor(before / FOLLOW_EVERY_SECONDS) !== Math.floor(p.timer / FOLLOW_EVERY_SECONDS)) {
    const spot = besideTile(tileOf(p.kid, p.ground), p.dog, p.ground);
    if (spot !== null) routeTo(p.dog, spot, p.ground);
  }
  stepAlong(p.dog, stepSeconds, p.ground);
  if (p.timer <= 0) {
    p.kid.route = [];
    startMode(p, rng.chance(0.5) ? 'fetch' : 'rest', rng, settings);
  }
}

function updateGreet(
  p: Playmates,
  player: Player | null,
  rng: Rng,
  stepSeconds: number,
  settings: PlaySettings,
): void {
  const { dog } = p;
  p.kid.pose = 'stand';
  stepAlong(p.kid, stepSeconds, p.ground);
  if (
    !player ||
    Math.hypot(player.x - dog.x, player.y - dog.y) > GREET_GIVE_UP_TILES * p.ground.tileSizePx
  ) {
    startMode(p, 'rest', rng, settings);
    return;
  }
  if (p.timer <= 0) {
    // On the way over.
    if (dog.route.length === 0) {
      const spot = besideTile(tileOf(player, p.ground), dog, p.ground);
      if (spot === null || !routeTo(dog, spot, p.ground)) {
        startMode(p, 'rest', rng, settings);
        return;
      }
    }
    if (!stepAlong(dog, stepSeconds, p.ground)) return;
    dog.facing = facingTowards(dog, player);
    dog.pose = 'sniff';
    p.timer = SNIFF_SECONDS + WAG_SECONDS;
    return;
  }
  const before = p.timer;
  p.timer -= stepSeconds;
  if (before > WAG_SECONDS && p.timer <= WAG_SECONDS) {
    dog.pose = 'wag';
    say(p, 'dog', 'heart');
  }
  if (p.timer <= 0) startMode(p, 'rest', rng, settings);
}

/** After a shower: to the puddle, then jumping about in it (the puppy wagging nearby). */
function updateSplash(p: Playmates, rng: Rng, stepSeconds: number, settings: PlaySettings): void {
  const done = (): void => {
    p.kid.pose = 'stand';
    p.splashAt = null;
    startMode(p, 'rest', rng, settings);
  };
  if (p.splashAt === null || p.wet <= 0) {
    done();
    return;
  }
  if (!stepAlong(p.kid, stepSeconds, p.ground)) return;
  if (tileOf(p.kid, p.ground) !== p.splashAt && p.kid.route.length === 0) {
    // Couldn't get into the puddle (someone's there): splash another time.
    done();
    return;
  }
  if (dogToKid(p, stepSeconds)) p.dog.pose = 'wag';
  p.timer -= stepSeconds;
  p.kid.pose = Math.floor(p.timer / SPLASH_JUMP_SECONDS) % 2 === 0 ? 'cheer' : 'stand';
  if (p.timer <= 0) done();
}

function updateHome(p: Playmates, stepSeconds: number, night: boolean): void {
  const { kid, dog } = p;
  if (!kid.hidden) {
    if (kid.route.length === 0 && tileOf(kid, p.ground) !== p.door) routeTo(kid, p.door, p.ground);
    if (stepAlong(kid, stepSeconds, p.ground) && tileOf(kid, p.ground) === p.door)
      kid.hidden = true;
  }
  if (dog.pose === 'sleep') return;
  if (dog.route.length === 0 && tileOf(dog, p.ground) !== p.bed) routeTo(dog, p.bed, p.ground);
  if (stepAlong(dog, stepSeconds, p.ground) && tileOf(dog, p.ground) === p.bed) {
    // Asleep for the night, or sitting by the door waiting for the rain to stop.
    dog.pose = night ? 'sleep' : 'sit';
    dog.facing = night ? 'left' : 'down';
  }
}

/** One fixed step of the kid's and the puppy's day. */
export function updatePlaymates(
  p: Playmates,
  player: Player | null,
  time: number,
  rng: Rng,
  stepSeconds: number,
  settings: PlaySettings,
  raining = false,
  others: readonly Spot[] = [],
  wet = 0,
): void {
  p.wet = wet;
  for (const mate of [p.kid, p.dog]) {
    mate.previousX = mate.x;
    mate.previousY = mate.y;
  }
  // Who stands where now: never walk through them (nor through each other).
  p.ground.occupied.clear();
  for (const spot of player ? [player, ...others] : others) {
    p.ground.occupied.add(tileUnder(spot, p.ground.world, p.ground.tileSizePx));
  }
  p.kid.avoid = p.kid.hidden ? null : tileOf(p.dog, p.ground);
  p.dog.avoid = p.kid.hidden ? null : tileOf(p.kid, p.ground);
  if (p.bubble) {
    p.bubble.seconds -= stepSeconds;
    if (p.bubble.seconds <= 0) p.bubble = null;
  }
  p.greetCooldown = Math.max(0, p.greetCooldown - stepSeconds);
  const night = !within(time, settings.awake);
  const awake = !night && !raining;
  if (!awake && p.mode !== 'home') {
    p.mode = 'home';
    p.kid.pose = 'stand';
    p.ball.holder = 'kid';
    p.ball.flight = null;
    p.kid.route = [];
    p.dog.route = [];
    p.kid.speedPx = settings.kidSpeedTilesPerSecond * p.ground.tileSizePx;
    p.dog.speedPx = settings.dogSpeedTilesPerSecond * p.ground.tileSizePx;
  }
  if (awake && p.mode === 'home') {
    // Morning: out of the door to play.
    p.kid.hidden = false;
    p.dog.pose = 'sit';
    startMode(p, 'rest', rng, settings);
  }
  const calm =
    p.mode === 'rest' ||
    p.mode === 'chase' ||
    (p.mode === 'fetch' && p.ball.holder === 'kid' && p.phase === 'aim');
  if (
    calm &&
    player &&
    p.greetCooldown <= 0 &&
    Math.hypot(player.x - p.dog.x, player.y - p.dog.y) <=
      settings.greetRangeTiles * p.ground.tileSizePx
  ) {
    p.kid.route = [];
    p.dog.route = [];
    p.greetCooldown = settings.greetCooldownSeconds;
    startMode(p, 'greet', rng, settings);
  }
  if (p.dog.route.length > 0 && p.dog.pose !== 'sleep') p.dog.pose = 'sit';
  switch (p.mode) {
    case 'rest':
      updateRest(p, rng, stepSeconds, settings);
      break;
    case 'fetch':
      updateFetch(p, rng, stepSeconds, settings);
      break;
    case 'chase':
      updateChase(p, rng, stepSeconds, settings);
      break;
    case 'greet':
      updateGreet(p, player, rng, stepSeconds, settings);
      break;
    case 'home':
      updateHome(p, stepSeconds, night);
      break;
    case 'splash':
      updateSplash(p, rng, stepSeconds, settings);
      break;
  }
}
