// Tiny Web Audio instruments for a lo-fi sound. Each note is a few
// oscillators or a burst of noise through an envelope that always fades
// fully to silence before the sound source stops, so nothing ever clicks.
import { midiToFrequency, type VoiceName } from './song';

/** Where voices send their sound (built by `musicGraph.ts`). */
export interface VoiceBuses {
  readonly context: BaseAudioContext;
  /** Dry mix. */
  readonly mix: AudioNode;
  /** Electric-piano bus (mellow filter, gentle tremolo). */
  readonly keys: AudioNode;
  /** Echo send. */
  readonly echo: AudioNode;
  /** Slow pitch drift in cents, like a worn tape, for the keys. */
  readonly wobble: AudioNode;
  /** Shared white-noise buffer for drums. */
  readonly noise: AudioBuffer;
}

export interface Note {
  readonly time: number;
  readonly duration: number;
  readonly velocity: number;
}

interface Envelope {
  readonly attack: number;
  readonly peak: number;
  /** Level the note settles to, as a share of the peak. */
  readonly sustain: number;
  /** Time constant of the fall from peak to sustain. */
  readonly decay: number;
  readonly release: number;
}

const SILENT = 0.0001;

/**
 * Attack → decay towards sustain → release to exactly zero. The level at the
 * release point is computed, so the release starts where the decay is (no jump).
 * Returns the gain node and when the sound has fully died away.
 */
function envelope(context: BaseAudioContext, note: Note, shape: Envelope): [GainNode, number] {
  const gain = context.createGain();
  const peak = shape.peak * note.velocity;
  const sustain = peak * shape.sustain;
  const decayStart = note.time + shape.attack;
  const releaseStart = Math.max(note.time + note.duration, decayStart);
  const levelAtRelease =
    sustain + (peak - sustain) * Math.exp(-(releaseStart - decayStart) / shape.decay);
  const end = releaseStart + shape.release;
  gain.gain.setValueAtTime(SILENT, note.time);
  gain.gain.exponentialRampToValueAtTime(peak, decayStart);
  gain.gain.setTargetAtTime(sustain, decayStart, shape.decay);
  gain.gain.setValueAtTime(levelAtRelease, releaseStart);
  gain.gain.linearRampToValueAtTime(0, end);
  return [gain, end];
}

function tone(
  context: BaseAudioContext,
  type: OscillatorType,
  frequency: number,
  level: number,
  target: AudioNode,
  span: readonly [number, number],
): OscillatorNode {
  const osc = context.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  const gain = context.createGain();
  gain.gain.value = level;
  osc.connect(gain).connect(target);
  osc.start(span[0]);
  osc.stop(span[1] + 0.02);
  return osc;
}

/** A soft, warm electric piano: sine body, a little bell on top, drifting with the tape. */
function keys(buses: VoiceBuses, note: Note, midi: number): void {
  const { context } = buses;
  const [env, end] = envelope(context, note, {
    attack: 0.015,
    peak: 0.12,
    sustain: 0.4,
    decay: 0.9,
    release: 0.6,
  });
  env.connect(buses.keys);
  const frequency = midiToFrequency(midi);
  const span = [note.time, end] as const;
  for (const osc of [
    tone(context, 'sine', frequency, 1, env, span),
    tone(context, 'sine', frequency * 2, 0.08, env, span),
    tone(context, 'triangle', frequency * 3, 0.015, env, span),
  ]) {
    buses.wobble.connect(osc.detune);
  }
}

/** A deep, round bass that sits under everything. */
function bass(buses: VoiceBuses, note: Note, midi: number): void {
  const { context } = buses;
  const [env, end] = envelope(context, note, {
    attack: 0.03,
    peak: 0.3,
    sustain: 0.7,
    decay: 0.6,
    release: 0.12,
  });
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 320;
  env.connect(filter).connect(buses.mix);
  const span = [note.time, end] as const;
  tone(context, 'sine', midiToFrequency(midi), 1, env, span);
  tone(context, 'triangle', midiToFrequency(midi), 0.25, env, span);
}

