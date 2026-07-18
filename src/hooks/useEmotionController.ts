import { useEffect, useRef, useCallback } from "react";
import { useCompanionStore, type CompanionMood } from "@/stores/useCompanionStore";

/* ================================================================== */
/*  Emotion Controller                                                 */
/*  Picks the right emotion based on context (time, activity, user     */
/*  interaction) and manages smooth transitions via the emotion queue.  */
/* ================================================================== */

/**
 * Facial parameter set for each emotion.
 * Values are normalised 0→1 or -1→1 where noted.
 */
export interface EmotionFace {
  /** Eye openness 0=closed 1=normal 1.3=wide */
  eyeOpen: number;
  /** Pupil scale multiplier */
  pupilScale: number;
  /** Eyebrow Y offset (-1 sad … 0 neutral … 1 raised) */
  eyebrowY: number;
  /** Eyebrow angle (-1 angry inward … 0 neutral … 1 worried outward) */
  eyebrowAngle: number;
  /** Mouth vertical scale (0 closed … 1 normal … 2 wide) */
  mouthOpen: number;
  /** Mouth horizontal stretch (0 pursed … 1 normal … 1.5 wide smile) */
  mouthWidth: number;
  /** Mouth curve (-1 frown … 0 neutral … 1 smile) */
  mouthCurve: number;
  /** Cheek blush intensity 0→1 */
  cheekIntensity: number;
  /** Body lean Y axis (radians) */
  bodyLean: number;
  /** Head tilt Z axis (radians) */
  headTilt: number;
  /** Breathing rate multiplier */
  breathRate: number;
  /** Bounce intensity */
  bounceIntensity: number;
  /** Arm activity level 0→1 */
  armActivity: number;
}

/* ------------------------------------------------------------------ */
/*  Per-emotion face definitions                                       */
/* ------------------------------------------------------------------ */

