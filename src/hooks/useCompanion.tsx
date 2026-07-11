import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CompanionAction =
  | "idle"
  | "greet"
  | "wave"
  | "talk"
  | "sleep"
  | "eat"
  | "calmSleep"
  | "photo"
  | "exercise"
  // rich emotions
  | "happy"
  | "excited"
  | "sad"
  | "sleepy"
  | "hungry"
  | "thinking"
  | "talking"
  | "laughing"
  | "surprised"
  | "proud"
  | "celebrating";

// Actions that stay active until explicitly changed (no auto-revert).
const PERSISTENT: CompanionAction[] = ["sleep", "calmSleep"];

// Map AI emotion strings -> companion actions.
const EMOTION_TO_ACTION: Record<string, CompanionAction> = {
  idle: "idle",
  happy: "happy",
  excited: "excited",
  sad: "sad",
  sleepy: "sleepy",
  hungry: "hungry",
  thinking: "thinking",
  talking: "talking",
  laughing: "laughing",
  surprised: "surprised",
  proud: "proud",
  celebrating: "celebrating",
};

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  speaker?: "boy" | "girl";
  ts: number;
}

const CHAT_KEY = "companion_chat_history";

interface CompanionContextValue {
  action: CompanionAction;
  speech: string;
  speaker: "boy" | "girl";
  hidden: boolean;
  chatOpen: boolean;
  thinking: boolean;
  messages: ChatMsg[];
  mouthOpen: number; // 0..1 live lip-sync amplitude
  trigger: (action: CompanionAction, speech?: string, holdMs?: number) => void;
  setHidden: (hidden: boolean) => void;
  setChatOpen: (open: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  speak: (text: string, who?: "boy" | "girl") => void;
  clearHistory: () => void;
}

const CompanionContext = createContext<CompanionContextValue | null>(null);

export const CompanionProvider = ({ children }: { children: ReactNode }) => {
  const [action, setAction] = useState<CompanionAction>("idle");
  const [speech, setSpeech] = useState("");
  const [speaker, setSpeaker] = useState<"boy" | "girl">("boy");
  const [hidden, setHidden] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouthTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist chat memory.
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  const trigger = useCallback((next: CompanionAction, text?: string, holdMs = 5000) => {
    if (revertTimer.current) clearTimeout(revertTimer.current);
    setAction(next);
    if (text !== undefined) {
      setSpeech(text);
      if (speechTimer.current) clearTimeout(speechTimer.current);
      speechTimer.current = setTimeout(() => setSpeech(""), Math.max(holdMs, 4000));
    }
    if (!PERSISTENT.includes(next)) {
      revertTimer.current = setTimeout(() => setAction("idle"), holdMs);
    }
  }, []);

  // Web Speech synthesis + live lip-sync amplitude driven by boundaries.
  const speak = useCallback((text: string, who: "boy" | "girl" = "boy") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ru-RU"; // closest widely-available voice for Uzbek phonetics
      u.rate = 1.02;
      u.pitch = who === "girl" ? 1.4 : 0.9;
      const voices = window.speechSynthesis.getVoices();
      const pick = voices.find((v) => /ru|uz/i.test(v.lang));
      if (pick) u.voice = pick;

      // Fake but lively lip-sync while speaking.
      if (mouthTimer.current) clearInterval(mouthTimer.current);
      mouthTimer.current = setInterval(() => setMouthOpen(0.2 + Math.random() * 0.8), 90);
      u.onboundary = () => setMouthOpen(0.3 + Math.random() * 0.7);
      const stop = () => {
        if (mouthTimer.current) clearInterval(mouthTimer.current);
        setMouthOpen(0);
      };
      u.onend = stop;
      u.onerror = stop;
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      const userMsg: ChatMsg = { role: "user", content: clean, ts: Date.now() };
      setMessages((m) => [...m, userMsg]);
      setThinking(true);
      trigger("thinking");
      try {
        const history = [...messages, userMsg].slice(-12).map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const { data, error } = await supabase.functions.invoke("companion-chat", {
          body: {
            userMessage: clean,
            messages: history,
            context: {
              hour: new Date().getHours(),
              page: typeof window !== "undefined" ? window.location.pathname : "/",
            },
          },
        });
        if (error) throw error;
        const reply: string = data?.reply || "Men shu yerdaman! 😊";
        const who: "boy" | "girl" = data?.speaker === "girl" ? "girl" : "boy";
        const emotion: CompanionAction = EMOTION_TO_ACTION[data?.emotion] || "talking";

        setMessages((m) => [...m, { role: "assistant", content: reply, speaker: who, ts: Date.now() }]);
        setSpeaker(who);
        trigger(emotion, reply, 7000);
        speak(reply, who);
      } catch (e) {
        const fallback = "Kechirasan, hozir bog'lana olmadim 😔";
        setMessages((m) => [...m, { role: "assistant", content: fallback, speaker: "boy", ts: Date.now() }]);
        trigger("sad", fallback, 5000);
      } finally {
        setThinking(false);
      }
    },
    [messages, trigger, speak],
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <CompanionContext.Provider
      value={{
        action,
        speech,
        speaker,
        hidden,
        chatOpen,
        thinking,
        messages,
        mouthOpen,
        trigger,
        setHidden,
        setChatOpen,
        sendMessage,
        speak,
        clearHistory,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
};

export const useCompanion = () => {
  const ctx = useContext(CompanionContext);
  if (!ctx) {
    return {
      action: "idle" as CompanionAction,
      speech: "",
      speaker: "boy" as const,
      hidden: true,
      chatOpen: false,
      thinking: false,
      messages: [] as ChatMsg[],
      mouthOpen: 0,
      trigger: () => {},
      setHidden: () => {},
      setChatOpen: () => {},
      sendMessage: async () => {},
      speak: () => {},
      clearHistory: () => {},
    };
  }
  return ctx;
};
