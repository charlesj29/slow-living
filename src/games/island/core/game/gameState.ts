// Everything the game simulates, in plain mutable objects. The render layer
// calls `advanceGame` once per frame and reads positions; React never holds
// any of this in state.
import { advanceClock, createFixedStepClock, type FixedStepClock } from '@/shared/engine/fixedStep';
import type { TilePoint } from '@/shared/engine/grid';
import {
  clearPresses,
  consumePress,
  createInputState,
  type InputState,
} from '@/shared/engine/input';
import { approach } from '@/shared/engine/math';
import { createRng, type Rng } from '@/shared/engine/random';
import type { IslandConfig } from '../config';
import { createPlayer, type Player } from '../entities/player';
import { OBJECT_REGISTRY } from '../world/objects';
import { bumpsInto, createVillager, type Villager } from '../entities/villager';
import { villagerSpawns, wanderTiles } from '../world/village';
import type { World, WorldObject } from '../world/world';
import { updatePlayerAnimation } from '../systems/animation';
import { readMovementIntent, type IslandAction } from '../systems/controls';
import { advanceTimeOfDay } from '../systems/dayNight';
import { findLandmarks, signpostPages, villagerTalk, type Landmarks } from '../systems/guidance';
import {
  findInteractTarget,
  type Dialog,
  type InteractionSettings,
  type InteractTarget,
  type PanelOpen,
} from '../systems/interaction';
import { createAnimals, updateAnimal, type Animal } from '../systems/animals';
import {
  bumpsIntoRabbit,
  createRabbits,
  rabbitMeadow,
  updateRabbit,
  type Rabbit,
} from '../systems/rabbits';
import { createDuckFamily, duckWater, updateDuckFamily, type DuckFamily } from '../systems/ducks';
import { movePlayer } from '../systems/movement';
import { followWalk, planTap, type AutoWalk } from '../systems/tapToWalk';
import { startTalking, updateVillager } from '../systems/wander';
import type { Transition } from '../systems/doors';
import { buildInteriorWorld, INTERIORS } from '../world/interiors';
import { checkDoors, ISLAND_MAP, stepTransition } from './mapTravel';
import { stepIdleTour } from './idleTour';
import { tourStops, type PixelPoint, type Tour, type TourReturn } from '../systems/tour';
import { createWeather, updateWeather, type Weather } from '../systems/weather';

/** True while the player is outdoors (where the villagers are). */
export function onIsland(state: GameState): boolean {
  return state.mapId === ISLAND_MAP;
}

export interface GameState {
  /** The map the player is on now (the island or an interior). */
  world: World;
  /** Which map that is: `ISLAND_MAP` or an interior id. */
  mapId: string;
  /** The island and every interior, by id. */
  readonly maps: ReadonlyMap<string, World>;
  /** A door transition in progress (the player stands still meanwhile). */
  transition: Transition | null;
  /** The island tile in front of the door last walked through: where you come back out. */
  returnPoint: TilePoint | null;
  readonly player: Player;
  readonly input: InputState<IslandAction>;
  readonly clock: FixedStepClock;
  /** 0..1: how far rendering is between the previous and the current logic step. */
  interpolation: number;
  /** Smoothed frames per second, from the frame times the render loop reports. */
  framesPerSecond: number;
  /** What Space would interact with right now (drives the arrow above it). */
  interactTarget: InteractTarget | null;
  /** The open message, if any; the player stands still while Space turns its pages, then closes it. */
  dialog: Dialog | null;
  /** The portfolio panel, if open; the UI closes it (the player stands still meanwhile). */
  panel: PanelOpen | null;
  /** A page over the game (the Résumé) is open: the player stands still. */
  overlayOpen: boolean;
  /** Walking to a tapped spot (touch or mouse), if any; keys take over at once. */
  autoWalk: AutoWalk | null;
  /** Fraction of a day (0 = midnight, 0.5 = noon); keeps running in every day/night mode. */
  timeOfDay: number;
  /** The village's people (none if the world has no village). */
  readonly villagers: readonly Villager[];
  /** Randomness for wandering: seeded per world, so a session is reproducible. */
  readonly wanderRng: Rng;
  /** The village's chickens and cat (island only). */
  readonly animals: readonly Animal[];
  /** The village tiles villagers and animals keep to. */
  readonly villageHome: ReadonlySet<number>;
  /** Wild rabbits round the village (island only), and the meadow they keep to. */
  readonly rabbits: readonly Rabbit[];
  readonly rabbitMeadow: ReadonlySet<number>;
  /** A mother duck and her ducklings on the lake (island only), and the water they keep to. */
  readonly ducks: DuckFamily | null;
  readonly duckWater: ReadonlySet<number>;
  /** Clear spells and rain showers, with their own rng. */
  readonly weather: Weather;
  readonly weatherRng: Rng;
  /** Seconds with no input; after a while the ambient tour starts (and runs until input). */
  idleSeconds: number;
  tour: Tour | null;
  /** The camera gliding back to the player after a tour. */
  tourReturn: TourReturn | null;
  /** The places the tour visits (map pixels). */
  readonly tourStops: readonly PixelPoint[];
  /** The island's studio, village and cottage: what hints and signposts point to. */
  readonly landmarks: Landmarks;
}

