import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Activity, UserCog, Search, Bell, Ban, CheckCircle2, Filter, Calendar, Send, MessageSquare, FileImage, Brain, Eye, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import SystemMonitor from "../admin/SystemMonitor";
import SecurityCenter from "../admin/SecurityCenter";

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string | null;
  is_blocked: boolean;
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
  const [tab, setTab] = useState<"users" | "activity" | "notify" | "dashboards" | "chats">("users");
  const [notifyTarget, setNotifyTarget] = useState("");
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyType, setNotifyType] = useState<"info" | "warning" | "success">("info");
  const [sendingNotify, setSendingNotify] = useState(false);
  const [globalStats, setGlobalStats] = useState({ users: 0, scans: 0, diagnoses: 0, rehabs: 0, patients: 0, chats: 0 });
  const [activityFilter, setActivityFilter] = useState({ type: "", dateFrom: "", dateTo: "" });
  const [allScans, setAllScans] = useState<any[]>([]);
  const [allDiagnoses, setAllDiagnoses] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [allChats, setAllChats] = useState<any[]>([]);
  const [chatFilterUser, setChatFilterUser] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
    const channel = supabase.channel("admin-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (payload) => {
        setActivities((prev) => [payload.new as ActivityRow, ...prev]);
        toast.info(`Yangi faoliyat: ${(payload.new as ActivityRow).action}`);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const loadData = async () => {
    const [profs, acts, scansC, diagC, rehabC, patsC, recentScans, recentDiag, chatsC, recentChats] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("scan_analyses").select("id", { count: "exact", head: true }),
      supabase.from("diagnoses").select("id", { count: "exact", head: true }),
      supabase.from("rehab_sessions").select("id", { count: "exact", head: true }),
      supabase.from("patients").select("id", { count: "exact", head: true }),
      supabase.from("scan_analyses").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("diagnoses").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("chat_messages").select("id", { count: "exact", head: true }),
      supabase.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setProfiles(profs.data as ProfileRow[] || []);
    setActivities(acts.data || []);
    setAllScans(recentScans.data || []);
    setAllDiagnoses(recentDiag.data || []);
    setAllChats(recentChats.data || []);
    setGlobalStats({
      users: profs.data?.length || 0,
      scans: scansC.count || 0,
      diagnoses: diagC.count || 0,
      rehabs: rehabC.count || 0,
      patients: patsC.count || 0,
      chats: chatsC.count || 0,
    });
  };

  const toggleBlock = async (profile: ProfileRow) => {
    const newBlocked = !profile.is_blocked;
    const { error } = await supabase.from("profiles").update({ is_blocked: newBlocked } as any).eq("id", profile.id);
    if (error) { toast.error("Xatolik: " + error.message); return; }
    toast.success(newBlocked ? "Foydalanuvchi bloklandi" : "Foydalanuvchi blokdan chiqarildi");
    if (user) {
      await supabase.from("activity_log").insert({
        user_id: user.id, action: newBlocked ? "Foydalanuvchi bloklandi" : "Foydalanuvchi blokdan chiqarildi",
        entity_type: "user", entity_id: profile.user_id as any, details: { target_name: profile.full_name } as any,
      });
    }
    loadData();
  };

  const changeRole = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    await supabase.from("user_roles" as any).delete().eq("user_id", userId);
    await supabase.from("user_roles" as any).insert({ user_id: userId, role: newRole });
    if (user) {
      await supabase.from("activity_log").insert({
        user_id: user.id, action: `Rol o'zgartirildi: ${newRole}`, entity_type: "user", entity_id: userId as any,
      });
    }
    toast.success("Rol yangilandi");
    loadData();
  };

  const sendNotification = async () => {
    if (!notifyTitle.trim() || !notifyMessage.trim()) { toast.error("Sarlavha va xabar to'ldiring"); return; }
    setSendingNotify(true);
    const targets = notifyTarget === "all" ? profiles.map(p => p.user_id) : [notifyTarget];
    const rows = targets.map(uid => ({ user_id: uid, title: notifyTitle, message: notifyMessage, type: notifyType }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) { toast.error("Xatolik: " + error.message); } else {
      toast.success(`${targets.length} ta foydalanuvchiga bildirishnoma yuborildi`);
      setNotifyTitle(""); setNotifyMessage(""); setNotifyTarget("");
      if (user) {
        await supabase.from("activity_log").insert({ user_id: user.id, action: `Bildirishnoma yuborildi: ${notifyTitle}`, entity_type: "notification", details: { target_count: targets.length } as any });
      }
    }
    setSendingNotify(false);
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
  const filteredActivities = activities.filter((a) => {
    if (activityFilter.type && !a.action.toLowerCase().includes(activityFilter.type.toLowerCase()) && !a.entity_type?.toLowerCase().includes(activityFilter.type.toLowerCase())) return false;
    if (activityFilter.dateFrom && new Date(a.created_at) < new Date(activityFilter.dateFrom)) return false;
    if (activityFilter.dateTo && new Date(a.created_at) > new Date(activityFilter.dateTo + "T23:59:59")) return false;
    return true;
  });

  const getUserName = (userId: string) => profiles.find(p => p.user_id === userId)?.full_name || "Nomsiz";

  const userScans = selectedUserId ? allScans.filter(s => s.user_id === selectedUserId) : allScans;
  const userDiagnoses = selectedUserId ? allDiagnoses.filter(d => d.user_id === selectedUserId) : allDiagnoses;

  const statsCards = [
    { label: "Foydalanuvchilar", value: globalStats.users, icon: <Users size={20} />, color: "bg-medical-blue-light text-medical-blue" },
    { label: "Skan tahlillari", value: globalStats.scans, icon: <Activity size={20} />, color: "bg-medical-teal-light text-medical-teal" },
    { label: "Tashxislar", value: globalStats.diagnoses, icon: <Activity size={20} />, color: "bg-medical-green-light text-medical-green" },
    { label: "Bemorlar", value: globalStats.patients, icon: <Users size={20} />, color: "bg-medical-purple-light text-medical-purple" },
    { label: "Chatlar", value: globalStats.chats, icon: <MessageCircle size={20} />, color: "bg-primary/10 text-primary" },
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statsCards.map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4 border border-border">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>{s.icon}</div>
            <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary rounded-xl p-1 overflow-x-auto">
        {([["users", "Foydalanuvchilar"], ["dashboards", "Dashboardlar"], ["chats", "Chatlar"], ["activity", "Faoliyat jurnali"], ["notify", "Bildirishnoma"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap px-3 ${tab === id ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
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
              <div key={p.id} className={`bg-card rounded-xl p-4 border transition-all ${p.is_blocked ? "border-destructive/30 opacity-60" : "border-border"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{p.full_name || "Nomsiz"}</p>
                      {p.is_blocked && <span className="medical-badge bg-destructive/10 text-destructive">Bloklangan</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd.MM.yyyy")} • {p.role || "user"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedUserId(p.user_id); setTab("dashboards"); }}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Dashboardni ko'rish">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => toggleBlock(p)}
                      className={`p-2 rounded-lg transition-colors ${p.is_blocked ? "bg-medical-green-light text-medical-green hover:bg-medical-green/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}
                      title={p.is_blocked ? "Blokdan chiqarish" : "Bloklash"}>
                      {p.is_blocked ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                    </button>
                    <div className="relative group">
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground">
                        <UserCog size={14} /> Rol
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-elevated opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10 min-w-[120px]">
                        {(["admin", "doctor", "user", "patient"] as const).map((r) => (
                          <button key={r} onClick={() => changeRole(p.user_id, r as any)} className="block w-full px-4 py-2 text-sm text-left hover:bg-secondary text-foreground capitalize">{r}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "dashboards" && (
        <div className="space-y-6">
          {/* User filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setSelectedUserId(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!selectedUserId ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              Barcha foydalanuvchilar
            </button>
            {profiles.slice(0, 10).map(p => (
              <button key={p.user_id} onClick={() => setSelectedUserId(p.user_id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedUserId === p.user_id ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {p.full_name || "Nomsiz"}
              </button>
            ))}
          </div>

          {selectedUserId && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">Tanlangan foydalanuvchi: <span className="font-semibold text-foreground">{getUserName(selectedUserId)}</span></p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <p className="text-lg font-bold text-foreground">{userScans.length}</p>
                  <p className="text-xs text-muted-foreground">Skanlar</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <p className="text-lg font-bold text-foreground">{userDiagnoses.length}</p>
                  <p className="text-xs text-muted-foreground">Tashxislar</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Scans */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-4"><FileImage size={18} className="text-primary" /> So'nggi skanlar</h3>
            {userScans.length === 0 ? <p className="text-sm text-muted-foreground">Skan topilmadi</p> : (
              <div className="space-y-3">
                {userScans.slice(0, 10).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className={`w-2 h-2 rounded-full ${s.severity === "critical" ? "bg-destructive" : s.severity === "moderate" ? "bg-yellow-500" : "bg-medical-green"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.scan_type?.toUpperCase() || "Skan"} — {s.severity || "normal"}</p>
                      <p className="text-xs text-muted-foreground">{getUserName(s.user_id)} • {format(new Date(s.created_at), "dd.MM.yyyy HH:mm")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Diagnoses */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-4"><Brain size={18} className="text-accent" /> So'nggi tashxislar</h3>
            {userDiagnoses.length === 0 ? <p className="text-sm text-muted-foreground">Tashxis topilmadi</p> : (
              <div className="space-y-3">
                {userDiagnoses.slice(0, 10).map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className={`w-2 h-2 rounded-full ${(d.confidence || 0) > 80 ? "bg-medical-green" : "bg-yellow-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.condition_name || "Noma'lum"} — {d.confidence ? `${d.confidence}%` : ""}</p>
                      <p className="text-xs text-muted-foreground">{getUserName(d.user_id)} • {format(new Date(d.created_at), "dd.MM.yyyy HH:mm")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground"><Filter size={16} /> Filtrlash</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tur</label>
                <input value={activityFilter.type} onChange={(e) => setActivityFilter({ ...activityFilter, type: e.target.value })} placeholder="Masalan: bloklandi, rol..."
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar size={12} /> Boshlanish</label>
                <input type="date" value={activityFilter.dateFrom} onChange={(e) => setActivityFilter({ ...activityFilter, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar size={12} /> Tugash</label>
                <input type="date" value={activityFilter.dateTo} onChange={(e) => setActivityFilter({ ...activityFilter, dateTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Faoliyat topilmadi</div>
            ) : filteredActivities.map((a) => (
              <div key={a.id} className="bg-card rounded-xl p-4 border border-border flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-medical-blue-light flex items-center justify-center shrink-0"><Bell size={14} className="text-medical-blue" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.entity_type && `${a.entity_type} • `}{format(new Date(a.created_at), "dd.MM.yyyy HH:mm")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "notify" && (
        <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
          <div className="flex items-center gap-2 mb-2"><MessageSquare size={20} className="text-primary" /><h3 className="font-display font-bold text-foreground">Bildirishnoma yuborish</h3></div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Kimga</label>
            <select value={notifyTarget} onChange={(e) => setNotifyTarget(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Tanlang...</option>
              <option value="all">Barcha foydalanuvchilar</option>
              {profiles.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name || "Nomsiz"}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Turi</label>
            <div className="flex gap-2">
              {(["info", "warning", "success"] as const).map(t => (
                <button key={t} onClick={() => setNotifyType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${notifyType === t ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {t === "info" ? "Ma'lumot" : t === "warning" ? "Ogohlantirish" : "Muvaffaqiyat"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Sarlavha</label>
            <input value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} placeholder="Bildirishnoma sarlavhasi"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Xabar</label>
            <textarea value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} placeholder="Bildirishnoma matni..." rows={3}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <button onClick={sendNotification} disabled={sendingNotify || !notifyTarget}
            className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-60 shadow-glow">
            <Send size={16} /> {sendingNotify ? "Yuborilmoqda..." : "Yuborish"}
          </button>
        </div>
      )}

      {tab === "chats" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setChatFilterUser(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!chatFilterUser ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              Barcha chatlar
            </button>
            {profiles.slice(0, 10).map(p => (
              <button key={p.user_id} onClick={() => setChatFilterUser(p.user_id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${chatFilterUser === p.user_id ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {p.full_name || "Nomsiz"}
              </button>
            ))}
          </div>
          <div className="bg-card rounded-2xl p-6 border border-border space-y-3">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-4">
              <MessageCircle size={18} className="text-primary" /> Chat xabarlari
            </h3>
            {(chatFilterUser ? allChats.filter(c => c.sender_id === chatFilterUser || c.receiver_id === chatFilterUser) : allChats).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chat xabarlari topilmadi</p>
            ) : (
              (chatFilterUser ? allChats.filter(c => c.sender_id === chatFilterUser || c.receiver_id === chatFilterUser) : allChats)
                .slice(0, 50).map((msg: any) => (
                  <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {getUserName(msg.sender_id)?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{getUserName(msg.sender_id)}</span>
                        <span className="text-[10px] text-muted-foreground">→</span>
                        <span className="text-xs font-semibold text-foreground">{getUserName(msg.receiver_id)}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(msg.created_at), "dd.MM.yyyy HH:mm")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{msg.is_deleted ? "🗑 O'chirilgan" : msg.message || "📎 Fayl"}</p>
                      {msg.image_url && !msg.is_deleted && <img src={msg.image_url} alt="" className="w-16 h-16 rounded-lg mt-1 object-cover" />}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminPanel;
