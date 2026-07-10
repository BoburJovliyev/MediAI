import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

export type CompanionAction =
  | "idle"
  | "greet"
  | "wave"
  | "talk"
  | "sleep"
  | "eat"
  | "calmSleep"
  | "photo"
  | "exercise";

// Actions that stay active until explicitly changed (no auto-revert).
const PERSISTENT: CompanionAction[] = ["sleep", "calmSleep"];

interface CompanionContextValue {
  action: CompanionAction;
  speech: string;
  hidden: boolean;
  trigger: (action: CompanionAction, speech?: string, holdMs?: number) => void;
  setHidden: (hidden: boolean) => void;
}

const CompanionContext = createContext<CompanionContextValue | null>(null);

export const CompanionProvider = ({ children }: { children: ReactNode }) => {
  const [action, setAction] = useState<CompanionAction>("idle");
  const [speech, setSpeech] = useState("");
  const [hidden, setHidden] = useState(false);
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <CompanionContext.Provider value={{ action, speech, hidden, trigger, setHidden }}>
      {children}
    </CompanionContext.Provider>
  );
};

export const useCompanion = () => {
  const ctx = useContext(CompanionContext);
  if (!ctx) {
    // Safe no-op fallback when used outside the provider.
    return {
      action: "idle" as CompanionAction,
      speech: "",
      hidden: true,
      trigger: () => {},
      setHidden: () => {},
    };
  }
  return ctx;
};
