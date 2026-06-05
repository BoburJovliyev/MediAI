import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Image as ImageIcon, Users, ArrowLeft, Megaphone, Lock, Stethoscope, Search, Loader2, Video, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import VideoCall from "./VideoCall";
import { validateUpload, validateImageDimensions, MAX_IMAGE_DIMENSION } from "@/lib/uploadValidation";
import { CHAT_MEDIA_BUCKET, resolveMessageMedia, resolveMediaUrl } from "@/lib/signedUrl";

interface DoctorGroup {
  id: string;
  doctor_id: string;
  name: string;
  avatar_url: string | null;
  specialty: string | null;
  description: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  memberCount?: number;
}

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  message: string | null;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  is_deleted: boolean;
}

const GroupsView = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<DoctorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DoctorGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [inCall, setInCall] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [myName, setMyName] = useState("Foydalanuvchi");
  const lobbyRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isOwner = !!(selected && user && selected.doctor_id === user.id);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setMyName((data as any)?.full_name || "Foydalanuvchi"));
  }, [user]);

  // Lobby presence: know whether the doctor has an active call
  useEffect(() => {
    if (!selected || !user) return;
    setCallActive(false);
    setInCall(false);
    const channel = supabase.channel(`group-call-${selected.id}`, { config: { presence: { key: user.id } } });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, any[]>;
      const doctorPresent = Object.values(state).some((arr) => arr.some((m: any) => m.role === "doctor"));
      setCallActive(doctorPresent);
    });
    channel.subscribe();
    lobbyRef.current = channel;
    return () => { supabase.removeChannel(channel); lobbyRef.current = null; };
  }, [selected?.id, user?.id]);

  // Announce presence in the lobby while in a call
  useEffect(() => {
    const ch = lobbyRef.current;
    if (!ch) return;
    if (inCall) {
      ch.track({ role: isOwner ? "doctor" : "member", name: myName });
    } else {
      ch.untrack();
    }
  }, [inCall, isOwner, myName]);

  useEffect(() => {
    if (!user) return;
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    setLoading(true);
    // groups where user is owner doctor OR member (RLS handles visibility)
    const { data: gs } = await (supabase.from("doctor_groups" as any) as any)
      .select("id, doctor_id, name, avatar_url, specialty, description")
      .order("created_at", { ascending: false });

    const list: DoctorGroup[] = [];
    for (const g of (gs || []) as any[]) {
      const { data: lastMsg } = await (supabase.from("group_messages" as any) as any)
        .select("message, image_url, file_name, created_at")
        .eq("group_id", g.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const { count } = await (supabase.from("group_members" as any) as any)
        .select("id", { count: "exact", head: true })
        .eq("group_id", g.id);
      const lm: any = lastMsg?.[0];
      list.push({
        ...g,
        lastMessage: lm ? (lm.message || (lm.image_url ? "📷 Rasm" : lm.file_name || "")) : "",
        lastMessageTime: lm?.created_at,
        memberCount: count || 0,
      });
    }
    list.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
    setGroups(list);
    setLoading(false);
  };

  const loadMessages = async (group: DoctorGroup) => {
    const { data } = await (supabase.from("group_messages" as any) as any)
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });
    setMessages((await resolveMessageMedia((data || []) as any)) as any);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected);
    const channel = supabase
      .channel(`group_${selected.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${selected.id}` },
        async (payload) => {
          const m = payload.new as any;
          m.image_url = await resolveMediaUrl(m.image_url);
          setMessages(prev => prev.some((x: any) => x.id === m.id) ? prev : [...prev, m]);
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected?.id]);

  const sendMessage = async () => {
    if (!user || !selected || !isOwner) return;
    const text = newMessage.trim();
    if (!text) return;
    setNewMessage("");
    const { error } = await (supabase.from("group_messages" as any) as any).insert({
      group_id: selected.id,
      sender_id: user.id,
      message: text,
    });
    if (error) toast.error("Xabar yuborilmadi");
    else loadGroups();
  };

  const sendImage = async (file: File) => {
    if (!user || !selected || !isOwner) return;
    const valid = validateUpload(file, "image");
    if (!valid.ok) { toast.error(valid.error!); return; }
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("chat-files").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("chat-files").getPublicUrl(path);
      const { error } = await (supabase.from("group_messages" as any) as any).insert({
        group_id: selected.id,
        sender_id: user.id,
        image_url: pub.publicUrl,
      });
      if (error) throw error;
      loadGroups();
    } catch (e: any) {
      toast.error(e.message || "Yuklab bo'lmadi");
    } finally {
      setUploading(false);
    }
  };

  const filtered = groups.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-12rem)] flex rounded-2xl overflow-hidden border border-border bg-card">
      {/* Groups list */}
      <div className={`w-full md:w-80 border-r border-border flex flex-col bg-card ${showMobileChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border space-y-3">
          <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
            <Megaphone size={20} className="text-primary" /> Guruhlar
          </h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Guruh qidirish..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8"><Loader2 size={20} className="animate-spin inline text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm px-4">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p>Hozircha guruhlar yo'q.</p>
              <p className="text-xs mt-1">Shifokorga bemor sifatida qo'shilganingizda guruhga avtomatik kirasiz.</p>
            </div>
          ) : filtered.map(g => (
            <button key={g.id} onClick={() => { setSelected(g); setShowMobileChat(true); }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left ${selected?.id === g.id ? "bg-secondary" : ""}`}>
              {g.avatar_url ? (
                <img src={g.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Stethoscope size={20} className="text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                  {g.lastMessageTime && <span className="text-[10px] text-muted-foreground">{format(new Date(g.lastMessageTime), "HH:mm")}</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{g.lastMessage || `${g.memberCount} a'zo`}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Megaphone size={48} className="mb-3 opacity-30" />
            <p>Guruhni tanlang</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              <button onClick={() => setShowMobileChat(false)} className="md:hidden text-muted-foreground"><ArrowLeft size={20} /></button>
              {selected.avatar_url ? (
                <img src={selected.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Stethoscope size={18} className="text-primary" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.memberCount} a'zo • Kanal</p>
              </div>
              {isOwner ? (
                <button onClick={() => setInCall(true)} disabled={inCall}
                  className="px-3 py-2 rounded-xl bg-medical-green-light text-medical-green hover:opacity-80 transition-opacity flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
                  title="Video chat boshlash">
                  <Video size={18} /> <span className="hidden sm:inline">Video chat</span>
                </button>
              ) : callActive && !inCall ? (
                <button onClick={() => setInCall(true)}
                  className="px-3 py-2 rounded-xl bg-medical-green text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 text-sm font-medium animate-pulse"
                  title="Video chatga qo'shilish">
                  <Video size={18} /> <span className="hidden sm:inline">Qo'shilish</span>
                </button>
              ) : null}
            </div>

            {callActive && !inCall && (
              <div className="px-4 py-2 bg-medical-green-light border-b border-border flex items-center gap-2 text-sm text-medical-green">
                <Video size={16} />
                <span className="flex-1">Shifokor video chat boshladi</span>
                <button onClick={() => setInCall(true)} className="px-3 py-1 rounded-lg bg-medical-green text-white text-xs font-semibold">
                  Qo'shilish
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/30">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">Xabarlar yo'q</div>
              ) : messages.map(m => (
                <div key={m.id} className="flex">
                  <div className="max-w-[80%] rounded-2xl bg-card border border-border p-3 shadow-sm">
                    {m.image_url && (
                      <img src={m.image_url} alt="" className="rounded-lg mb-2 max-h-80 object-contain" />
                    )}
                    {m.message && <p className="text-sm text-foreground whitespace-pre-wrap break-words">{m.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">{format(new Date(m.created_at), "HH:mm")}</p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {isOwner ? (
              <div className="p-3 border-t border-border flex items-end gap-2 bg-card">
                <button onClick={() => imgInputRef.current?.click()} disabled={uploading}
                  className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/70 text-muted-foreground" title="Rasm">
                  <ImageIcon size={18} />
                </button>
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) sendImage(f); e.target.value = ""; }} />
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Bemorlaringiz uchun xabar yozing..." rows={1}
                  className="flex-1 resize-none px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32" />
                <button onClick={sendMessage} disabled={!newMessage.trim() || uploading}
                  className="p-2.5 rounded-xl gradient-primary text-primary-foreground disabled:opacity-50">
                  <Send size={18} />
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-border bg-card flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Lock size={14} />
                <span>Faqat shifokor xabar yoza oladi</span>
              </div>
            )}
          </>
        )}
      </div>
      {inCall && selected && user && (
        <VideoCall
          roomId={`group-${selected.id}`}
          selfId={user.id}
          selfName={myName}
          title={selected.name}
          onEnd={() => setInCall(false)}
        />
      )}
    </motion.div>
  );
};

export default GroupsView;
