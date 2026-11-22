import { describe, expect, it } from 'vitest';
import { createRng } from '@/shared/engine/random';
import { BUTTERFLY_FRAMES } from '../assets/paintInsects';
import { ISLAND_CONFIG } from '../core/config';
import type { ButterflyRoute } from './ambientSpots';
import { butterflyPose, createFireflies, fireflyPose } from './insectMotion';

const settings = ISLAND_CONFIG.butterflies;
const route: ButterflyRoute = {
  from: { x: 100, y: 100 },
  to: { x: 160, y: 120 },
  colorIndex: 0,
  phase: 0,
};

describe('butterflyPose', () => {
  it('rests on the first flower, flies, rests on the second, and flies back', () => {
    const resting = butterflyPose(route, settings.restSeconds / 2, settings);
    expect(resting).toMatchObject({ x: 100, groundY: 100 });
    const atSecond = butterflyPose(
      route,
      settings.restSeconds * 1.5 + settings.flightSeconds,
      settings,
    );
    expect(atSecond).toMatchObject({ x: 160, groundY: 120 });
    const cycle = 2 * (settings.restSeconds + settings.flightSeconds);
    expect(butterflyPose(route, cycle + 0.5, settings)).toMatchObject({ x: 100, groundY: 100 });
  });

  it('moves smoothly: no jumps between frames, and lands where it took off', () => {
    const step = 1 / 60;
    let previous = butterflyPose(route, 0, settings);
    for (let t = step; t < 2 * (settings.restSeconds + settings.flightSeconds); t += step) {
      const pose = butterflyPose(route, t, settings);
      expect(Math.hypot(pose.x - previous.x, pose.groundY - previous.groundY)).toBeLessThan(1.5);
      expect(Math.abs(pose.lift - previous.lift)).toBeLessThan(1);
      previous = pose;
    }
  });

  it('beats its wings in flight and mostly keeps them open when perched', () => {
    const midFlight = settings.restSeconds + settings.flightSeconds / 2;
    const frames = new Set<number>();
    for (let i = 0; i < 8; i++) {
      frames.add(butterflyPose(route, midFlight + i * settings.flapFrameSeconds, settings).frame);
    }
    expect(frames.size).toBe(3);
    expect(butterflyPose(route, 0.1, settings).frame).toBe(BUTTERFLY_FRAMES.open);
  });
});

describe('fireflies', () => {
  const swarms = [{ x: 50, y: 50 }];
  const flies = createFireflies(swarms, ISLAND_CONFIG.fireflies, createRng(9));

  it('makes a swarm of the configured size, the same for the same seed', () => {
    expect(flies).toHaveLength(ISLAND_CONFIG.fireflies.perSwarm);
    expect(createFireflies(swarms, ISLAND_CONFIG.fireflies, createRng(9))).toEqual(flies);
  });

  it('drift near their swarm and spend part of each blink lit and part dark', () => {
    const drift = ISLAND_CONFIG.fireflies.driftPx;
    for (const fly of flies) {
      const glows = new Set<string>();
      for (let t = 0; t < fly.blinkSeconds; t += 0.05) {
        const pose = fireflyPose(fly, t, drift);
        expect(Math.abs(pose.x - 50)).toBeLessThanOrEqual(drift);
        expect(Math.abs(pose.groundY - 50)).toBeLessThanOrEqual(drift);
        glows.add(pose.glow);
      }
      expect([...glows].sort()).toEqual(['dim', 'glow', 'off']);
    }
  });
});
