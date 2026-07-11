import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, Variants } from "framer-motion";
import { X, HeartPulse, MessageCircle, Send, Loader2, Trash2 } from "lucide-react";
import boyCompanion from "@/assets/companion-boy.png";
import girlCompanion from "@/assets/companion-girl.png";
import { useCompanion, CompanionAction } from "@/hooks/useCompanion";

const POS_KEY = "companion_pos";
const CHAR_H = 120;

// Per-action body animation for each companion.
const bodyVariants: Variants = {
  idle: { rotate: [0, 1.5, -1.5, 0], y: [0, -6, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } },
  greet: { rotate: [0, -8, 0], scaleY: [1, 0.94, 1], transition: { duration: 1.4, repeat: 2, ease: "easeInOut" } },
  wave: { rotate: [0, 5, -5, 5, 0], transition: { duration: 0.7, repeat: 4, ease: "easeInOut" } },
  talk: { y: [0, -2, 0], scaleY: [1, 0.98, 1.01, 1], transition: { duration: 0.35, repeat: Infinity, ease: "easeInOut" } },
  talking: { y: [0, -2, 0], rotate: [0, 1, -1, 0], transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" } },
  sleep: { rotate: 90, y: 26, scale: [0.95, 0.98, 0.95], transition: { scale: { duration: 3, repeat: Infinity, ease: "easeInOut" } } },
  calmSleep: { rotate: 90, y: 26, scale: [0.95, 0.98, 0.95], transition: { scale: { duration: 4, repeat: Infinity, ease: "easeInOut" } } },
  sleepy: { rotate: [0, 6, -3, 0], y: [0, 3, 0], transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
  eat: { rotate: [0, -4, 4, 0], y: [0, -3, 0], transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" } },
  hungry: { rotate: [0, -3, 3, 0], scale: [1, 0.97, 1], transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" } },
  photo: { scale: [1, 1.03, 1], rotate: [0, -2, 2, 0], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
  exercise: { y: [0, -16, 0], transition: { duration: 0.45, repeat: Infinity, ease: "easeInOut" } },
  happy: { y: [0, -10, 0], rotate: [0, 3, -3, 0], transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" } },
  excited: { y: [0, -18, 0], transition: { duration: 0.35, repeat: Infinity, ease: "easeInOut" } },
  celebrating: { y: [0, -22, 0], rotate: [0, 8, -8, 0], transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" } },
  proud: { y: [0, -4, 0], scale: [1, 1.05, 1], transition: { duration: 1, repeat: Infinity, ease: "easeInOut" } },
  laughing: { rotate: [0, 4, -4, 0], y: [0, -5, 0], transition: { duration: 0.25, repeat: Infinity, ease: "easeInOut" } },
  surprised: { scale: [1, 1.12, 1], y: [0, -8, 0], transition: { duration: 0.5, repeat: 3, ease: "easeOut" } },
  sad: { rotate: [0, -2, 2, 0], y: [0, 4, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  thinking: { rotate: [0, 4, 0], transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } },
};

const EMOJI: Partial<Record<CompanionAction, string>> = {
  greet: "❤️", wave: "👋", eat: "🍽️", hungry: "😋", sleep: "💤", calmSleep: "🌙",
  sleepy: "😴", photo: "📷", exercise: "💪", happy: "😄", excited: "🤩",
  celebrating: "🎉", proud: "😌", laughing: "😂", surprised: "😲", sad: "😢", thinking: "💭",
  talking: "💬",
};

const ActionProps = ({ action }: { action: CompanionAction }) => {
  const emoji = EMOJI[action];
  if (!emoji) return null;
  const isCelebrate = action === "celebrating";
  if (isCelebrate) {
    return (
      <>
        {["🎉", "✨", "🎊"].map((e, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl"
            style={{ left: `${20 + i * 30}%`, top: "0%" }}
            animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          >{e}</motion.span>
        ))}
      </>
    );
  }
  return (
    <motion.span
      className="absolute -top-1 right-0 text-2xl"
      animate={{ y: [0, -8, 0], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 0.9, repeat: Infinity }}
    >{emoji}</motion.span>
  );
};

// A companion character: PNG + blink overlay + live mouth (lip-sync) glow.
const Character = ({
  src, alt, action, isSpeaker, mouthOpen, tilt,
}: {
  src: string; alt: string; action: CompanionAction;
  isSpeaker: boolean; mouthOpen: number; tilt: number;
}) => {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        loop();
      }, 2200 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-end" style={{ height: CHAR_H + 8 }}>
      <ActionProps action={action} />
      <motion.div
        style={{ rotate: tilt }}
        animate={{ rotate: tilt }}
        transition={{ type: "spring", stiffness: 60, damping: 12 }}
        className="relative"
      >
        <motion.img
          src={src}
          alt={alt}
          draggable={false}
          variants={bodyVariants}
          animate={action}
          style={{ height: CHAR_H, filter: blink ? "brightness(0.96)" : undefined }}
          className="object-contain drop-shadow-xl select-none pointer-events-none"
        />
        {/* blink line */}
        <AnimatePresence>
          {blink && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              className="absolute left-1/2 -translate-x-1/2 top-[30%] w-6 h-[2px] bg-foreground/40 rounded-full"
            />
          )}
        </AnimatePresence>
        {/* live lip-sync mouth when this character is the active speaker */}
        {isSpeaker && mouthOpen > 0.05 && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 top-[44%] bg-foreground/60 rounded-full"
            style={{ width: 10, height: 3 + mouthOpen * 9 }}
          />
        )}
      </motion.div>
    </div>
  );
};

const FloatingCompanion = () => {
  const {
    action, speech, speaker, hidden, setHidden, trigger,
    chatOpen, setChatOpen, messages, sendMessage, thinking, mouthOpen, clearHistory,
  } = useCompanion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState(0);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Greet the user on app open.
  useEffect(() => {
    const t = setTimeout(
      () => trigger("greet", "Assalomu alaykum! Bugungi sog'lom kuningizni birga boshlaymiz 👋", 6000),
      800,
    );
    return () => clearTimeout(t);
  }, [trigger]);

  // Eye/head tracking: tilt toward the mouse cursor.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cx = x.get() + 110;
      const dx = e.clientX - cx;
      setTilt(Math.max(-12, Math.min(12, dx / 40)));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x]);

  // Restore / default position (bottom-right).
  useEffect(() => {
    let start = { x: window.innerWidth - 230, y: window.innerHeight - 260 };
    try {
      const saved = JSON.parse(localStorage.getItem(POS_KEY) || "null");
      if (saved && typeof saved.x === "number") {
        start = {
          x: Math.min(Math.max(saved.x, 0), window.innerWidth - 200),
          y: Math.min(Math.max(saved.y, 0), window.innerHeight - 200),
        };
      }
    } catch {
      /* ignore */
    }
    x.set(start.x);
    y.set(start.y);
  }, [x, y]);

  // Auto-scroll chat.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  const persist = () => {
    localStorage.setItem(POS_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
  };

  const isSleeping = action === "sleep" || action === "calmSleep";

  const submit = () => {
    const v = input.trim();
    if (!v || thinking) return;
    setInput("");
    void sendMessage(v);
  };

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        className="fixed bottom-5 right-5 z-[60] w-12 h-12 rounded-full gradient-primary text-white shadow-elevated flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Hamrohlarni ko'rsatish"
      >
        <HeartPulse size={22} />
      </button>
    );
  }

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 z-[55] pointer-events-none" />
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        onDragEnd={persist}
        style={{ x, y }}
        whileDrag={{ scale: 1.05 }}
        className="fixed top-0 left-0 z-[56] cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <div className="relative">
          {/* speech bubble */}
          <AnimatePresence>
            {speech && !chatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 8 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-56 bg-card text-foreground p-3 rounded-2xl shadow-elevated border border-border text-xs font-medium text-center"
              >
                {speech}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card rotate-45 border-r border-b border-border" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* chat panel */}
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 12 }}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute bottom-full mb-3 right-0 w-72 bg-card border border-border rounded-2xl shadow-elevated overflow-hidden flex flex-col"
                style={{ maxHeight: 380 }}
              >
                <div className="flex items-center justify-between px-3 py-2 gradient-primary text-white">
                  <span className="text-sm font-semibold">Alisher & Malika</span>
                  <div className="flex items-center gap-1">
                    <button onClick={clearHistory} aria-label="Tarixni tozalash" className="p-1 hover:opacity-80"><Trash2 size={14} /></button>
                    <button onClick={() => setChatOpen(false)} aria-label="Yopish" className="p-1 hover:opacity-80"><X size={16} /></button>
                  </div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[140px]">
                  {messages.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Salom! Sog'lom hayot bo'yicha nima so'ramoqchisan? 💚
                    </p>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {thinking && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-muted-foreground px-3 py-2 rounded-2xl rounded-bl-sm">
                        <Loader2 size={14} className="animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-border flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="Yozing..."
                    className="flex-1 bg-muted rounded-full px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={submit}
                    disabled={thinking}
                    className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center disabled:opacity-50"
                    aria-label="Yuborish"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* controls */}
          <button
            onClick={() => setHidden(true)}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-card/90 border border-border text-muted-foreground flex items-center justify-center shadow hover:text-foreground"
            aria-label="Hamrohlarni yashirish"
          >
            <X size={13} />
          </button>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute -top-1 -left-1 z-10 w-7 h-7 rounded-full gradient-primary text-white flex items-center justify-center shadow-elevated hover:scale-110 transition-transform"
            aria-label="Hamroh bilan suhbat"
          >
            <MessageCircle size={14} />
          </button>

          {/* bed when sleeping */}
          {isSleeping && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[200px] h-8 rounded-xl bg-gradient-to-b from-primary/25 to-primary/10 border border-border" />
          )}

          {/* companions */}
          <div className="flex items-end gap-1 px-1">
            <Character src={boyCompanion} alt="Alisher hamroh" action={action} isSpeaker={speaker === "boy"} mouthOpen={mouthOpen} tilt={tilt} />
            <Character src={girlCompanion} alt="Malika hamroh" action={action} isSpeaker={speaker === "girl"} mouthOpen={mouthOpen} tilt={tilt} />
          </div>

          {/* camera flash */}
          <AnimatePresence>
            {action === "photo" && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.8 }}
                className="absolute inset-0 rounded-2xl bg-white pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

export default FloatingCompanion;
