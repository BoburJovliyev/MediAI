import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const COLORS = [
  "hsl(195, 85%, 42%)",
  "hsl(165, 60%, 45%)",
  "hsl(220, 80%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(25, 90%, 55%)",
  "hsl(0, 72%, 55%)",
];

const DashboardCharts = () => {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<{ month: string; scans: number; diagnoses: number; rehabs: number }[]>([]);
  const [diseaseData, setDiseaseData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadCharts = async () => {
      // Monthly data for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const [scans, diagnoses, rehabs] = await Promise.all([
        supabase.from("scan_analyses").select("created_at").eq("user_id", user.id).gte("created_at", sixMonthsAgo.toISOString()),
        supabase.from("diagnoses").select("created_at, condition_name").eq("user_id", user.id).gte("created_at", sixMonthsAgo.toISOString()),
        supabase.from("rehab_sessions").select("created_at").eq("user_id", user.id).gte("created_at", sixMonthsAgo.toISOString()),
      ]);

      // Group by month
      const months: Record<string, { scans: number; diagnoses: number; rehabs: number }> = {};
      const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        months[key] = { scans: 0, diagnoses: 0, rehabs: 0 };
      }

      (scans.data || []).forEach((s) => {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (months[key]) months[key].scans++;
      });
      (diagnoses.data || []).forEach((s) => {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (months[key]) months[key].diagnoses++;
      });
      (rehabs.data || []).forEach((s) => {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (months[key]) months[key].rehabs++;
      });

      setMonthlyData(
        Object.entries(months).map(([key, val]) => {
          const [year, month] = key.split("-");
          return { month: monthNames[parseInt(month)], ...val };
        })
      );

      // Disease type stats
      const conditionCounts: Record<string, number> = {};
      (diagnoses.data || []).forEach((d: any) => {
        const name = d.condition_name || "Noma'lum";
        conditionCounts[name] = (conditionCounts[name] || 0) + 1;
      });

      const diseaseArr = Object.entries(conditionCounts)
        .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + "..." : name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setDiseaseData(diseaseArr);
    };

    loadCharts();
  }, [user]);

  const totalDiseases = diseaseData.reduce((s, d) => s + d.value, 0);
  const totalMonthly = monthlyData.reduce((s, m) => s + m.scans + m.diagnoses + m.rehabs, 0);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Monthly Bar Chart */}
      <motion.div
        whileHover={{ y: -4 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative bg-card rounded-2xl p-5 shadow-card border border-border overflow-hidden"
      >
        <div className="absolute -top-24 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between mb-4">
          <h4 className="font-display font-bold text-foreground">Oylik tahlillar</h4>
          <span className="medical-badge bg-primary/10 text-primary">Jami {totalMonthly}</span>
        </div>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barGap={4}>
              <defs>
                {COLORS.slice(0, 4).map((c, i) => (
                  <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={1} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.35} />
                  </linearGradient>
                ))}
                <filter id="barShadow" x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "hsl(var(--secondary))", opacity: 0.5 }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 12px 30px -12px rgba(0,0,0,0.45)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="scans" name="Skanlar" fill="url(#barGrad0)" radius={[6, 6, 0, 0]} filter="url(#barShadow)" />
              <Bar dataKey="diagnoses" name="Tashxislar" fill="url(#barGrad1)" radius={[6, 6, 0, 0]} filter="url(#barShadow)" />
              <Bar dataKey="rehabs" name="Reab." fill="url(#barGrad3)" radius={[6, 6, 0, 0]} filter="url(#barShadow)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Ma'lumot yo'q</div>
        )}
      </motion.div>

      {/* Disease Pie Chart */}
      <motion.div
        whileHover={{ y: -4 }}
        className="relative bg-card rounded-2xl p-5 shadow-card border border-border overflow-hidden"
      >
        <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <h4 className="relative font-display font-bold text-foreground mb-4">Kasallik turlari</h4>
        {diseaseData.length > 0 ? (
          <div className="relative w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="pieShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.3" />
                  </filter>
                </defs>
                <Pie
                  data={diseaseData}
                  cx="50%" cy="45%"
                  outerRadius={82} innerRadius={52}
                  dataKey="value" paddingAngle={4}
                  stroke="none"
                  filter="url(#pieShadow)"
                  isAnimationActive
                >
                  {diseaseData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 12px 30px -12px rgba(0,0,0,0.45)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-x-0 top-[45%] -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <span className="text-2xl font-display font-bold text-foreground">{totalDiseases}</span>
              <span className="text-[11px] text-muted-foreground">tashxis</span>
            </div>
          </div>
        ) : (
          <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Tashxis ma'lumoti yo'q</div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardCharts;
