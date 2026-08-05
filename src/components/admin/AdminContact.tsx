import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MailOpen, Search, Loader2, User, Clock, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Submission {
  id: string;
  full_name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

const AdminContact = () => {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Xabarlarni yuklashda xatolik");
    setRows((data as Submission[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-contact")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_submissions" }, (p) => {
        const row = p.new as Submission;
        setRows((prev) => [row, ...prev]);
        toast.info(`Yangi xabar: ${row.full_name}`);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggleRead = async (row: Submission) => {
    const next = !row.is_read;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_read: next } : r)));
    const { error } = await supabase.from("contact_submissions").update({ is_read: next }).eq("id", row.id);
    if (error) {
      toast.error("Holatni saqlab bo'lmadi");
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_read: !next } : r)));
    }
  };

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return rows.filter(
      (r) =>
        (!onlyUnread || !r.is_read) &&
        (!s || r.full_name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || r.message.toLowerCase().includes(s))
    );
  }, [rows, q, onlyUnread]);

  const unread = rows.filter((r) => !r.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotateY: [0, 18, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center shadow-glow"
          >
            <Inbox size={19} />
          </motion.div>
          <div>
            <h3 className="font-display font-bold text-foreground">Aloqa xabarlari</h3>
            <p className="text-xs text-muted-foreground">
              {rows.length} ta xabar · {unread} ta o'qilmagan
            </p>
          </div>
        </div>
        <button
          onClick={() => setOnlyUnread((v) => !v)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${onlyUnread ? "gradient-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
        >
          Faqat o'qilmagan
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ism, email yoki xabar bo'yicha qidirish..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Xabarlar topilmadi</div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((r, i) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 12, rotateX: -8 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                whileHover={{ y: -3 }}
                style={{ transformStyle: "preserve-3d" }}
                className={`bg-card border rounded-2xl p-4 shadow-card flex gap-3 ${r.is_read ? "border-border" : "border-primary/50"}`}
              >
                <div className="w-11 h-11 rounded-2xl gradient-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 shadow-glow">
                  {initials(r.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.full_name}</p>
                      {!r.is_read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock size={11} /> {format(new Date(r.created_at), "dd.MM.yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <User size={11} /> {r.email}
                  </p>
                  <div className="mt-2 rounded-2xl rounded-tl-sm bg-secondary/70 px-3 py-2 text-sm text-foreground whitespace-pre-wrap break-words">
                    {r.message}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => toggleRead(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-semibold text-foreground"
                    >
                      {r.is_read ? <MailOpen size={13} /> : <Mail size={13} />}
                      {r.is_read ? "O'qilmagan deb belgilash" : "O'qildi"}
                    </button>
                    <a
                      href={`mailto:${r.email}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold"
                    >
                      Javob yozish
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminContact;
