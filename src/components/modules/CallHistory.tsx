import { useEffect, useState } from "react";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Phone, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CallLog {
  id: string;
  room_id: string;
  caller_id: string;
  callee_id: string | null;
  group_id: string | null;
  caller_name: string | null;
  callee_name: string | null;
  status: string;
  started_at: string;
  duration_seconds: number;
}

interface CallHistoryProps {
  /** Limit to calls involving this peer (1:1). */
  peerId?: string;
  /** Limit to a group's calls. */
  groupId?: string;
}

const fmtDuration = (s: number) => {
  if (!s) return "";
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
};

const statusMeta = (log: CallLog, myId?: string) => {
  const outgoing = log.caller_id === myId;
  if (log.status === "missed") return { icon: PhoneMissed, color: "text-destructive", label: outgoing ? "Javobsiz" : "O'tkazib yuborilgan" };
  if (log.status === "rejected") return { icon: PhoneOff, color: "text-destructive", label: "Rad etilgan" };
  if (log.status === "completed") return { icon: outgoing ? PhoneOutgoing : PhoneIncoming, color: "text-medical-green", label: "Bog'langan" };
  return { icon: outgoing ? PhoneOutgoing : PhoneIncoming, color: "text-muted-foreground", label: "Qo'ng'iroq" };
};

const CallHistory = ({ peerId, groupId }: CallHistoryProps) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    let q = supabase.from("call_logs" as any).select("*").order("started_at", { ascending: false }).limit(20);
    if (groupId) {
      q = q.eq("group_id", groupId);
    } else if (peerId) {
      q = q.or(`and(caller_id.eq.${user.id},callee_id.eq.${peerId}),and(caller_id.eq.${peerId},callee_id.eq.${user.id})`);
    }
    const { data } = await q;
    setLogs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel(`call-logs-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "call_logs" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, peerId, groupId]);

  if (loading) {
    return <div className="p-6 flex justify-center"><Loader2 size={20} className="animate-spin text-primary" /></div>;
  }

  if (logs.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
        <Phone size={24} className="opacity-40" />
        Qo'ng'iroqlar tarixi bo'sh
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {logs.map((log) => {
        const { icon: Icon, color, label } = statusMeta(log, user?.id);
        const outgoing = log.caller_id === user?.id;
        const name = outgoing ? (log.callee_name || "Foydalanuvchi") : (log.caller_name || "Foydalanuvchi");
        return (
          <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`shrink-0 ${color}`}><Icon size={18} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{name}</p>
              <p className="text-xs text-muted-foreground">
                {label}{log.duration_seconds ? ` • ${fmtDuration(log.duration_seconds)}` : ""}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CallHistory;