const EMOTION_FACES: Record<CompanionMood, EmotionFace> = {
  idle: {
    eyeOpen: 1, pupilScale: 1, eyebrowY: 0, eyebrowAngle: 0,
    mouthOpen: 0.3, mouthWidth: 1, mouthCurve: 0.15,
    cheekIntensity: 0.3, bodyLean: 0, headTilt: 0,
    breathRate: 1, bounceIntensity: 0.02, armActivity: 0.1,
  },
  happy: {
    eyeOpen: 0.85, pupilScale: 1.1, eyebrowY: 0.3, eyebrowAngle: 0,
    mouthOpen: 0.5, mouthWidth: 1.3, mouthCurve: 1,
    cheekIntensity: 0.7, bodyLean: 0, headTilt: 0.05,
    breathRate: 1.2, bounceIntensity: 0.05, armActivity: 0.3,
  },
  excited: {
    eyeOpen: 1.3, pupilScale: 1.2, eyebrowY: 0.6, eyebrowAngle: 0,
    mouthOpen: 0.8, mouthWidth: 1.4, mouthCurve: 1,
    cheekIntensity: 0.8, bodyLean: 0, headTilt: 0,
    breathRate: 1.5, bounceIntensity: 0.12, armActivity: 0.8,
  },
  sad: {
    eyeOpen: 0.7, pupilScale: 0.9, eyebrowY: -0.4, eyebrowAngle: 0.5,
    mouthOpen: 0.2, mouthWidth: 0.8, mouthCurve: -0.7,
    cheekIntensity: 0.1, bodyLean: -0.05, headTilt: -0.08,
    breathRate: 0.7, bounceIntensity: 0, armActivity: 0,
  },
  sleepy: {
    eyeOpen: 0.3, pupilScale: 0.8, eyebrowY: -0.2, eyebrowAngle: 0.2,
    mouthOpen: 0.1, mouthWidth: 0.9, mouthCurve: 0,
    cheekIntensity: 0.2, bodyLean: 0, headTilt: -0.1,
    breathRate: 0.5, bounceIntensity: 0, armActivity: 0,
  },
  hungry: {
    eyeOpen: 0.9, pupilScale: 1.1, eyebrowY: -0.1, eyebrowAngle: 0.3,
    mouthOpen: 0.6, mouthWidth: 0.9, mouthCurve: -0.3,
    cheekIntensity: 0.2, bodyLean: 0, headTilt: 0.04,
    breathRate: 1, bounceIntensity: 0.01, armActivity: 0.2,
  },
  thinking: {
    eyeOpen: 0.9, pupilScale: 0.95, eyebrowY: 0.2, eyebrowAngle: -0.2,
    mouthOpen: 0.15, mouthWidth: 0.85, mouthCurve: 0,
    cheekIntensity: 0.2, bodyLean: 0, headTilt: 0.1,
    breathRate: 0.8, bounceIntensity: 0, armActivity: 0.15,
  },
  talking: {
    eyeOpen: 1, pupilScale: 1, eyebrowY: 0.15, eyebrowAngle: 0,
    mouthOpen: 0.6, mouthWidth: 1.1, mouthCurve: 0.2,
    cheekIntensity: 0.4, bodyLean: 0, headTilt: 0,
    breathRate: 1.1, bounceIntensity: 0.02, armActivity: 0.5,
  },
  laughing: {
    eyeOpen: 0.5, pupilScale: 1.1, eyebrowY: 0.4, eyebrowAngle: 0,
    mouthOpen: 1.2, mouthWidth: 1.5, mouthCurve: 1,
    cheekIntensity: 0.9, bodyLean: 0, headTilt: 0.06,
    breathRate: 2, bounceIntensity: 0.1, armActivity: 0.6,
  },
  surprised: {
    eyeOpen: 1.5, pupilScale: 1.3, eyebrowY: 0.8, eyebrowAngle: 0,
    mouthOpen: 1.3, mouthWidth: 1.2, mouthCurve: 0,
    cheekIntensity: 0.3, bodyLean: 0.03, headTilt: 0,
    breathRate: 1.5, bounceIntensity: 0.08, armActivity: 0.7,
  },
  embarrassed: {
    eyeOpen: 0.6, pupilScale: 0.85, eyebrowY: 0.2, eyebrowAngle: 0.4,
    mouthOpen: 0.3, mouthWidth: 0.8, mouthCurve: -0.2,
    cheekIntensity: 1, bodyLean: -0.04, headTilt: -0.12,
    breathRate: 1.1, bounceIntensity: 0, armActivity: 0.2,
  },
  proud: {
    eyeOpen: 0.95, pupilScale: 1.05, eyebrowY: 0.3, eyebrowAngle: -0.1,
    mouthOpen: 0.4, mouthWidth: 1.2, mouthCurve: 0.8,
    cheekIntensity: 0.5, bodyLean: 0.05, headTilt: 0.04,
    breathRate: 0.9, bounceIntensity: 0.01, armActivity: 0.3,
  },
  celebrating: {
    eyeOpen: 1.2, pupilScale: 1.2, eyebrowY: 0.7, eyebrowAngle: 0,
    mouthOpen: 1, mouthWidth: 1.5, mouthCurve: 1,
    cheekIntensity: 0.9, bodyLean: 0, headTilt: 0,
    breathRate: 1.8, bounceIntensity: 0.15, armActivity: 1,
  },
  yawning: {
    eyeOpen: 0.2, pupilScale: 0.8, eyebrowY: 0.1, eyebrowAngle: 0.3,
    mouthOpen: 1.6, mouthWidth: 1.3, mouthCurve: 0,
    cheekIntensity: 0.3, bodyLean: 0, headTilt: -0.06,
    breathRate: 0.6, bounceIntensity: 0, armActivity: 0.4,
  },
  stretching: {
    eyeOpen: 0.5, pupilScale: 0.9, eyebrowY: 0.2, eyebrowAngle: 0,
    mouthOpen: 0.4, mouthWidth: 1.1, mouthCurve: 0.3,
    cheekIntensity: 0.4, bodyLean: 0.03, headTilt: 0.04,
    breathRate: 1.2, bounceIntensity: 0.03, armActivity: 0.9,
  },
  // Legacy compatibility aliases
  eating: {
    eyeOpen: 0.85, pupilScale: 1, eyebrowY: 0.2, eyebrowAngle: 0,
    mouthOpen: 0.8, mouthWidth: 1, mouthCurve: 0.5,
    cheekIntensity: 0.6, bodyLean: 0, headTilt: 0.03,
    breathRate: 1, bounceIntensity: 0.02, armActivity: 0.3,
  },
  exercise: {
    eyeOpen: 1.1, pupilScale: 1, eyebrowY: 0.1, eyebrowAngle: -0.1,
    mouthOpen: 0.5, mouthWidth: 1, mouthCurve: 0.3,
    cheekIntensity: 0.7, bodyLean: 0, headTilt: 0,
    breathRate: 2.2, bounceIntensity: 0.1, armActivity: 1,
  },
  sleep: {
    eyeOpen: 0, pupilScale: 0.8, eyebrowY: -0.1, eyebrowAngle: 0.1,
    mouthOpen: 0.1, mouthWidth: 0.9, mouthCurve: 0.1,
    cheekIntensity: 0.3, bodyLean: -0.03, headTilt: -0.15,
    breathRate: 0.4, bounceIntensity: 0, armActivity: 0,
  },
};

/**
 * Linearly interpolate between two EmotionFace states.
 */