/** Outfits in sprite order; villagers take them in turn. */
const VILLAGER_LOOKS = 3;
const WANDER_SEED_SALT = 0x5a11;
const WEATHER_SEED_SALT = 0x3a1e;
/** Sitting, the feet rest just in front of the bench row (so the player draws in front of it). */
const SEAT_IN_FRONT_PX = 1;

function createVillagers(world: World, tileSizePx: number): Villager[] {
  if (!world.village) return [];
  const home = wanderTiles(world);
  return villagerSpawns(world).map((spawn, id) =>
    createVillager(id, id % VILLAGER_LOOKS, spawn, home, tileSizePx),
  );
}

export function createGameState(world: World, config: IslandConfig): GameState {
  const wanderRng = createRng(world.generationSeed ^ WANDER_SEED_SALT);
  const weatherRng = createRng(world.generationSeed ^ WEATHER_SEED_SALT);
  const landmarks = findLandmarks(world);
  const home = wanderTiles(world);
  const meadow = rabbitMeadow(world, config.rabbits);
  const water = duckWater(world);
  const maps = new Map<string, World>([[ISLAND_MAP, world]]);
  for (const definition of Object.values(INTERIORS)) {
    maps.set(definition.id, buildInteriorWorld(definition));
  }
  return {
    world,
    mapId: ISLAND_MAP,
    maps,
    transition: null,
    returnPoint: null,
    player: createPlayer(world.spawn, config.map.tileSizePx),
    input: createInputState<IslandAction>(),
    clock: createFixedStepClock(config.loop.stepsPerSecond, config.loop.maxStepsPerFrame),
    interpolation: 0,
    framesPerSecond: 0,
    interactTarget: null,
    dialog: null,
    panel: null,
    overlayOpen: false,
    autoWalk: null,
    timeOfDay: config.dayNight.startTime,
    villagers: createVillagers(world, config.map.tileSizePx),
    wanderRng,
    animals: createAnimals(world, home, wanderRng, config.animals, config.map.tileSizePx),
    villageHome: new Set(home),
    rabbits: createRabbits(world, meadow, wanderRng, config.rabbits, config.map.tileSizePx),
    rabbitMeadow: meadow,
    ducks: createDuckFamily(world, water, wanderRng, config.ducks, config.map.tileSizePx),
    duckWater: water,
    weather: createWeather(weatherRng, config.weather),
    weatherRng,
    idleSeconds: 0,
    tour: null,
    tourReturn: null,
    tourStops: tourStops(world, landmarks, config.map.tileSizePx),
    landmarks,
  };
}

/**
 * One fixed logic step: read input, face, move with collision, animate, then
 * see what's in reach. Space opens that thing's message; while a message is
 * open the player stands still and Space turns its pages, then closes it.
 */
