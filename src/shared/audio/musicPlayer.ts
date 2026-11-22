// Plays a looping `Song` with Web Audio. Notes are queued ahead on the audio
// clock (never played "now" from a timer), and the loop is unrolled on that
// clock, so bar 1 follows the last bar exactly on the beat with the echo tails
// still ringing: the repeat has no seam. Browsers only allow sound after a
// user gesture: call `start()` from one.
import { buildMusicGraph, MELLOW_OPEN_HZ, type MusicGraph } from './musicGraph';
import { beatToSeconds, eventsBetween, secondsToBeat, type Song } from './song';
import { startTicker, type Ticker } from './ticker';
import { playVoice, type VoiceBuses } from './voices';

export interface MusicPlayerOptions {
  /** 0..1 master volume. */
  readonly volume: number;
  /** How long muting / unmuting fades. */
  readonly fadeSeconds: number;
  /** The very first start fades in slowly. */
  readonly fadeInSeconds: number;
  /** Mellow: the highs rolled off to this (Hz) and the volume scaled by this, over this long. */
  readonly mellowLowpassHz: number;
  readonly mellowVolume: number;
  readonly mellowSeconds: number;
}

export interface MusicPlayer {
  /** Starts (or resumes) playback; must be called from a user gesture the first time. */
  start: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  /** Softer and warmer (quiet moments), or back to normal; glides. */
  setMellow: (mellow: boolean) => void;
  /** Stops everything and releases the audio device. */
  dispose: () => void;
}

/** Notes are queued this far ahead; generous, so a busy frame can never starve the music. */
const LOOKAHEAD_SECONDS = 0.6;
const TICK_MS = 25;
const START_DELAY_SECONDS = 0.15;

/** Queues every note starting in [fromBeat, toBeat) at its exact audio-clock time. */
export function scheduleBeats(
  song: Song,
  buses: VoiceBuses,
  songStart: number,
  fromBeat: number,
  toBeat: number,
): void {
  for (const { event, beat } of eventsBetween(song, fromBeat, toBeat)) {
    const time = songStart + beatToSeconds(song, beat);
    const duration = songStart + beatToSeconds(song, beat + event.beats) - time;
    playVoice(buses, event.voice, event.notes, { time, duration, velocity: event.velocity });
  }
}

export function createMusicPlayer(song: Song, options: MusicPlayerOptions): MusicPlayer {
  let context: AudioContext | null = null;
  let graph: MusicGraph | null = null;
  let ticker: Ticker | null = null;
  let muted = false;
  let mellow = false;
  /** The volume to play at now (muted: silence). */
  const level = (): number => (muted ? 0 : options.volume * (mellow ? options.mellowVolume : 1));
  let songStart = 0;
  let scheduledUpTo = 0;

  const tick = (): void => {
    if (!context || !graph || context.state !== 'running') return;
    const horizon = secondsToBeat(song, context.currentTime + LOOKAHEAD_SECONDS - songStart);
    if (horizon <= scheduledUpTo) return;
    scheduleBeats(song, graph.buses, songStart, scheduledUpTo, horizon);
    scheduledUpTo = horizon;
  };

  const fadeTo = (level: number, seconds: number): void => {
    if (!context || !graph) return;
    const gain = graph.master.gain;
    const now = context.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(level, now + seconds);
  };

  const applyMellow = (): void => {
    if (!context || !graph) return;
    const now = context.currentTime;
    const frequency = graph.mellow.frequency;
    frequency.cancelScheduledValues(now);
    frequency.setValueAtTime(frequency.value, now);
    // Exponential, so the filter closes evenly to the ear.
    frequency.exponentialRampToValueAtTime(
      mellow ? options.mellowLowpassHz : MELLOW_OPEN_HZ,
      now + options.mellowSeconds,
    );
  };

  // A hidden tab pauses the music; the audio clock stops too, so it resumes on the beat.
  const onVisibility = (): void => {
    if (!context) return;
    if (document.hidden) void context.suspend();
    else if (!muted) void context.resume();
  };

  return {
    start: async () => {
      if (!context) {
        context = new AudioContext({ latencyHint: 'playback' });
        graph = buildMusicGraph(context, song);
        songStart = context.currentTime + START_DELAY_SECONDS;
        ticker = startTicker(TICK_MS, tick);
        document.addEventListener('visibilitychange', onVisibility);
        await context.resume();
        tick();
        applyMellow();
        fadeTo(level(), options.fadeInSeconds);
        return;
      }
      await context.resume();
      fadeTo(level(), options.fadeSeconds);
    },
    setMuted: (value) => {
      muted = value;
      const current = context;
      if (!current) return;
      if (muted) {
        fadeTo(0, options.fadeSeconds);
        // Once faded out, suspend the clock so a muted page costs nothing.
        window.setTimeout(() => {
          if (muted) void current.suspend();
        }, options.fadeSeconds * 1000);
      } else {
        void current.resume().then(() => fadeTo(level(), options.fadeSeconds));
      }
    },
    setMellow: (value) => {
      if (value === mellow) return;
      mellow = value;
      applyMellow();
      if (!muted) fadeTo(level(), options.mellowSeconds);
    },
    dispose: () => {
      ticker?.stop();
      document.removeEventListener('visibilitychange', onVisibility);
      void context?.close();
      context = null;
      graph = null;
      ticker = null;
    },
  };
}
