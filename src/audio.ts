// Procedural sound effects via the Web Audio API — no asset files.
// The AudioContext is created lazily on first use, which always happens
// inside a user gesture (clicking a mode/class card, typing, etc.), so it
// starts in the running state per browser autoplay policy.

import type { Tier } from './fight';

const MUTE_KEY = 'typefighter.muted.v1';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

export function initAudioPrefs(): void {
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    muted = false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // ignore
  }
}

function audio(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOpts {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  freqEnd?: number;
  delay?: number;
}

function tone(o: ToneOpts): void {
  const c = audio();
  if (!c || !master) return;
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqEnd), t0 + o.dur);
  }
  const peak = o.gain ?? 0.3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack ?? 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.03);
}

function noise(dur: number, gain: number, cutoff: number, highpass = false): void {
  const c = audio();
  if (!c || !master) return;
  const t0 = c.currentTime;
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = highpass ? 'highpass' : 'lowpass';
  filt.frequency.value = cutoff;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.03);
}

// --- Sound effects ----------------------------------------------------------

const STRIKE_FREQ: Record<Tier, number> = { perfect: 540, great: 450, good: 370 };

export function sfxType(): void {
  tone({ freq: 880, dur: 0.025, type: 'square', gain: 0.04 });
}

export function sfxTypo(): void {
  tone({ freq: 150, dur: 0.09, type: 'sawtooth', gain: 0.07, freqEnd: 90 });
}

export function sfxStrike(tier: Tier, crit: boolean): void {
  const base = STRIKE_FREQ[tier];
  tone({ freq: base, dur: 0.13, type: 'triangle', gain: 0.22, freqEnd: base * 0.55 });
  noise(crit ? 0.12 : 0.07, crit ? 0.24 : 0.16, 3200, true);
  if (crit) {
    tone({ freq: 1040, dur: 0.18, type: 'square', gain: 0.2, freqEnd: 1640, delay: 0.01 });
  }
}

export function sfxHurt(): void {
  tone({ freq: 130, dur: 0.2, type: 'sine', gain: 0.26, freqEnd: 68 });
  noise(0.18, 0.28, 520);
}

export function sfxEnrage(): void {
  tone({ freq: 150, dur: 0.5, type: 'sawtooth', gain: 0.16, freqEnd: 320 });
}

export function sfxWin(): void {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => tone({ freq: f, dur: 0.3, type: 'triangle', gain: 0.22, delay: i * 0.1 }));
}

export function sfxLose(): void {
  const notes = [392, 330, 262, 196];
  notes.forEach((f, i) => tone({ freq: f, dur: 0.34, type: 'sawtooth', gain: 0.18, delay: i * 0.12 }));
}

export function sfxBoon(): void {
  tone({ freq: 784, dur: 0.18, type: 'triangle', gain: 0.18 });
  tone({ freq: 1175, dur: 0.24, type: 'triangle', gain: 0.16, delay: 0.07 });
}
