import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Pill, Stethoscope, TestTube, Loader2, User } from "lucide-react";
import MedicalDisclaimer from "../shared/MedicalDisclaimer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PatientData {
  complaint: string;
  bloodResults: string;
  mriSummary: string;
  age: string;
  gender: string;
}

interface Diagnosis {
  condition: string;
  confidence: number;
  description: string;
  medications: { name: string; dose: string; frequency: string; duration: string }[];
  lifestyle: string[];
}

const DAILY_LIMIT = 5;

const SmartMedicalAdvisor = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PatientData>({ complaint: "", bloodResults: "", mriSummary: "", age: "", gender: "" });
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [dailyCount, setDailyCount] = useState(0);

  // Check daily usage on mount
  useState(() => {
    if (!user) return;
    supabase.from("profiles").select("daily_ai_count, daily_ai_date").eq("user_id", user.id).single()
      .then(({ data: p }) => {
        if (p) {
          const today = new Date().toISOString().split("T")[0];
          if (p.daily_ai_date === today) {
            setDailyCount(p.daily_ai_count || 0);
          } else {
            setDailyCount(0);
          }
        }
      });
  });

  const handleSubmit = async () => {
    if (!data.complaint) return;
    if (dailyCount >= DAILY_LIMIT) {
      toast.error("Kunlik AI so'rovlar limiti tugadi (5/5). Ertaga qayta urinib ko'ring!");
      return;
    }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("diagnose", {
        body: { ...data },
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      const d: Diagnosis = {
        condition: result.condition || "Noma'lum",
        confidence: result.confidence || 0,
        description: result.description || "",
        medications: result.medications || [],
        lifestyle: result.lifestyle || [],
      };
      setDiagnosis(d);

      // Save to database
      if (user) {
        await supabase.from("diagnoses").insert({
          user_id: user.id,
          complaint: data.complaint,
          blood_results: data.bloodResults,
          mri_summary: data.mriSummary,
          condition_name: d.condition,
          confidence: d.confidence,
          description: d.description,
          medications: d.medications as any,
          lifestyle_tips: d.lifestyle as any,
          ai_model: "gemini-2.5-flash",
        });
      }

      // Update daily count
      const today = new Date().toISOString().split("T")[0];
      const newCount = dailyCount + 1;
      setDailyCount(newCount);
      await supabase.from("profiles").update({
        daily_ai_count: newCount,
        daily_ai_date: today,
      } as any).eq("user_id", user!.id);

      toast.success("Tashxis muvaffaqiyatli yakunlandi!");
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      toast.error(err.message || "Tashxisda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fields: { key: keyof PatientData; label: string; icon: React.ReactNode; placeholder: string; multiline?: boolean }[] = [
    { key: "complaint", label: "Bemor shikoyati", icon: <User size={18} />, placeholder: "Masalan: Bel og'rig'i, oyoqqa tarqaladi...", multiline: true },
    { key: "bloodResults", label: "Qon tahlili natijalari", icon: <TestTube size={18} />, placeholder: "Masalan: Gemoglobin 130, Leykositlar 8.2..." },
    { key: "mriSummary", label: "MRT/Rentgen xulosasi", icon: <Stethoscope size={18} />, placeholder: "Masalan: L4-L5 darajasida disk protruziyasi..." },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Smart Medical Advisor</h2>
        <p className="text-muted-foreground mt-1">Barcha natijalarni birlashtirgan AI tashxis tizimi</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Yosh</label>
                <input type="number" value={data.age} onChange={(e) => setData({ ...data, age: e.target.value })} placeholder="45"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Jins</label>
                <select value={data.gender} onChange={(e) => setData({ ...data, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Tanlang</option>
                  <option value="male">Erkak</option>
                  <option value="female">Ayol</option>
                </select>
              </div>
            </div>

            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">{f.icon} {f.label}</label>
                {f.multiline ? (
                  <textarea value={data[f.key]} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} placeholder={f.placeholder} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                ) : (
                  <input value={data[f.key]} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                )}
              </div>
            ))}

            <button onClick={handleSubmit} disabled={loading || !data.complaint}
              className="w-full gradient-accent text-accent-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><Loader2 size={20} className="animate-spin" /> AI Tahlil qilmoqda...</> : <><Brain size={20} /> Tashxis va Tavsiya Olish</>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {diagnosis && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-foreground">{diagnosis.condition}</h3>
                    <span className="medical-badge bg-medical-teal-light text-medical-teal">{diagnosis.confidence}% ishonch</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{diagnosis.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <Pill size={16} className="text-medical-purple" /> Dori vositalari
                  </h4>
                  <div className="space-y-2">
                    {diagnosis.medications.map((med, i) => (
                      <div key={i} className="bg-medical-purple-light rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-foreground">{med.name}</p>
                          <p className="text-xs text-muted-foreground">{med.frequency} • {med.duration}</p>
                        </div>
                        <span className="medical-badge bg-card text-medical-purple">{med.dose}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Hayot tarzi tavsiyalari:</h4>
                  <div className="space-y-2">
                    {diagnosis.lifestyle.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <span className="w-5 h-5 rounded-full bg-medical-green-light text-medical-green flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <MedicalDisclaimer type="medication" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SmartMedicalAdvisor;
