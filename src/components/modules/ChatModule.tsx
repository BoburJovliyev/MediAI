import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Image, Paperclip, Reply, Forward, Smile, Check, CheckCheck,
  MoreVertical, Edit2, Trash2, X, MessageCircle, Search, ArrowLeft, UserPlus, Mail, Mic, Square, Play, Pause, UserCheck, UserX, Copy, Info, Download, Sparkles, Users, Megaphone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import GroupsView from "./GroupsView";

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
  read_at?: string | null;
  edited_at?: string | null;
}

import EmojiPicker from "./EmojiPicker";

const EDIT_DELETE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

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
  const [showNewChat, setShowNewChat] = useState(false);
  const [emailSearch, setEmailSearch] = useState("");
  const [emailResults, setEmailResults] = useState<any[]>([]);
  const [emailSearching, setEmailSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [otherTyping, setOtherTyping] = useState(false);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [analyzingMsgId, setAnalyzingMsgId] = useState<string | null>(null);
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);
  const [myFullName, setMyFullName] = useState<string>("");
  const [reactions, setReactions] = useState<Record<string, { emoji: string; user_id: string }[]>>({});
  const [activeTab, setActiveTab] = useState<"all" | "contacts" | "groups">("all");
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_url, full_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setMyAvatarUrl((data as any)?.avatar_url || null);
        setMyFullName((data as any)?.full_name || "");
      });
  }, [user]);

  const toggleReaction = async (msg: ChatMessage, emoji: string) => {
    if (!user) return;
    setMenuMessageId(null);
    const existing = (reactions[msg.id] || []).find(r => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      // optimistic remove
      setReactions(prev => ({
        ...prev,
        [msg.id]: (prev[msg.id] || []).filter(r => !(r.user_id === user.id && r.emoji === emoji)),
      }));
      await (supabase.from("message_reactions" as any) as any)
        .delete()
        .eq("message_id", msg.id)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      setReactions(prev => ({
        ...prev,
        [msg.id]: [...(prev[msg.id] || []), { emoji, user_id: user.id }],
      }));
      await (supabase.from("message_reactions" as any) as any).insert({
        message_id: msg.id,
        user_id: user.id,
        emoji,
      });
    }
  };

  const sendQuickReaction = (msg: ChatMessage, emoji: string) => toggleReaction(msg, emoji);

  const loadReactions = async (msgIds: string[]) => {
    if (msgIds.length === 0) { setReactions({}); return; }
    const { data } = await (supabase.from("message_reactions" as any) as any)
      .select("message_id, emoji, user_id")
      .in("message_id", msgIds);
    const map: Record<string, { emoji: string; user_id: string }[]> = {};
    (data || []).forEach((r: any) => {
      (map[r.message_id] ||= []).push({ emoji: r.emoji, user_id: r.user_id });
    });
    setReactions(map);
  };

  const analyzeAttachmentWithAI = async (msg: ChatMessage) => {
    if (!user || !selectedContact) return;
    setMenuMessageId(null);
    setAnalyzingMsgId(msg.id);
    try {
      const isImage = !!msg.image_url;
      const url = msg.image_url || msg.file_url;
      const userPrompt = `Foydalanuvchi chatda ${isImage ? "rasm" : "fayl"} yubordi${msg.file_name ? ` (${msg.file_name})` : ""}. Iltimos, uni tibbiy nuqtai nazardan tahlil qiling va qisqa xulosa bering.`;
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          userMessage: userPrompt,
          attachmentUrl: url,
          attachmentType: isImage ? "image" : "file",
          fileName: msg.file_name,
          messages: [],
        },
      });
      if (error) throw error;
      const aiText = data?.response || "AI javob bera olmadi.";
      // Insert AI response as message from current user, referencing original
      await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: selectedContact.user_id,
        message: `🤖 **AI tahlili** (yuborilgan ${isImage ? "rasm" : "fayl"} bo'yicha):\n\n${aiText}`,
        reply_to: msg.id,
      });
      toast.success("AI tahlili tayyor");
      loadContacts();
    } catch (e: any) {
      toast.error(e.message || "AI tahlilida xatolik");
    } finally {
      setAnalyzingMsgId(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadVoiceMessage(blob);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { toast.error("Mikrofonga ruxsat bering"); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
  };

  const uploadVoiceMessage = async (blob: Blob) => {
    if (!user || !selectedContact) return;
    setUploading(true);
    const path = `${user.id}/voice_${Date.now()}.webm`;
    const { error } = await supabase.storage.from("chat-files").upload(path, blob, { contentType: "audio/webm" });
    if (error) { toast.error("Yuklashda xatolik"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);
    await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: selectedContact.user_id,
      message: "🎤 Ovozli xabar",
      file_url: urlData.publicUrl,
      file_name: "voice_message.webm",
    });
    setUploading(false);
    loadContacts();
  };

  const toggleAudioPlay = (msgId: string, url: string) => {
    if (playingAudioId === msgId) {
      audioRefs.current[msgId]?.pause();
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioRefs.current[playingAudioId]) audioRefs.current[playingAudioId].pause();
      if (!audioRefs.current[msgId]) {
        const audio = new Audio(url);
        audio.onended = () => setPlayingAudioId(null);
        audioRefs.current[msgId] = audio;
      }
      audioRefs.current[msgId].play();
      setPlayingAudioId(msgId);
    }
  };

  // Load contacts (all users who have chatted with current user + doctor-patient relationships)
  useEffect(() => {
    if (!user) return;
    loadContacts();
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;
    
    // Get all unique user IDs from chat messages
    const { data: sentMsgs } = await supabase
      .from("chat_messages")
      .select("receiver_id")
      .eq("sender_id", user.id);
    const { data: receivedMsgs } = await supabase
      .from("chat_messages")
      .select("sender_id")
      .eq("receiver_id", user.id);

    // Get doctor-patient relationships too
    const { data: rels } = await supabase
      .from("doctor_patients")
      .select("*")
      .or(`doctor_id.eq.${user.id},patient_id.eq.${user.id}`);

    const chatUserIds = new Set<string>();
    sentMsgs?.forEach(m => chatUserIds.add(m.receiver_id));
    receivedMsgs?.forEach(m => chatUserIds.add(m.sender_id));
    rels?.forEach(r => {
      chatUserIds.add(r.doctor_id === user.id ? r.patient_id : r.doctor_id);
    });
    chatUserIds.delete(user.id);

    if (chatUserIds.size === 0) { setContacts([]); return; }

    const uniqueIds = [...chatUserIds];
    const { data: profilesRaw } = await supabase
      .from("profiles")
      .select("user_id, full_name, role, avatar_url")
      .in("user_id", uniqueIds);

    if (!profilesRaw) return;

    // Hide Super Admin accounts from all users
    const { data: adminRoles } = await supabase.rpc("get_admin_user_ids" as any);
    const adminIds = new Set(((adminRoles as any[]) || []).map((r: any) => r.user_id));
    const profiles = profilesRaw.filter(p => !adminIds.has(p.user_id));

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

  // Search users by email
  const searchByEmail = async () => {
    if (!emailSearch.trim() || emailSearch.trim().length < 3) {
      setEmailResults([]);
      return;
    }
    setEmailSearching(true);
    const { data, error } = await supabase.rpc("search_users_by_email", { search_email: emailSearch.trim() });
    if (!error && data) {
      setEmailResults(data.filter((p: any) => p.user_id !== user?.id));
    }
    setEmailSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => { searchByEmail(); }, 400);
    return () => clearTimeout(timer);
  }, [emailSearch]);

  const startChatWithUser = (profile: any) => {
    const contact: ChatContact = {
      user_id: profile.user_id,
      full_name: profile.full_name || profile.email || "Nomsiz",
      role: profile.role,
      avatar_url: profile.avatar_url,
    };
    // Add to contacts if not already there
    setContacts(prev => {
      if (prev.find(c => c.user_id === profile.user_id)) return prev;
      return [contact, ...prev];
    });
    setSelectedContact(contact);
    setShowNewChat(false);
    setEmailSearch("");
    setEmailResults([]);
    setShowMobileChat(true);
  };

  // Load messages for selected contact
  useEffect(() => {
    if (!user || !selectedContact) return;
    setShowEmoji(false);
    setMenuMessageId(null);
    loadMessages();

    // Mark as read
    supabase
      .from("chat_messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
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
              supabase.from("chat_messages").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", newMsg.id).then();
            }
          }
        } else if (payload.eventType === "UPDATE") {
          setMessages(prev => prev.map(m => m.id === (payload.new as ChatMessage).id ? payload.new as ChatMessage : m));
        }
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "message_reactions",
      }, (payload: any) => {
        const row = (payload.new || payload.old) as any;
        if (!row?.message_id) return;
        setReactions(prev => {
          const list = prev[row.message_id] || [];
          if (payload.eventType === "INSERT") {
            if (list.some(r => r.user_id === row.user_id && r.emoji === row.emoji)) return prev;
            return { ...prev, [row.message_id]: [...list, { emoji: row.emoji, user_id: row.user_id }] };
          }
          if (payload.eventType === "DELETE") {
            return { ...prev, [row.message_id]: list.filter(r => !(r.user_id === row.user_id && r.emoji === row.emoji)) };
          }
          return prev;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedContact, user]);

  // Typing presence channel
  useEffect(() => {
    if (!user || !selectedContact) return;
    const key = [user.id, selectedContact.user_id].sort().join("-");
    const channel = supabase.channel(`typing-${key}`, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "typing" }, (payload: any) => {
      if (payload.payload?.from === selectedContact.user_id) {
        setOtherTyping(true);
        setTimeout(() => setOtherTyping(false), 2500);
      }
    }).subscribe();
    typingChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); typingChannelRef.current = null; setOtherTyping(false); };
  }, [selectedContact, user]);

  const broadcastTyping = () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    typingChannelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: user?.id } });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const loadMessages = async () => {
    if (!user || !selectedContact) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.user_id}),and(sender_id.eq.${selectedContact.user_id},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    const msgs = data || [];
    setMessages(msgs);
    loadReactions(msgs.map((m: any) => m.id));
  };

  const sendMsg = async () => {
    if (!user || !selectedContact || (!newMessage.trim() && !forwardMessage)) return;

    if (editMessage) {
      const ageMs = Date.now() - new Date(editMessage.created_at).getTime();
      if (ageMs > EDIT_DELETE_WINDOW_MS) {
        toast.error("10 daqiqadan keyin xabarni tahrirlab bo'lmaydi");
        setEditMessage(null);
        setNewMessage("");
        return;
      }
      const oldText = editMessage.message || "";
      await supabase.from("chat_messages").update({
        message: newMessage,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", editMessage.id);
      // Activity message visible to both sides
      await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: selectedContact.user_id,
        message: JSON.stringify({ type: "edit_activity", from: user.id, before: oldText.slice(0, 80), after: newMessage.slice(0, 80) }),
      });
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
      msgData.message = null;
    } else {
      msgData.file_url = urlData.publicUrl;
      msgData.file_name = file.name;
      msgData.message = null;
    }
    if (replyTo) msgData.reply_to = replyTo.id;

    await supabase.from("chat_messages").insert(msgData);
    setReplyTo(null);
    setUploading(false);
    loadContacts();
  };

  const deleteMsg = async (msg: ChatMessage) => {
    const ageMs = Date.now() - new Date(msg.created_at).getTime();
    if (ageMs > EDIT_DELETE_WINDOW_MS) {
      toast.error("10 daqiqadan keyin xabarni o'chirib bo'lmaydi");
      setMenuMessageId(null);
      return;
    }
    await supabase.from("chat_messages").update({ is_deleted: true, message: "Bu xabar o'chirildi" }).eq("id", msg.id);
    if (user && selectedContact) {
      await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: selectedContact.user_id,
        message: JSON.stringify({ type: "delete_activity", from: user.id }),
      });
    }
    setMenuMessageId(null);
  };

  const getReplyMessage = (replyId: string) => messages.find(m => m.id === replyId);
  const getContactName = (userId: string) => userId === user?.id ? "Siz" : selectedContact?.full_name || "Nomsiz";

  // Parse invitation payload from message
  const parseInvitation = (message: string | null) => {
    if (!message) return null;
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === "patient_invitation") return parsed;
    } catch { }
    return null;
  };

  const parseActivity = (message: string | null) => {
    if (!message) return null;
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === "invitation_activity" || parsed.type === "edit_activity" || parsed.type === "delete_activity") return parsed;
    } catch { }
    return null;
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Nusxalandi"));
    setMenuMessageId(null);
  };

  const [respondingInvite, setRespondingInvite] = useState<string | null>(null);

  const handleInvitationResponse = async (msg: ChatMessage, accept: boolean) => {
    if (!user) return;
    setRespondingInvite(msg.id);
    try {
      const inv = parseInvitation(msg.message);
      if (!inv) return;

      // Update invitation status
      await supabase
        .from("patient_invitations")
        .update({ status: accept ? "accepted" : "declined", updated_at: new Date().toISOString() })
        .eq("doctor_id", inv.doctor_id)
        .eq("patient_user_id", user.id);

      if (accept) {
        // Create doctor_patients relation
        await supabase.from("doctor_patients").upsert({
          doctor_id: inv.doctor_id,
          patient_id: user.id,
        }, { onConflict: "doctor_id,patient_id" });
        toast.success("Doktorning taklifini qabul qildingiz!");
        // Mark message edited so card updates
        await supabase.from("chat_messages").update({
          message: JSON.stringify({ ...inv, status: "accepted" }),
          is_edited: true,
        }).eq("id", msg.id);
      } else {
        toast.info("Taklif rad etildi.");
        await supabase.from("chat_messages").update({
          message: JSON.stringify({ ...inv, status: "declined" }),
          is_edited: true,
        }).eq("id", msg.id);
      }
      loadContacts();
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setRespondingInvite(null);
    }
  };

  const filteredContacts = contacts.filter(c => c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-border bg-card">
      {/* Contacts sidebar */}
      <div className={`w-full md:w-80 border-r border-border flex flex-col bg-card ${showMobileChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
              <MessageCircle size={20} className="text-primary" /> Chatlar
            </h3>
            <button onClick={() => setShowNewChat(!showNewChat)}
              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Yangi chat">
              <UserPlus size={18} />
            </button>
          </div>
          {showNewChat ? (
            <div className="space-y-2">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={emailSearch} onChange={e => setEmailSearch(e.target.value)}
                  placeholder="Email orqali foydalanuvchi qidiring..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button onClick={() => { setShowNewChat(false); setEmailSearch(""); setEmailResults([]); }}
                className="text-xs text-muted-foreground hover:text-foreground">← Kontaktlarga qaytish</button>
            </div>
          ) : (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Kontaktlardan qidirish..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {showNewChat ? (
            <>
              {emailSearching && <div className="text-center py-4 text-muted-foreground text-sm">Qidirilmoqda...</div>}
              {!emailSearching && emailSearch.length >= 3 && emailResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">Foydalanuvchi topilmadi</div>
              )}
              {!emailSearching && emailSearch.length > 0 && emailSearch.length < 3 && (
                <div className="text-center py-8 text-muted-foreground text-sm">Kamida 3 ta belgi kiriting</div>
              )}
              {emailResults.map((p: any) => (
                <button key={p.user_id} onClick={() => startChatWithUser(p)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {p.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.full_name || "Nomsiz"}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    <p className="text-[10px] text-primary capitalize">{p.role || "user"}</p>
                  </div>
                </button>
              ))}
              {!emailSearching && emailSearch.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Mail size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Email manzilini kiriting</p>
                </div>
              )}
            </>
          ) : (
            <>
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Kontaktlar topilmadi</div>
              ) : filteredContacts.map(c => (
                <button key={c.user_id} onClick={() => { setSelectedContact(c); setShowMobileChat(true); }}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left ${selectedContact?.user_id === c.user_id ? "bg-secondary" : ""}`}>
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {c.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
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
            </>
          )}
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
              {selectedContact.avatar_url ? (
                <img src={selectedContact.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {selectedContact.full_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
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
                return (() => {
                  const activity = parseActivity(msg.message);
                  if (activity) {
                    let label = "";
                    let cls = "bg-secondary text-muted-foreground";
                    if (activity.type === "invitation_activity") {
                      const accepted = activity.status === "accepted";
                      label = accepted ? "Bemor taklifi qabul qilindi" : "Bemor taklifi rad etildi";
                      cls = accepted ? "bg-medical-green-light text-medical-green" : "bg-medical-red-light text-medical-red";
                    } else if (activity.type === "edit_activity") {
                      label = `${activity.from === user?.id ? "Siz" : selectedContact?.full_name || "Foydalanuvchi"} xabarni tahrirladi`;
                      cls = "bg-primary/10 text-primary";
                    } else if (activity.type === "delete_activity") {
                      label = `${activity.from === user?.id ? "Siz" : selectedContact?.full_name || "Foydalanuvchi"} xabarni o'chirdi`;
                      cls = "bg-destructive/10 text-destructive";
                    }
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className={`px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 ${cls}`}>
                          <Info size={12} />
                          {label}
                          <span className="opacity-60">• {format(new Date(msg.created_at), "HH:mm")}</span>
                        </div>
                      </div>
                    );
                  }
                  const inv = parseInvitation(msg.message);
                  if (inv) {
                    const isDone = inv.status === "accepted" || inv.status === "declined";
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className="bg-card border border-primary/30 rounded-2xl p-4 min-w-[240px] max-w-[75%] shadow-card">
                          <div className="flex items-center gap-2 mb-2">
                            <UserCheck size={18} className="text-primary" />
                            <p className="font-semibold text-foreground text-sm">Bemor taklifi</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            {isMine
                              ? (isDone ? (inv.status === "accepted" ? "✅ Qabul qilindi" : "❌ Rad etildi") : "Taklif yuborildi. Bemor javobini kutmoqda...")
                              : "Doktor sizni bemori sifatida qo'shmoqchi. Qabul qilasizmi?"}
                          </p>
                          {!isMine && !isDone && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleInvitationResponse(msg, true)}
                                disabled={respondingInvite === msg.id}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold shadow-glow disabled:opacity-50"
                              >
                                <UserCheck size={14} /> Qabul qilish
                              </button>
                              <button
                                onClick={() => handleInvitationResponse(msg, false)}
                                disabled={respondingInvite === msg.id}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold disabled:opacity-50"
                              >
                                <UserX size={14} /> Rad etish
                              </button>
                            </div>
                          )}
                          {!isMine && isDone && (
                            <p className="text-xs font-semibold text-center">
                              {inv.status === "accepted" ? "✅ Qabul qilindi" : "❌ Rad etildi"}
                            </p>
                          )}
                          <span className="text-[10px] text-muted-foreground block mt-2 text-right">{format(new Date(msg.created_at), "HH:mm")}</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                    {!isMine && (
                      selectedContact?.avatar_url ? (
                        <img src={selectedContact.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold shrink-0">
                          {selectedContact?.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )
                    )}
                    <div className={`relative max-w-[75%] group ${isMine ? "order-1" : ""}`}>
                      {msg.forwarded_from && (
                        <div className="text-[10px] px-3 py-0.5 text-muted-foreground italic">↗ Yo'naltirilgan xabar</div>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? "gradient-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      } ${msg.is_deleted ? "italic opacity-60" : ""}`}>
                        {msg.image_url && !msg.is_deleted && (
                          <div className="relative group/img mb-1">
                            <img
                              src={msg.image_url}
                              alt=""
                              className="rounded-xl max-w-[260px] max-h-[260px] object-cover cursor-zoom-in"
                              onClick={() => setPreviewImage(msg.image_url!)}
                            />
                            <a
                              href={msg.image_url}
                              download
                              target="_blank"
                              rel="noopener"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                              title="Yuklab olish"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        )}
                        {msg.file_url && !msg.is_deleted && msg.file_name?.endsWith(".webm") ? (
                          <div className="flex items-center gap-2 mb-1">
                            <button onClick={() => toggleAudioPlay(msg.id, msg.file_url!)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${isMine ? "bg-white/20" : "bg-primary/10"}`}>
                              {playingAudioId === msg.id ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <div className="flex-1 h-1 rounded-full bg-current opacity-30" />
                            <span className="text-[10px] opacity-70">🎤</span>
                          </div>
                        ) : msg.file_url && !msg.is_deleted ? (
                          <div className={`flex items-center gap-2 mb-1 px-2 py-1.5 rounded-lg ${isMine ? "bg-white/10" : "bg-background/50"}`}>
                            <Paperclip size={14} className="shrink-0" />
                            <span className="flex-1 truncate text-xs">{msg.file_name}</span>
                            <a href={msg.file_url} target="_blank" rel="noopener" download className="p-1 rounded hover:bg-white/20" title="Yuklab olish">
                              <Download size={14} />
                            </a>
                          </div>
                        ) : null}
                        {msg.message && msg.message !== "📷 Rasm" && !(msg.file_url && msg.message?.startsWith("📎 ")) && (
                          <p>{msg.message}</p>
                        )}
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                          <span className="text-[10px] opacity-70">{format(new Date(msg.created_at), "HH:mm")}</span>
                          {msg.is_edited && <span className="text-[10px] opacity-50">tahrirlangan</span>}
                          {isMine && (msg.is_read
                            ? <CheckCheck size={12} className="opacity-70" />
                            : <Check size={12} className="opacity-50" />)}
                        </div>
                      </div>
                      {/* Reactions display */}
                      {(reactions[msg.id] && reactions[msg.id].length > 0) && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                          {Object.entries(
                            reactions[msg.id].reduce<Record<string, { count: number; mine: boolean }>>((acc, r) => {
                              const cur = acc[r.emoji] || { count: 0, mine: false };
                              acc[r.emoji] = { count: cur.count + 1, mine: cur.mine || r.user_id === user?.id };
                              return acc;
                            }, {})
                          ).map(([emoji, info]) => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg, emoji)}
                              className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-colors ${
                                info.mine
                                  ? "bg-primary/15 border-primary/40 text-primary"
                                  : "bg-secondary border-border text-foreground hover:bg-secondary/70"
                              }`}
                              title={info.mine ? "Reaksiyani olib tashlash" : "Reaksiya qo'shish"}
                            >
                              <span>{emoji}</span>
                              <span className="font-semibold">{info.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Context menu */}
                      {!msg.is_deleted && (
                        <div className={`absolute top-1 ${isMine ? "left-1" : "right-1"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <button onClick={() => { setShowEmoji(false); setMenuMessageId(menuMessageId === msg.id ? null : msg.id); }}
                            className="p-1 rounded-full bg-card/80 text-muted-foreground hover:text-foreground">
                            <MoreVertical size={14} />
                          </button>
                          {menuMessageId === msg.id && (
                            <div className={`absolute ${isMine ? "left-0" : "right-0"} top-full mt-1 bg-card border border-border rounded-2xl shadow-elevated z-20 min-w-[260px] py-1 overflow-hidden`}>
                              {/* Quick reactions */}
                              <div className="flex items-center justify-between px-2 py-2 border-b border-border bg-secondary/40">
                                {["❤️","👍","👏","🔥","😂","😮","🙏"].map(em => (
                                  <button
                                    key={em}
                                    onClick={() => sendQuickReaction(msg, em)}
                                    className="text-lg hover:scale-125 transition-transform p-1"
                                  >{em}</button>
                                ))}
                              </div>
                              {isMine && (
                                <div className="px-3 py-2 text-[11px] text-muted-foreground border-b border-border flex items-center gap-1.5">
                                  {msg.is_read ? (
                                    <>
                                      <CheckCheck size={12} className="text-primary" />
                                      <span>O'qildi: {msg.read_at ? format(new Date(msg.read_at), "dd MMM, HH:mm") : "—"}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check size={12} />
                                      <span>Hali o'qilmagan</span>
                                    </>
                                  )}
                                </div>
                              )}
                              {msg.is_edited && msg.edited_at && (
                                <div className="px-3 py-1.5 text-[11px] text-muted-foreground border-b border-border flex items-center gap-1.5">
                                  <Edit2 size={11} />
                                  <span>Tahrirlangan: {format(new Date(msg.edited_at), "dd MMM, HH:mm")}</span>
                                </div>
                              )}
                              <button onClick={() => { setReplyTo(msg); setMenuMessageId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-foreground"><Reply size={12} /> Javob</button>
                              <button onClick={() => { setForwardMessage(msg); setMenuMessageId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-foreground"><Forward size={12} /> Yo'naltirish</button>
                              {msg.message && (
                                <button onClick={() => copyText(msg.message!)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-foreground"><Copy size={12} /> Nusxalash</button>
                              )}
                              {(msg.image_url || msg.file_url) && (
                                <>
                                  <a
                                    href={(msg.image_url || msg.file_url) as string}
                                    download
                                    target="_blank"
                                    rel="noopener"
                                    onClick={() => setMenuMessageId(null)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-foreground"
                                  >
                                    <Download size={12} /> Yuklab olish
                                  </a>
                                  <button
                                    onClick={() => analyzeAttachmentWithAI(msg)}
                                    disabled={analyzingMsgId === msg.id}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-primary disabled:opacity-50"
                                  >
                                    <Sparkles size={12} /> {analyzingMsgId === msg.id ? "Tahlil qilinmoqda..." : "AI tahlil qilish"}
                                  </button>
                                </>
                              )}
                              {isMine && (
                                <>
                                  <button onClick={() => { setEditMessage(msg); setNewMessage(msg.message || ""); setMenuMessageId(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-foreground"><Edit2 size={12} /> Tahrirlash</button>
                                  <button onClick={() => deleteMsg(msg)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-destructive"><Trash2 size={12} /> O'chirish</button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {isMine && (
                      myAvatarUrl ? (
                        <img src={myAvatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 order-2" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[11px] font-bold shrink-0 order-2">
                          {(myFullName || "?").charAt(0).toUpperCase()}
                        </div>
                      )
                    )}
                  </div>
                ); // close regular message return
                })(); // invoke IIFE
              })}
              {otherTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl px-4 py-2 text-xs text-muted-foreground italic flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="ml-1">yozmoqda...</span>
                  </div>
                </div>
              )}
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
              {isRecording ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30">
                    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-sm text-destructive font-medium">
                      {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
                    </span>
                    <span className="text-xs text-muted-foreground">Yozilmoqda...</span>
                  </div>
                  <button onClick={stopRecording} className="p-2.5 rounded-xl bg-destructive text-destructive-foreground shadow-glow">
                    <Square size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button data-emoji-toggle onClick={() => { setMenuMessageId(null); setShowEmoji(!showEmoji); }} className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Smile size={20} />
                    </button>
                    {showEmoji && (
                      <EmojiPicker
                        onSelect={(e) => setNewMessage(prev => prev + e)}
                        onClose={() => setShowEmoji(false)}
                      />
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
                    onChange={e => { setNewMessage(e.target.value); broadcastTyping(); }}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMsg())}
                    placeholder="Xabar yozing..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {newMessage.trim() || forwardMessage ? (
                    <button onClick={sendMsg} disabled={uploading}
                      className="p-2.5 rounded-xl gradient-primary text-primary-foreground disabled:opacity-40 shadow-glow">
                      <Send size={20} />
                    </button>
                  ) : (
                    <button onClick={startRecording} disabled={uploading}
                      className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40">
                      <Mic size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
    {previewImage && (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={() => setPreviewImage(null)}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={() => setPreviewImage(null)}
        >
          <X size={20} />
        </button>
        <a
          href={previewImage}
          download
          target="_blank"
          rel="noopener"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-16 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          title="Yuklab olish"
        >
          <Download size={20} />
        </a>
        <img
          src={previewImage}
          alt="preview"
          className="max-w-full max-h-full rounded-xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    </>
  );
};

export default ChatModule;
