import { AnimatePresence, motion } from "framer-motion";
import { Mic } from "lucide-react";

interface CompanionChatBubbleProps {
  text: string;
  isSpeaking: boolean;
  isListening: boolean;
  side: "left" | "right";
}

/* ------------------------------------------------------------------ */
/*  Floating speech bubble above the 3D companion                      */
/* ------------------------------------------------------------------ */
const CompanionChatBubble = ({
  text,
  isSpeaking,
  isListening,
  side,
}: CompanionChatBubbleProps) => {
  const show = Boolean(text) || isListening;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className={`pointer-events-none relative max-w-[240px] mb-1 ${
            side === "left" ? "self-start" : "self-end"
          }`}
        >
          <div className="rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-xl px-3.5 py-2.5">
            {isListening && !text ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mic size={14} className="text-primary animate-pulse" />
                <span>Tinglayapman…</span>
              </div>
            ) : (
              <p className="text-sm leading-snug text-foreground">{text}</p>
            )}

            {isSpeaking && (
              <div className="mt-1.5 flex items-end gap-0.5 h-2.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    className="w-0.5 flex-1 max-w-[3px] rounded-full bg-primary"
                    animate={{ scaleY: [0.3, 1, 0.4, 0.9, 0.3] }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      delay: i * 0.08,
                    }}
                    style={{ height: "100%", transformOrigin: "bottom" }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* tail */}
          <div
            className={`absolute -bottom-1.5 h-3 w-3 rotate-45 bg-card/90 border-r border-b border-border ${
              side === "left" ? "left-6" : "right-6"
            }`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompanionChatBubble;
