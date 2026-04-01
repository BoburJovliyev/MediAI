import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Loader2, ArrowRight, Stethoscope, UserCheck, HeartPulse } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import logo from "@/assets/logo.png";

interface AuthPageProps {
  onAuth: (mode: "login" | "signup", email: string, password: string, fullName?: string, role?: string, extra?: Record<string, string>) => Promise<{ error: Error | null }>;
}

const SPECIALTIES = [
  "general", "cardiology", "neurology", "orthopedics", "pediatrics", "radiology", "surgery", "dermatology", "other"
];

const AuthPage = ({ onAuth }: AuthPageProps) => {
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
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(result.error.message);
    setGoogleLoading(false);
  };

  const showDoctorList = mode === "signup" && (role === "patient" || role === "user");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Language switcher */}
        <div className="flex justify-center gap-2 mb-4">
          {(["uz", "ru", "en"] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${lang === l ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {l === "uz" ? "O'zbek" : l === "ru" ? "Русский" : "English"}
            </button>
          ))}
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

          {/* Google Sign In */}
          <button onClick={handleGoogleSignIn} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-foreground text-sm font-medium mb-4 disabled:opacity-60">
            {googleLoading ? <Loader2 size={18} className="animate-spin" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {t("auth.google")}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
            <div className="flex-1 h-px bg-border" />
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
