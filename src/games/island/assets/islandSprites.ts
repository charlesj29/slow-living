import type { SpriteSource } from '@/shared/render/atlasLayout';
import { buildSpriteAtlas, type SpriteAtlas } from '@/shared/render/spriteAtlas';
import { OBJECT_KINDS, OBJECT_REGISTRY } from '../core/world/objects';
import { paintAnimalSprites } from './paintAnimals';
import { paintCabinSprites } from './paintCabin';
import { paintCliffSprites } from './paintCliff';
import { paintDeadwoodSprites } from './paintDeadwood';
import { paintFurnitureSprites } from './paintFurniture';
import { paintInteriorSprites } from './paintInterior';
import { paintHouseSprites } from './paintHouses';
import { paintWindowLights } from './paintLights';
import { paintObjectSprites } from './paintObjects';
import { paintPlayerSprites } from './paintPlayer';
import { paintPlazaSprites } from './paintPlaza';
import { paintPropSprites } from './paintProps';
import { paintShadowSprites } from './paintShadows';
import { paintSmokeSprites } from './paintSmoke';
import { paintStructureSprites } from './paintStructures';
import { paintStudioSprites } from './paintStudio';
import { paintStudioFurnitureSprites } from './paintStudioFurniture';
import { paintTileSprites } from './paintTiles';
import { paintTransitionSprites } from './paintTransitions';
import { paintUiSprites } from './paintUi';
import { paintVillagePropSprites } from './paintVillageProps';

/** Buildings and lamps get a night-time light overlay (registry: `litAtNight`). */
const LIT_SPRITE_KEYS = OBJECT_KINDS.filter((kind) => OBJECT_REGISTRY[kind].litAtNight).map(
  (kind) => OBJECT_REGISTRY[kind].spriteKey,
);

/** Every sprite the island needs, painted in code. */
export function paintIslandSprites(): SpriteSource[] {
  const sprites = [
    ...paintTileSprites(),
    ...paintCliffSprites(),
    ...paintInteriorSprites(),
    ...paintTransitionSprites(),
    ...paintObjectSprites(),
    ...paintDeadwoodSprites(),
    ...paintStructureSprites(),
    ...paintPropSprites(),
    ...paintVillagePropSprites(),
    ...paintPlazaSprites(),
    ...paintFurnitureSprites(),
    ...paintStudioFurnitureSprites(),
    ...paintCabinSprites(),
    ...paintHouseSprites(),
    ...paintStudioSprites(),
    ...paintPlayerSprites(),
    ...paintAnimalSprites(),
    ...paintShadowSprites(),
    ...paintSmokeSprites(),
    ...paintUiSprites(),
  ];
  return [...sprites, ...paintWindowLights(sprites, LIT_SPRITE_KEYS)];
}

/** Builds the island's texture atlas. The caller owns it and must call `dispose()`. */
export function createIslandAtlas(): SpriteAtlas {
  return buildSpriteAtlas(paintIslandSprites());
}
