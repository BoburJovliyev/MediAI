import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ReferenceLine,
} from "recharts";
import { TrendingUp, PieChart as PieIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { FoodResult } from "./FoodCalorieAI";

const DAILY_NORM = 2000;
/** Me'yoriy makro taqsimoti (kaloriya ulushi) */
const NORM_SPLIT = { protein: 20, fat: 30, carbs: 50 };

const MACRO_COLORS = ["hsl(220, 80%, 55%)", "hsl(25, 90%, 55%)", "hsl(165, 60%, 45%)"];

export interface FoodLogRow {
  id: string;
  created_at: string;
  dish_name: string;
  meal_type: string;
  total_calories: number;
  status: string;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

/* ---------- Macro distribution vs norm ---------- */
export const MacroBreakdown = ({ result }: { result: FoodResult }) => {
  const pCal = result.protein_g * 4;
  const fCal = result.fat_g * 9;
  const cCal = result.carbs_g * 4;
  const total = Math.max(1, pCal + fCal + cCal);

  const rows = [
    { key: "Oqsil", pct: (pCal / total) * 100, norm: NORM_SPLIT.protein, grams: result.protein_g, color: MACRO_COLORS[0] },
    { key: "Yog'", pct: (fCal / total) * 100, norm: NORM_SPLIT.fat, grams: result.fat_g, color: MACRO_COLORS[1] },
    { key: "Uglevod", pct: (cCal / total) * 100, norm: NORM_SPLIT.carbs, grams: result.carbs_g, color: MACRO_COLORS[2] },
  ];

  const pieData = rows.map((r) => ({ name: r.key, value: +r.pct.toFixed(1) }));

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-4">
      <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <PieIcon size={16} className="text-primary" /> Makro taqsimot va me'yordan farqi
      </h5>

      <div className="grid sm:grid-cols-2 gap-4 items-center">
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={72} dataKey="value" paddingAngle={3} stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)}
              </Pie>
              <Tooltip
                formatter={(v: any, n: any) => [`${v}%`, n]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {rows.map((r) => {
            const diff = r.pct - r.norm;
            return (
              <div key={r.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground/80">{r.key} · {Math.round(r.grams)} g</span>
                  <span className="font-semibold text-foreground">
                    {r.pct.toFixed(0)}%
                    <span className={diff > 5 ? "text-medical-red ml-1" : diff < -5 ? "text-medical-blue ml-1" : "text-medical-green ml-1"}>
                      ({diff > 0 ? "+" : ""}{diff.toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, r.pct)}%` }}
                    className="h-full rounded-full"
                    style={{ background: r.color }}
                  />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/40" style={{ left: `${r.norm}%` }} title={`Me'yor ${r.norm}%`} />
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground">Qora chiziq — tavsiya etilgan me'yor ulushi (20/30/50).</p>
        </div>
      </div>
    </div>
  );
};

/* ---------- Historical trend ---------- */
export const FoodTrend = ({ refreshKey }: { refreshKey: number }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<FoodLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("food_logs" as any) as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);
    setRows(((data as FoodLogRow[]) || []).reverse());
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load, refreshKey]);

  // group by day
  const byDay = rows.reduce<Record<string, { day: string; kkal: number; count: number }>>((acc, r) => {
    const d = new Date(r.created_at);
    const key = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    acc[key] ??= { day: key, kkal: 0, count: 0 };
    acc[key].kkal += Number(r.total_calories) || 0;
    acc[key].count++;
    return acc;
  }, {});
  const chartData = Object.values(byDay).slice(-14);

  const statusCounts = rows.reduce<Record<string, number>>((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp size={16} className="text-medical-teal" /> Kaloriya tarixi (oxirgi 14 kun)
        </h5>
        <div className="flex gap-2 text-[11px]">
          <span className="medical-badge bg-medical-green-light text-medical-green">Me'yorda {statusCounts.norm || 0}</span>
          <span className="medical-badge bg-medical-red-light text-medical-red">Yuqori {statusCounts.high || 0}</span>
          <span className="medical-badge bg-medical-blue-light text-medical-blue">Past {statusCounts.low || 0}</span>
        </div>
      </div>

      {loading ? (
        <div className="h-[220px] flex items-center justify-center text-muted-foreground"><Loader2 size={18} className="animate-spin" /></div>
      ) : chartData.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Hali saqlangan ovqat yo'q</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="kkalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(25, 90%, 55%)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="hsl(25, 90%, 55%)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              formatter={(v: any) => [`${Math.round(v)} kkal`, "Jami"]}
            />
            <ReferenceLine y={DAILY_NORM} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Me'yor 2000", fontSize: 10, fill: "hsl(var(--muted-foreground))", position: "insideTopRight" }} />
            <Area type="monotone" dataKey="kkal" stroke="hsl(25, 90%, 55%)" strokeWidth={2.5} fill="url(#kkalFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {rows.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {[...rows].reverse().slice(0, 10).map((r) => (
            <div key={r.id} className="flex items-center justify-between text-xs bg-secondary/60 rounded-xl px-3 py-2">
              <span className="text-foreground/80 truncate">{r.dish_name || "Ovqat"} <span className="text-muted-foreground">· {r.meal_type}</span></span>
              <span className="font-semibold text-foreground shrink-0 ml-2">{Math.round(r.total_calories)} kkal</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
