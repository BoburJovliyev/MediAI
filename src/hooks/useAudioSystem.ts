import { useCallback, useEffect, useRef } from "react";
import { useCompanionStore } from "@/stores/useCompanionStore";

/* ================================================================== */
/*  Procedural Audio System                                            */
/*  All sounds generated via Web Audio API — no external files needed  */
/* ================================================================== */

type SoundType =
  | "alarm"
  | "alarm_stop"
  | "click"
  | "whoosh"
  | "celebrate"
  | "footstep"
  | "eat"
  | "ambient_night"
  | "ambient_kitchen"
  | "ambient_gym"
  | "notification";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/* ------------------------------------------------------------------ */
/*  Sound generators                                                   */
/* ------------------------------------------------------------------ */

function playAlarm(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();

  osc.type = "square";
  osc.frequency.value = 880;

  lfo.type = "sine";
  lfo.frequency.value = 8;
  lfoGain.gain.value = 200;

  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  lfo.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.8);
  lfo.stop(ctx.currentTime + 0.8);
}

function playAlarmStop(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

function playClick(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 1200;
  gain.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

function playWhoosh(ctx: AudioContext, volume: number) {
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2);
  filter.Q.value = 2;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime);
}

function playCelebrate(ctx: AudioContext, volume: number) {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume * 0.1, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

function playFootstep(ctx: AudioContext, volume: number) {
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime);
}

function playEat(ctx: AudioContext, volume: number) {
  // Mouth/chewing click
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 300 + Math.random() * 200;
  gain.gain.setValueAtTime(volume * 0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

function playNotification(ctx: AudioContext, volume: number) {
  const notes = [880, 1100];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(volume * 0.08, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.25);
  });
}

/* ------------------------------------------------------------------ */
/*  Ambient drone generators                                           */
/* ------------------------------------------------------------------ */

interface AmbientHandle {
  stop: () => void;
}

function startAmbientNight(ctx: AudioContext, volume: number): AmbientHandle {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.value = 80;
  filter.type = "lowpass";
  filter.frequency.value = 200;
  gain.gain.value = volume * 0.03;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  return {
    stop: () => {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      setTimeout(() => osc.stop(), 600);
    },
  };
}

function startAmbientKitchen(ctx: AudioContext, volume: number): AmbientHandle {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 120;
  gain.gain.value = volume * 0.02;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  return {
    stop: () => {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      setTimeout(() => osc.stop(), 600);
    },
  };
}

function startAmbientGym(ctx: AudioContext, volume: number): AmbientHandle {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 55;
  lfo.type = "sine";
  lfo.frequency.value = 0.5;
  lfoGain.gain.value = 10;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300;
  gain.gain.value = volume * 0.025;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  lfo.start();
  return {
    stop: () => {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      setTimeout(() => { osc.stop(); lfo.stop(); }, 600);
    },
  };
}

/* ================================================================== */
/*  React Hook                                                         */
/* ================================================================== */

export function useAudioSystem() {
  const audioEnabled = useCompanionStore((s) => s.audioEnabled);
  const audioVolume = useCompanionStore((s) => s.audioVolume);
  const sceneMode = useCompanionStore((s) => s.sceneMode);
  const alarmActive = useCompanionStore((s) => s.alarmActive);

  const ambientRef = useRef<AmbientHandle | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval>>();

  /* ---- Play a one-shot sound ---- */
  const playSound = useCallback(
    (type: SoundType) => {
      if (!audioEnabled) return;
      try {
        const ctx = getAudioContext();
        const vol = audioVolume;
        switch (type) {
          case "alarm": playAlarm(ctx, vol); break;
          case "alarm_stop": playAlarmStop(ctx, vol); break;
          case "click": playClick(ctx, vol); break;
          case "whoosh": playWhoosh(ctx, vol); break;
          case "celebrate": playCelebrate(ctx, vol); break;
          case "footstep": playFootstep(ctx, vol); break;
          case "eat": playEat(ctx, vol); break;
          case "notification": playNotification(ctx, vol); break;
          default: break;
        }
      } catch {
        /* AudioContext may not be available */
      }
    },
    [audioEnabled, audioVolume],
  );

  /* ---- Ambient scene music ---- */
  useEffect(() => {
    // Stop previous ambient
    ambientRef.current?.stop();
    ambientRef.current = null;

    if (!audioEnabled) return;

    try {
      const ctx = getAudioContext();
      const vol = audioVolume;
      switch (sceneMode) {
        case "bedroom":
          ambientRef.current = startAmbientNight(ctx, vol);
          break;
        case "kitchen":
          ambientRef.current = startAmbientKitchen(ctx, vol);
          break;
        case "gym":
          ambientRef.current = startAmbientGym(ctx, vol);
          break;
      }
    } catch {
      /* ignore */
    }

    return () => {
      ambientRef.current?.stop();
      ambientRef.current = null;
    };
  }, [sceneMode, audioEnabled, audioVolume]);

  /* ---- Alarm sound loop ---- */
  useEffect(() => {
    if (alarmActive && audioEnabled) {
      // Play alarm sound every 1.5s
      playSound("alarm");
      alarmIntervalRef.current = setInterval(() => {
        playSound("alarm");
      }, 1500);
    } else {
      clearInterval(alarmIntervalRef.current);
    }

    return () => clearInterval(alarmIntervalRef.current);
  }, [alarmActive, audioEnabled, playSound]);

  return { playSound };
}
