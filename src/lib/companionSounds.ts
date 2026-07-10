// Lightweight Web Audio cues for the health companions.
// No external assets — everything is synthesized so it works offline.

let ctx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
};

const tone = (
  freq: number,
  start: number,
  dur: number,
  gain = 0.2,
  type: OscillatorType = "sine",
) => {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  g.gain.setValueAtTime(0, ac.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
};

let alarmTimer: ReturnType<typeof setInterval> | null = null;

/** Loud repeating wake-up alarm. Call stopAlarm() to end it. */
export const playAlarm = (rings = 6) => {
  stopAlarm();
  let count = 0;
  const ring = () => {
    // two-tone loud beep
    tone(880, 0, 0.18, 0.6, "square");
    tone(1175, 0.2, 0.18, 0.6, "square");
    count += 1;
    if (count >= rings) stopAlarm();
  };
  ring();
  alarmTimer = setInterval(ring, 600);
};

export const stopAlarm = () => {
  if (alarmTimer) {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }
};

/** Clanging dishes / cutlery for meal times. */
export const playClang = () => {
  tone(2400, 0, 0.08, 0.35, "triangle");
  tone(1800, 0.09, 0.1, 0.3, "triangle");
  tone(3000, 0.18, 0.07, 0.25, "square");
};

/** Soft calm chime for bedtime. */
export const playCalm = () => {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.28, 1.2, 0.12, "sine"));
};

/** Camera shutter click. */
export const playShutter = () => {
  tone(1200, 0, 0.04, 0.4, "square");
  tone(600, 0.05, 0.06, 0.3, "square");
};

/** Short upbeat cue for exercise start. */
export const playExercise = () => {
  [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.12, 0.15, 0.25, "triangle"));
};
