// What the villagers and signposts say to guide visitors to the studio.
// `{studio}` becomes the compass direction from the speaker to the studio
// ("east", "north-west", …), worked out for each island.

/**
 * Each villager's conversations, by look (farmer, girl, baker). Talking again
 * moves on to the next one; each conversation is the pages of one message.
 */
export const VILLAGER_TALKS: readonly (readonly (readonly string[])[])[] = [
  // The farmer.
  [
    [
      'Hi there! New on the island?',
      "Charles works in his studio, the big workshop {studio} of here. That's where he keeps his apps.",
    ],
    [
      'The lantern at the studio burns late most nights.',
      'If you want to see what Charles builds, head {studio}.',
    ],
    ['Hi! Mind the haystacks.'],
  ],
  // The girl.
  [
    [
      "Hi! Have you been to the Developer's Studio yet?",
      "It's the workshop with the teal roof, {studio} of here. Charles's work is all inside.",
    ],
    ['I love the phones on the shelf in the studio. Each one is a project of his!'],
    ['Hi! Say hello to Charles if you see him.'],
  ],
  // The baker.
  [
    [
      'Fresh bread this morning! Hi!',
      "Charles came by for a loaf. He's busy in his studio, {studio} of here.",
    ],
    ["Looking for Charles's work? Walk {studio} to the workshop with the sign over the door."],
    ['Hi! Come back for a cinnamon roll sometime.'],
  ],
];

/** The places signposts point to. */
export const SIGN_LABELS = {
  studio: "Charles's Workspace",
  village: 'The Village',
  cottage: "Charles's Cottage",
} as const;

export type SignPlace = keyof typeof SIGN_LABELS;
