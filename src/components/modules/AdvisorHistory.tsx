import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown, ChevronUp, Pill, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface HistoryItem {
  id: string;
  complaint: string | null;
  condition_name: string | null;
  confidence: number | null;
  description: string | null;
  medications: any;
  lifestyle_tips: any;
  created_at: string;
}

const AdvisorHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("diagnoses")
      .select("id, complaint, condition_name, confidence, description, medications, lifestyle_tips, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setHistory(data || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return null;
  if (history.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center">
        <History size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Hali tarix mavjud emas</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
      <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-4">
        <History size={18} className="text-primary" /> So'nggi savollar tarixi
      </h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {history.map((item) => (
          <div key={item.id} className="rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.condition_name || "Noma'lum"}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={10} /> {format(new Date(item.created_at), "dd.MM.yyyy HH:mm")}
                  {item.confidence && <span className="ml-2 text-primary">{item.confidence}%</span>}
                </p>
              </div>
              {expanded === item.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {expanded === item.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-3 border-t border-border">
                    {item.complaint && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Shikoyat:</p>
                        <p className="text-sm text-foreground">{item.complaint}</p>
                      </div>
                    )}
                    {item.description && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Tashxis:</p>
                        <p className="text-sm text-foreground">{item.description}</p>
                      </div>
                    )}
                    {Array.isArray(item.medications) && item.medications.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Pill size={12} /> Dorilar:</p>
                        <div className="space-y-1">
                          {item.medications.map((med: any, i: number) => (
                            <p key={i} className="text-xs text-foreground/80">• {med.name} — {med.dose} ({med.frequency})</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(item.lifestyle_tips) && item.lifestyle_tips.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Tavsiyalar:</p>
                        {item.lifestyle_tips.map((tip: string, i: number) => (
                          <p key={i} className="text-xs text-foreground/80">• {tip}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvisorHistory;