export function lerpFace(a: EmotionFace, b: EmotionFace, t: number): EmotionFace {
  const lerp = (v0: number, v1: number) => v0 + (v1 - v0) * t;
  return {
    eyeOpen: lerp(a.eyeOpen, b.eyeOpen),
    pupilScale: lerp(a.pupilScale, b.pupilScale),
    eyebrowY: lerp(a.eyebrowY, b.eyebrowY),
    eyebrowAngle: lerp(a.eyebrowAngle, b.eyebrowAngle),
    mouthOpen: lerp(a.mouthOpen, b.mouthOpen),
    mouthWidth: lerp(a.mouthWidth, b.mouthWidth),
    mouthCurve: lerp(a.mouthCurve, b.mouthCurve),
    cheekIntensity: lerp(a.cheekIntensity, b.cheekIntensity),
    bodyLean: lerp(a.bodyLean, b.bodyLean),
    headTilt: lerp(a.headTilt, b.headTilt),
    breathRate: lerp(a.breathRate, b.breathRate),
    bounceIntensity: lerp(a.bounceIntensity, b.bounceIntensity),
    armActivity: lerp(a.armActivity, b.armActivity),
  };
}

/**
 * Get the EmotionFace for a mood, or interpolate during transitions.
 */
export function getEmotionFace(
  mood: CompanionMood,
  previousMood: CompanionMood,
  transitionProgress: number,
): EmotionFace {
  const from = EMOTION_FACES[previousMood] ?? EMOTION_FACES.idle;
  const to = EMOTION_FACES[mood] ?? EMOTION_FACES.idle;
  if (transitionProgress >= 1) return to;
  // Use easeInOutCubic for smooth transition
  const t = transitionProgress < 0.5
    ? 4 * transitionProgress * transitionProgress * transitionProgress
    : 1 - Math.pow(-2 * transitionProgress + 2, 3) / 2;
  return lerpFace(from, to, t);
}

export { EMOTION_FACES };

/* ================================================================== */
/*  React hook                                                         */
/* ================================================================== */

export function useEmotionController() {
  const {
    mood,
    setMood,
    emotionQueue,
    clearEmotionQueue,
    activity,
    isSpeaking,
    isListening,
    alarmActive,
  } = useCompanionStore();

  const queueTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const contextTimerRef = useRef<ReturnType<typeof setInterval>>();

  /* ---------- process emotion queue ---------- */
  useEffect(() => {
    if (emotionQueue.length === 0) return;

    const [next, ...rest] = emotionQueue;
    setMood(next.mood);
    clearEmotionQueue();

    // After duration, restore idle or process next
    queueTimerRef.current = setTimeout(() => {
      if (rest.length > 0) {
        // Re-queue remaining
        rest.forEach((e) => useCompanionStore.getState().queueEmotion(e.mood, e.durationMs));
      } else {
        setMood("idle");
      }
    }, next.durationMs);

    return () => clearTimeout(queueTimerRef.current);
  }, [emotionQueue.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- context-aware auto-emotion ---------- */
  useEffect(() => {
    contextTimerRef.current = setInterval(() => {
      const state = useCompanionStore.getState();
      // Don't override if speaking or alarm is active
      if (state.isSpeaking || state.alarmActive || state.emotionQueue.length > 0) return;

      const hour = new Date().getHours();

      // Activity-driven emotions
      if (state.activity === "sleeping") {
        if (state.mood !== "sleep") setMood("sleep");
        return;
      }
      if (state.activity === "waking_up") {
        if (state.mood !== "sleepy" && state.mood !== "yawning" && state.mood !== "stretching") {
          setMood("sleepy");
        }
        return;
      }
      if (state.activity === "working_out") {
        if (state.mood !== "exercise") setMood("exercise");
        return;
      }
      if (state.activity.startsWith("eating_")) {
        if (state.mood !== "eating" && state.mood !== "happy") setMood("eating");
        return;
      }
      if (state.activity === "greeting") {
        if (state.mood !== "happy") setMood("happy");
        return;
      }

      // Time-driven emotions (only when activity is "none" and mood is "idle")
      if (state.activity === "none" && state.mood === "idle") {
        if (hour >= 23 || hour < 5) {
          setMood("sleepy");
        } else if (hour >= 12 && hour < 13) {
          // Lunch time — get hungry
          setMood("hungry");
        }
        // Otherwise stay idle
      }
    }, 10_000); // Check every 10s

    return () => clearInterval(contextTimerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- speaking triggers talking mood ---------- */
  useEffect(() => {
    if (isSpeaking && mood !== "talking") {
      setMood("talking");
    }
  }, [isSpeaking]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- listening triggers thinking ---------- */
  useEffect(() => {
    if (isListening) {
      setMood("thinking");
    }
  }, [isListening]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerReaction = useCallback(
    (emotion: CompanionMood, durationMs = 2500) => {
      useCompanionStore.getState().queueEmotion(emotion, durationMs);
    },
    [],
  );

  return { triggerReaction, getEmotionFace, EMOTION_FACES };
}
