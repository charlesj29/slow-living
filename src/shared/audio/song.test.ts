import { describe, expect, it } from 'vitest';
import { beatToSeconds, eventsBetween, midiToFrequency, secondsToBeat, type Song } from './song';

const SONG: Song = {
  bpm: 60,
  swing: 0.6,
  loopBeats: 4,
  events: [
    { beat: 0, voice: 'kick', notes: [], beats: 0.5, velocity: 1 },
    { beat: 2.5, voice: 'hat', notes: [], beats: 0.25, velocity: 0.5 },
  ],
};

describe('song timing', () => {
  it('converts MIDI notes to frequencies', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440);
    expect(midiToFrequency(81)).toBeCloseTo(880);
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
  });

  it('swings off-beat eighths and leaves other positions alone', () => {
    expect(beatToSeconds(SONG, 2)).toBeCloseTo(2);
    expect(beatToSeconds(SONG, 2.5)).toBeCloseTo(2.6);
    expect(beatToSeconds(SONG, 2.25)).toBeCloseTo(2.25);
    expect(secondsToBeat(SONG, 3)).toBeCloseTo(3);
  });

  it('finds the events in a window, unrolling the loop', () => {
    const found = eventsBetween(SONG, 2, 9);
    expect(found.map((e) => e.beat)).toEqual([2.5, 4, 6.5, 8]);
    expect(eventsBetween(SONG, 4, 4)).toEqual([]);
  });

  it('never schedules an event twice across consecutive windows', () => {
    const beats = [
      ...eventsBetween(SONG, 0, 3.7),
      ...eventsBetween(SONG, 3.7, 8),
      ...eventsBetween(SONG, 8, 12.1),
    ].map((e) => e.beat);
    expect(beats).toEqual([0, 2.5, 4, 6.5, 8, 10.5, 12]);
  });
});
