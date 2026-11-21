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
      "Charles works in his workspace, the log lodge {studio} of here. That's where he keeps his apps.",
    ],
    [
      'The lanterns at the workspace glow late most nights.',
      'If you want to see what Charles builds, head {studio}.',
    ],
    ['Hi! Mind the haystacks.'],
  ],
  // The girl.
  [
    [
      "Hi! Have you been to Charles's Workspace yet?",
      "It's the log lodge with the cedar roof, {studio} of here. Charles's work is all inside.",
    ],
    ['I love the phones on the shelf in the workspace. Each one is a project of his!'],
    ['Hi! Say hello to Charles if you see him.'],
  ],
  // The baker.
  [
    [
      'Fresh bread this morning! Hi!',
      "Charles came by for a loaf. He's busy in his workspace, {studio} of here.",
    ],
    ["Looking for Charles's work? Walk {studio} to the log lodge with the carved sign."],
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
