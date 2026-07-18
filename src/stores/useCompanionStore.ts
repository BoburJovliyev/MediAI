import { create } from "zustand";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export type CharacterType = "boy" | "girl";

export type CompanionMood =
  | "idle"
  | "happy"
  | "excited"
  | "sad"
  | "sleepy"
  | "hungry"
  | "thinking"
  | "talking"
  | "laughing"
  | "surprised"
  | "embarrassed"
  | "proud"
  | "celebrating"
  | "yawning"
  | "stretching"
  | "eating"
  | "exercise"
  | "sleep";

export type CompanionMode = "minimized" | "floating" | "expanded" | "scene";

export type SceneMode =
  | "none"
  | "bedroom"
  | "kitchen"
  | "gym"
  | "welcome";

export type CompanionActivity =
  | "none"
  | "waking_up"
  | "eating_breakfast"
  | "eating_lunch"
  | "eating_dinner"
  | "sleeping"
  | "working_out"
  | "greeting"
  | "photographing";

export type MealType = "breakfast" | "lunch" | "dinner";

/* ================================================================== */
/*  Interfaces                                                         */
/* ================================================================== */

interface CompanionPosition {
  x: number;
  y: number;
}

interface DailySchedule {
  wakeTime: string;   // "07:00"
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  sleepTime: string;
  workoutTime: string;
}

interface UserProgress {
  streakDays: number;
  mealsLogged: number;
  workoutsCompleted: number;
  lastActiveDate: string; // ISO date
}

interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  emotionHint?: CompanionMood;
}

interface CompanionState {
  // Character
  character: CharacterType;
  setCharacter: (c: CharacterType) => void;

  // Mood / emotion
  mood: CompanionMood;
  previousMood: CompanionMood;
  moodTransitionProgress: number; // 0→1 for smooth blending
  setMood: (m: CompanionMood) => void;
  queueEmotion: (m: CompanionMood, durationMs?: number) => void;
  emotionQueue: { mood: CompanionMood; durationMs: number }[];
  clearEmotionQueue: () => void;

  // Activity
  activity: CompanionActivity;
  setActivity: (a: CompanionActivity) => void;

  // Display mode
  mode: CompanionMode;
  setMode: (m: CompanionMode) => void;

  // Visibility
  visible: boolean;
  setVisible: (v: boolean) => void;

  // Position on screen
  position: CompanionPosition;
  setPosition: (p: CompanionPosition) => void;

  // Speech
  isSpeaking: boolean;
  isListening: boolean;
  speechText: string;
  audioLevel: number;
  speak: (text: string, mood?: CompanionMood) => void;
  stopSpeaking: () => void;
  setListening: (v: boolean) => void;
  setAudioLevel: (v: number) => void;
  setSpeechText: (t: string) => void;

  // Scene
  sceneMode: SceneMode;
  setSceneMode: (s: SceneMode) => void;

  // Panel
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;

  // Mouse tracking
  mousePosition: { x: number; y: number };
  setMousePosition: (p: { x: number; y: number }) => void;

  // Alarm
  alarmActive: boolean;
  setAlarmActive: (v: boolean) => void;
  stopAlarm: () => void;

  // Welcome
  welcomeCompleted: boolean;
  setWelcomeCompleted: (v: boolean) => void;
  welcomePlaying: boolean;
  setWelcomePlaying: (v: boolean) => void;

  // Conversation memory
  conversationHistory: ConversationMessage[];
  addMessage: (msg: ConversationMessage) => void;
  clearConversation: () => void;

  // Daily schedule
  dailySchedule: DailySchedule;
  setDailySchedule: (s: Partial<DailySchedule>) => void;

  // User progress
  userProgress: UserProgress;
  updateProgress: (p: Partial<UserProgress>) => void;

  // Audio
  audioEnabled: boolean;
  setAudioEnabled: (v: boolean) => void;
  audioVolume: number;
  setAudioVolume: (v: number) => void;
}

/* ================================================================== */
/*  LocalStorage helpers                                               */
/* ================================================================== */

const CHAR_STORAGE = "medi_companion_character_v1";
const POS_STORAGE = "medi_companion_position_v1";
const WELCOME_STORAGE = "medi_companion_welcome_v1";
const HISTORY_STORAGE = "medi_companion_history_v1";
const SCHEDULE_STORAGE = "medi_companion_schedule_v1";
const PROGRESS_STORAGE = "medi_companion_progress_v1";
const AUDIO_STORAGE = "medi_companion_audio_v1";

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

function loadCharacter(): CharacterType {
  try {
    const s = localStorage.getItem(CHAR_STORAGE);
    if (s === "boy" || s === "girl") return s;
  } catch { /* ignore */ }
  return "boy";
}

function loadPosition(): CompanionPosition {
  try {
    const raw = localStorage.getItem(POS_STORAGE);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.x === "number" && typeof p.y === "number") return p;
    }
  } catch { /* ignore */ }
  return { x: window.innerWidth - 200, y: window.innerHeight - 350 };
}

