// Which part of the portfolio each Developer's Studio piece opens
// (the content itself is in portfolio.ts).
import type { PanelId } from './portfolio';

/** The portfolio pieces in the studio; each is an object kind with the same name. */
export type StudioPiece =
  | 'desk_laptop'
  | 'phone_wall'
  | 'tech_shelf'
  | 'timeline_board'
  | 'trophy_shelf'
  | 'certificates'
  | 'post_desk';

export const STUDIO_PANELS: Readonly<Record<StudioPiece, PanelId>> = {
  desk_laptop: 'about',
  // Each phone on the shelf opens its own project (the panel's pages, left to right).
  phone_wall: 'projects',
  tech_shelf: 'skills',
  timeline_board: 'experience',
  trophy_shelf: 'highlights',
  certificates: 'education',
  post_desk: 'contact',
};