/** A mellow plucked lead for the melody; much of it goes to the echo. */
function lead(buses: VoiceBuses, note: Note, midi: number): void {
  const { context } = buses;
  const [env, end] = envelope(context, note, {
    attack: 0.008,
    peak: 0.07,
    sustain: 0.25,
    decay: 0.4,
    release: 0.5,
  });
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2200;
  env.connect(filter);
  filter.connect(buses.mix);
  const send = context.createGain();
  send.gain.value = 0.55;
  filter.connect(send).connect(buses.echo);
  const span = [note.time, end] as const;
  tone(context, 'triangle', midiToFrequency(midi), 1, env, span);
  tone(context, 'sine', midiToFrequency(midi) * 2, 0.15, env, span);
}

/** A soft, round kick: a sine sweeping down. */
function kick(buses: VoiceBuses, note: Note): void {
  const { context } = buses;
  const end = note.time + 0.35;
  const osc = context.createOscillator();
  osc.frequency.setValueAtTime(120, note.time);
  osc.frequency.exponentialRampToValueAtTime(48, note.time + 0.1);
  const gain = context.createGain();
  gain.gain.setValueAtTime(SILENT, note.time);
  gain.gain.exponentialRampToValueAtTime(0.5 * note.velocity, note.time + 0.005);
  gain.gain.exponentialRampToValueAtTime(SILENT, end - 0.02);
  gain.gain.linearRampToValueAtTime(0, end);
  osc.connect(gain).connect(buses.mix);
  osc.start(note.time);
  osc.stop(end + 0.02);
}

/** A burst of filtered noise: snare, closed or open hat. */
function noiseHit(
  buses: VoiceBuses,
  note: Note,
  filter: { readonly type: BiquadFilterType; readonly frequency: number; readonly q: number },
  level: number,
  length: number,
): void {
  const { context } = buses;
  const end = note.time + length;
  const source = context.createBufferSource();
  source.buffer = buses.noise;
  const shaping = context.createBiquadFilter();
  shaping.type = filter.type;
  shaping.frequency.value = filter.frequency;
  shaping.Q.value = filter.q;
  const gain = context.createGain();
  gain.gain.setValueAtTime(SILENT, note.time);
  gain.gain.exponentialRampToValueAtTime(level * note.velocity, note.time + 0.003);
  gain.gain.exponentialRampToValueAtTime(SILENT, end - 0.01);
  gain.gain.linearRampToValueAtTime(0, end);
  source.connect(shaping).connect(gain).connect(buses.mix);
  // Start somewhere different in the noise each time, so hits don't sound identical.
  const offset = ((note.time * 7.31) % 1) * (buses.noise.duration - length - 0.1);
  source.start(note.time, Math.max(0, offset));
  source.stop(end + 0.02);
}

/** The snare also gets a short low "body" tone under its noise. */
function snare(buses: VoiceBuses, note: Note): void {
  noiseHit(buses, note, { type: 'bandpass', frequency: 1900, q: 0.8 }, 0.11, 0.18);
  const { context } = buses;
  const end = note.time + 0.12;
  const body = context.createOscillator();
  body.frequency.setValueAtTime(190, note.time);
  body.frequency.exponentialRampToValueAtTime(140, end);
  const gain = context.createGain();
  gain.gain.setValueAtTime(SILENT, note.time);
  gain.gain.exponentialRampToValueAtTime(0.06 * note.velocity, note.time + 0.004);
  gain.gain.exponentialRampToValueAtTime(SILENT, end - 0.01);
  gain.gain.linearRampToValueAtTime(0, end);
  body.connect(gain).connect(buses.mix);
  body.start(note.time);
  body.stop(end + 0.02);
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
    case 'lead':
      for (const midi of notes) lead(buses, note, midi);
      return;
    case 'kick':
      kick(buses, note);
      return;
    case 'snare':
      snare(buses, note);
      return;
    case 'hat':
      noiseHit(buses, note, { type: 'highpass', frequency: 7500, q: 0.5 }, 0.03, 0.045);
      return;
    case 'openHat':
      noiseHit(buses, note, { type: 'highpass', frequency: 7000, q: 0.5 }, 0.025, 0.28);
      return;
  }
}
