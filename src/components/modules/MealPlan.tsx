import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Loader2, Sparkles, Droplets, Ban, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FoodResult } from "./FoodCalorieAI";
import type { SafetyProfile } from "./NutritionSafety";

interface PlanStep { time: string; meal: string; dish: string; portion: string; calories: number; why: string }
interface Plan {
  target_calories: number;
  summary: string;
  steps: PlanStep[];
  avoid: string[];
  hydration: string;
  safety_notes: string[];
}

interface Props {
  food: FoodResult | null;
  scan?: unknown;
  profile: SafetyProfile;
}

const MealPlan = ({ food, scan, profile }: Props) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("meal-plan", {
        body: { food, scan, profile },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setPlan(data as Plan);
      toast.success("Ratsion rejasi tayyor!");
    } catch (e: any) {
      toast.error(e.message || "Reja tuzishda xatolik");
    } finally {
      setLoading(false);
    }
  }, [food, scan, profile]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ChefHat size={16} className="text-medical-green" /> Bosqichma-bosqich ratsion rejasi
        </h5>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 shadow-glow"
        >
          {loading ? <><Loader2 size={15} className="animate-spin" /> Tuzilmoqda...</> : <><Sparkles size={15} /> Reja tuzish</>}
        </button>
      </div>

      <AnimatePresence>
        {plan && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl bg-secondary/60 p-4">
              <p className="text-sm text-foreground/80">{plan.summary}</p>
              <p className="text-xs text-muted-foreground mt-2">Kunlik maqsad: <span className="font-semibold text-foreground">{Math.round(plan.target_calories)} kkal</span></p>
            </div>

            <div className="relative pl-6 space-y-3">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
              {plan.steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative bg-secondary/50 rounded-xl p-3"
                >
                  <span className="absolute -left-[19px] top-4 w-3 h-3 rounded-full gradient-primary ring-4 ring-card" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{s.dish}</p>
                    <span className="text-xs font-semibold text-medical-orange shrink-0">{Math.round(s.calories)} kkal</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock size={11} /> {s.time} · {s.meal} · {s.portion}
                  </p>
                  <p className="text-xs text-foreground/70 mt-1.5">{s.why}</p>
                </motion.div>
              ))}
            </div>

            {plan.avoid?.length > 0 && (
              <div className="rounded-xl bg-medical-red-light/40 p-3">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1"><Ban size={13} className="text-medical-red" /> Cheklash kerak</p>
                {plan.avoid.map((a, i) => <p key={i} className="text-xs text-foreground/75">• {a}</p>)}
              </div>
            )}

            {plan.hydration && (
              <div className="rounded-xl bg-medical-blue-light/40 p-3 flex gap-2">
                <Droplets size={14} className="text-medical-blue shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/80">{plan.hydration}</p>
              </div>
            )}

            {plan.safety_notes?.length > 0 && (
              <div className="rounded-xl bg-secondary p-3 space-y-1">
                {plan.safety_notes.map((n, i) => <p key={i} className="text-[11px] text-muted-foreground">⚠ {n}</p>)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!plan && !loading && (
        <p className="text-xs text-muted-foreground">
          Reja oxirgi ovqat tahlili{scan ? " va AI radiolog natijasi" : ""} hamda salomatlik profilingiz asosida tuziladi.
        </p>
      )}
    </div>
  );
};

export default MealPlan;
