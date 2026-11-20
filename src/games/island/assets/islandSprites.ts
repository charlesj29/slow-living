import type { SpriteSource } from '@/shared/render/atlasLayout';
import { buildSpriteAtlas, type SpriteAtlas } from '@/shared/render/spriteAtlas';
import { paintCabinSprites } from './paintCabin';
import { paintObjectSprites } from './paintObjects';
import { paintPlayerSprites } from './paintPlayer';
import { paintStructureSprites } from './paintStructures';
import { paintTileSprites } from './paintTiles';
import { paintTransitionSprites } from './paintTransitions';

/** Every sprite the island needs, painted in code (placeholder art). */
export function paintIslandSprites(): SpriteSource[] {
  return [
    ...paintTileSprites(),
    ...paintTransitionSprites(),
    ...paintObjectSprites(),
    ...paintStructureSprites(),
    ...paintCabinSprites(),
    ...paintPlayerSprites(),
  ];
}

/** Builds the island's texture atlas. The caller owns it and must call `dispose()`. */
export function createIslandAtlas(): SpriteAtlas {
  return buildSpriteAtlas(paintIslandSprites());
}
