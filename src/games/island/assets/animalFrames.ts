// Which frame is which in the village animals' strips (the same in every view).

/** Frames per animal strip. */
export const ANIMAL_FRAME_COUNT = 6;

/** Frame indexes, the same in the side, front and back strips. */
export const ANIMAL_FRAMES = {
  chicken: { stand: 0, peck: 1, walk: [2, 3], huddle: 4, sleep: 5 },
  cat: { sit: 0, walk: [1, 2], sleep: 3, flick: 4, loaf: 5 },
} as const;

export const ANIMAL_VIEWS = ['side', 'front', 'back'] as const;
export type AnimalView = (typeof ANIMAL_VIEWS)[number];

/** Atlas key of an animal's strip for a view (the side view keeps the plain key). */
export const animalKey = (kind: 'chicken' | 'cat', view: AnimalView): string =>
  view === 'side' ? `animal_${kind}` : `animal_${kind}_${view}`;
