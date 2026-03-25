import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, Play, Pause, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import MedicalDisclaimer from "../shared/MedicalDisclaimer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

// Angle calculation helper
const calcAngle = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
};

const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32],
];

const TeleRehab = () => {
  const { user } = useAuth();
  const [cameraOn, setCameraOn] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
  const [isExercising, setIsExercising] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [poseLoaded, setPoseLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const exercisingRef = useRef(false);
  const repStateRef = useRef<"up" | "down">("down");
  const feedbackLogRef = useRef<Feedback[]>([]);
  const startTimeRef = useRef<number>(0);

  exercisingRef.current = isExercising;

  // Draw skeleton on canvas
  const drawSkeleton = useCallback((landmarks: any[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    ctx.strokeStyle = "hsl(195, 85%, 42%)";
    ctx.lineWidth = 3;
    for (const [i, j] of POSE_CONNECTIONS) {
      const a = landmarks[i];
      const b = landmarks[j];
      if (a && b && a.visibility > 0.5 && b.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
        ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
        ctx.stroke();
      }
    }

    // Draw points
    for (const lm of landmarks) {
      if (lm.visibility > 0.5) {
        ctx.fillStyle = "hsl(165, 60%, 45%)";
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, []);

  // Analyze pose for shoulder raise exercise
  const analyzePose = useCallback((landmarks: any[]) => {
    if (!exercisingRef.current) return;

    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const leftHip = landmarks[23];
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];
    const rightHip = landmarks[24];

    if (!leftShoulder || !leftElbow || !leftWrist || !leftHip || !rightShoulder || !rightElbow || !rightWrist || !rightHip) return;

    if (selectedExercise.id === "shoulder-raise") {
      const leftAngle = calcAngle(leftHip, leftShoulder, leftElbow);
      const rightAngle = calcAngle(rightHip, rightShoulder, rightElbow);
      const avgAngle = (leftAngle + rightAngle) / 2;

      if (avgAngle > 150 && repStateRef.current === "down") {
        repStateRef.current = "up";
        setCurrentRep((r) => {
          const newR = r + 1;
          return Math.min(newR, selectedExercise.reps);
        });
        const fb: Feedback = { type: "success", message: "✅ Juda yaxshi! Davom eting!" };
        setFeedback(fb);
        feedbackLogRef.current.push(fb);
      } else if (avgAngle < 60) {
        repStateRef.current = "down";
      } else if (avgAngle > 60 && avgAngle < 120 && repStateRef.current === "down") {
        const fb: Feedback = { type: "warning", message: "⚠️ Qo'lni yuqoriroq ko'taring!" };
        setFeedback(fb);
        feedbackLogRef.current.push(fb);
      }

      // Check body alignment
      const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
      if (shoulderDiff > 0.05) {
        const fb: Feedback = { type: "error", message: "❌ Yelkalarni tekis tuting!" };
        setFeedback(fb);
        feedbackLogRef.current.push(fb);
      }
    } else if (selectedExercise.id === "knee-bend") {
      const leftKneeAngle = calcAngle(leftHip, landmarks[25], landmarks[27]);
      const rightKneeAngle = calcAngle(rightHip, landmarks[26], landmarks[28]);
      const avgKnee = (leftKneeAngle + rightKneeAngle) / 2;

      if (avgKnee < 100 && repStateRef.current === "down") {
        repStateRef.current = "up";
        setCurrentRep((r) => Math.min(r + 1, selectedExercise.reps));
        const fb: Feedback = { type: "success", message: "✅ Yaxshi cho'qqaydingiz!" };
        setFeedback(fb);
        feedbackLogRef.current.push(fb);
      } else if (avgKnee > 160) {
        repStateRef.current = "down";
      }
    } else {
      // neck-stretch - track head tilt
      const nose = landmarks[0];
      const leftEar = landmarks[7];
      const rightEar = landmarks[8];
      if (nose && leftEar && rightEar) {
        const tilt = Math.abs(leftEar.y - rightEar.y);
        if (tilt > 0.04 && repStateRef.current === "down") {
          repStateRef.current = "up";
          setCurrentRep((r) => Math.min(r + 1, selectedExercise.reps));
          const fb: Feedback = { type: "success", message: "✅ Bo'yin cho'zish yaxshi!" };
          setFeedback(fb);
          feedbackLogRef.current.push(fb);
        } else if (tilt < 0.02) {
          repStateRef.current = "down";
        }
      }
    }
  }, [selectedExercise]);

  // Initialize MediaPipe Pose
  const initPose = useCallback(async () => {
    try {
      const { Pose } = await import("@mediapipe/pose");
      
      const pose = new Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        if (results.poseLandmarks && canvasRef.current) {
          drawSkeleton(results.poseLandmarks, canvasRef.current);
          analyzePose(results.poseLandmarks);
        }
      });

      poseRef.current = pose;
      setPoseLoaded(true);
    } catch (err) {
      console.error("MediaPipe init error:", err);
      toast.error("MediaPipe yuklanmadi. Sahifani qayta yuklang.");
    }
  }, [drawSkeleton, analyzePose]);

  // Camera frame loop
  const sendFrame = useCallback(async () => {
    if (videoRef.current && poseRef.current && videoRef.current.readyState >= 2) {
      await poseRef.current.send({ image: videoRef.current });
    }
    if (cameraOn) {
      animFrameRef.current = requestAnimationFrame(sendFrame);
    }
  }, [cameraOn]);

  useEffect(() => {
    if (cameraOn && poseLoaded) {
      animFrameRef.current = requestAnimationFrame(sendFrame);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraOn, poseLoaded, sendFrame]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      if (canvasRef.current) {
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      }
      setCameraOn(true);
      if (!poseRef.current) await initPose();
    } catch (err) {
      console.error("Camera error:", err);
      setFeedback({ type: "error", message: "Kameraga ruxsat berilmadi" });
    }
  }, [initPose]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setCameraOn(false);
    setIsExercising(false);
  }, []);

  // Save session when exercise completes
  useEffect(() => {
    if (currentRep >= selectedExercise.reps && isExercising) {
      setIsExercising(false);
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      const successCount = feedbackLogRef.current.filter((f) => f.type === "success").length;
      const accuracy = Math.round((successCount / Math.max(feedbackLogRef.current.length, 1)) * 100);

      setFeedback({ type: "success", message: "🎉 Mashq muvaffaqiyatli yakunlandi!" });

      if (user) {
        supabase.from("rehab_sessions").insert({
          user_id: user.id,
          exercise_name: selectedExercise.name,
          total_reps: selectedExercise.reps,
          completed_reps: currentRep,
          accuracy_score: accuracy,
          feedback_log: feedbackLogRef.current as any,
          duration_seconds: duration,
        }).then(({ error }) => {
          if (error) console.error("Save session error:", error);
          else toast.success("Mashq natijalari saqlandi!");
        });
      }
    }
  }, [currentRep, selectedExercise, isExercising, user]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Tele-Rehab AI</h2>
        <p className="text-muted-foreground mt-1">MediaPipe Pose yordamida reabilitatsiya mashqlarini nazorat qiling</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-foreground">Mashqlar</h3>
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { setSelectedExercise(ex); setCurrentRep(0); setFeedback(null); repStateRef.current = "down"; feedbackLogRef.current = []; }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedExercise.id === ex.id ? "border-primary bg-medical-teal-light shadow-card" : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <p className="font-medium text-sm text-foreground">{ex.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{ex.reps} takror</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-foreground/5 rounded-2xl overflow-hidden aspect-video border border-border">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraOn ? "" : "hidden"}`} />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Camera size={48} className="text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Kamerani yoqing va mashqni boshlang</p>
                {!poseLoaded && cameraOn && <p className="text-xs text-muted-foreground mt-2">MediaPipe yuklanmoqda...</p>}
              </div>
            )}
            {isExercising && (
              <div className="absolute top-4 left-4 right-4 flex items-center gap-3">
                <div className="glass-card rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{currentRep}/{selectedExercise.reps}</span>
                  <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                    <motion.div className="h-full gradient-accent rounded-full" animate={{ width: `${(currentRep / selectedExercise.reps) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={cameraOn ? stopCamera : startCamera}
              className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm ${
                cameraOn ? "bg-destructive text-destructive-foreground" : "gradient-primary text-primary-foreground shadow-glow"
              }`}>
              {cameraOn ? <><CameraOff size={18} /> Kamerani o'chirish</> : <><Camera size={18} /> Kamerani yoqish</>}
            </button>
            {cameraOn && (
              <button
                onClick={() => {
                  if (!isExercising) { setCurrentRep(0); repStateRef.current = "down"; feedbackLogRef.current = []; startTimeRef.current = Date.now(); }
                  setIsExercising(!isExercising);
                }}
                className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm bg-accent text-accent-foreground">
                {isExercising ? <><Pause size={18} /> To'xtatish</> : <><Play size={18} /> Mashqni Boshlash</>}
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div key={feedback.message} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className={`rounded-xl p-4 flex items-center gap-3 ${
                  feedback.type === "success" ? "bg-medical-green-light" : feedback.type === "warning" ? "bg-medical-orange-light" : "bg-medical-red-light"
                }`}>
                {feedback.type === "success" ? <CheckCircle2 size={20} className="text-medical-green" /> :
                 feedback.type === "warning" ? <AlertTriangle size={20} className="text-medical-orange" /> :
                 <XCircle size={20} className="text-medical-red" />}
                <span className="text-sm font-medium text-foreground">{feedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

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
