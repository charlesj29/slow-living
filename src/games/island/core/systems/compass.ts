// Which way something lies, in words (for hints and signs). Map y grows
// downwards, so north is towards smaller y. Words, not arrow glyphs: diagonal
// arrows render unreliably in system fonts.
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

/** The compass direction from `from` to `to` (east if they are the same point). */
export function headingTo(from: TilePoint, to: TilePoint): Heading {
  const angle = Math.atan2(to.y - from.y, to.x - from.x); // clockwise on screen
  const sector = ((Math.round(angle / SECTOR) % 8) + 8) % 8;
  return HEADINGS[sector] ?? 'east';
}
