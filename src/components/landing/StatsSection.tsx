import { Users, FileImage, Brain, Dumbbell } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AnimatedCounter from "./AnimatedCounter";

const StatsSection = () => {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState({ users: 0, scans: 0, diagnoses: 0, rehab: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [u, s, d, r] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("scan_analyses").select("id", { count: "exact", head: true }),
        supabase.from("diagnoses").select("id", { count: "exact", head: true }),
        supabase.from("rehab_sessions").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        users: u.count || 0,
        scans: s.count || 0,
        diagnoses: d.count || 0,
        rehab: r.count || 0,
      });
    };
    fetchStats();
  }, []);

  const labels = {
    uz: { users: "Foydalanuvchilar", scans: "Tahlillar", diagnoses: "Tashxislar", rehab: "Reab. seanslar" },
    ru: { users: "Пользователи", scans: "Анализы", diagnoses: "Диагнозы", rehab: "Реаб. сеансы" },
    en: { users: "Users", scans: "Analyses", diagnoses: "Diagnoses", rehab: "Rehab Sessions" },
  };

  const l = labels[lang];

  return (
    <section className="py-10 sm:py-16 px-4 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="bg-card/60 backdrop-blur-xl rounded-3xl border border-border/50 shadow-elevated p-2.5 sm:p-4 md:p-5 sm:p-8">
          <div className="grid grid-cols-4 md:grid-cols-4 gap-1 sm:gap-4 md:gap-0 md:divide-x divide-border">
            <AnimatedCounter end={stats.users > 0 ? stats.users : 150} suffix="+" icon={<Users size={24} />} label={l.users} />
            <AnimatedCounter end={stats.scans > 0 ? stats.scans : 1200} suffix="+" icon={<FileImage size={24} />} label={l.scans} />
            <AnimatedCounter end={stats.diagnoses > 0 ? stats.diagnoses : 800} suffix="+" icon={<Brain size={24} />} label={l.diagnoses} />
            <AnimatedCounter end={stats.rehab > 0 ? stats.rehab : 350} suffix="+" icon={<Dumbbell size={24} />} label={l.rehab} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
