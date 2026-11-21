// "Island Breeze": an original lo-fi hip-hop loop for the island, written as
// data (F major, 75 BPM, lazy swing, 32 bars ≈ 1:42), form A A B A′.
// Warm electric-piano chords on jazzy ii–V turns, a deep bass, a mellow lead
// and relaxed boom-bap drums. The last bar is a turnaround with a rising
// pickup and a small drum fill that lands on bar 1, so the loop never seems
// to restart. Composed for this project: no samples, no third-party music.
import type { Song, SongEvent, VoiceName } from '@/shared/audio/song';

const BEATS_PER_BAR = 4;

/** Rootless, close voicings in the middle register, with the bass root below. */
const CHORDS = {
  Fmaj7: { keys: [57, 60, 64, 67], root: 41 },
  Em7: { keys: [55, 59, 62, 64], root: 40 },
  A7: { keys: [55, 61, 64, 66], root: 45 },
  Dm7: { keys: [53, 57, 60, 64], root: 38 },
  Cm7: { keys: [51, 55, 58, 62], root: 36 },
  F7: { keys: [51, 57, 60, 62], root: 41 },
  Bbmaj7: { keys: [50, 53, 57, 60], root: 34 },
  Bbm6: { keys: [49, 53, 55, 58], root: 34 },
  Am7: { keys: [55, 60, 64, 67], root: 45 },
  D7: { keys: [54, 57, 60, 64], root: 38 },
  Gm7: { keys: [53, 58, 62, 65], root: 43 },
  C7: { keys: [52, 58, 62, 67], root: 36 },
} as const;
type Chord = keyof typeof CHORDS;
/** A bar holds one chord, or two (two beats each). */
type Bar = Chord | readonly [Chord, Chord];
type Phrase = readonly (readonly (readonly [beat: number, note: number, beats: number])[])[];

// prettier-ignore
const SECTION_A: readonly Bar[] = [
  'Fmaj7', ['Em7', 'A7'], 'Dm7', ['Cm7', 'F7'], 'Bbmaj7', ['Am7', 'D7'], 'Gm7', 'C7',
];
// prettier-ignore
const SECTION_B: readonly Bar[] = [
  'Bbmaj7', 'Bbm6', 'Am7', 'D7', 'Gm7', 'C7', 'Fmaj7', ['Gm7', 'C7'],
];

// Lead phrases, one entry per bar: [beat in bar, MIDI note, length in beats].
// prettier-ignore
const MELODY_A: Phrase = [
  [[0.5, 72, 0.5], [1, 69, 0.5], [1.5, 72, 1], [3, 74, 0.5], [3.5, 72, 0.5]],
  [[0, 76, 1.5], [2, 73, 0.5], [2.5, 76, 1.5]],
  [[0.5, 74, 1], [1.5, 72, 0.5], [2, 69, 2]],
  [[0, 70, 1], [1.5, 72, 0.5], [2, 75, 1], [3, 74, 1]],
  [[0.5, 77, 1.5], [2, 76, 0.5], [2.5, 74, 1.5]],
  [[0, 72, 1], [1.5, 74, 0.5], [2, 78, 0.5], [2.5, 76, 1.5]],
  [[0, 74, 1.5], [2, 70, 0.5], [2.5, 72, 1]],
  [[0, 70, 1], [1, 69, 1], [2, 67, 2]],
];
/** The second time round the lead only answers every other bar, leaving space. */
// prettier-ignore
const MELODY_A2: Phrase = [
  MELODY_A[0] ?? [], [], MELODY_A[2] ?? [], [], MELODY_A[4] ?? [], [], MELODY_A[6] ?? [],
  [[0, 72, 3]],
];
// prettier-ignore
const MELODY_B: Phrase = [
  [[0, 77, 1], [1, 76, 0.5], [1.5, 74, 1.5], [3.5, 72, 0.5]],
  [[0, 73, 1.5], [2, 72, 1], [3, 70, 1]],
  [[0.5, 72, 1], [1.5, 76, 0.5], [2, 79, 2]],
  [[0, 78, 1], [1, 76, 0.5], [1.5, 74, 1], [3, 72, 1]],
  [[0.5, 70, 0.5], [1, 74, 1], [2, 77, 1], [3, 76, 0.5]],
  [[0, 74, 1], [1.5, 72, 0.5], [2, 70, 2]],
  [[0, 69, 1], [1, 72, 1], [2, 76, 1], [3, 77, 1]],
  [[0, 79, 1.5], [2, 76, 1], [3, 74, 1]],
];
/** Last time: the ending rises into bar 1's first note, so the loop flows on. */
// prettier-ignore
const MELODY_A3: Phrase = [
  ...MELODY_A.slice(0, 6),
  [[0, 74, 1], [1, 72, 1], [2, 70, 1.5]],
  [[0, 67, 1], [1, 70, 0.5], [1.5, 72, 0.5], [2, 76, 1], [3, 77, 0.5], [3.5, 76, 0.5]],
];

