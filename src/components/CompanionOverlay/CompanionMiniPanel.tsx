import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Clock,
  Utensils,
  Dumbbell,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  Moon,
  Sparkles,
  X,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCompanionStore } from "@/stores/useCompanionStore";
import type { CharacterType, SceneMode } from "@/stores/useCompanionStore";

interface CompanionMiniPanelProps {
  onStartListening: () => void;
  onStopListening: () => void;
  onSpeak: (text: string, mood?: any) => void;
}

const CompanionMiniPanel = ({
  onStartListening,
  onStopListening,
  onSpeak,
}: CompanionMiniPanelProps) => {
  const {
    panelOpen,
    setPanelOpen,
    character,
    setCharacter,
    isListening,
    setSceneMode,
    setMood,
    setActivity,
    mode,
    setMode,
    audioEnabled,
    setAudioEnabled,
    setWelcomePlaying,
  } = useCompanionStore();

  const actions = [
    {
      icon: <Mic size={18} />,
      activeIcon: <MicOff size={18} />,
      label: "Gapiring",
      activeLabel: "To'xtating",
      color: "bg-primary",
      isActive: isListening,
      onClick: () => {
        if (isListening) {
          onStopListening();
        } else {
          onStartListening();
        }
      },
    },
    {
      icon: <Clock size={18} />,
      label: "Uyqu",
      color: "bg-indigo-500",
      onClick: () => {
        setSceneMode("bedroom");
        setMood("sleep");
        setActivity("sleeping");
        onSpeak("Uxlash vaqti yaqinlashdi. Bugun erta dam oling! 🌙", "sleep");
      },
    },
    {
      icon: <Utensils size={18} />,
      label: "Ovqat",
      color: "bg-orange-500",
      onClick: () => {
        setSceneMode("kitchen");
        setMood("hungry");
        setActivity("eating_lunch");
        onSpeak("Ovqatlanish vaqti! Sog'lom taomlar tanlang 🥗", "happy");
      },
    },
    {
      icon: <Dumbbell size={18} />,
      label: "Mashq",
      color: "bg-rose-500",
      onClick: () => {
        setSceneMode("gym");
        setMood("exercise");
        setActivity("working_out");
        onSpeak("Harakatda barakat! Keling mashq qilamiz! 💪", "exercise");
      },
    },
    {
      icon: <Sparkles size={18} />,
      label: "Salom",
      color: "bg-purple-500",
      onClick: () => {
        setSceneMode("welcome");
        setMood("happy");
        setActivity("greeting");
        setWelcomePlaying(true);
        onSpeak("Salom do'stim! Men sizning sog'lom hamrohingizman! ✨", "happy");
        setTimeout(() => setWelcomePlaying(false), 4000);
      },
    },
  ];

  return (
    <div className="pointer-events-auto select-none">
      {/* toggle button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-card/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all hover:border-primary/50 shadow-lg"
      >
        {panelOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        {panelOpen ? "Yopish" : "Menyusini ochish"}
      </button>

      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="mt-2 bg-card/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl p-3 space-y-3"
            style={{ minWidth: 200 }}
          >
            {/* top controls: audio & minimize */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  audioEnabled ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                }`}
              >
                {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              
              <button
                onClick={() => setMode(mode === "minimized" ? "floating" : "minimized")}
                className="p-1.5 rounded-lg bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                title="Minimallashtirish"
              >
                <X size={16} />
              </button>
            </div>

            {/* character switcher */}
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl">
              <button
                onClick={() => {
                  if (character !== "boy") {
                    setCharacter("boy");
                    onSpeak("Salom! Men o'g'il hamrohman! 💙", "happy");
                  }
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                  character === "boy"
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                👦 O'g'il
              </button>
              <button
                onClick={() => {
                  if (character !== "girl") {
                    setCharacter("girl");
                    onSpeak("Salom! Men qiz hamrohman! 💖", "happy");
                  }
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                  character === "girl"
                    ? "bg-pink-500 text-white shadow-md"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                👧 Qiz
              </button>
            </div>

            {/* quick actions */}
            <div className="grid grid-cols-3 gap-1.5">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-white transition-all hover:scale-105 active:scale-95 shadow-md ${
                    action.isActive ? "ring-2 ring-white/50 bg-destructive" : action.color
                  }`}
                >
                  {action.isActive ? action.activeIcon || action.icon : action.icon}
                  <span className="text-[9px] font-semibold leading-none">
                    {action.isActive ? action.activeLabel || action.label : action.label}
                  </span>
                </button>
              ))}
            </div>

            {/* reset button */}
            <button
              onClick={() => {
                setSceneMode("none");
                setMood("idle");
                setActivity("none");
              }}
              className="w-full py-1.5 px-2 rounded-lg bg-secondary/80 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all flex justify-center items-center gap-2"
            >
              🏠 Asosiy rejim
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanionMiniPanel;
