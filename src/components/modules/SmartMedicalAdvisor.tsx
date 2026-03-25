import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, Pill, Stethoscope, TestTube, Loader2, User } from "lucide-react";
import MedicalDisclaimer from "../shared/MedicalDisclaimer";

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

const SmartMedicalAdvisor = () => {
  const [data, setData] = useState<PatientData>({ complaint: "", bloodResults: "", mriSummary: "", age: "", gender: "" });
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);

  const handleSubmit = async () => {
    if (!data.complaint) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 3500));
    setDiagnosis({
      condition: "Lumbar Disk Herniation (L4-L5)",
      confidence: 87,
      description: "Bemor shikoyatlari, MRT natijalari va klinik ko'rsatkichlar asosida bel umurtqa diskining chiqishi (herniya) aniqlandi. L4-L5 darajasida dorsolateral herniya nerve ildiziga bosim ko'rsatmoqda.",
      medications: [
        { name: "Ibuprofen", dose: "400mg", frequency: "Kuniga 2 marta", duration: "7 kun" },
        { name: "Mydocalm", dose: "150mg", frequency: "Kuniga 3 marta", duration: "14 kun" },
        { name: "Milgamma", dose: "1 ampula", frequency: "Kuniga 1 marta", duration: "10 kun" },
      ],
      lifestyle: [
        "Og'ir yuk ko'tarmaslik (5 kg dan ortiq)",
        "Har 45 daqiqada o'rnidan turib harakatlanish",
        "Maxsus ortopedik to'shak ishlatish",
        "Suzish va yurish mashqlari",
      ],
    });
    setLoading(false);
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
        {/* Input Form */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Yosh</label>
                <input
                  type="number"
                  value={data.age}
                  onChange={(e) => setData({ ...data, age: e.target.value })}
                  placeholder="45"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Jins</label>
                <select
                  value={data.gender}
                  onChange={(e) => setData({ ...data, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Tanlang</option>
                  <option value="male">Erkak</option>
                  <option value="female">Ayol</option>
                </select>
              </div>
            </div>

            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  {f.icon} {f.label}
                </label>
                {f.multiline ? (
                  <textarea
                    value={data[f.key]}
                    onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                ) : (
                  <input
                    value={data[f.key]}
                    onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={loading || !data.complaint}
              className="w-full gradient-accent text-accent-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  AI Tahlil qilmoqda...
                </>
              ) : (
                <>
                  <Brain size={20} />
                  Tashxis va Tavsiya Olish
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {diagnosis && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-foreground">{diagnosis.condition}</h3>
                    <span className="medical-badge bg-medical-teal-light text-medical-teal">
                      {diagnosis.confidence}% ishonch
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{diagnosis.description}</p>
                </div>

                {/* Medications */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <Pill size={16} className="text-medical-purple" />
                    Dori vositalari
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

                {/* Lifestyle */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Hayot tarzi tavsiyalari:</h4>
                  <div className="space-y-2">
                    {diagnosis.lifestyle.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <span className="w-5 h-5 rounded-full bg-medical-green-light text-medical-green flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
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
