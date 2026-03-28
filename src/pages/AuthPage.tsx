import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Loader2, ArrowRight, Stethoscope, UserCheck, HeartPulse } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface AuthPageProps {
  onAuth: (mode: "login" | "signup", email: string, password: string, fullName?: string, role?: string) => Promise<{ error: Error | null }>;
}

const AuthPage = ({ onAuth }: AuthPageProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"doctor" | "user" | "patient">("doctor");
  const [doctors, setDoctors] = useState<{ user_id: string; full_name: string | null }[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const result = await onAuth(mode, email, password, fullName, role);
    if (result.error) {
      setError(result.error.message);
    } else if (mode === "signup") {
      setSuccess("Ro'yxatdan o'tdingiz! Email manzilingizni tasdiqlang.");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message);
    }
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="Medi AI" className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover" />
          <h1 className="text-3xl font-display font-bold text-foreground">Medi AI</h1>
          <p className="text-muted-foreground mt-1">Intelligent Healthcare Platform</p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-elevated border border-border">
          <div className="flex mb-6 bg-secondary rounded-xl p-1">
            <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "login" ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
              Kirish
            </button>
            <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "signup" ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
              Ro'yxatdan o'tish
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
            Google orqali kirish
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">yoki</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><User size={16} /> To'liq ism</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Alisher Karimov" required
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Rolni tanlang</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole("doctor")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        role === "doctor" ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/30"
                      }`}>
                      <Stethoscope size={24} className={role === "doctor" ? "text-primary" : "text-muted-foreground"} />
                      <span className={`text-sm font-semibold ${role === "doctor" ? "text-primary" : "text-muted-foreground"}`}>Doktor</span>
                    </button>
                    <button type="button" onClick={() => setRole("user")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        role === "user" ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/30"
                      }`}>
                      <UserCheck size={24} className={role === "user" ? "text-primary" : "text-muted-foreground"} />
                      <span className={`text-sm font-semibold ${role === "user" ? "text-primary" : "text-muted-foreground"}`}>Foydalanuvchi</span>
                    </button>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Mail size={16} /> Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@example.com" required
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2"><Lock size={16} /> Parol</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>}
            {success && <div className="bg-medical-green-light text-medical-green text-sm p-3 rounded-xl">{success}</div>}

            <button type="submit" disabled={loading}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-glow">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>{mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}<ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
