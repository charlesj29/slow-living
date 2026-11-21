// Which way something lies: in words (villager hints) or as arrow markers
// (signposts; the message box draws them as icons, since arrow characters
// render unreliably in system fonts). Map y grows downwards, so north is
// towards smaller y.
import type { TilePoint } from '@/shared/engine/grid';

/** Clockwise from east, one per 45° sector. */
const HEADINGS = [
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
  'north',
  'north-east',
] as const;

export type Heading = (typeof HEADINGS)[number];

const SECTOR = Math.PI / 4;

/**
 * A direction marker inside message text: the message box draws it as a small
 * arrow icon (arrow characters render unreliably in system fonts).
 */
export function arrowToken(heading: Heading): string {
  return `[[arrow:${heading}]]`;
}

/** Finds arrow markers in message text (group 1: the heading). */
export const ARROW_TOKEN = /\[\[arrow:([a-z-]+)\]\]/g;

/** Clockwise angle (degrees) of an arrow pointing in `heading`, from pointing east. */
export function headingAngle(heading: string): number {
  const index = HEADINGS.indexOf(heading as Heading);
  return index < 0 ? 0 : index * 45;
}

/** The compass direction from `from` to `to` (east if they are the same point). */
export function headingTo(from: TilePoint, to: TilePoint): Heading {
  const angle = Math.atan2(to.y - from.y, to.x - from.x); // clockwise on screen
  const sector = ((Math.round(angle / SECTOR) % 8) + 8) % 8;
  return HEADINGS[sector] ?? 'east';
}
