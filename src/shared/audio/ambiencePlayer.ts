// Nature sounds under the music: surf, rain, a fire, birds and crickets, each
// a layer whose level the game sets (louder near the sea, birds by day,
// crickets at night...). Levels glide, so walking about never jumps. Short
// sounds are queued ahead on the audio clock. Like the music, it can only
// start after a user gesture: call `start()` from one.
import { createRng } from '@/shared/engine/random';
import {
  birdPhrase,
  crackle,
  cricketTrill,
  fireBed,
  noiseBuffer,
  rainfall,
  surf,
} from './ambienceSounds';
import { startTicker, type Ticker } from './ticker';

export type AmbienceLayer = 'waves' | 'birds' | 'crickets' | 'rain' | 'fire';
/** 0..1 per layer. */
export type AmbienceLevels = Readonly<Record<AmbienceLayer, number>>;

export const AMBIENCE_LAYERS: readonly AmbienceLayer[] = [
  'waves',
  'birds',
  'crickets',
  'rain',
  'fire',
];

export interface AmbiencePlayerOptions {
  /** 0..1 volume of the whole layer. */
  readonly volume: number;
  readonly fadeSeconds: number;
  readonly fadeInSeconds: number;
}

export interface AmbiencePlayer {
  start: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  setLevels: (levels: AmbienceLevels) => void;
  dispose: () => void;
}

/** Each layer at full level, balanced against the others. */
const LAYER_GAIN: AmbienceLevels = {
  waves: 0.5,
  birds: 0.35,
  crickets: 0.16,
  rain: 0.45,
  fire: 0.5,
};
/** How quickly a layer follows a new level (seconds, time constant). */
const GLIDE_SECONDS = 0.8;
/** Below this a layer counts as silent, and its short sounds aren't queued. */
const AUDIBLE = 0.02;
const LOOKAHEAD_SECONDS = 0.4;
const TICK_MS = 50;
/** Seconds between bird phrases (scaled down when birds are loud), crackles and trills. */
const BIRD_GAP = { min: 1.8, max: 6.5 } as const;
const CRACKLE_GAP = { min: 0.05, max: 0.45 } as const;
const CRICKETS = [
  { pitch: 4600, every: 0.72 },
  { pitch: 5150, every: 0.93 },
] as const;
const RNG_SEED = 0xa3b1;

interface Graph {
  readonly context: AudioContext;
  readonly master: GainNode;
  readonly layers: Readonly<Record<AmbienceLayer, GainNode>>;
  readonly noise: AudioBuffer;
}

function buildGraph(context: AudioContext): Graph {
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);
  const layer = (): GainNode => {
    const node = context.createGain();
    node.gain.value = 0;
    node.connect(master);
    return node;
  };
  const layers = {
    waves: layer(),
    birds: layer(),
    crickets: layer(),
    rain: layer(),
    fire: layer(),
  };
  const noise = noiseBuffer(context, 11);
  surf(context, noise, layers.waves);
  rainfall(context, noise, layers.rain);
  fireBed(context, noise, layers.fire);
  return { context, master, layers, noise };
}

export function createAmbiencePlayer(options: AmbiencePlayerOptions): AmbiencePlayer {
  let graph: Graph | null = null;
  let ticker: Ticker | null = null;
  let muted = false;
  let levels: AmbienceLevels = { waves: 0, birds: 0, crickets: 0, rain: 0, fire: 0 };
  const rng = createRng(RNG_SEED);
  const next = { bird: 0, crackle: 0, crickets: CRICKETS.map(() => 0) };

  /** Queues the short sounds due before the lookahead horizon (or skips them while silent). */
  const tick = (): void => {
    if (!graph || graph.context.state !== 'running') return;
    const { context, layers, noise } = graph;
    const now = context.currentTime;
    const horizon = now + LOOKAHEAD_SECONDS;
    if (levels.birds < AUDIBLE) next.bird = Math.max(next.bird, now);
    while (levels.birds >= AUDIBLE && next.bird < horizon) {
      const end = birdPhrase(context, layers.birds, Math.max(next.bird, now), rng);
      next.bird = end + rng.range(BIRD_GAP.min, BIRD_GAP.max) / (0.5 + levels.birds);
    }
    if (levels.fire < AUDIBLE) next.crackle = Math.max(next.crackle, now);
    while (levels.fire >= AUDIBLE && next.crackle < horizon) {
      crackle(context, noise, layers.fire, Math.max(next.crackle, now), rng);
      next.crackle = Math.max(next.crackle, now) + rng.range(CRACKLE_GAP.min, CRACKLE_GAP.max);
    }
    CRICKETS.forEach((cricket, i) => {
      let at = Math.max(next.crickets[i] ?? 0, now);
      while (levels.crickets >= AUDIBLE && at < horizon) {
        cricketTrill(context, layers.crickets, at, cricket.pitch);
        at += cricket.every * rng.range(0.9, 1.1);
      }
      next.crickets[i] = at;
    });
  };

  const fadeTo = (level: number, seconds: number): void => {
    if (!graph) return;
    const { gain } = graph.master;
    const now = graph.context.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(level, now + seconds);
  };

  const applyLevels = (): void => {
    if (!graph) return;
    const now = graph.context.currentTime;
    for (const layer of AMBIENCE_LAYERS) {
      const target = Math.max(0, Math.min(1, levels[layer])) * LAYER_GAIN[layer];
      graph.layers[layer].gain.setTargetAtTime(target, now, GLIDE_SECONDS);
    }
  };

  const onVisibility = (): void => {
    if (!graph) return;
    if (document.hidden) void graph.context.suspend();
    else if (!muted) void graph.context.resume();
  };

  return {
    start: async () => {
      if (!graph) {
        graph = buildGraph(new AudioContext({ latencyHint: 'playback' }));
        ticker = startTicker(TICK_MS, tick);
        document.addEventListener('visibilitychange', onVisibility);
        await graph.context.resume();
        applyLevels();
        fadeTo(muted ? 0 : options.volume, options.fadeInSeconds);
        return;
      }
      await graph.context.resume();
      fadeTo(muted ? 0 : options.volume, options.fadeSeconds);
    },
    setMuted: (value) => {
      muted = value;
      const current = graph;
      if (!current) return;
      if (muted) {
        fadeTo(0, options.fadeSeconds);
        window.setTimeout(() => {
          if (muted) void current.context.suspend();
        }, options.fadeSeconds * 1000);
      } else {
        void current.context.resume().then(() => fadeTo(options.volume, options.fadeSeconds));
      }
    },
    setLevels: (value) => {
      levels = value;
      applyLevels();
    },
    dispose: () => {
      ticker?.stop();
      document.removeEventListener('visibilitychange', onVisibility);
      void graph?.context.close();
      graph = null;
      ticker = null;
    },
  };
}
