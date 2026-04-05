import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Loader2, ArrowRight, Stethoscope, UserCheck, HeartPulse, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import logo from "@/assets/logo.png";

interface AuthPageProps {
  onAuth: (mode: "login" | "signup", email: string, password: string, fullName?: string, role?: string, extra?: Record<string, string>) => Promise<{ error: Error | null }>;
  onBack?: () => void;
}

const SPECIALTIES = [
  "general", "cardiology", "neurology", "orthopedics", "pediatrics", "radiology", "surgery", "dermatology", "other"
];

const AuthPage = ({ onAuth, onBack }: AuthPageProps) => {
  const { t, lang, setLang } = useLanguage();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"doctor" | "user" | "patient">("doctor");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [doctors, setDoctors] = useState<{ user_id: string; full_name: string | null }[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (mode === "signup" && (role === "patient" || role === "user")) {
      supabase.from("profiles").select("user_id, full_name").eq("role", "doctor")
        .then(({ data }) => setDoctors(data || []));
    }
  }, [mode, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (mode === "signup" && role === "patient" && !selectedDoctor) {
      setError(t("auth.selectDoctorError"));
      return;
    }
    setLoading(true);
    const extra: Record<string, string> = {};
    if (age) extra.age = age;
    if (gender) extra.gender = gender;
    if (role === "doctor" && specialty) extra.specialty = specialty;
    
    // If user selects a doctor, treat them also as patient
    const finalRole = (role === "user" && selectedDoctor) ? "patient" : role;
    
    const result = await onAuth(mode, email, password, fullName, finalRole, extra);
    if (result.error) {
      setError(result.error.message);
    } else if (mode === "signup") {
      if ((role === "patient" || (role === "user" && selectedDoctor)) && selectedDoctor) {
        localStorage.setItem("pending_doctor_id", selectedDoctor);
      }
      setSuccess(t("auth.success"));
    }
    setLoading(false);
  };



  const showDoctorList = mode === "signup" && (role === "patient" || role === "user");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Language switcher + Back */}
        <div className="flex items-center justify-between mb-4">
          {onBack ? (
            <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} />
              {t("landing.login") === "Kirish" ? "Orqaga" : t("landing.login") === "Войти" ? "Назад" : "Back"}
            </button>
          ) : <div />}
          <LanguageSwitcher compact />
        </div>

        <div className="text-center mb-8">
          <img src={logo} alt="Medi AI" className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover" />
          <h1 className="text-3xl font-display font-bold text-foreground">Medi AI</h1>
          <p className="text-muted-foreground mt-1">Intelligent Healthcare Platform</p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-elevated border border-border">
          <div className="flex mb-6 bg-secondary rounded-xl p-1">
            <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "login" ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {t("auth.login")}
            </button>
            <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "signup" ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {t("auth.signup")}
            </button>
          </div>



          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><User size={16} /> {t("auth.fullName")}</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>

                {/* Age + Gender */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.age")}</label>
                    <input type="number" min="1" max="150" value={age} onChange={e => setAge(e.target.value)} required
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.gender")}</label>
                    <select value={gender} onChange={e => setGender(e.target.value)} required
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">—</option>
                      <option value="male">{t("auth.male")}</option>
                      <option value="female">{t("auth.female")}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t("auth.selectRole")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => { setRole("doctor"); setSelectedDoctor(""); }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${role === "doctor" ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/30"}`}>
                      <Stethoscope size={22} className={role === "doctor" ? "text-primary" : "text-muted-foreground"} />
                      <span className={`text-xs font-semibold ${role === "doctor" ? "text-primary" : "text-muted-foreground"}`}>{t("auth.doctor")}</span>
                    </button>
                    <button type="button" onClick={() => setRole("user")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${role === "user" ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/30"}`}>
                      <UserCheck size={22} className={role === "user" ? "text-primary" : "text-muted-foreground"} />
                      <span className={`text-xs font-semibold ${role === "user" ? "text-primary" : "text-muted-foreground"}`}>{t("auth.user")}</span>
                    </button>
                    <button type="button" onClick={() => setRole("patient")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${role === "patient" ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/30"}`}>
                      <HeartPulse size={22} className={role === "patient" ? "text-primary" : "text-muted-foreground"} />
                      <span className={`text-xs font-semibold ${role === "patient" ? "text-primary" : "text-muted-foreground"}`}>{t("auth.patient")}</span>
                    </button>
                  </div>
                </div>

                {/* Doctor specialty */}
                {role === "doctor" && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.specialty")}</label>
                    <select value={specialty} onChange={e => setSpecialty(e.target.value)} required
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">—</option>
                      {SPECIALTIES.map(s => <option key={s} value={s}>{t(`auth.specialties.${s}`)}</option>)}
                    </select>
                  </div>
                )}

                {/* Doctor selection for patient/user */}
                {showDoctorList && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t("auth.selectDoctor")} {role === "user" && <span className="text-muted-foreground text-xs">({t("auth.patient")})</span>}
                    </label>
                    {doctors.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("auth.noDoctors")}</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {doctors.map(d => (
                          <button key={d.user_id} type="button" onClick={() => setSelectedDoctor(d.user_id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${selectedDoctor === d.user_id ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/30"}`}>
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Stethoscope size={16} className="text-primary" />
                            </div>
                            <span className={`text-sm font-medium ${selectedDoctor === d.user_id ? "text-primary" : "text-foreground"}`}>
                              {d.full_name || t("general.doctor")}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Mail size={16} /> {t("auth.email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@example.com" required
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Lock size={16} /> {t("auth.password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>}
            {success && <div className="bg-medical-green-light text-medical-green text-sm p-3 rounded-xl">{success}</div>}

            <button type="submit" disabled={loading}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-glow">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>{mode === "login" ? t("auth.login") : t("auth.signup")}<ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
