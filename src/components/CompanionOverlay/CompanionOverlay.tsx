import { Suspense, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Float } from "@react-three/drei";

import { motion, AnimatePresence } from "framer-motion";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { useCompanionDrag } from "@/hooks/useCompanionDrag";
import { useCompanionAI } from "@/hooks/useCompanionAI";
import { useAudioSystem } from "@/hooks/useAudioSystem";
import { useSceneOrchestrator } from "@/hooks/useSceneOrchestrator";
import { useEmotionController } from "@/hooks/useEmotionController";
import Character3D from "@/components/3d/Character3D";
import SceneManager from "@/components/scenes/SceneManager";
import CompanionChatBubble from "./CompanionChatBubble";
import CompanionMiniPanel from "./CompanionMiniPanel";
import { BellRing, Check } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Global overlay that renders the 3D companion on top of everything */
/*  Persists across route changes because it lives in App.tsx          */
/* ------------------------------------------------------------------ */

function CompanionScene() {
  const { character, mood, isSpeaking, audioLevel, sceneMode, mousePosition } =
    useCompanionStore();

  return (
    <>
      <ambientLight intensity={0.6} />
      <spotLight
        position={[3, 5, 4]}
        angle={0.35}
        penumbra={0.8}
        intensity={1.2}
        castShadow
      />
      <spotLight
        position={[-3, 4, 2]}
        angle={0.4}
        penumbra={1}
        intensity={0.5}
        color="#aaccff"
      />
      <Environment preset="city" />

      <SceneManager sceneMode={sceneMode} mood={mood} />

      <Float speed={1.5} rotationIntensity={0.06} floatIntensity={0.12}>
        <Character3D
          character={character}
          mood={mood}
          isSpeaking={isSpeaking}
          lookTarget={mousePosition}
          audioLevel={audioLevel}
        />
      </Float>

      <ContactShadows
        position={[0, -0.15, 0]}
        opacity={0.45}
        scale={2.5}
        blur={2.5}
        far={1.2}
      />

    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Minimised mode — just a pulsing avatar circle                      */
/* ------------------------------------------------------------------ */
function MinimisedButton({
  onClick,
  character,
}: {
  onClick: () => void;
  character: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-xl flex items-center justify-center text-white text-xl font-bold hover:scale-110 active:scale-95 transition-transform ring-2 ring-primary/30 ring-offset-2 ring-offset-background relative"
    >
      {character === "boy" ? "👦" : "👧"}
      <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Alarm UI Overlay                                                   */
/* ------------------------------------------------------------------ */
function AlarmUI({ onStop }: { onStop: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute -top-16 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3 pointer-events-auto"
    >
      <BellRing className="animate-wiggle" size={20} />
      <span className="font-bold">Uyg'onish vaqti!</span>
      <button 
        onClick={onStop}
        className="bg-white text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors ml-2"
      >
        <Check size={16} />
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Overlay                                                       */
/* ------------------------------------------------------------------ */
const CompanionOverlay = () => {
  const {
    visible,
    mode,
    setMode,
    character,
    speechText,
    isSpeaking,
    isListening,
    setMousePosition,
    alarmActive,
    stopAlarm,
    welcomePlaying,
  } = useCompanionStore();

  const { position, isDragging, dragHandlers } = useCompanionDrag();
  const { speakText, startListening, stopListening } = useCompanionAI();
  
  // Initialize hooks that need to be mounted globally
  useAudioSystem();
  useSceneOrchestrator();
  useEmotionController();

  /* track mouse for IK */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePosition({ x, y });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [setMousePosition]);

  if (!visible) return null;

  const isOnLeft = position.x < window.innerWidth / 2;

  // We make the canvas container slightly larger but completely transparent without borders
  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ isolation: "isolate" }}
    >
      <AnimatePresence mode="wait">
        {mode === "minimized" ? (
          <motion.div
            key="minimized"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="pointer-events-auto"
            style={{
              position: "absolute",
              left: position.x,
              top: position.y,
            }}
          >
            <MinimisedButton
              onClick={() => setMode("floating")}
              character={character}
            />
          </motion.div>
        ) : (
          <motion.div
            key="floating"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              x: isDragging ? 0 : 0,
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: isDragging ? 999 : 300,
              damping: isDragging ? 50 : 25,
            }}
            style={{
              position: "absolute",
              left: position.x,
              top: position.y,
              width: 260, // slightly wider for the borderless look
            }}
            className="flex flex-col items-center"
          >
            {/* speech bubble */}
            <CompanionChatBubble
              text={speechText}
              isSpeaking={isSpeaking}
              isListening={isListening}
              side={isOnLeft ? "left" : "right"}
            />

            {/* Alarm UI */
             alarmActive && (
               <AnimatePresence>
                 <AlarmUI onStop={stopAlarm} />
               </AnimatePresence>
             )
            }

            {/* 3D canvas — borderless and fully transparent */}
            <div
              {...dragHandlers}
              className="pointer-events-auto relative"
              style={{
                width: 260,
                height: 320,
                cursor: isDragging ? "grabbing" : "grab",
              }}
            >
              <Canvas
                shadows
                camera={{ position: [0, 0.8, 3.2], fov: 38 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: "transparent" }}
                dpr={[1, 2]} // Performance optimization: max dpr 2
              >
                <Suspense fallback={null}>
                  <CompanionScene />
                </Suspense>
              </Canvas>
              
              {/* Optional welcome overlay text */}
              {welcomePlaying && (
                <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/30"
                  >
                    Xush kelibsiz!
                  </motion.div>
                </div>
              )}
            </div>

            {/* mini panel */}
            <div className="mt-[-20px] w-[200px] pointer-events-auto">
              <CompanionMiniPanel
                onStartListening={startListening}
                onStopListening={stopListening}
                onSpeak={speakText}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanionOverlay;
