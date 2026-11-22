// Map ↔ Three.js coordinates and draw depth. 1 world unit = 1 source pixel.
// Map coordinates have y growing downwards; Three.js has y growing upwards, so
// world y = −(map y in pixels). Tile (0, 0)'s top-left corner is the origin.

/** Terrain is drawn at z = 0; all tile layers share it and draw in index order. */
export const TERRAIN_Z = 0;
/** Soft cast shadows: above the ground, below decorations and everything standing. */
export const SHADOW_Z = 0.25;
/** Flat decorations (flowers, grass tufts) always lie under anything standing. */
export const GROUND_DECAL_Z = 0.5;
const SORTED_BASE_Z = 1;
/**
 * Weather sits above the whole sorted world (a 192-tile map ends near z 32):
 * cloud shadows darken everything under them, rain falls in front of it all.
 */
export const CLOUD_SHADOW_Z = 50;
export const RAIN_Z = 55;
/**
 * Per pixel of "foot" height. Small enough that a 192-tile map stays well
 * within the camera's depth range, large enough for depth-buffer precision.
 */
const DEPTH_PER_PIXEL = 0.01;

export function worldYFromMapPx(mapYPx: number): number {
  return -mapYPx;
}

/**
 * Depth of a standing sprite (tree, rock, cabin, later the player) from where
 * its base touches the ground, in map pixels. Lower on screen = closer to the
 * camera, so a character walking above a tree passes behind its crown.
 */
export function standingSpriteZ(footMapYPx: number): number {
  return SORTED_BASE_Z + footMapYPx * DEPTH_PER_PIXEL;
}
