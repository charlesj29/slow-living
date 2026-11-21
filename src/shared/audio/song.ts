// A song as plain data: notes on a beat grid that loops forever. Pure (no Web
// Audio), so timing rules are unit-tested; `musicPlayer.ts` plays it.

export type VoiceName = 'keys' | 'bass' | 'lead' | 'kick' | 'snare' | 'hat' | 'openHat';

export interface SongEvent {
  /** Start, in beats from the start of the loop (before swing). */
  readonly beat: number;
  readonly voice: VoiceName;
  /** MIDI note numbers (a chord has several); drums ignore them. */
  readonly notes: readonly number[];
  /** Length in beats. */
  readonly beats: number;
  /** 0..1 loudness. */
  readonly velocity: number;
}

export interface Song {
  readonly bpm: number;
  /**
   * Where the off-beat eighth lands within its beat: 0.5 = straight, about
   * 0.6 = a lazy swing.
   */
  readonly swing: number;
  readonly loopBeats: number;
  /** Sorted by beat. */
  readonly events: readonly SongEvent[];
}

/** A song event at an absolute beat (loops unrolled). */
export interface ScheduledEvent {
  readonly event: SongEvent;
  readonly beat: number;
}

const A4_MIDI = 69;
const A4_HZ = 440;
const SEMITONES_PER_OCTAVE = 12;
const EPSILON = 1e-6;

export function midiToFrequency(note: number): number {
  return A4_HZ * 2 ** ((note - A4_MIDI) / SEMITONES_PER_OCTAVE);
}

/** Seconds from the song start to an absolute beat, with off-beat eighths swung. */
export function beatToSeconds(song: Song, beat: number): number {
  const whole = Math.floor(beat + EPSILON);
  const fraction = beat - whole;
  const swung = Math.abs(fraction - 0.5) < EPSILON ? song.swing : fraction;
  return ((whole + swung) * 60) / song.bpm;
}

/** Absolute beat reached after `seconds` (ignoring swing; used for the scheduling window). */
export function secondsToBeat(song: Song, seconds: number): number {
  return (seconds * song.bpm) / 60;
}

/** Events starting in [fromBeat, toBeat), unrolling the loop as often as needed. */
export function eventsBetween(song: Song, fromBeat: number, toBeat: number): ScheduledEvent[] {
  const found: ScheduledEvent[] = [];
  if (toBeat <= fromBeat || song.loopBeats <= 0) return found;
  const firstLoop = Math.floor(fromBeat / song.loopBeats);
  const lastLoop = Math.floor(toBeat / song.loopBeats);
  for (let loop = firstLoop; loop <= lastLoop; loop++) {
    const offset = loop * song.loopBeats;
    for (const event of song.events) {
      const beat = offset + event.beat;
      if (beat >= fromBeat && beat < toBeat) found.push({ event, beat });
    }
  }
  return found;
}
