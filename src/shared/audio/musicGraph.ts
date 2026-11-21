// The mixing desk for the music, on any audio context (live or offline, so
// the exact same sound can be rendered in tests): instruments → mix → a
// muffled lo-fi filter → gentle glue compression → master volume.
import type { Song } from './song';
import type { VoiceBuses } from './voices';

export interface MusicGraph {
  readonly buses: VoiceBuses;
  /** Master volume (starts silent; the player fades it). */
  readonly master: GainNode;
}

const NOISE_SECONDS = 2;
/** Lo-fi colour: roll off the highs and the rumble. */
const TONE = { lowpassHz: 4200, highpassHz: 45 };
/** Just enough to glue the mix; no audible pumping. */
const GLUE = { threshold: -18, knee: 18, ratio: 2.5, attack: 0.03, release: 0.35 };
const KEYS = { lowpassHz: 1900, tremoloHz: 3.2, tremoloDepth: 0.08 };
/** Worn-tape pitch drift, in cents. */
const WOBBLE = { hz: 0.35, cents: 7 };
const ECHO = { beats: 0.75, feedback: 0.3, lowpassHz: 1500, level: 0.45 };
/** Smooth tape hiss: filtered noise, no clicks. */
const HISS = { level: 0.006, lowpassHz: 5500, highpassHz: 1500 };

/** Deterministic noise (the same every time; no Math.random needed). */
function noiseBuffer(context: BaseAudioContext, seed: number): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * NOISE_SECONDS, context.sampleRate);
  const data = buffer.getChannelData(0);
  let state = seed;
  for (let i = 0; i < data.length; i++) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    data[i] = (state / 4294967296) * 2 - 1;
  }
  return buffer;
}

function filter(context: BaseAudioContext, type: BiquadFilterType, hz: number): BiquadFilterNode {
  const node = context.createBiquadFilter();
  node.type = type;
  node.frequency.value = hz;
  return node;
}

function lfo(context: BaseAudioContext, hz: number, depth: number): GainNode {
  const osc = context.createOscillator();
  osc.frequency.value = hz;
  const amount = context.createGain();
  amount.gain.value = depth;
  osc.connect(amount);
  osc.start();
  return amount;
}

function hiss(context: BaseAudioContext, target: AudioNode): void {
  const source = context.createBufferSource();
  source.buffer = noiseBuffer(context, 23);
  source.loop = true;
  const gain = context.createGain();
  gain.gain.value = HISS.level;
  source
    .connect(filter(context, 'highpass', HISS.highpassHz))
    .connect(filter(context, 'lowpass', HISS.lowpassHz))
    .connect(gain)
    .connect(target);
  source.start();
}

export function buildMusicGraph(context: BaseAudioContext, song: Song): MusicGraph {
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);
  const glue = context.createDynamicsCompressor();
  glue.threshold.value = GLUE.threshold;
  glue.knee.value = GLUE.knee;
  glue.ratio.value = GLUE.ratio;
  glue.attack.value = GLUE.attack;
  glue.release.value = GLUE.release;
  glue.connect(master);
  const mix = context.createGain();
  mix
    .connect(filter(context, 'highpass', TONE.highpassHz))
    .connect(filter(context, 'lowpass', TONE.lowpassHz))
    .connect(glue);

  const keys = filter(context, 'lowpass', KEYS.lowpassHz);
  const tremolo = context.createGain();
  keys.connect(tremolo).connect(mix);
  lfo(context, KEYS.tremoloHz, KEYS.tremoloDepth).connect(tremolo.gain);

  const echo = context.createDelay(2);
  echo.delayTime.value = (ECHO.beats * 60) / song.bpm;
  const echoTone = filter(context, 'lowpass', ECHO.lowpassHz);
  const feedback = context.createGain();
  feedback.gain.value = ECHO.feedback;
  const echoOut = context.createGain();
  echoOut.gain.value = ECHO.level;
  echo.connect(echoTone).connect(feedback).connect(echo);
  echoTone.connect(echoOut).connect(mix);

  hiss(context, mix);
  const wobble = lfo(context, WOBBLE.hz, WOBBLE.cents);
  return {
    buses: { context, mix, keys, echo, wobble, noise: noiseBuffer(context, 7) },
    master,
  };
}
