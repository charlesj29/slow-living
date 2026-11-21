import type { SpriteSource } from '@/shared/render/atlasLayout';
import { buildSpriteAtlas, type SpriteAtlas } from '@/shared/render/spriteAtlas';
import { paintCabinSprites } from './paintCabin';
import { paintCliffSprites } from './paintCliff';
import { paintDeadwoodSprites } from './paintDeadwood';
import { paintObjectSprites } from './paintObjects';
import { paintPlayerSprites } from './paintPlayer';
import { paintPropSprites } from './paintProps';
import { paintShadowSprites } from './paintShadows';
import { paintStructureSprites } from './paintStructures';
import { paintTileSprites } from './paintTiles';
import { paintTransitionSprites } from './paintTransitions';
import { paintUiSprites } from './paintUi';

/** Every sprite the island needs, painted in code (placeholder art). */
export function paintIslandSprites(): SpriteSource[] {
  return [
    ...paintTileSprites(),
    ...paintCliffSprites(),
    ...paintTransitionSprites(),
    ...paintObjectSprites(),
    ...paintDeadwoodSprites(),
    ...paintStructureSprites(),
    ...paintPropSprites(),
    ...paintCabinSprites(),
    ...paintPlayerSprites(),
    ...paintShadowSprites(),
    ...paintUiSprites(),
  ];
}

/** Builds the island's texture atlas. The caller owns it and must call `dispose()`. */
export function createIslandAtlas(): SpriteAtlas {
  return buildSpriteAtlas(paintIslandSprites());
}
