import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, CameraOff, CircleDot, UtensilsCrossed, Loader2, Flame, Sparkles,
  AlertTriangle, CheckCircle2, Trash2, HeartPulse,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import MedicalDisclaimer from "../shared/MedicalDisclaimer";
import NutritionSafety, { buildSafetyNotes, AGE_GROUPS, CONDITIONS, type SafetyProfile } from "./NutritionSafety";
import { MacroBreakdown, FoodTrend } from "./FoodInsights";
import MealPlan from "./MealPlan";

interface FoodItem { name: string; portion: string; calories: number }

export interface FoodResult {
  dish_name: string;
  items: FoodItem[];
  total_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  health_score: number;
  status: "norm" | "high" | "low";
  daily_percent: number;
  verdict: string;
  recommendations: string[];
  warnings: string[];
}

const statusConfig: Record<FoodResult["status"], { label: string; color: string }> = {
  norm: { label: "Me'yorda", color: "bg-medical-green-light text-medical-green" },
  high: { label: "Me'yordan yuqori", color: "bg-medical-red-light text-medical-red" },
  low: { label: "Me'yordan past", color: "bg-medical-blue-light text-medical-blue" },
};

const MEALS = [
  { id: "nonushta", label: "Nonushta" },
  { id: "tushlik", label: "Tushlik" },
  { id: "kechki", label: "Kechki ovqat" },
  { id: "gazak", label: "Gazak" },
] as const;

