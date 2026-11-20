// Fixed-timestep clock (accumulator pattern). Game logic advances in equal
// steps no matter the display's frame rate, so movement is identical on a
// 60 Hz laptop and a 144 Hz monitor; rendering interpolates between steps.

/** Absorbs float rounding so e.g. 60 frames of 1/60 s yield exactly 60 steps. */
const ROUNDING_TOLERANCE = 1e-9;

export interface FixedStepClock {
  readonly stepSeconds: number;
  readonly maxStepsPerFrame: number;
  /** Time not yet consumed by a step. */
  accumulator: number;
}

export function createFixedStepClock(
  stepsPerSecond: number,
  maxStepsPerFrame: number,
): FixedStepClock {
  return { stepSeconds: 1 / stepsPerSecond, maxStepsPerFrame, accumulator: 0 };
}

/**
 * Runs as many whole steps as the elapsed time allows and returns the
 * interpolation factor (0..1) between the last two logic states. After a long
 * stall (tab in background) at most `maxStepsPerFrame` steps run and the rest
 * is dropped, so the game never tries to "catch up" in a burst.
 */
export function advanceClock(
  clock: FixedStepClock,
  frameSeconds: number,
  step: (stepSeconds: number) => void,
): number {
  clock.accumulator += Math.max(0, frameSeconds);
  let steps = 0;
  const due = (): boolean => clock.accumulator >= clock.stepSeconds - ROUNDING_TOLERANCE;
  while (due() && steps < clock.maxStepsPerFrame) {
    step(clock.stepSeconds);
    clock.accumulator = Math.max(0, clock.accumulator - clock.stepSeconds);
    steps++;
  }
  if (due()) {
    clock.accumulator = 0;
  }
  return clock.accumulator / clock.stepSeconds;
}
