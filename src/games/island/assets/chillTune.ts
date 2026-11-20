// "Island Breeze": an original, laid-back lo-fi loop for the island, written
// as data (C major, 72 BPM, swung eighths, 16 bars ≈ 53 s). Electric-piano
// chords, a round bass, a sparse music-box melody and brushed drums.
// Composed for this project: no samples, no third-party music.
import type { Song, SongEvent } from '@/shared/audio/song';

const BEATS_PER_BAR = 4;

/** Chord voicings (MIDI) with the bass root an octave or two below. */
const CHORDS = {
  Fmaj7: { keys: [53, 57, 60, 64], root: 41 },
  Em7: { keys: [52, 55, 59, 62], root: 40 },
  Dm7: { keys: [50, 53, 57, 60], root: 38 },
  Cmaj7: { keys: [55, 59, 60, 64], root: 36 },
  G7: { keys: [55, 59, 62, 65], root: 43 },
  Am7: { keys: [57, 60, 64, 67], root: 45 },
} as const;
type ChordName = keyof typeof CHORDS;

/** One chord per bar (a pair = two beats each). Second half lifts to Am7, then turns home. */
// prettier-ignore
const PROGRESSION: readonly (ChordName | readonly [ChordName, ChordName])[] = [
  'Fmaj7', 'Em7', 'Dm7', 'Cmaj7', 'Fmaj7', 'Em7', ['Dm7', 'G7'], 'Cmaj7',
  'Am7', 'Em7', 'Fmaj7', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7',
];

/** Melody per bar: [beat in bar, MIDI note, length in beats]. Pentatonic, with room to breathe. */
// prettier-ignore
const MELODY: readonly (readonly (readonly [number, number, number])[])[] = [
  [[0.5, 76, 1], [1.5, 72, 0.5], [2, 69, 1.5]],
  [[0, 67, 1], [1.5, 74, 1], [3, 76, 1]],
  [[0.5, 74, 1.5], [2, 72, 0.5], [2.5, 69, 1.5]],
  [[0, 67, 3]],
  [[0.5, 69, 0.5], [1, 72, 0.5], [1.5, 76, 1], [3, 79, 0.5]],
  [[0, 76, 1.5], [2, 74, 1], [3, 71, 1]],
  [[0, 74, 1], [1.5, 77, 0.5], [2, 74, 1], [3, 71, 1]],
  [[0, 72, 3]],
  [[1, 76, 0.5], [1.5, 79, 1], [3, 76, 0.5]],
  [[0, 74, 1], [1.5, 71, 0.5], [2, 67, 2]],
  [[0.5, 69, 0.5], [1, 72, 0.5], [1.5, 69, 0.5], [2, 67, 1.5]],
  [[0, 64, 2], [2.5, 67, 1]],
  [[0, 65, 0.5], [0.5, 69, 0.5], [1, 72, 1], [2.5, 74, 1.5]],
  [[0, 76, 2], [2.5, 74, 0.5], [3, 71, 1]],
  [[0, 72, 1], [1.5, 69, 0.5], [2, 72, 0.5], [2.5, 76, 1.5]],
  [[0, 74, 2]],
];

const event = (
  beat: number,
  voice: SongEvent['voice'],
  notes: readonly number[],
  beats: number,
  velocity: number,
): SongEvent => ({ beat, voice, notes, beats, velocity });

/** Lazy comping: the chord on the downbeat and again just after beat 3. */
function chordEvents(bar: number, name: ChordName, from: number, length: number): SongEvent[] {
  const { keys, root } = CHORDS[name];
  const start = bar * BEATS_PER_BAR + from;
  const events = [event(start, 'keys', keys, Math.min(1.5, length), 0.9)];
  events.push(event(start, 'bass', [root], Math.min(2.5, length), 0.9));
  if (length === BEATS_PER_BAR) {
    events.push(event(start + 2.5, 'keys', keys, 1.5, 0.65));
    events.push(event(start + 3, 'bass', [root + 7], 0.75, 0.7));
  }
  return events;
}

function drumEvents(bar: number): SongEvent[] {
  const start = bar * BEATS_PER_BAR;
  const events = [
    event(start, 'kick', [], 0.5, 1),
    event(start + 2.5, 'kick', [], 0.5, 0.8),
    event(start + 1, 'snare', [], 0.5, 0.9),
    event(start + 3, 'snare', [], 0.5, 0.9),
  ];
  for (let eighth = 0; eighth < BEATS_PER_BAR * 2; eighth++) {
    // Skip the odd hat so the groove breathes.
    if (eighth === 7 && bar % 2 === 1) continue;
    events.push(event(start + eighth / 2, 'hat', [], 0.25, eighth % 2 === 0 ? 0.9 : 0.55));
  }
  return events;
}

function buildEvents(): SongEvent[] {
  const events: SongEvent[] = [];
  PROGRESSION.forEach((chord, bar) => {
    if (typeof chord === 'string') {
      events.push(...chordEvents(bar, chord, 0, BEATS_PER_BAR));
    } else {
      events.push(...chordEvents(bar, chord[0], 0, 2), ...chordEvents(bar, chord[1], 2, 2));
    }
    events.push(...drumEvents(bar));
    for (const [beat, note, length] of MELODY[bar] ?? []) {
      events.push(event(bar * BEATS_PER_BAR + beat, 'bell', [note], length, 0.8));
    }
  });
  return events.sort((a, b) => a.beat - b.beat);
}

export const CHILL_TUNE: Song = {
  bpm: 72,
  swing: 0.6,
  loopBeats: PROGRESSION.length * BEATS_PER_BAR,
  events: buildEvents(),
};
