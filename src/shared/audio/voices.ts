// Tiny Web Audio instruments for a lo-fi sound: every note is a few
// oscillators or a burst of noise through an envelope, started at an exact
// AudioContext time and freed by the browser when it stops.
import { midiToFrequency, type VoiceName } from './song';

/** Where voices send their sound. */
export interface VoiceBuses {
  readonly context: AudioContext;
  /** Dry mix. */
  readonly mix: AudioNode;
  /** Electric piano bus (with tremolo and a mellow filter). */
  readonly keys: AudioNode;
  /** Echo send. */
  readonly echo: AudioNode;
  /** Shared white-noise buffer for drums. */
  readonly noise: AudioBuffer;
}

interface Note {
  readonly time: number;
  readonly duration: number;
  readonly velocity: number;
}

const SILENT = 0.0001;

/** Gain node with an attack → decay → release envelope. */
function envelope(
  buses: VoiceBuses,
  note: Note,
  shape: { attack: number; peak: number; sustain: number; decay: number; release: number },
): GainNode {
  const gain = buses.context.createGain();
  const { time, duration, velocity } = note;
  const peak = shape.peak * velocity;
  const end = time + Math.max(duration, shape.attack);
  gain.gain.setValueAtTime(SILENT, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + shape.attack);
  gain.gain.setTargetAtTime(
    Math.max(peak * shape.sustain, SILENT),
    time + shape.attack,
    shape.decay,
  );
  gain.gain.setTargetAtTime(SILENT, end, shape.release / 3);
  return gain;
}

function oscillator(
  buses: VoiceBuses,
  type: OscillatorType,
  frequency: number,
  target: AudioNode,
  level: number,
  start: number,
  stop: number,
): void {
  const osc = buses.context.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  const gain = buses.context.createGain();
  gain.gain.value = level;
  osc.connect(gain).connect(target);
  osc.start(start);
  osc.stop(stop);
}

/** A soft electric piano: a sine with a faint bell-like overtone. */
function keys(buses: VoiceBuses, note: Note, midi: number): void {
  const env = envelope(buses, note, {
    attack: 0.012,
    peak: 0.16,
    sustain: 0.35,
    decay: 0.6,
    release: 0.5,
  });
  env.connect(buses.keys);
  const stop = note.time + note.duration + 0.6;
  const frequency = midiToFrequency(midi);
  oscillator(buses, 'sine', frequency, env, 1, note.time, stop);
  oscillator(buses, 'sine', frequency * 2, env, 0.12, note.time, stop);
  oscillator(buses, 'triangle', frequency * 4, env, 0.02, note.time, stop);
}

/** A round, low bass. */
function bass(buses: VoiceBuses, note: Note, midi: number): void {
  const env = envelope(buses, note, {
    attack: 0.02,
    peak: 0.32,
    sustain: 0.6,
    decay: 0.4,
    release: 0.15,
  });
  const filter = buses.context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  env.connect(filter).connect(buses.mix);
  const stop = note.time + note.duration + 0.25;
  oscillator(buses, 'sine', midiToFrequency(midi), env, 1, note.time, stop);
  oscillator(buses, 'triangle', midiToFrequency(midi), env, 0.3, note.time, stop);
}

/** A music-box bell for the melody, half of it sent to the echo. */
function bell(buses: VoiceBuses, note: Note, midi: number): void {
  const env = envelope(buses, note, {
    attack: 0.005,
    peak: 0.09,
    sustain: 0.15,
    decay: 0.35,
    release: 0.6,
  });
  env.connect(buses.mix);
  const send = buses.context.createGain();
  send.gain.value = 0.5;
  env.connect(send).connect(buses.echo);
  const stop = note.time + note.duration + 0.8;
  oscillator(buses, 'triangle', midiToFrequency(midi), env, 1, note.time, stop);
  oscillator(buses, 'sine', midiToFrequency(midi) * 3, env, 0.08, note.time, stop);
}

/** A soft, thumpy kick: a sine sweeping down. */
function kick(buses: VoiceBuses, note: Note): void {
  const { context } = buses;
  const osc = context.createOscillator();
  osc.frequency.setValueAtTime(110, note.time);
  osc.frequency.exponentialRampToValueAtTime(45, note.time + 0.12);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.42 * note.velocity, note.time);
  gain.gain.exponentialRampToValueAtTime(SILENT, note.time + 0.32);
  osc.connect(gain).connect(buses.mix);
  osc.start(note.time);
  osc.stop(note.time + 0.35);
}

/** Filtered noise bursts: a brushed snare or a closed hat. */
function noiseHit(
  buses: VoiceBuses,
  note: Note,
  filter: { type: BiquadFilterType; frequency: number; q: number },
  level: number,
  length: number,
): void {
  const { context } = buses;
  const source = context.createBufferSource();
  source.buffer = buses.noise;
  const shaping = context.createBiquadFilter();
  shaping.type = filter.type;
  shaping.frequency.value = filter.frequency;
  shaping.Q.value = filter.q;
  const gain = context.createGain();
  gain.gain.setValueAtTime(level * note.velocity, note.time);
  gain.gain.exponentialRampToValueAtTime(SILENT, note.time + length);
  source.connect(shaping).connect(gain).connect(buses.mix);
  source.start(note.time, Math.random() * (buses.noise.duration - length));
  source.stop(note.time + length + 0.02);
}

export function playVoice(
  buses: VoiceBuses,
  voice: VoiceName,
  notes: readonly number[],
  note: Note,
): void {
  switch (voice) {
    case 'keys':
      for (const midi of notes) keys(buses, note, midi);
      return;
    case 'bass':
      for (const midi of notes) bass(buses, note, midi);
      return;
    case 'bell':
      for (const midi of notes) bell(buses, note, midi);
      return;
    case 'kick':
      kick(buses, note);
      return;
    case 'snare':
      noiseHit(buses, note, { type: 'bandpass', frequency: 1800, q: 0.7 }, 0.1, 0.2);
      return;
    case 'hat':
      noiseHit(buses, note, { type: 'highpass', frequency: 7000, q: 0.5 }, 0.035, 0.05);
      return;
  }
}
