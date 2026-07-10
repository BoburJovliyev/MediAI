import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, Variants } from "framer-motion";
import { X, HeartPulse } from "lucide-react";
import boyCompanion from "@/assets/companion-boy.png";
import girlCompanion from "@/assets/companion-girl.png";
import { useCompanion, CompanionAction } from "@/hooks/useCompanion";

const POS_KEY = "companion_pos";
const CHAR_H = 120; // per character height (smaller than the panel version)

// Per-action body animation for each companion.
const bodyVariants: Variants = {
  idle: { rotate: [0, 1.5, -1.5, 0], y: [0, -6, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } },
  greet: { rotate: [0, -8, 0], scaleY: [1, 0.94, 1], transition: { duration: 1.4, repeat: 2, ease: "easeInOut" } },
  wave: { rotate: [0, 5, -5, 5, 0], transition: { duration: 0.7, repeat: 4, ease: "easeInOut" } },
  talk: { y: [0, -2, 0], scaleY: [1, 0.98, 1.01, 1], transition: { duration: 0.35, repeat: Infinity, ease: "easeInOut" } },
  sleep: { rotate: 90, y: 26, scale: [0.95, 0.98, 0.95], transition: { scale: { duration: 3, repeat: Infinity, ease: "easeInOut" } } },
  calmSleep: { rotate: 90, y: 26, scale: [0.95, 0.98, 0.95], transition: { scale: { duration: 4, repeat: Infinity, ease: "easeInOut" } } },
  eat: { rotate: [0, -4, 4, 0], y: [0, -3, 0], transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" } },
  photo: { scale: [1, 1.03, 1], rotate: [0, -2, 2, 0], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
  exercise: { y: [0, -16, 0], transition: { duration: 0.45, repeat: Infinity, ease: "easeInOut" } },
};

// Little emoji "props" that float around based on the current action.
const ActionProps = ({ action }: { action: CompanionAction }) => {
  const bounce = { animate: { y: [0, -8, 0], transition: { duration: 0.8, repeat: Infinity } } };
  switch (action) {
    case "greet":
      return <motion.span className="absolute left-1/2 top-1/2 text-2xl" {...bounce}>❤️</motion.span>;
    case "wave":
      return (
        <motion.span
          className="absolute -top-1 left-2 text-3xl"
          animate={{ rotate: [0, 25, -10, 25, 0] }}
          transition={{ duration: 0.7, repeat: Infinity }}
        >👋</motion.span>
      );
    case "eat":
      return (
        <>
          <motion.span className="absolute -top-1 left-1 text-2xl" animate={{ x: [0, 4, 0], rotate: [0, 15, 0] }} transition={{ duration: 0.4, repeat: Infinity }}>🍽️</motion.span>
          <motion.span className="absolute -top-1 right-1 text-2xl" animate={{ x: [0, -4, 0], rotate: [0, -15, 0] }} transition={{ duration: 0.4, repeat: Infinity }}>🥄</motion.span>
        </>
      );
    case "sleep":
      return <motion.span className="absolute -top-2 right-2 text-2xl" animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>💤</motion.span>;
    case "calmSleep":
      return (
        <>
          <motion.span className="absolute -top-2 right-2 text-2xl" animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }}>💤</motion.span>
          <motion.span className="absolute -top-1 left-3 text-lg" animate={{ y: [0, -14, 0], opacity: [0, 1, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>🎵</motion.span>
        </>
      );
    case "photo":
      return <motion.span className="absolute top-1/3 left-1/2 -translate-x-1/2 text-3xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>📷</motion.span>;
    case "exercise":
      return <motion.span className="absolute -top-1 right-1 text-2xl" animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>💪</motion.span>;
    case "talk":
      return (
        <motion.span className="absolute -top-1 right-1 text-lg" animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 0.5, repeat: Infinity }}>💬</motion.span>
      );
    default:
      return null;
  }
};

const Character = ({ src, alt, action }: { src: string; alt: string; action: CompanionAction }) => (
  <div className="relative flex flex-col items-center justify-end" style={{ height: CHAR_H + 8 }}>
    <ActionProps action={action} />
    <motion.img
      src={src}
      alt={alt}
      draggable={false}
      variants={bodyVariants}
      animate={action}
      style={{ height: CHAR_H }}
      className="object-contain drop-shadow-xl select-none pointer-events-none"
    />
  </div>
);

const FloatingCompanion = () => {
  const { action, speech, hidden, setHidden } = useCompanion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

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

  const persist = () => {
    localStorage.setItem(POS_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
  };

  const isSleeping = action === "sleep" || action === "calmSleep";

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
      {/* full-screen constraint layer (no pointer capture) */}
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
            {speech && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 8 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-52 bg-card text-foreground p-3 rounded-2xl shadow-elevated border border-border text-xs font-medium text-center"
              >
                {speech}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card rotate-45 border-r border-b border-border" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* close button */}
          <button
            onClick={() => setHidden(true)}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-card/90 border border-border text-muted-foreground flex items-center justify-center shadow hover:text-foreground"
            aria-label="Hamrohlarni yashirish"
          >
            <X size={13} />
          </button>

          {/* bed when sleeping */}
          {isSleeping && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[200px] h-8 rounded-xl bg-gradient-to-b from-primary/25 to-primary/10 border border-border" />
          )}

          {/* companions */}
          <div className="flex items-end gap-1 px-1">
            <Character src={boyCompanion} alt="Alisher hamroh" action={action} />
            <Character src={girlCompanion} alt="Malika hamroh" action={action} />
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