const DEFAULT_SCHEDULE: DailySchedule = {
  wakeTime: "07:00",
  breakfastTime: "08:00",
  lunchTime: "13:00",
  dinnerTime: "19:00",
  sleepTime: "23:00",
  workoutTime: "07:30",
};

const DEFAULT_PROGRESS: UserProgress = {
  streakDays: 0,
  mealsLogged: 0,
  workoutsCompleted: 0,
  lastActiveDate: new Date().toISOString().split("T")[0],
};

const MAX_HISTORY = 50;

/* ================================================================== */
/*  Store                                                              */
/* ================================================================== */

export const useCompanionStore = create<CompanionState>((set, get) => ({
  // Character
  character: loadCharacter(),
  setCharacter: (c) => {
    localStorage.setItem(CHAR_STORAGE, c);
    set({ character: c });
  },

  // Mood / emotion
  mood: "idle",
  previousMood: "idle",
  moodTransitionProgress: 1,
  setMood: (mood) => {
    const prev = get().mood;
    if (prev === mood) return;
    set({ previousMood: prev, mood, moodTransitionProgress: 0 });

    // Animate transition progress 0→1 over 400ms
    const start = performance.now();
    const duration = 400;
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      set({ moodTransitionProgress: progress });
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  emotionQueue: [],
  queueEmotion: (mood, durationMs = 2000) => {
    set((s) => ({
      emotionQueue: [...s.emotionQueue, { mood, durationMs }],
    }));
  },
  clearEmotionQueue: () => set({ emotionQueue: [] }),

  // Activity
  activity: "none",
  setActivity: (activity) => set({ activity }),

  // Display mode
  mode: "floating",
  setMode: (mode) => set({ mode }),

  // Visibility
  visible: true,
  setVisible: (visible) => set({ visible }),

  // Position
  position: loadPosition(),
  setPosition: (position) => {
    localStorage.setItem(POS_STORAGE, JSON.stringify(position));
    set({ position });
  },

  // Speech
  isSpeaking: false,
  isListening: false,
  speechText: "",
  audioLevel: 0,
  speak: (text, mood) =>
    set({
      speechText: text,
      isSpeaking: true,
      ...(mood ? { mood } : {}),
    }),
  stopSpeaking: () => set({ isSpeaking: false }),
  setSpeechText: (speechText) => set({ speechText }),
  setListening: (isListening) => set({ isListening }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),

  // Scene
  sceneMode: "none",
  setSceneMode: (sceneMode) => set({ sceneMode }),

  // Panel
  panelOpen: false,
  setPanelOpen: (panelOpen) => set({ panelOpen }),

  // Mouse tracking
  mousePosition: { x: 0, y: 0 },
  setMousePosition: (mousePosition) => set({ mousePosition }),

  // Alarm
  alarmActive: false,
  setAlarmActive: (alarmActive) => set({ alarmActive }),
  stopAlarm: () => set({ alarmActive: false, activity: "none" }),

  // Welcome
  welcomeCompleted: safeGet(WELCOME_STORAGE, false),
  setWelcomeCompleted: (v) => {
    safeSet(WELCOME_STORAGE, v);
    set({ welcomeCompleted: v });
  },
  welcomePlaying: false,
  setWelcomePlaying: (welcomePlaying) => set({ welcomePlaying }),

  // Conversation memory
  conversationHistory: safeGet<ConversationMessage[]>(HISTORY_STORAGE, []),
  addMessage: (msg) => {
    set((s) => {
      const history = [...s.conversationHistory, msg].slice(-MAX_HISTORY);
      safeSet(HISTORY_STORAGE, history);
      return { conversationHistory: history };
    });
  },
  clearConversation: () => {
    safeSet(HISTORY_STORAGE, []);
    set({ conversationHistory: [] });
  },

  // Daily schedule
  dailySchedule: safeGet(SCHEDULE_STORAGE, DEFAULT_SCHEDULE),
  setDailySchedule: (partial) => {
    set((s) => {
      const schedule = { ...s.dailySchedule, ...partial };
      safeSet(SCHEDULE_STORAGE, schedule);
      return { dailySchedule: schedule };
    });
  },

  // User progress
  userProgress: safeGet(PROGRESS_STORAGE, DEFAULT_PROGRESS),
  updateProgress: (partial) => {
    set((s) => {
      const progress = { ...s.userProgress, ...partial };
      safeSet(PROGRESS_STORAGE, progress);
      return { userProgress: progress };
    });
  },

  // Audio
  audioEnabled: safeGet(AUDIO_STORAGE, true),
  setAudioEnabled: (audioEnabled) => {
    safeSet(AUDIO_STORAGE, audioEnabled);
    set({ audioEnabled });
  },
  audioVolume: 0.7,
  setAudioVolume: (audioVolume) => set({ audioVolume }),
}));
