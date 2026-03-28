import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Image, Paperclip, Reply, Forward, Smile, Check, CheckCheck,
  MoreVertical, Edit2, Trash2, X, MessageCircle, Search, ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChatContact {
  user_id: string;
  full_name: string;
  role: string | null;
  avatar_url: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  reply_to: string | null;
  forwarded_from: string | null;
  is_read: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

const EMOJI_LIST = ["😀", "😂", "❤️", "👍", "👏", "🙏", "😊", "🎉", "💊", "🩺", "💉", "🏥", "✅", "⚠️", "📋", "🔬"];

const ChatModule = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null);
  const [editMessage, setEditMessage] = useState<ChatMessage | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load contacts (doctor-patient relationships)
  useEffect(() => {
    if (!user) return;
    loadContacts();
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;
    
    // Get relationships
    const { data: rels } = await supabase
      .from("doctor_patients")
      .select("*")
      .or(`doctor_id.eq.${user.id},patient_id.eq.${user.id}`);

    if (!rels || rels.length === 0) { setContacts([]); return; }

    const contactIds = rels.map(r => r.doctor_id === user.id ? r.patient_id : r.doctor_id);
    const uniqueIds = [...new Set(contactIds)];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, role, avatar_url")
      .in("user_id", uniqueIds);

    if (!profiles) return;

    // Get last messages and unread counts
    const contactsList: ChatContact[] = [];
    for (const p of profiles) {
      const { data: lastMsg } = await supabase
        .from("chat_messages")
        .select("message, created_at")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${p.user_id}),and(sender_id.eq.${p.user_id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", p.user_id)
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      contactsList.push({
        ...p,
        lastMessage: lastMsg?.[0]?.message || "",
        lastMessageTime: lastMsg?.[0]?.created_at,
        unreadCount: count || 0,
      });
    }

    contactsList.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    setContacts(contactsList);
  };

  // Load messages for selected contact
  useEffect(() => {
    if (!user || !selectedContact) return;
    loadMessages();

    // Mark as read
    supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("sender_id", selectedContact.user_id)
      .eq("receiver_id", user.id)
      .eq("is_read", false)
      .then();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${user.id}-${selectedContact.user_id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chat_messages",
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newMsg = payload.new as ChatMessage;
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedContact.user_id) ||
            (newMsg.sender_id === selectedContact.user_id && newMsg.receiver_id === user.id)
          ) {
            setMessages(prev => [...prev, newMsg]);
            if (newMsg.sender_id === selectedContact.user_id) {
              supabase.from("chat_messages").update({ is_read: true }).eq("id", newMsg.id).then();
            }
          }
        } else if (payload.eventType === "UPDATE") {
          setMessages(prev => prev.map(m => m.id === (payload.new as ChatMessage).id ? payload.new as ChatMessage : m));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedContact, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!user || !selectedContact) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.user_id}),and(sender_id.eq.${selectedContact.user_id},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const sendMsg = async () => {
    if (!user || !selectedContact || (!newMessage.trim() && !forwardMessage)) return;

    if (editMessage) {
      await supabase.from("chat_messages").update({ message: newMessage, is_edited: true, updated_at: new Date().toISOString() }).eq("id", editMessage.id);
      setEditMessage(null);
      setNewMessage("");
      return;
    }

    const msgData: any = {
      sender_id: user.id,
      receiver_id: selectedContact.user_id,
      message: newMessage.trim() || (forwardMessage?.message || ""),
    };

    if (replyTo) msgData.reply_to = replyTo.id;
    if (forwardMessage) {
      msgData.forwarded_from = forwardMessage.id;
      msgData.message = forwardMessage.message;
      if (forwardMessage.image_url) msgData.image_url = forwardMessage.image_url;
      if (forwardMessage.file_url) { msgData.file_url = forwardMessage.file_url; msgData.file_name = forwardMessage.file_name; }
    }

    await supabase.from("chat_messages").insert(msgData);
    setNewMessage("");
    setReplyTo(null);
    setForwardMessage(null);
    loadContacts();
  };

  const handleFileUpload = async (file: File, type: "image" | "file") => {
    if (!user || !selectedContact) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-files").upload(path, file);
    if (error) { toast.error("Yuklashda xatolik"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

    const msgData: any = { sender_id: user.id, receiver_id: selectedContact.user_id };
    if (type === "image") {
      msgData.image_url = urlData.publicUrl;
      msgData.message = "📷 Rasm";
    } else {
      msgData.file_url = urlData.publicUrl;
      msgData.file_name = file.name;
      msgData.message = `📎 ${file.name}`;
    }
    if (replyTo) msgData.reply_to = replyTo.id;

    await supabase.from("chat_messages").insert(msgData);
    setReplyTo(null);
    setUploading(false);
    loadContacts();
  };

  const deleteMsg = async (id: string) => {
    await supabase.from("chat_messages").update({ is_deleted: true, message: "Bu xabar o'chirildi" }).eq("id", id);
    setMenuMessageId(null);
  };

  const getReplyMessage = (replyId: string) => messages.find(m => m.id === replyId);
  const getContactName = (userId: string) => userId === user?.id ? "Siz" : selectedContact?.full_name || "Nomsiz";

  const filteredContacts = contacts.filter(c => c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-border bg-card">
      {/* Contacts sidebar */}
      <div className={`w-full md:w-80 border-r border-border flex flex-col bg-card ${showMobileChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-bold text-foreground text-lg mb-3 flex items-center gap-2">
            <MessageCircle size={20} className="text-primary" /> Chatlar
          </h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Qidirish..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Kontaktlar topilmadi</div>
          ) : filteredContacts.map(c => (
            <button key={c.user_id} onClick={() => { setSelectedContact(c); setShowMobileChat(true); }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left ${selectedContact?.user_id === c.user_id ? "bg-secondary" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {c.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground truncate">{c.full_name}</p>
                  {c.lastMessageTime && <span className="text-[10px] text-muted-foreground">{format(new Date(c.lastMessageTime), "HH:mm")}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage || "Xabar yo'q"}</p>
                  {(c.unreadCount || 0) > 0 && (
                    <span className="w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{c.unreadCount}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
        {!selectedContact ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle size={48} className="mb-3 opacity-30" />
            <p>Suhbat boshlash uchun kontakt tanlang</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <button onClick={() => setShowMobileChat(false)} className="md:hidden text-muted-foreground"><ArrowLeft size={20} /></button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {selectedContact.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{selectedContact.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedContact.role || "user"}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(msg => {
                const isMine = msg.sender_id === user?.id;
                const replyMsg = msg.reply_to ? getReplyMessage(msg.reply_to) : null;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`relative max-w-[75%] group ${isMine ? "order-1" : ""}`}>
                      {/* Reply preview */}
                      {replyMsg && (
                        <div className="text-[11px] px-3 py-1 mb-0.5 rounded-t-xl bg-primary/5 border-l-2 border-primary text-muted-foreground truncate">
                          ↩ {getContactName(replyMsg.sender_id)}: {replyMsg.message?.slice(0, 50)}
                        </div>
                      )}
                      {msg.forwarded_from && (
                        <div className="text-[10px] px-3 py-0.5 text-muted-foreground italic">↗ Yo'naltirilgan xabar</div>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? "gradient-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      } ${msg.is_deleted ? "italic opacity-60" : ""}`}>
                        {msg.image_url && !msg.is_deleted && (
                          <img src={msg.image_url} alt="" className="rounded-xl max-w-[240px] mb-1 cursor-pointer" onClick={() => window.open(msg.image_url!, "_blank")} />
                        )}
                        {msg.file_url && !msg.is_deleted && (
                          <a href={msg.file_url} target="_blank" rel="noopener" className="flex items-center gap-2 underline mb-1">
                            <Paperclip size={14} /> {msg.file_name}
                          </a>
                        )}
                        <p>{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                          <span className="text-[10px] opacity-70">{format(new Date(msg.created_at), "HH:mm")}</span>
                          {msg.is_edited && <span className="text-[10px] opacity-50">tahrirlangan</span>}
                          {isMine && (msg.is_read ? <CheckCheck size={12} className="opacity-70" /> : <Check size={12} className="opacity-50" />)}
                        </div>
                      </div>
                      {/* Context menu */}
                      {!msg.is_deleted && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setMenuMessageId(menuMessageId === msg.id ? null : msg.id)}
                            className="p-1 rounded-full bg-card/80 text-muted-foreground hover:text-foreground">
                            <MoreVertical size={14} />
                          </button>
                          {menuMessageId === msg.id && (
                            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-elevated z-20 min-w-[140px] py-1">
                              <button onClick={() => { setReplyTo(msg); setMenuMessageId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-foreground"><Reply size={12} /> Javob</button>
                              <button onClick={() => { setForwardMessage(msg); setMenuMessageId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-foreground"><Forward size={12} /> Yo'naltirish</button>
                              {isMine && (
                                <>
                                  <button onClick={() => { setEditMessage(msg); setNewMessage(msg.message || ""); setMenuMessageId(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-foreground"><Edit2 size={12} /> Tahrirlash</button>
                                  <button onClick={() => deleteMsg(msg.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-destructive"><Trash2 size={12} /> O'chirish</button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply/Edit/Forward banner */}
            {(replyTo || editMessage || forwardMessage) && (
              <div className="px-4 py-2 bg-secondary/50 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground truncate">
                  {replyTo && <span>↩ Javob: {replyTo.message?.slice(0, 60)}</span>}
                  {editMessage && <span>✏️ Tahrirlash: {editMessage.message?.slice(0, 60)}</span>}
                  {forwardMessage && <span>↗ Yo'naltirish: {forwardMessage.message?.slice(0, 60)}</span>}
                </div>
                <button onClick={() => { setReplyTo(null); setEditMessage(null); setForwardMessage(null); setNewMessage(""); }}
                  className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button onClick={() => setShowEmoji(!showEmoji)} className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Smile size={20} />
                  </button>
                  {showEmoji && (
                    <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-xl p-2 shadow-elevated grid grid-cols-8 gap-1 z-20">
                      {EMOJI_LIST.map(e => (
                        <button key={e} onClick={() => { setNewMessage(prev => prev + e); setShowEmoji(false); }}
                          className="text-lg hover:bg-secondary rounded p-1">{e}</button>
                      ))}
                    </div>
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "image")} />
                <button onClick={() => imageInputRef.current?.click()} className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <Image size={20} />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "file")} />
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <Paperclip size={20} />
                </button>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMsg())}
                  placeholder="Xabar yozing..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={sendMsg} disabled={uploading || (!newMessage.trim() && !forwardMessage)}
                  className="p-2.5 rounded-xl gradient-primary text-primary-foreground disabled:opacity-40 shadow-glow">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ChatModule;
