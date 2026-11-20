import { describe, expect, it } from 'vitest';
import { advanceClock, createFixedStepClock } from './fixedStep';

describe('fixed-step clock', () => {
  it('runs whole steps and returns the leftover as an interpolation factor', () => {
    const clock = createFixedStepClock(10, 5); // 0.1 s steps
    let steps = 0;
    const alpha = advanceClock(clock, 0.25, () => steps++);
    expect(steps).toBe(2);
    expect(alpha).toBeCloseTo(0.5);
  });

  it('carries leftover time into the next frame', () => {
    const clock = createFixedStepClock(10, 5);
    let steps = 0;
    advanceClock(clock, 0.06, () => steps++);
    advanceClock(clock, 0.06, () => steps++);
    expect(steps).toBe(1);
  });

  it('runs the same number of steps however the time is split into frames', () => {
    const count = (frames: number[]): number => {
      const clock = createFixedStepClock(60, 100);
      let steps = 0;
      for (const frame of frames) advanceClock(clock, frame, () => steps++);
      return steps;
    };
    expect(count(Array.from({ length: 60 }, () => 1 / 60))).toBe(
      count(Array.from({ length: 144 }, () => 1 / 144)),
    );
  });

  it('caps steps after a long stall and drops the backlog', () => {
    const clock = createFixedStepClock(60, 5);
    let steps = 0;
    const alpha = advanceClock(clock, 10, () => steps++);
    expect(steps).toBe(5);
    expect(alpha).toBe(0);
  });

  it('ignores negative frame times', () => {
    const clock = createFixedStepClock(60, 5);
    let steps = 0;
    advanceClock(clock, -1, () => steps++);
    expect(steps).toBe(0);
  });
});
