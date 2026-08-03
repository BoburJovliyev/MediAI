import { useEffect, useState } from "react";
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

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Monthly Bar Chart */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
        <h4 className="font-display font-bold text-foreground mb-4">Oylik tahlillar</h4>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="scans" name="Skanlar" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="diagnoses" name="Tashxislar" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="rehabs" name="Reab." fill={COLORS[3]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Ma'lumot yo'q</div>
        )}
      </div>

      {/* Disease Pie Chart */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
        <h4 className="font-display font-bold text-foreground mb-4">Kasallik turlari</h4>
        {diseaseData.length > 0 ? (
          <div className="relative w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={diseaseData} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" paddingAngle={3}>
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
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
            {/* 3D Characters Overlay in the center of the Pie Chart */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center top-[-15px]">
              <div className="w-[180px] h-[180px]">
                <Canvas
                  shadows
                  camera={{ position: [0, 0.8, 3.5], fov: 45 }}
                  gl={{ antialias: true, alpha: true }}
                >
                  <Suspense fallback={null}>
                    <ambientLight intensity={0.6} />
                    <spotLight position={[3, 5, 4]} angle={0.35} penumbra={0.8} intensity={1.2} />
                    <Environment preset="city" />
                    <group position={[-0.3, -0.6, 0]}>
                      <Character3D character="boy" mood="happy" isSpeaking={false} lookTarget={{ x: 0, y: 0 }} audioLevel={0} />
                    </group>
                    <group position={[0.3, -0.6, 0]}>
                      <Character3D character="girl" mood="happy" isSpeaking={false} lookTarget={{ x: 0, y: 0 }} audioLevel={0} />
                    </group>
                  </Suspense>
                </Canvas>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Tashxis ma'lumoti yo'q</div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;