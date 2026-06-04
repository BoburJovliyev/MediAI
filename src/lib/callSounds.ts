// Synthesized call sounds using the Web Audio API.
// - Incoming ringtone: an iPhone "Reflection"-style marimba arpeggio loop.
// - Outgoing dial tone (gudok): classic ringback beep pattern.

type Stoppable = { stop: () => void };

let audioCtx: AudioContext | null = null;
const getCtx = (): AudioContext => {
  if (!audioCtx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
};

const playNote = (
  ctx: AudioContext,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  type: OscillatorType = "sine",
) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // soft marimba-like envelope
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
};

// iPhone 16 Pro "Reflection"-inspired arpeggio (G# minor-ish marimba pattern).
const RINGTONE_PATTERN = [
  830.61, 1108.73, 1244.51, 1108.73,
  830.61, 1108.73, 1244.51, 1661.22,
];

export const startRingtone = (): Stoppable => {
  const ctx = getCtx();
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  const loop = () => {
    if (stopped) return;
    const now = ctx.currentTime;
    const step = 0.16;
    RINGTONE_PATTERN.forEach((f, i) => {
      playNote(ctx, f, now + i * step, 0.5, 0.18, "triangle");
      // add a softer octave-down body
      playNote(ctx, f / 2, now + i * step, 0.4, 0.06, "sine");
    });
    // repeat the whole melody roughly every ~2.4s (pattern + pause)
    timer = setTimeout(loop, RINGTONE_PATTERN.length * step * 1000 + 1000);
  };
  loop();

  return {
    stop: () => {
      stopped = true;
      clearTimeout(timer);
    },
  };
};

// Outgoing ringback / "gudok": ~440Hz beep, 1s on, 3s off (loops).
export const startDialTone = (): Stoppable => {
  const ctx = getCtx();
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  const beep = () => {
    if (stopped) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.14, now + 0.05);
    g.gain.setValueAtTime(0.14, now + 0.95);
    g.gain.linearRampToValueAtTime(0, now + 1.0);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.05);
    timer = setTimeout(beep, 4000);
  };
  beep();

  return {
    stop: () => {
      stopped = true;
      clearTimeout(timer);
    },
  };
};

// Short notification blip for missed/rejected events.
export const playBlip = () => {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    playNote(ctx, 660, now, 0.18, 0.15, "sine");
    playNote(ctx, 440, now + 0.18, 0.22, 0.13, "sine");
  } catch { /* ignore */ }
};
