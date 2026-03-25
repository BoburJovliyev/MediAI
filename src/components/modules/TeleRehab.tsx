import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, Play, Pause, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import MedicalDisclaimer from "../shared/MedicalDisclaimer";

interface Exercise {
  id: string;
  name: string;
  description: string;
  reps: number;
  checkpoints: string[];
}

const exercises: Exercise[] = [
  {
    id: "shoulder-raise",
    name: "Yelka ko'tarish mashqi",
    description: "Qo'llaringizni yon tomondan sekin yuqoriga ko'taring va 3 soniya ushlang",
    reps: 10,
    checkpoints: ["Qo'llar to'g'ri", "Yelkalar tekis", "Tana tik holda"],
  },
  {
    id: "knee-bend",
    name: "Tizza bukish mashqi",
    description: "Sekin cho'qqayib o'tiring va orqaga qayting",
    reps: 12,
    checkpoints: ["Tizzalar oyoq uchidan o'tmaydi", "Orqa tekis", "Qadam keng"],
  },
  {
    id: "neck-stretch",
    name: "Bo'yin cho'zish mashqi",
    description: "Boshni sekin chap va o'ng tomonga buking",
    reps: 8,
    checkpoints: ["Harakatlar sekin", "Yelkalar tushirilgan", "Nafas olish bir tekis"],
  },
];

type Feedback = { type: "success" | "warning" | "error"; message: string };

const TeleRehab = () => {
  const [cameraOn, setCameraOn] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
  const [isExercising, setIsExercising] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraOn(true);
    } catch (err) {
      console.error("Camera error:", err);
      setFeedback({ type: "error", message: "Kameraga ruxsat berilmadi" });
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setIsExercising(false);
  }, []);

  // Simulate pose feedback during exercise
  useEffect(() => {
    if (!isExercising) return;
    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand > 0.7) {
        setFeedback({ type: "warning", message: "⚠️ Qo'lni yuqoriroq ko'taring!" });
      } else if (rand > 0.4) {
        setFeedback({ type: "success", message: "✅ Juda yaxshi! Davom eting!" });
        setCurrentRep((r) => Math.min(r + 1, selectedExercise.reps));
      } else {
        setFeedback({ type: "error", message: "❌ Tana holatini to'g'rilang!" });
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [isExercising, selectedExercise.reps]);

  useEffect(() => {
    if (currentRep >= selectedExercise.reps && isExercising) {
      setIsExercising(false);
      setFeedback({ type: "success", message: "🎉 Mashq muvaffaqiyatli yakunlandi!" });
    }
  }, [currentRep, selectedExercise.reps, isExercising]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Tele-Rehab AI</h2>
        <p className="text-muted-foreground mt-1">Kamera orqali reabilitatsiya mashqlarini AI nazorat qiladi</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Exercise List */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-foreground">Mashqlar</h3>
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { setSelectedExercise(ex); setCurrentRep(0); setFeedback(null); }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedExercise.id === ex.id
                  ? "border-primary bg-medical-teal-light shadow-card"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <p className="font-medium text-sm text-foreground">{ex.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{ex.reps} takror</p>
            </button>
          ))}
        </div>

        {/* Camera View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-foreground/5 rounded-2xl overflow-hidden aspect-video border border-border">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraOn ? "" : "hidden"}`}
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Camera size={48} className="text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Kamerani yoqing va mashqni boshlang</p>
              </div>
            )}

            {/* Progress */}
            {isExercising && (
              <div className="absolute top-4 left-4 right-4 flex items-center gap-3">
                <div className="glass-card rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {currentRep}/{selectedExercise.reps}
                  </span>
                  <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full gradient-accent rounded-full"
                      animate={{ width: `${(currentRep / selectedExercise.reps) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={cameraOn ? stopCamera : startCamera}
              className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm ${
                cameraOn
                  ? "bg-destructive text-destructive-foreground"
                  : "gradient-primary text-primary-foreground shadow-glow"
              }`}
            >
              {cameraOn ? <><CameraOff size={18} /> Kamerani o'chirish</> : <><Camera size={18} /> Kamerani yoqish</>}
            </button>
            {cameraOn && (
              <button
                onClick={() => { setIsExercising(!isExercising); if (!isExercising) setCurrentRep(0); }}
                className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm bg-accent text-accent-foreground"
              >
                {isExercising ? <><Pause size={18} /> To'xtatish</> : <><Play size={18} /> Mashqni Boshlash</>}
              </button>
            )}
          </div>

          {/* Feedback */}
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                key={feedback.message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-xl p-4 flex items-center gap-3 ${
                  feedback.type === "success" ? "bg-medical-green-light" :
                  feedback.type === "warning" ? "bg-medical-orange-light" :
                  "bg-medical-red-light"
                }`}
              >
                {feedback.type === "success" ? <CheckCircle2 size={20} className="text-medical-green" /> :
                 feedback.type === "warning" ? <AlertTriangle size={20} className="text-medical-orange" /> :
                 <XCircle size={20} className="text-medical-red" />}
                <span className="text-sm font-medium text-foreground">{feedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exercise Info */}
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
            <h4 className="font-display font-bold text-foreground mb-2">{selectedExercise.name}</h4>
            <p className="text-sm text-muted-foreground mb-3">{selectedExercise.description}</p>
            <div className="flex flex-wrap gap-2">
              {selectedExercise.checkpoints.map((c) => (
                <span key={c} className="medical-badge bg-medical-green-light text-medical-green">{c}</span>
              ))}
            </div>
          </div>

          <MedicalDisclaimer type="general" />
        </div>
      </div>
    </motion.div>
  );
};

export default TeleRehab;
