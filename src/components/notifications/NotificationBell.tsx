import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, AlertCircle, Info, FileImage, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  scan: { icon: <FileImage size={16} />, color: "bg-medical-teal-light text-medical-teal" },
  diagnosis: { icon: <Brain size={16} />, color: "bg-medical-purple-light text-medical-purple" },
  admin: { icon: <AlertCircle size={16} />, color: "bg-destructive/10 text-destructive" },
  info: { icon: <Info size={16} />, color: "bg-medical-blue-light text-medical-blue" },
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications((data as Notification[]) || []);
    };
    load();

    const channel = supabase
      .channel("user-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true } as any).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    for (const id of unreadIds) {
      await supabase.from("notifications").update({ is_read: true } as any).eq("id", id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-secondary text-foreground transition-colors">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="fixed left-4 right-4 top-16 lg:left-[19rem] lg:right-auto lg:top-auto lg:bottom-24 w-auto lg:w-80 max-h-[70vh] lg:max-h-96 overflow-y-auto bg-card border border-border rounded-2xl shadow-elevated z-50"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h4 className="font-display font-bold text-foreground text-sm">Bildirishnomalar</h4>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                      Barchasini o'qish
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Bildirishnomalar yo'q
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((n) => {
                    const cfg = typeConfig[n.type] || typeConfig.info;
                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && markRead(n.id)}
                        className={`p-3 flex items-start gap-3 cursor-pointer hover:bg-secondary/50 transition-colors ${
                          !n.is_read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center shrink-0`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.is_read ? "font-semibold text-foreground" : "text-foreground/80"}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), "dd.MM.yyyy HH:mm")}</p>
                        </div>
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;