import { describe, expect, it } from 'vitest';
import { CHILL_TUNE } from './chillTune';

describe('chill tune', () => {
  it('is a 16-bar loop at an easy tempo', () => {
    expect(CHILL_TUNE.loopBeats).toBe(64);
    expect(CHILL_TUNE.bpm).toBeLessThan(90);
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

  it('has chords, bass, melody and drums in every bar', () => {
    for (let bar = 0; bar < CHILL_TUNE.loopBeats / 4; bar++) {
      const voices = new Set(
        CHILL_TUNE.events.filter((e) => Math.floor(e.beat / 4) === bar).map((e) => e.voice),
      );
      for (const voice of ['keys', 'bass', 'bell', 'kick', 'snare', 'hat'] as const) {
        expect(voices.has(voice), `bar ${String(bar)} ${voice}`).toBe(true);
      }
    }
  });
});
