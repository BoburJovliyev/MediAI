import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle, Camera, CameraOff, CircleDot, Stethoscope, UtensilsCrossed } from "lucide-react";
import MedicalDisclaimer from "../shared/MedicalDisclaimer";
import FoodCalorieAI from "./FoodCalorieAI";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import sampleXray from "@/assets/sample-xray.jpg";
import sampleUzi from "@/assets/sample-uzi.jpg";
import sampleMrt from "@/assets/sample-mrt.jpg";

type Mode = "scan" | "food";

const ModeSwitch = ({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) => (
  <div className="inline-flex bg-card border border-border rounded-2xl p-1 gap-1">
    <button
      onClick={() => setMode("scan")}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        mode === "scan" ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <FileImage size={16} /> Tibbiy tasvir
    </button>
    <button
      onClick={() => setMode("food")}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        mode === "food" ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <UtensilsCrossed size={16} /> Kunlik Ratsion AI
    </button>
  </div>
);


interface AnalysisResult {
  findings: string[];
  severity: "normal" | "mild" | "moderate" | "severe";
  recommendation: string;
  regions: string[];
  recommended_doctor?: string;
}

const severityConfig = {
  normal: { label: "Normal", color: "bg-medical-green-light text-medical-green" },
  mild: { label: "Yengil", color: "bg-medical-blue-light text-medical-blue" },
  moderate: { label: "O'rtacha", color: "bg-medical-orange-light text-medical-orange" },
  severe: { label: "Jiddiy", color: "bg-medical-red-light text-medical-red" },
};

type ScanType = "xray" | "uzi" | "mrt";

const scanTypeLabels: Record<ScanType, string> = {
  xray: "Rentgen",
  uzi: "UZI (Ultratovush)",
  mrt: "MRT",
};

const sampleImages: Record<ScanType, { src: string; label: string; desc: string }> = {
  xray: { src: sampleXray, label: "Rentgen tasviri", desc: "Ko'krak qafasi rentgeni — o'pka va suyaklarni tekshirish" },
  uzi: { src: sampleUzi, label: "UZI tasviri", desc: "Ultratovush tekshiruvi — ichki a'zolarni vizualizatsiya qilish" },
  mrt: { src: sampleMrt, label: "MRT tasviri", desc: "Magnit-rezonans tomografiya — yumshoq to'qimalarni tahlil qilish" },
};

const AIRadiologist = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("scan");
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanType, setScanType] = useState<ScanType>("xray");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setImage(null);
      setResult(null);
      setFileName("");
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Kameraga ruxsat berilmadi yoki kamera topilmadi");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    setImage(dataUrl);
    setFileName("camera-capture.png");
    setResult(null);
    stopCamera();
    toast.success("Rasm muvaffaqiyatli olindi!");
  }, [stopCamera]);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-scan", {
        body: { imageBase64: image, scanType },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const analysisResult: AnalysisResult = {
        findings: data.findings || [],
        severity: data.severity || "normal",
        recommendation: data.recommendation || "",
        regions: data.regions || [],
        recommended_doctor: data.recommended_doctor,
      };
      setResult(analysisResult);

      if (user) {
        await supabase.from("scan_analyses").insert({
          user_id: user.id,
          scan_type: scanType,
          findings: data.findings,
          severity: data.severity,
          recommendation: data.recommendation,
          ai_model: "gemini-2.5-flash",
        });
      }

      toast.success("Tahlil muvaffaqiyatli yakunlandi!");
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Tahlilda xatolik yuz berdi");
    } finally {
      setAnalyzing(false);
    }
  }, [image, user, scanType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("image/") || file.name.endsWith(".dcm"))) {
      setFileName(file.name);
      setResult(null);
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  if (mode === "food") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">AI Radiologist</h2>
          <p className="text-muted-foreground mt-1">Tibbiy tasvirlar va ovqat ratsionini sun'iy intellekt bilan tahlil qiling</p>
        </div>
        <ModeSwitch mode={mode} setMode={setMode} />
        <FoodCalorieAI />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">AI Radiologist</h2>
        <p className="text-muted-foreground mt-1">Rentgen, UZI va MRT tasvirlarini sun'iy intellekt yordamida tahlil qiling</p>
      </div>

      <ModeSwitch mode={mode} setMode={setMode} />

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="space-y-4">
          {/* Scan type selector */}
          <div className="flex gap-2">
            {(["xray", "uzi", "mrt"] as ScanType[]).map((type) => (
              <button
                key={type}
                onClick={() => setScanType(type)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  scanType === type
                    ? "gradient-primary text-primary-foreground shadow-glow"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {scanTypeLabels[type]}
              </button>
            ))}
          </div>

          {/* Sample image preview for selected scan type */}
          <motion.div
            key={scanType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-center"
          >
            <img
              src={sampleImages[scanType].src}
              alt={sampleImages[scanType].label}
              className="w-20 h-20 rounded-xl object-cover"
              loading="lazy"
              width={80}
              height={80}
            />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground text-sm">{sampleImages[scanType].label}</h4>
              <p className="text-xs text-muted-foreground mt-1">{sampleImages[scanType].desc}</p>
            </div>
          </motion.div>

          {/* Camera / Upload toggle buttons */}
          <div className="flex gap-3">
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                cameraActive
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
              }`}
            >
              {cameraActive ? (
                <><CameraOff size={20} /> Kamerani o'chirish</>
              ) : (
                <><Camera size={20} /> Kamera bilan olish</>
              )}
            </button>
          </div>

          {/* Camera view */}
          {cameraActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-card border border-border rounded-2xl overflow-hidden"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full min-h-[280px] rounded-2xl bg-black object-cover"
              />
              {/* Capture button */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white/90 border-4 border-primary flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <CircleDot size={32} className="text-primary" />
                </motion.button>
              </div>
              {/* Overlay frame */}
              <div className="absolute inset-4 border-2 border-dashed border-white/30 rounded-xl pointer-events-none" />
            </motion.div>
          )}

          {/* Upload area (hidden when camera is active) */}
          {!cameraActive && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors"
            >
              {image ? (
                <div className="space-y-4">
                  <img src={image} alt="Uploaded scan" className="max-h-64 mx-auto rounded-xl object-contain" />
                  <p className="text-sm text-muted-foreground">{fileName}</p>
                  <button
                    onClick={() => { setImage(null); setFileName(""); setResult(null); }}
                    className="text-sm text-primary hover:underline"
                  >
                    Boshqa rasm yuklash
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="w-16 h-16 rounded-2xl bg-medical-teal-light mx-auto flex items-center justify-center mb-4">
                    <Upload size={28} className="text-medical-teal" />
                  </div>
                  <p className="font-medium text-foreground mb-1">Tasvirni yuklang</p>
                  <p className="text-sm text-muted-foreground">DICOM, JPG, PNG formatlarini qo'llab-quvvatlaydi</p>
                  <input type="file" accept="image/*,.dcm" onChange={handleUpload} className="hidden" />
                </label>
              )}
            </div>
          )}

          {image && !cameraActive && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-glow"
            >
              {analyzing ? (
                <><Loader2 size={20} className="animate-spin" /> AI Tahlil qilmoqda...</>
              ) : (
                <><FileImage size={20} /> AI Tahlilni Boshlash</>
              )}
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-foreground">Tahlil Natijalari</h3>
                  <span className={`medical-badge ${severityConfig[result.severity].color}`}>
                    {severityConfig[result.severity].label}
                  </span>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Topilmalar:</h4>
                  {result.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={16} className="text-medical-teal shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Tekshirilgan hududlar:</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.regions.map((r) => (
                      <span key={r} className="medical-badge bg-medical-blue-light text-medical-blue">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-secondary rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Tavsiya:</h4>
                      <p className="text-sm text-muted-foreground">{result.recommendation}</p>
                    </div>
                  </div>
                </div>
                {result.recommended_doctor && (
                  <div className="bg-medical-blue-light/50 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Stethoscope size={16} className="text-medical-blue md:mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">Qaysi doktorga ko'rinish kerak:</h4>
                        <p className="text-sm text-foreground/80">{result.recommended_doctor}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <MedicalDisclaimer type="diagnosis" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AIRadiologist;
