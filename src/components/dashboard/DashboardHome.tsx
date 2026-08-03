import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileImage, Brain, Dumbbell, Activity, TrendingUp, Users, Clock, ArrowRight, Stethoscope, MessageCircle, HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardCharts from "./DashboardCharts";
import { format } from "date-fns";

interface DashboardHomeProps {
  onNavigate: (tab: any) => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DashboardHome = ({ onNavigate }: DashboardHomeProps) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>("user");
  const [stats, setStats] = useState([
    { label: "Tahlillar", value: "—", icon: <Activity size={20} />, color: "bg-medical-teal-light text-medical-teal" },
    { label: "Tashxislar", value: "—", icon: <TrendingUp size={20} />, color: "bg-medical-green-light text-medical-green" },
    { label: "Bemorlar", value: "—", icon: <Users size={20} />, color: "bg-medical-blue-light text-medical-blue" },
    { label: "Reab. seanslar", value: "—", icon: <Clock size={20} />, color: "bg-medical-purple-light text-medical-purple" },
  ]);

  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const checkRole = async () => {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as any });
      if (isAdmin) { setUserRole("admin"); return; }
      const { data: isDoctor } = await supabase.rpc("has_role", { _user_id: user.id, _role: "doctor" as any });
      if (isDoctor) { setUserRole("doctor"); return; }
      const { data: isPatient } = await supabase.rpc("has_role", { _user_id: user.id, _role: "patient" as any });
      if (isPatient) { setUserRole("patient"); return; }
      setUserRole("user");
    };
    checkRole();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [scans, diagnoses, patients, rehabs, lastScans, lastDiag] = await Promise.all([
        supabase.from("scan_analyses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("diagnoses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("rehab_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("scan_analyses").select("id, scan_type, severity, created_at, recommendation").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("diagnoses").select("id, condition_name, confidence, created_at, description").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setStats((s) => s.map((st, i) => ({
        ...st,
        value: String([scans, diagnoses, patients, rehabs][i].count ?? 0),
      })));
      setRecentScans(lastScans.data || []);
      setRecentDiagnoses(lastDiag.data || []);
    };
    load();
  }, [user]);

  const greeting = userRole === "doctor" || userRole === "admin" ? "Xush kelibsiz, Doktor" : "Xush kelibsiz";

  // Role-specific modules
  const getModules = () => {
    if (userRole === "admin") {
      return [
        { id: "radiologist", title: "AI Radiologist", description: "MRT va Rentgen tasvirlarini AI yordamida tahlil qiling", icon: <FileImage size={28} />, gradient: "gradient-primary" },
        { id: "advisor", title: "AI Assistant", description: "AI tashxis va dori tavsiyalari", icon: <Brain size={28} />, gradient: "gradient-accent" },
        { id: "patients", title: "Bemorlar", description: "Bemorlar ro'yxati va tarix", icon: <Users size={28} />, gradient: "gradient-primary" },
      ];
    }
    if (userRole === "doctor") {
      return [
        { id: "radiologist", title: "AI Radiologist", description: "MRT va Rentgen tasvirlarini tahlil qiling", icon: <FileImage size={28} />, gradient: "gradient-primary" },
        { id: "advisor", title: "AI Assistant", description: "AI tashxis va dori tavsiyalari", icon: <Brain size={28} />, gradient: "gradient-accent" },
        { id: "patients", title: "Bemorlar", description: "Bemorlaringiz ro'yxati", icon: <Users size={28} />, gradient: "gradient-primary" },
      ];
    }
    // user / patient
    return [
      { id: "advisor", title: "AI Assistant", description: "AI tashxis va maslahat oling", icon: <Brain size={28} />, gradient: "gradient-accent" },
      { id: "doctors", title: "Shifokorlar", description: "Shifokor tanlang va bog'laning", icon: <Stethoscope size={28} />, gradient: "gradient-primary" },
      { id: "chat", title: "Chat", description: "Shifokoringiz bilan yozishing", icon: <MessageCircle size={28} />, gradient: "gradient-warm" },
    ];
  };

  const modules = getModules();

  // Role-specific stats
  const displayStats = (userRole === "user" || userRole === "patient") 
    ? stats.filter(s => s.label !== "Bemorlar" && s.label !== "Reab. seanslar")
    : stats;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h2 className="text-3xl font-display font-bold text-foreground">{greeting}</h2>
        <p className="text-muted-foreground mt-1">Medi AI diagnostika platformasi</p>
      </motion.div>

      <motion.div variants={item} className={`grid grid-cols-2 ${displayStats.length > 2 ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-4`}>
        {displayStats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card border border-border">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <DashboardCharts />
      </motion.div>

      {/* Recent analyses */}
      <motion.div variants={item} className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2"><FileImage size={18} className="text-primary" /> So'nggi skanlar</h3>
            <button onClick={() => onNavigate("radiologist")} className="text-xs text-primary hover:underline flex items-center gap-1">Barchasi <ArrowRight size={12} /></button>
          </div>
          {recentScans.length === 0 ? <p className="text-sm text-muted-foreground">Hali skan mavjud emas</p> : (
            <div className="space-y-3">
              {recentScans.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className={`w-2 h-2 rounded-full ${s.severity === "critical" ? "bg-destructive" : s.severity === "moderate" ? "bg-yellow-500" : "bg-medical-green"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.scan_type?.toUpperCase() || "Skan"} — {s.severity || "normal"}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(s.created_at), "dd.MM.yyyy HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2"><Brain size={18} className="text-accent" /> So'nggi tashxislar</h3>
            <button onClick={() => onNavigate("advisor")} className="text-xs text-primary hover:underline flex items-center gap-1">Barchasi <ArrowRight size={12} /></button>
          </div>
          {recentDiagnoses.length === 0 ? <p className="text-sm text-muted-foreground">Hali tashxis mavjud emas</p> : (
            <div className="space-y-3">
              {recentDiagnoses.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className={`w-2 h-2 rounded-full ${(d.confidence || 0) > 80 ? "bg-medical-green" : "bg-yellow-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.condition_name || "Noma'lum"} — {d.confidence ? `${d.confidence}%` : ""}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(d.created_at), "dd.MM.yyyy HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={item} className={`grid md:grid-cols-2 ${modules.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-6`}>
        {modules.map((m) => (
          <motion.button key={m.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} onClick={() => onNavigate(m.id)}
            className="bg-card rounded-2xl p-6 shadow-card border border-border text-left hover:shadow-elevated transition-shadow group">
            <div className={`w-14 h-14 rounded-2xl ${m.gradient} flex items-center justify-center mb-4 text-primary-foreground group-hover:scale-110 transition-transform`}>{m.icon}</div>
            <h3 className="text-lg font-display font-bold text-foreground mb-2">{m.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default DashboardHome;
