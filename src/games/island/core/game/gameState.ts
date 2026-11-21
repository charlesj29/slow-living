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
import { bumpsInto, createVillager, type Villager } from '../entities/villager';
import { villagerSpawns, villageTiles } from '../world/village';
import type { World } from '../world/world';
import { updatePlayerAnimation } from '../systems/animation';
import { readMovementIntent, type IslandAction } from '../systems/controls';
import { advanceTimeOfDay } from '../systems/dayNight';
import { findInteractTarget, type Dialog, type InteractTarget } from '../systems/interaction';
import { movePlayer } from '../systems/movement';
import { startTalking, updateVillager } from '../systems/wander';
import type { Transition } from '../systems/doors';
import { buildInteriorWorld, INTERIORS } from '../world/interiors';
import { checkDoors, ISLAND_MAP, stepTransition } from './mapTravel';

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
  /** Fraction of a day (0 = midnight, 0.5 = noon); keeps running in every day/night mode. */
  timeOfDay: number;
  /** The village's people (none if the world has no village). */
  readonly villagers: readonly Villager[];
  /** Randomness for wandering: seeded per world, so a session is reproducible. */
  readonly wanderRng: Rng;
}

/** Outfits in sprite order; villagers take them in turn. */
const VILLAGER_LOOKS = 3;
const WANDER_SEED_SALT = 0x5a11;

function createVillagers(world: World, tileSizePx: number): Villager[] {
  if (!world.village) return [];
  const home = villageTiles(world.village, world);
  return villagerSpawns(world).map((spawn, id) =>
    createVillager(id, id % VILLAGER_LOOKS, spawn, home, tileSizePx),
  );
}

export function createGameState(world: World, config: IslandConfig): GameState {
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
    timeOfDay: config.dayNight.startTime,
    villagers: createVillagers(world, config.map.tileSizePx),
    wanderRng: createRng(world.generationSeed ^ WANDER_SEED_SALT),
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
  stepVillagers(state, stepSeconds, config);
  if (state.transition) {
    stepTransition(state, stepSeconds, config);
    player.moving = false;
    state.interactTarget = null;
  } else if (state.dialog) {
    if (consumePress(input, 'interact')) turnPage(state, state.dialog);
    player.moving = false;
  } else {
    const intent = readMovementIntent(input);
    if (intent.facing) player.facing = intent.facing;
    movePlayer(player, intent, state.world, stepSeconds, config.player, tileSizePx);
    const villagersHere = onIsland(state) ? state.villagers : [];
    if (bumpsInto(player, villagersHere, config.player)) {
      // Villagers are solid: step back.
      player.x = player.previousX;
      player.y = player.previousY;
      player.moving = false;
    }
    state.interactTarget = findInteractTarget(
      state.world,
      player,
      villagersHere,
      { ...config.player, ...config.interaction, greeting: config.villagers.greeting },
      tileSizePx,
    );
    if (checkDoors(state, intent, config)) {
      player.moving = false;
      state.interactTarget = null;
    } else if (consumePress(input, 'interact') && state.interactTarget) {
      openDialog(state);
    }
  }
  updatePlayerAnimation(player, stepSeconds, config.player, tileSizePx);
  clearPresses(input);
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

function openDialog(state: GameState): void {
  const target = state.interactTarget;
  if (!target) return;
  state.dialog = { pages: target.pages, page: 0 };
  state.player.moving = false;
  if (target.kind === 'villager') startTalking(target.villager, state.player);
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
