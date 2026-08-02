import { X, Volume2, VolumeX } from "lucide-react";
import { useCompanionStore } from "@/stores/useCompanionStore";

interface CompanionMiniPanelProps {
  onStartListening?: () => void;
  onStopListening?: () => void;
  onSpeak: (text: string, mood?: any) => void;
}

/**
 * Minimal control bar.
 * The companions live their own autonomous life (schedule driven),
 * so the user can ONLY: mute audio, switch character, hide companion.
 */
const CompanionMiniPanel = ({ onSpeak }: CompanionMiniPanelProps) => {
  const {
    character,
    setCharacter,
    mode,
    setMode,
    audioEnabled,
    setAudioEnabled,
  } = useCompanionStore();

  return (
    <div className="pointer-events-auto select-none">
      <div className="flex items-center gap-1.5 bg-card/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-border/50 shadow-lg px-1.5 py-1.5">
        {/* audio */}
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          title={audioEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
          className={`p-1.5 rounded-xl transition-all ${
            audioEnabled ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          }`}
        >
          {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* character switcher */}
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl">
          <button
            onClick={() => {
              if (character !== "boy") {
                setCharacter("boy");
                onSpeak("Salom! Men Alisherman!", "happy");
              }
            }}
            className={`py-1 px-2 rounded-lg text-[10px] font-semibold transition-all ${
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
                onSpeak("Salom! Men Malikaman!", "happy");
              }
            }}
            className={`py-1 px-2 rounded-lg text-[10px] font-semibold transition-all ${
              character === "girl"
                ? "bg-pink-500 text-white shadow-md"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            👧 Qiz
          </button>
        </div>

        {/* hide */}
        <button
          onClick={() => setMode(mode === "minimized" ? "floating" : "minimized")}
          title="Yashirish"
          className="p-1.5 rounded-xl bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default CompanionMiniPanel;
