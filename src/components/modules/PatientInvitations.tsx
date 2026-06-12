import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Check, X, Mail, Inbox, Send, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";

interface Invitation {
  id: string;
  doctor_id: string;
  patient_user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
  doctor?: { full_name: string | null; email: string | null; specialty: string | null };
  patient?: { full_name: string | null; email: string | null };
}

interface Props { onBack: () => void; }

const PAGE_SIZE = 8;

const statusConfig = {
  pending: { label: "Kutilmoqda", color: "bg-medical-orange-light text-medical-orange", icon: Clock },
  accepted: { label: "Qabul qilindi", color: "bg-medical-green-light text-medical-green", icon: Check },
  declined: { label: "Rad etildi", color: "bg-medical-red-light text-medical-red", icon: X },
};

const PatientInvitations = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"sent" | "received">("sent");
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");
  const [sent, setSent] = useState<Invitation[]>([]);
  const [received, setReceived] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [sentRes, recvRes] = await Promise.all([
      supabase.from("patient_invitations").select("*").eq("doctor_id", user.id).order("created_at", { ascending: false }),
      supabase.from("patient_invitations").select("*").eq("patient_user_id", user.id).order("created_at", { ascending: false }),
    ]);
    const allUserIds = new Set<string>();
    (sentRes.data || []).forEach((r: any) => allUserIds.add(r.patient_user_id));
    (recvRes.data || []).forEach((r: any) => allUserIds.add(r.doctor_id));

    const profileMap = new Map<string, any>();
    if (allUserIds.size > 0) {
      const { data: profs } = await supabase.from("profiles")
        .select("user_id, full_name, email, specialty")
        .in("user_id", Array.from(allUserIds));
      (profs || []).forEach((p: any) => profileMap.set(p.user_id, p));
    }
    setSent((sentRes.data || []).map((r: any) => ({ ...r, patient: profileMap.get(r.patient_user_id) })));
    setReceived((recvRes.data || []).map((r: any) => ({ ...r, doctor: profileMap.get(r.doctor_id) })));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`invitations-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_invitations" }, (payload) => {
        const row: any = payload.new || payload.old;
        if (row && (row.doctor_id === user.id || row.patient_user_id === user.id)) {
          load();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const respond = async (inv: Invitation, status: "accepted" | "declined") => {
    setActionId(inv.id);
    const { error } = await supabase.from("patient_invitations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", inv.id);

    if (!error) {
      // Post a system activity message into the chat thread so both sides see the decision
      await supabase.from("chat_messages").insert({
        sender_id: user!.id,
        receiver_id: inv.doctor_id,
        message: JSON.stringify({
          type: "invitation_activity",
          status,
          at: new Date().toISOString(),
        }),
      });
    }

    if (error) toast.error("Xatolik: " + error.message);
    else toast.success(status === "accepted" ? "Taklif qabul qilindi" : "Taklif rad etildi");
    setActionId(null);
    load();
  };

  const list = tab === "sent" ? sent : received;

  const filtered = useMemo(() => {
    let out = filter === "all" ? list : list.filter(i => i.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(i => {
        const cp = tab === "sent" ? i.patient : i.doctor;
        return (cp?.full_name || "").toLowerCase().includes(q) || (cp?.email || "").toLowerCase().includes(q);
      });
    }
    return out;
  }, [list, filter, search, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filter, tab]);

  const counts = (l: Invitation[]) => ({
    all: l.length,
    pending: l.filter(i => i.status === "pending").length,
    accepted: l.filter(i => i.status === "accepted").length,
    declined: l.filter(i => i.status === "declined").length,
  });
  const c = counts(list);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-foreground">Bemor takliflari</h2>
          <p className="text-muted-foreground mt-1 text-sm">Yuborilgan va qabul qilingan takliflar tarixi</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-1.5 flex gap-1 max-w-md">
        <button onClick={() => { setTab("sent"); setFilter("all"); }}
          className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${tab === "sent" ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}>
          <Send size={16} /> Yuborilgan ({sent.length})
        </button>
        <button onClick={() => { setTab("received"); setFilter("all"); }}
          className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${tab === "received" ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}>
          <Inbox size={16} /> Olingan ({received.length})
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism yoki email orqali qidirish..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "accepted", "declined"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f === "all" ? `Hammasi (${c.all})` : `${statusConfig[f].label} (${c[f]})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground"><Loader2 className="animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <Mail size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Hech narsa topilmadi</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map(inv => {
              const cfg = statusConfig[inv.status];
              const Icon = cfg.icon;
              const counterpart = tab === "sent" ? inv.patient : inv.doctor;
              return (
                <motion.div key={inv.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    {(counterpart?.full_name || counterpart?.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{counterpart?.full_name || "Nomsiz foydalanuvchi"}</p>
                    <p className="text-xs text-muted-foreground truncate">{counterpart?.email || "—"}{tab === "received" && (inv.doctor as any)?.specialty ? ` • ${(inv.doctor as any).specialty}` : ""}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(inv.created_at), "dd.MM.yyyy HH:mm")}</p>
                  </div>
                  <span className={`medical-badge ${cfg.color} flex items-center gap-1`}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                  {tab === "received" && inv.status === "pending" && (
                    <div className="flex gap-1">
                      <button onClick={() => respond(inv, "accepted")} disabled={actionId === inv.id}
                        className="px-3 py-1.5 rounded-lg bg-medical-green text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
                        <Check size={14} /> Qabul
                      </button>
                      <button onClick={() => respond(inv, "declined")} disabled={actionId === inv.id}
                        className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
                        <X size={14} /> Rad
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-2 rounded-lg bg-secondary text-foreground disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-secondary text-foreground disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default PatientInvitations;
