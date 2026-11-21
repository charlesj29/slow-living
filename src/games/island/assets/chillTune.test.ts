import { describe, expect, it } from 'vitest';
import { beatToSeconds } from '@/shared/audio/song';
import { CHILL_TUNE } from './chillTune';

const BAR = 4;
const eventsInBar = (bar: number): typeof CHILL_TUNE.events =>
  CHILL_TUNE.events.filter((e) => Math.floor(e.beat / BAR) === bar);

describe('chill tune', () => {
  it('is a 32-bar lo-fi loop of about a minute and three quarters', () => {
    expect(CHILL_TUNE.loopBeats).toBe(32 * BAR);
    expect(CHILL_TUNE.bpm).toBeGreaterThanOrEqual(70);
    expect(CHILL_TUNE.bpm).toBeLessThanOrEqual(90);
    const seconds = beatToSeconds(CHILL_TUNE, CHILL_TUNE.loopBeats);
    expect(seconds).toBeGreaterThan(95);
    expect(seconds).toBeLessThan(110);
  });

  it('keeps every note inside the loop, sorted, with sane values', () => {
    let previous = -1;
    for (const event of CHILL_TUNE.events) {
      expect(event.beat).toBeGreaterThanOrEqual(previous);
      previous = event.beat;
      expect(event.beat).toBeLessThan(CHILL_TUNE.loopBeats);
      expect(event.beats).toBeGreaterThan(0);
      expect(event.velocity).toBeGreaterThan(0);
      expect(event.velocity).toBeLessThanOrEqual(1);
      for (const note of event.notes) {
        expect(note).toBeGreaterThanOrEqual(24);
        expect(note).toBeLessThanOrEqual(96);
      }
    }
  });

  it('never drops out: chords, bass and drums play in every bar', () => {
    for (let bar = 0; bar < CHILL_TUNE.loopBeats / BAR; bar++) {
      const voices = new Set(eventsInBar(bar).map((e) => e.voice));
      for (const voice of ['keys', 'bass', 'kick', 'snare', 'hat'] as const) {
        expect(voices.has(voice), `bar ${String(bar + 1)} ${voice}`).toBe(true);
      }
    }
  });

  it('leads back into the top: the last bar has a fill, and bar 1 starts on the beat', () => {
    const last = eventsInBar(CHILL_TUNE.loopBeats / BAR - 1);
    expect(last.filter((e) => e.voice === 'snare').length).toBeGreaterThan(2);
    expect(last.some((e) => e.voice === 'openHat')).toBe(true);
    const first = CHILL_TUNE.events.filter((e) => e.beat === 0).map((e) => e.voice);
    expect(first).toEqual(expect.arrayContaining(['keys', 'bass', 'kick']));
  });

  it('has a melody through most of the loop, with some bars left open', () => {
    const bars = CHILL_TUNE.loopBeats / BAR;
    const withLead = Array.from({ length: bars }, (_, bar) =>
      eventsInBar(bar).some((e) => e.voice === 'lead'),
    ).filter(Boolean).length;
    expect(withLead).toBeGreaterThan(bars * 0.7);
    expect(withLead).toBeLessThan(bars);
  });
});
