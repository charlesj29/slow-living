import type { SpriteSource } from '@/shared/render/atlasLayout';
import { buildSpriteAtlas, type SpriteAtlas } from '@/shared/render/spriteAtlas';
import { kindsInCategory, OBJECT_REGISTRY } from '../core/world/objects';
import { paintCabinSprites } from './paintCabin';
import { paintCliffSprites } from './paintCliff';
import { paintDeadwoodSprites } from './paintDeadwood';
import { paintHouseSprites } from './paintHouses';
import { paintWindowLights } from './paintLights';
import { paintObjectSprites } from './paintObjects';
import { paintPlayerSprites } from './paintPlayer';
import { paintPropSprites } from './paintProps';
import { paintShadowSprites } from './paintShadows';
import { paintStructureSprites } from './paintStructures';
import { paintTileSprites } from './paintTiles';
import { paintTransitionSprites } from './paintTransitions';
import { paintUiSprites } from './paintUi';

/** Buildings get a night-time window-light overlay. */
const LIT_SPRITE_KEYS = kindsInCategory('building').map((kind) => OBJECT_REGISTRY[kind].spriteKey);

/** Every sprite the island needs, painted in code. */
export function paintIslandSprites(): SpriteSource[] {
  const buildings = [...paintCabinSprites(), ...paintHouseSprites()];
  return [
    ...paintTileSprites(),
    ...paintCliffSprites(),
    ...paintTransitionSprites(),
    ...paintObjectSprites(),
    ...paintDeadwoodSprites(),
    ...paintStructureSprites(),
    ...paintPropSprites(),
    ...buildings,
    ...paintWindowLights(buildings, LIT_SPRITE_KEYS),
    ...paintPlayerSprites(),
    ...paintShadowSprites(),
    ...paintUiSprites(),
  ];
}

/** Builds the island's texture atlas. The caller owns it and must call `dispose()`. */
export function createIslandAtlas(): SpriteAtlas {
  return buildSpriteAtlas(paintIslandSprites());
}
