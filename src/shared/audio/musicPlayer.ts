// Plays a looping `Song` with Web Audio. Notes are scheduled a little ahead
// on the audio clock (not with timers), so the loop never drifts or skips.
// Browsers only allow sound after a user gesture: call `start()` from one.
import { beatToSeconds, eventsBetween, secondsToBeat, type Song } from './song';
import { playVoice, type VoiceBuses } from './voices';

export interface MusicPlayerOptions {
  /** 0..1 master volume. */
  readonly volume: number;
  /** How long muting / unmuting fades. */
  readonly fadeSeconds: number;
}

export interface MusicPlayer {
  /** Starts (or resumes) playback; must be called from a user gesture the first time. */
  start: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  /** Stops everything and releases the audio device. */
  dispose: () => void;
}

/** How far ahead notes are queued, and how often the queue is topped up. */
const LOOKAHEAD_SECONDS = 0.25;
const TICK_MS = 50;
const START_DELAY_SECONDS = 0.1;
const NOISE_SECONDS = 2;
const CRACKLE = { level: 0.025, clicksPerSecond: 9, filterHz: 3200 };
const MIX = { lowpassHz: 6500, keysLowpassHz: 2400, tremoloHz: 4.2, tremoloDepth: 0.12 };
const ECHO = { beats: 0.75, feedback: 0.32, lowpassHz: 1800, level: 0.5 };

/** Deterministic pseudo-random numbers for the noise buffers (no Math.random needed). */
function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function whiteNoise(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * NOISE_SECONDS, context.sampleRate);
  const data = buffer.getChannelData(0);
  const random = lcg(7);
  for (let i = 0; i < data.length; i++) data[i] = random() * 2 - 1;
  return buffer;
}

/** Vinyl crackle: sparse clicks over a faint hiss, looped. */
function crackle(context: AudioContext, target: AudioNode): AudioBufferSourceNode {
  const buffer = context.createBuffer(1, context.sampleRate * NOISE_SECONDS, context.sampleRate);
  const data = buffer.getChannelData(0);
  const random = lcg(11);
  const clickChance = CRACKLE.clicksPerSecond / context.sampleRate;
  for (let i = 0; i < data.length; i++) {
    const click = random() < clickChance ? (random() * 2 - 1) * 0.9 : 0;
    data[i] = click + (random() * 2 - 1) * 0.04;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = CRACKLE.filterHz;
  const gain = context.createGain();
  gain.gain.value = CRACKLE.level;
  source.connect(filter).connect(gain).connect(target);
  return source;
}

/** mix → warm lowpass → gentle compressor → master volume → speakers; plus keys bus and echo. */
function buildGraph(context: AudioContext, song: Song): { buses: VoiceBuses; master: GainNode } {
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);
  const compressor = context.createDynamicsCompressor();
  compressor.connect(master);
  const warmth = context.createBiquadFilter();
  warmth.type = 'lowpass';
  warmth.frequency.value = MIX.lowpassHz;
  warmth.connect(compressor);
  const mix = context.createGain();
  mix.connect(warmth);

  const keysFilter = context.createBiquadFilter();
  keysFilter.type = 'lowpass';
  keysFilter.frequency.value = MIX.keysLowpassHz;
  const tremolo = context.createGain();
  keysFilter.connect(tremolo).connect(mix);
  const lfo = context.createOscillator();
  lfo.frequency.value = MIX.tremoloHz;
  const depth = context.createGain();
  depth.gain.value = MIX.tremoloDepth;
  lfo.connect(depth).connect(tremolo.gain);
  lfo.start();

  const echo = context.createDelay(2);
  echo.delayTime.value = (ECHO.beats * 60) / song.bpm;
  const feedback = context.createGain();
  feedback.gain.value = ECHO.feedback;
  const echoFilter = context.createBiquadFilter();
  echoFilter.type = 'lowpass';
  echoFilter.frequency.value = ECHO.lowpassHz;
  const echoOut = context.createGain();
  echoOut.gain.value = ECHO.level;
  echo.connect(echoFilter).connect(feedback).connect(echo);
  echoFilter.connect(echoOut).connect(mix);

  crackle(context, mix).start();
  return { buses: { context, mix, keys: keysFilter, echo, noise: whiteNoise(context) }, master };
}

export function createMusicPlayer(song: Song, options: MusicPlayerOptions): MusicPlayer {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let timer: number | undefined;
  let muted = false;
  let songStart = 0;
  let scheduledUpTo = 0;

  const tick = (buses: VoiceBuses): void => {
    const horizon = secondsToBeat(song, buses.context.currentTime + LOOKAHEAD_SECONDS - songStart);
    for (const { event, beat } of eventsBetween(song, scheduledUpTo, horizon)) {
      const time = songStart + beatToSeconds(song, beat);
      const duration = beatToSeconds(song, beat + event.beats) - beatToSeconds(song, beat);
      playVoice(buses, event.voice, event.notes, { time, duration, velocity: event.velocity });
    }
    scheduledUpTo = Math.max(scheduledUpTo, horizon);
  };

  const fadeTo = (level: number): void => {
    if (!context || !master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(level, context.currentTime, options.fadeSeconds / 3);
  };

  // A hidden tab pauses the music (timers are throttled there anyway).
  const onVisibility = (): void => {
    if (!context) return;
    if (document.hidden) void context.suspend();
    else if (!muted) void context.resume();
  };

  return {
    start: async () => {
      if (!context) {
        context = new AudioContext();
        const graph = buildGraph(context, song);
        master = graph.master;
        songStart = context.currentTime + START_DELAY_SECONDS;
        const { buses } = graph;
        timer = window.setInterval(() => tick(buses), TICK_MS);
        tick(buses);
        document.addEventListener('visibilitychange', onVisibility);
      }
      await context.resume();
      fadeTo(muted ? 0 : options.volume);
    },
    setMuted: (value) => {
      muted = value;
      if (!context) return;
      if (muted) {
        fadeTo(0);
        // Once faded out, suspend the clock so a muted page costs nothing.
        const faded = context;
        window.setTimeout(() => {
          if (muted) void faded.suspend();
        }, options.fadeSeconds * 1000);
      } else {
        void context.resume().then(() => fadeTo(options.volume));
      }
    },
    dispose: () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      void context?.close();
      context = null;
      master = null;
    },
  };
}