export function stepGame(state: GameState, stepSeconds: number, config: IslandConfig): void {
  const { player, input } = state;
  const tileSizePx = config.map.tileSizePx;
  player.previousX = player.x;
  player.previousY = player.y;
  state.timeOfDay = advanceTimeOfDay(
    state.timeOfDay,
    stepSeconds,
    config.dayNight.dayLengthSeconds,
  );
  updateWeather(state.weather, state.weatherRng, stepSeconds, config.weather);
  stepIdleTour(state, stepSeconds, config);
  stepVillagers(state, stepSeconds, config);
  stepAnimals(state, stepSeconds, config);
  stepRabbits(state, stepSeconds, config);
  stepDucks(state, stepSeconds, config);
  if (state.transition) {
    stepTransition(state, stepSeconds, config);
    player.moving = false;
    state.interactTarget = null;
    state.autoWalk = null;
  } else if (state.dialog) {
    if (consumePress(input, 'interact')) turnPage(state, state.dialog);
    player.moving = false;
  } else if (player.sitting) {
    // Sitting on a bench: only Space stands up again (or a tap, on phones).
    if (consumePress(input, 'interact')) standUp(player);
    player.moving = false;
    state.interactTarget = null;
  } else if (state.panel || state.overlayOpen) {
    // The panel or page has its own keys and buttons (UI); the game waits.
    player.moving = false;
  } else {
    let intent = readMovementIntent(input);
    let interactNow = false;
    if (intent.facing) {
      state.autoWalk = null; // the keyboard takes over from a tap
    } else if (state.autoWalk) {
      const step = followWalk(state.autoWalk, player, stepSeconds, tileSizePx);
      if (step.kind === 'move') intent = step.intent;
      else {
        interactNow = step.kind === 'interact';
        state.autoWalk = null;
      }
    }
    if (intent.facing) player.facing = intent.facing;
    movePlayer(player, intent, state.world, stepSeconds, config.player, tileSizePx);
    const villagersHere = onIsland(state) ? state.villagers : [];
    const rabbitsHere = onIsland(state) ? state.rabbits : [];
    if (
      bumpsInto(player, villagersHere, config.player) ||
      bumpsIntoRabbit(player, rabbitsHere, config.player)
    ) {
      // Villagers are solid: step back.
      player.x = player.previousX;
      player.y = player.previousY;
      player.moving = false;
    }
    state.interactTarget = findInteractTarget(
      state.world,
      player,
      villagersHere,
      interactionSettings(state, config),
      tileSizePx,
    );
    if (checkDoors(state, intent, config)) {
      player.moving = false;
      state.interactTarget = null;
    } else if ((consumePress(input, 'interact') || interactNow) && state.interactTarget) {
      openDialog(state, tileSizePx);
    }
  }
  updatePlayerAnimation(player, stepSeconds, config.player, tileSizePx);
  clearPresses(input);
}

function stepRabbits(state: GameState, stepSeconds: number, config: IslandConfig): void {
  const island = state.maps.get(ISLAND_MAP) ?? state.world;
  // They only notice the player out on the island.
  const player = onIsland(state) ? state.player : null;
  for (const rabbit of state.rabbits) {
    updateRabbit(
      rabbit,
      island,
      state.rabbitMeadow,
      player,
      state.wanderRng,
      stepSeconds,
      config.rabbits,
      config.map.tileSizePx,
    );
  }
}

function stepDucks(state: GameState, stepSeconds: number, config: IslandConfig): void {
  if (!state.ducks) return;
  const island = state.maps.get(ISLAND_MAP) ?? state.world;
  updateDuckFamily(
    state.ducks,
    island,
    state.duckWater,
    onIsland(state) ? state.player : null,
    state.wanderRng,
    stepSeconds,
    config.ducks,
    config.map.tileSizePx,
  );
}

function stepAnimals(state: GameState, stepSeconds: number, config: IslandConfig): void {
  const island = state.maps.get(ISLAND_MAP) ?? state.world;
  for (const animal of state.animals) {
    updateAnimal(
      animal,
      island,
      state.villageHome,
      state.wanderRng,
      stepSeconds,
      config.animals,
      config.map.tileSizePx,
    );
  }
}

function stepVillagers(state: GameState, stepSeconds: number, config: IslandConfig): void {
  const tileSizePx = config.map.tileSizePx;
  // Villagers live on the island; the player only gets in their way when out there too.
  const crowd = { player: onIsland(state) ? state.player : null, villagers: state.villagers };
  const island = state.maps.get(ISLAND_MAP) ?? state.world;
  for (const villager of state.villagers) {
    updateVillager(
      villager,
      island,
      crowd,
      state.wanderRng,
      stepSeconds,
      config.villagers,
      config.player,
      tileSizePx,
    );
    updatePlayerAnimation(villager, stepSeconds, config.player, tileSizePx);
  }
}

/** How to reach things, and what villagers and signposts say on this island. */
function interactionSettings(state: GameState, config: IslandConfig): InteractionSettings {
  const tile = config.map.tileSizePx;
  return {
    ...config.player,
    ...config.interaction,
    villagerPages: (villager) =>
      villagerTalk(
        villager.look,
        villager.timesTalked,
        { x: Math.floor(villager.x / tile), y: Math.floor(villager.y / tile) },
        state.landmarks.studio,
      ),
    signPages: (sign) => signpostPages({ x: sign.x, y: sign.y }, state.landmarks),
  };
}