const SECTIONS: readonly { chords: readonly Bar[]; melody: Phrase }[] = [
  { chords: SECTION_A, melody: MELODY_A },
  { chords: SECTION_A, melody: MELODY_A2 },
  { chords: SECTION_B, melody: MELODY_B },
  { chords: SECTION_A, melody: MELODY_A3 },
];

const event = (
  beat: number,
  voice: VoiceName,
  notes: readonly number[],
  beats: number,
  velocity: number,
): SongEvent => ({ beat, voice, notes, beats, velocity });

/** Lazy comping: the chord on the downbeat and again on the "and" of 2; bass under it. */
function harmony(start: number, bar: Bar): SongEvent[] {
  if (typeof bar === 'string') {
    const { keys, root } = CHORDS[bar];
    return [
      event(start, 'keys', keys, 2, 0.9),
      event(start + 2.5, 'keys', keys, 1.5, 0.6),
      event(start, 'bass', [root], 1.75, 0.9),
      event(start + 2.5, 'bass', [root + 12], 0.5, 0.55),
      event(start + 3, 'bass', [root], 1, 0.75),
    ];
  }
  return bar.flatMap((chord, half) => {
    const { keys, root } = CHORDS[chord];
    const at = start + half * 2;
    return [event(at, 'keys', keys, 1.75, 0.85), event(at, 'bass', [root], 1.75, 0.85)];
  });
}

/** Boom-bap: kick on 1 and the "and" of 3, snare on 2 and 4, swung hats, ghost notes. */
function drums(start: number, barIndex: number, isLastBar: boolean): SongEvent[] {
  const events = [
    event(start, 'kick', [], 0.5, 1),
    event(start + 2.5, 'kick', [], 0.5, 0.75),
    event(start + 1, 'snare', [], 0.5, 0.85),
    event(start + 3, 'snare', [], 0.5, 0.85),
  ];
  if (barIndex % 2 === 1) events.push(event(start + 1.75, 'kick', [], 0.25, 0.45));
  if (barIndex % 4 === 3) events.push(event(start + 3.75, 'snare', [], 0.25, 0.25));
  for (let eighth = 0; eighth < 8; eighth++) {
    if (isLastBar && eighth >= 6) continue; // room for the fill
    events.push(event(start + eighth / 2, 'hat', [], 0.25, eighth % 2 === 0 ? 0.85 : 0.5));
  }
  if (isLastBar) {
    // A soft fill that lands on bar 1: an open hat and rising ghost snares.
    events.push(event(start + 3, 'openHat', [], 0.5, 0.8));
    events.push(event(start + 3.25, 'snare', [], 0.25, 0.3));
    events.push(event(start + 3.5, 'snare', [], 0.25, 0.45));
    events.push(event(start + 3.75, 'snare', [], 0.25, 0.6));
  } else if (barIndex % 8 === 7) {
    events.push(event(start + 3.5, 'openHat', [], 0.5, 0.6));
  }
  return events;
}

function buildEvents(): SongEvent[] {
  const events: SongEvent[] = [];
  const totalBars = SECTIONS.reduce((sum, section) => sum + section.chords.length, 0);
  let barIndex = 0;
  for (const { chords, melody } of SECTIONS) {
    chords.forEach((bar, i) => {
      const start = barIndex * BEATS_PER_BAR;
      events.push(...harmony(start, bar), ...drums(start, barIndex, barIndex === totalBars - 1));
      for (const [beat, note, beats] of melody[i] ?? []) {
        events.push(event(start + beat, 'lead', [note], beats, 0.8));
      }
      barIndex++;
    });
  }
  return events.sort((a, b) => a.beat - b.beat);
}

const EVENTS = buildEvents();

export const CHILL_TUNE: Song = {
  bpm: 75,
  swing: 0.62,
  loopBeats: SECTIONS.reduce((sum, section) => sum + section.chords.length, 0) * BEATS_PER_BAR,
  events: EVENTS,
};