const Macro = ({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) => (
  <div className="bg-secondary rounded-xl p-3 text-center">
    <p className={`text-lg font-bold ${color}`}>{Math.round(value)}{unit}</p>
    <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
  </div>
);

const FoodCalorieAI = ({ scanResult }: { scanResult?: unknown }) => {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [meal, setMeal] = useState<string>("tushlik");
  const [note, setNote] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [safety, setSafety] = useState<SafetyProfile>({ ageGroup: "katta", conditions: [] });
  const [historyKey, setHistoryKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const safetyNotes = useMemo(() => buildSafetyNotes(safety, result), [safety, result]);

  const toggleCondition = (id: string) =>
    setSafety((s) => ({
      ...s,
      conditions: s.conditions.includes(id) ? s.conditions.filter((c) => c !== id) : [...s.conditions, id],
    }));


  const readFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm fayllari qabul qilinadi");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Rasm hajmi 10MB dan oshmasligi kerak");
      return;
    }
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setImage(null);
      setResult(null);
    } catch {
      toast.error("Kameraga ruxsat berilmadi yoki kamera topilmadi");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
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
    setImage(canvas.toDataURL("image/jpeg", 0.9));
    setFileName("kamera-rasm.jpg");
    setResult(null);
    stopCamera();
  }, [stopCamera]);

  const analyze = useCallback(async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { imageBase64: image, mealType: meal, note, safety },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const r = data as FoodResult;
      setResult(r);

      if (user) {
        const { error: logErr } = await (supabase.from("food_logs" as any) as any).insert({
          user_id: user.id,
          dish_name: r.dish_name ?? "",
          meal_type: meal,
          total_calories: r.total_calories ?? 0,
          protein_g: r.protein_g ?? 0,
          fat_g: r.fat_g ?? 0,
          carbs_g: r.carbs_g ?? 0,
          fiber_g: r.fiber_g ?? 0,
          sugar_g: r.sugar_g ?? 0,
          sodium_mg: r.sodium_mg ?? 0,
          health_score: r.health_score ?? 0,
          status: r.status ?? "norm",
          daily_percent: r.daily_percent ?? 0,
          verdict: r.verdict ?? "",
        });
        if (!logErr) setHistoryKey((k) => k + 1);
      }

      toast.success("Ovqat tahlili tayyor!");
    } catch (err: any) {
      toast.error(err.message || "Tahlilda xatolik yuz berdi");
    } finally {
      setAnalyzing(false);
    }
  }, [image, meal, note, safety, user]);


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl gradient-warm flex items-center justify-center text-white">
          <UtensilsCrossed size={22} />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-foreground">Kunlik Ratsion AI</h3>
          <p className="text-sm text-muted-foreground">Ovqat rasmini yuklang — AI kaloriya va me'yorni aniqlaydi</p>
        </div>
      </div>

      {/* Safety profile */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <HeartPulse size={16} className="text-medical-red" /> Salomatlik profili (tavsiyalar shunga moslashadi)
        </p>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((a) => (
            <button
              key={a.id}
              onClick={() => setSafety((s) => ({ ...s, ageGroup: a.id }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                safety.ageGroup === a.id ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleCondition(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                safety.conditions.includes(c.id)
                  ? "bg-medical-red-light text-medical-red border-medical-red/30"
                  : "bg-secondary text-muted-foreground border-transparent"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: upload */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {MEALS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMeal(m.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  meal === m.id
                    ? "gradient-primary text-primary-foreground shadow-glow"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              cameraActive
                ? "bg-medical-red-light text-medical-red border border-medical-red/30"
                : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
            }`}
          >
            {cameraActive ? <><CameraOff size={20} /> Kamerani o'chirish</> : <><Camera size={20} /> Kamera bilan olish</>}
          </button>

          {cameraActive ? (
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full min-h-[280px] bg-black object-cover" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white/90 border-4 border-primary flex items-center justify-center shadow-lg"
                  aria-label="Rasmga olish"
                >
                  <CircleDot size={32} className="text-primary" />
                </motion.button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) readFile(f); }}
              className="bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors"
            >
              {image ? (
                <div className="space-y-4">
                  <img src={image} alt="Ovqat rasmi" className="max-h-64 mx-auto rounded-xl object-contain" />
                  <p className="text-sm text-muted-foreground">{fileName}</p>
                  <button
                    onClick={() => { setImage(null); setFileName(""); setResult(null); }}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Boshqa rasm yuklash
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="w-16 h-16 rounded-2xl bg-medical-orange-light mx-auto flex items-center justify-center mb-4">
                    <Camera size={28} className="text-medical-orange" />
                  </div>
                  <p className="font-medium text-foreground mb-1">Ovqat rasmini yuklang</p>
                  <p className="text-sm text-muted-foreground">JPG, PNG — maks. 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
                  />
                </label>
              )}
            </div>
          )}

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Izoh (ixtiyoriy): masalan, 1 kosa mastava"
            maxLength={200}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />

          {image && !cameraActive && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={analyze}
              disabled={analyzing}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-glow"
            >
              {analyzing ? <><Loader2 size={20} className="animate-spin" /> AI hisoblamoqda...</> : <><Sparkles size={20} /> Kaloriyani hisoblash</>}
            </motion.button>
          )}
        </div>

        {/* RIGHT: result */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="res"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display font-bold text-foreground">{result.dish_name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{MEALS.find((m) => m.id === meal)?.label}</p>
                  </div>
                  <span className={`medical-badge ${statusConfig[result.status]?.color ?? statusConfig.norm.color}`}>
                    {statusConfig[result.status]?.label ?? "Me'yorda"}
                  </span>
                </div>

                <div className="rounded-2xl gradient-warm text-white p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-80">Umumiy kaloriya</p>
                    <p className="text-3xl font-bold">{Math.round(result.total_calories)} <span className="text-base font-medium">kkal</span></p>
                  </div>
                  <div className="text-right">
                    <Flame size={28} className="ml-auto" />
                    <p className="text-xs opacity-90 mt-1">Kunlik me'yorning {Math.round(result.daily_percent)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Macro label="Oqsil" value={result.protein_g} unit=" g" color="text-medical-blue" />
                  <Macro label="Yog'" value={result.fat_g} unit=" g" color="text-medical-orange" />
                  <Macro label="Uglevod" value={result.carbs_g} unit=" g" color="text-medical-teal" />
                  <Macro label="Tolalar" value={result.fiber_g} unit=" g" color="text-medical-green" />
                  <Macro label="Shakar" value={result.sugar_g} unit=" g" color="text-medical-red" />
                  <Macro label="Natriy" value={result.sodium_mg} unit=" mg" color="text-foreground" />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Foydalilik bahosi</span>
                    <span className="font-semibold text-foreground">{Math.round(result.health_score)}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, result.health_score))}%` }}
                      className="h-full gradient-primary rounded-full"
                    />
                  </div>
                </div>

                {result.items?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-foreground">Aniqlangan mahsulotlar</h5>
                    {result.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-secondary rounded-xl px-3 py-2">
                        <span className="text-foreground/80">{it.name} <span className="text-muted-foreground">· {it.portion}</span></span>
                        <span className="font-semibold text-foreground">{Math.round(it.calories)} kkal</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-secondary rounded-xl p-4 text-sm text-muted-foreground">{result.verdict}</div>

                {result.recommendations?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-foreground">Tavsiyalar</h5>
                    {result.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={16} className="text-medical-green shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{r}</span>
                      </div>
                    ))}
                  </div>
                )}

                {result.warnings?.length > 0 && (
                  <div className="space-y-2">
                    {result.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-medical-red-light/40 rounded-xl p-3">
                        <AlertTriangle size={16} className="text-medical-red shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <MacroBreakdown result={result} />
              <NutritionSafety notes={safetyNotes} />
              <MedicalDisclaimer type="nutrition" />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center text-center p-10 min-h-[320px]"
            >
              <UtensilsCrossed size={40} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Natijani ko'rish uchun rasm yuklang</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History + plan */}
      <div className="grid lg:grid-cols-2 gap-6">
        <FoodTrend refreshKey={historyKey} />
        <MealPlan food={result} scan={scanResult} profile={safety} />
      </div>
    </div>
  );
};

export default FoodCalorieAI;
