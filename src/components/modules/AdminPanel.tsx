import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Activity, UserCog, Search, ChevronDown, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string | null;
  created_at: string;
}

interface ActivityRow {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  details: any;
  created_at: string;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"users" | "activity" | "stats">("users");
  const [globalStats, setGlobalStats] = useState({ users: 0, scans: 0, diagnoses: 0, rehabs: 0, patients: 0 });

  useEffect(() => {
    if (!user) return;
    // Check admin role via RPC-like query
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
    // Realtime activity
    const channel = supabase.channel("admin-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (payload) => {
        setActivities((prev) => [payload.new as ActivityRow, ...prev]);
        toast.info(`Yangi faoliyat: ${(payload.new as ActivityRow).action}`);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const loadData = async () => {
    const [profs, acts, scansC, diagC, rehabC, patsC] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("scan_analyses").select("id", { count: "exact", head: true }),
      supabase.from("diagnoses").select("id", { count: "exact", head: true }),
      supabase.from("rehab_sessions").select("id", { count: "exact", head: true }),
      supabase.from("patients").select("id", { count: "exact", head: true }),
    ]);
    setProfiles(profs.data || []);
    setActivities(acts.data || []);
    setGlobalStats({
      users: profs.data?.length || 0,
      scans: scansC.count || 0,
      diagnoses: diagC.count || 0,
      rehabs: rehabC.count || 0,
      patients: patsC.count || 0,
    });
  };

  if (isAdmin === null) return <div className="flex items-center justify-center py-20 text-muted-foreground">Tekshirilmoqda...</div>;
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Shield size={48} className="text-destructive mb-4" />
      <h2 className="text-xl font-display font-bold text-foreground">Ruxsat yo'q</h2>
      <p className="text-muted-foreground mt-2">Sizda admin huquqi mavjud emas</p>
    </div>
  );

  const filteredProfiles = profiles.filter((p) => p.full_name?.toLowerCase().includes(search.toLowerCase()));

  const changeRole = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    // Delete existing then insert new
    await supabase.from("user_roles" as any).delete().eq("user_id", userId);
    await supabase.from("user_roles" as any).insert({ user_id: userId, role: newRole });
    toast.success("Rol yangilandi");
    loadData();
  };

  const statsCards = [
    { label: "Foydalanuvchilar", value: globalStats.users, icon: <Users size={20} />, color: "bg-medical-blue-light text-medical-blue" },
    { label: "Skan tahlillari", value: globalStats.scans, icon: <Activity size={20} />, color: "bg-medical-teal-light text-medical-teal" },
    { label: "Tashxislar", value: globalStats.diagnoses, icon: <Activity size={20} />, color: "bg-medical-green-light text-medical-green" },
    { label: "Bemorlar", value: globalStats.patients, icon: <Users size={20} />, color: "bg-medical-purple-light text-medical-purple" },
    { label: "Reab. seanslar", value: globalStats.rehabs, icon: <Activity size={20} />, color: "bg-medical-orange-light text-medical-orange" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><Shield size={20} className="text-destructive" /></div>
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Super Admin Panel</h2>
          <p className="text-muted-foreground text-sm">Barcha foydalanuvchilar va faoliyatni nazorat qiling</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4 border border-border">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>{s.icon}</div>
            <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary rounded-xl p-1">
        {([["users", "Foydalanuvchilar"], ["activity", "Faoliyat jurnali"], ["stats", "Statistika"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === id ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Foydalanuvchi qidirish..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-2">
            {filteredProfiles.map((p) => (
              <div key={p.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{p.full_name || "Nomsiz"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd.MM.yyyy")} • {p.role || "user"}</p>
                </div>
                <div className="relative group">
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground">
                    <UserCog size={14} /> Rol <ChevronDown size={14} />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-elevated opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                    {(["admin", "moderator", "user"] as const).map((r) => (
                      <button key={r} onClick={() => changeRole(p.user_id, r)} className="block w-full px-4 py-2 text-sm text-left hover:bg-secondary text-foreground capitalize">{r}</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-2">
          {activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Faoliyat jurnali bo'sh</div>
          ) : activities.map((a) => (
            <div key={a.id} className="bg-card rounded-xl p-4 border border-border flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-medical-blue-light flex items-center justify-center shrink-0"><Bell size={14} className="text-medical-blue" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.entity_type && `${a.entity_type} • `}{format(new Date(a.created_at), "dd.MM.yyyy HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "stats" && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-display font-bold text-foreground mb-4">Umumiy statistika</h3>
          <div className="space-y-3">
            {statsCards.map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{s.label}</span>
                <span className="font-display font-bold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminPanel;