function openDialog(state: GameState, tileSizePx: number): void {
  const target = state.interactTarget;
  if (!target) return;
  state.player.moving = false;
  state.autoWalk = null;
  if (target.kind === 'object' && target.sit) {
    sitOn(state.player, target.object, tileSizePx);
    return;
  }
  if (target.kind === 'object' && target.panel) {
    state.panel = target.panel;
    return;
  }
  state.dialog = { pages: target.pages, page: 0 };
  state.player.moving = false;
  if (target.kind === 'villager') {
    startTalking(target.villager, state.player);
    target.villager.timesTalked += 1;
  }
}

/** Space shows the next page; after the last one it closes the message. */
function turnPage(state: GameState, dialog: Dialog): void {
  if (dialog.page + 1 < dialog.pages.length) dialog.page += 1;
  else closeDialog(state);
}

function closeDialog(state: GameState): void {
  state.dialog = null;
  for (const villager of state.villagers) villager.talking = false;
}

/** The UI closed the portfolio panel: play goes on, and the key that closed it must not reopen it. */
export function closePortfolioPanel(state: GameState): void {
  state.panel = null;
  clearPresses(state.input);
}

/**
 * A tap (or click) at a map point: turns the page of an open message, or walks
 * to the spot (and interacts with what's there). Ignored during a door fade or
 * while a panel or page is open.
 */
export function tapAt(
  state: GameState,
  point: { readonly x: number; readonly y: number },
  config: IslandConfig,
): void {
  if (state.transition || state.panel || state.overlayOpen) return;
  if (state.player.sitting) {
    standUp(state.player);
    return;
  }
  if (state.dialog) {
    turnPage(state, state.dialog);
    return;
  }
  const tileSizePx = config.map.tileSizePx;
  const tile = { x: Math.floor(point.x / tileSizePx), y: Math.floor(point.y / tileSizePx) };
  const villagers = onIsland(state) ? state.villagers : [];
  state.autoWalk = planTap(state.world, state.player, villagers, tile, tileSizePx);
}

/**
 * Sits down on a bench: on the bench tile nearest the player, facing out,
 * feet just in front of it (so the player is drawn in front of the bench; the
 * renderer lifts the sitting sprite onto the seat). Remembers where to stand up.
 */
function sitOn(player: Player, bench: WorldObject, tileSizePx: number): void {
  const { footprint } = OBJECT_REGISTRY[bench.kind];
  const nearest = Math.floor(player.x / tileSizePx);
  const tileX = Math.min(bench.x + footprint.width - 1, Math.max(bench.x, nearest));
  player.sitting = { standX: player.x, standY: player.y };
  player.x = (tileX + 0.5) * tileSizePx;
  player.y = (bench.y + footprint.height) * tileSizePx + SEAT_IN_FRONT_PX;
  player.facing = 'down';
  player.moving = false;
}

/** Stands up from a bench, back where the player was before sitting down. */
function standUp(player: Player): void {
  if (!player.sitting) return;
  player.x = player.sitting.standX;
  player.y = player.sitting.standY;
  player.previousX = player.x;
  player.previousY = player.y;
  player.sitting = null;
}

/** A page over the game (the Résumé) opened or closed; the game waits while it is open. */
export function setOverlayOpen(state: GameState, open: boolean): void {
  state.overlayOpen = open;
  state.autoWalk = null;
  clearPresses(state.input);
}

/** Runs the fixed steps owed for this frame and records the interpolation factor. */
export function advanceGame(state: GameState, frameSeconds: number, config: IslandConfig): void {
  state.interpolation = advanceClock(state.clock, frameSeconds, (step) =>
    stepGame(state, step, config),
  );
  if (frameSeconds > 0) {
    const instant = 1 / frameSeconds;
    state.framesPerSecond =
      state.framesPerSecond === 0
        ? instant
        : approach(
            state.framesPerSecond,
            instant,
            config.debug.fpsSmoothingSharpness,
            frameSeconds,
          );
  }
}

/** The tile under the player's feet. */
export function playerTile(state: GameState, tileSizePx: number): TilePoint {
  return {
    x: Math.floor(state.player.x / tileSizePx),
    y: Math.floor(state.player.y / tileSizePx),
  };
}

/** Player position between the last two steps, for smooth rendering on any refresh rate. */
export function interpolatedPlayerPosition(state: GameState): { x: number; y: number } {
  const { player, interpolation: t } = state;
  return {
    x: player.previousX + (player.x - player.previousX) * t,
    y: player.previousY + (player.y - player.previousY) * t,
  };
}
