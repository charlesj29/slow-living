// What the Developer's Studio says, in one place so it is easy to edit.
// Each entry is the pages of one message box (Space turns the page).
// Placeholders until Charles's CV arrives: M5 replaces them with the real
// portfolio (and a richer panel with images and links).

/** The portfolio pieces in the studio; each is an object kind with the same name. */
export type StudioPiece =
  | 'desk_laptop'
  | 'phone_wall'
  | 'tech_shelf'
  | 'timeline_board'
  | 'trophy_shelf'
  | 'certificates'
  | 'post_desk';

export const STUDIO_PAGES: Readonly<Record<StudioPiece, readonly string[]>> = {
  desk_laptop: [
    'A laptop with a half-finished app on the screen.',
    'This is where Charles, a mobile engineer, tells his story. It is still being written. Check back soon!',
  ],
  phone_wall: [
    'A wall of framed phones, one for each app Charles has built.',
    'The frames are still empty. The apps go up here soon.',
  ],
  tech_shelf: [
    'Notebooks, manuals and a few well-loved books on mobile development.',
    'A proper list of skills and tools is coming soon.',
  ],
  timeline_board: [
    'A timeline pinned to a cork board, from the first job to today.',
    "The cards aren't filled in yet. Coming soon.",
  ],
  trophy_shelf: [
    'A shelf for trophies and milestones.',
    'Nothing on it yet. Achievements go here soon.',
  ],
  certificates: ['Frames for diplomas and certificates.', "They'll be hung up soon."],
  post_desk: [
    'A post desk with a telephone and a neat stack of envelopes.',
    'Contact details and a CV to download arrive here soon.',
  ],
};
