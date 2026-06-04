import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startRingtone, startDialTone, playBlip } from "@/lib/callSounds";
import { toast } from "sonner";
import VideoCall from "@/components/modules/VideoCall";

export interface CallPeer {
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
}

interface ActiveCall {
  roomId: string;
  callLogId: string | null;
  isCaller: boolean;
  peer: CallPeer;
  connected: boolean;
}

interface IncomingCall {
  roomId: string;
  callLogId: string | null;
  fromId: string;
  fromName: string;
  fromAvatar: string | null;
}

interface CallContextType {
  startCall: (peer: CallPeer) => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
};

const NO_ANSWER_MS = 35000;

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [myProfile, setMyProfile] = useState<{ full_name: string; avatar_url: string | null }>({ full_name: "Foydalanuvchi", avatar_url: null });
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [active, setActive] = useState<ActiveCall | null>(null);

  const ringRef = useRef<{ stop: () => void } | null>(null);
  const dialRef = useRef<{ stop: () => void } | null>(null);
  const noAnswerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef<ActiveCall | null>(null);
  const incomingRef = useRef<IncomingCall | null>(null);
  activeRef.current = active;
  incomingRef.current = incoming;

  const stopRing = useCallback(() => { ringRef.current?.stop(); ringRef.current = null; }, []);
  const stopDial = useCallback(() => { dialRef.current?.stop(); dialRef.current = null; }, []);
  const clearNoAnswer = useCallback(() => {
    if (noAnswerTimer.current) { clearTimeout(noAnswerTimer.current); noAnswerTimer.current = null; }
  }, []);

  // Load my profile for outgoing caller name/avatar.
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setMyProfile({ full_name: (data as any).full_name || "Foydalanuvchi", avatar_url: (data as any).avatar_url || null });
      });
  }, [user]);

  const sendToPeer = useCallback(async (peerId: string, event: string, payload: any) => {
    const ch = supabase.channel(`incoming-call-${peerId}`);
    await new Promise<void>((resolve) => ch.subscribe((s) => { if (s === "SUBSCRIBED") resolve(); }));
    await ch.send({ type: "broadcast", event, payload });
    setTimeout(() => supabase.removeChannel(ch), 500);
  }, []);

  // Global signaling listener for the current user.
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`incoming-call-${user.id}`, { config: { broadcast: { self: false } } });

    channel.on("broadcast", { event: "call" }, ({ payload }: any) => {
      if (!payload?.roomId) return;
      // Already on a call → auto-reject as busy.
      if (activeRef.current) {
        supabase.rpc("record_call_status" as any, { _call_id: payload.callLogId, _status: "rejected" });
        sendToPeer(payload.fromId, "reject", { roomId: payload.roomId });
        return;
      }
      setIncoming({
        roomId: payload.roomId,
        callLogId: payload.callLogId ?? null,
        fromId: payload.fromId,
        fromName: payload.fromName || "Foydalanuvchi",
        fromAvatar: payload.fromAvatar ?? null,
      });
      ringRef.current = startRingtone();
      // Auto missed after timeout
      clearNoAnswer();
      noAnswerTimer.current = setTimeout(() => {
        const inc = incomingRef.current;
        if (inc) {
          supabase.rpc("record_call_status" as any, { _call_id: inc.callLogId, _status: "missed" });
          stopRing();
          setIncoming(null);
          playBlip();
        }
      }, NO_ANSWER_MS);
    });

    channel.on("broadcast", { event: "accept" }, ({ payload }: any) => {
      const a = activeRef.current;
      if (a && a.isCaller && a.roomId === payload?.roomId) {
        stopDial();
        clearNoAnswer();
        setActive((prev) => prev ? { ...prev, connected: true } : prev);
      }
    });

    channel.on("broadcast", { event: "reject" }, ({ payload }: any) => {
      const a = activeRef.current;
      if (a && a.isCaller && a.roomId === payload?.roomId) {
        stopDial();
        clearNoAnswer();
        playBlip();
        toast.error("Qo'ng'iroq rad etildi");
        setActive(null);
      }
    });

    channel.on("broadcast", { event: "cancel" }, ({ payload }: any) => {
      const inc = incomingRef.current;
      if (inc && inc.roomId === payload?.roomId) {
        stopRing();
        clearNoAnswer();
        setIncoming(null);
      }
    });

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
      stopRing(); stopDial(); clearNoAnswer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const startCall = useCallback(async (peer: CallPeer) => {
    if (!user) return;
    if (activeRef.current) { toast.info("Siz allaqachon qo'ng'iroqdasiz"); return; }
    const roomId = crypto.randomUUID();

    let callLogId: string | null = null;
    const { data, error } = await supabase.from("call_logs" as any).insert({
      room_id: roomId,
      caller_id: user.id,
      callee_id: peer.user_id,
      caller_name: myProfile.full_name,
      callee_name: peer.full_name,
      status: "ringing",
    }).select("id").maybeSingle();
    if (!error && data) callLogId = (data as any).id;

    await sendToPeer(peer.user_id, "call", {
      roomId, callLogId, fromId: user.id, fromName: myProfile.full_name, fromAvatar: myProfile.avatar_url,
    });

    setActive({ roomId, callLogId, isCaller: true, peer, connected: false });
    dialRef.current = startDialTone();
    toast.info(`${peer.full_name}ga qo'ng'iroq qilinmoqda...`);

    clearNoAnswer();
    noAnswerTimer.current = setTimeout(() => {
      const a = activeRef.current;
      if (a && a.isCaller && !a.connected) {
        supabase.rpc("record_call_status" as any, { _call_id: a.callLogId, _status: "missed" });
        sendToPeer(peer.user_id, "cancel", { roomId });
        stopDial();
        playBlip();
        toast.error("Javob bo'lmadi");
        setActive(null);
      }
    }, NO_ANSWER_MS);
  }, [user, myProfile, sendToPeer, clearNoAnswer, stopDial]);

  const acceptCall = useCallback(async () => {
    const inc = incomingRef.current;
    if (!inc) return;
    stopRing();
    clearNoAnswer();
    await supabase.rpc("record_call_status" as any, { _call_id: inc.callLogId, _status: "connected" });
    await sendToPeer(inc.fromId, "accept", { roomId: inc.roomId });
    setActive({
      roomId: inc.roomId,
      callLogId: inc.callLogId,
      isCaller: false,
      peer: { user_id: inc.fromId, full_name: inc.fromName, avatar_url: inc.fromAvatar },
      connected: true,
    });
    setIncoming(null);
  }, [stopRing, clearNoAnswer, sendToPeer]);

  const rejectCall = useCallback(async () => {
    const inc = incomingRef.current;
    if (!inc) return;
    stopRing();
    clearNoAnswer();
    await supabase.rpc("record_call_status" as any, { _call_id: inc.callLogId, _status: "rejected" });
    await sendToPeer(inc.fromId, "reject", { roomId: inc.roomId });
    setIncoming(null);
  }, [stopRing, clearNoAnswer, sendToPeer]);

  const endActive = useCallback(async () => {
    const a = activeRef.current;
    stopDial();
    clearNoAnswer();
    if (a) {
      if (a.connected) {
        await supabase.rpc("record_call_status" as any, { _call_id: a.callLogId, _status: "completed" });
      } else if (a.isCaller) {
        await supabase.rpc("record_call_status" as any, { _call_id: a.callLogId, _status: "missed" });
        await sendToPeer(a.peer.user_id, "cancel", { roomId: a.roomId });
      }
    }
    setActive(null);
  }, [stopDial, clearNoAnswer, sendToPeer]);

  // Mark connected once the peer media is flowing (caller side fallback).
  const handleConnected = useCallback(() => {
    const a = activeRef.current;
    if (a && !a.connected) {
      stopDial();
      supabase.rpc("record_call_status" as any, { _call_id: a.callLogId, _status: "connected" });
      setActive((prev) => prev ? { ...prev, connected: true } : prev);
    }
  }, [stopDial]);

  return (
    <CallContext.Provider value={{ startCall }}>
      {children}

      {/* Global incoming call overlay */}
      <AnimatePresence>
        {incoming && !active && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}
              className="flex flex-col items-center gap-4"
            >
              {incoming.fromAvatar ? (
                <img src={incoming.fromAvatar} alt="" className="w-28 h-28 rounded-full object-cover border-4 border-primary/40 shadow-glow" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-primary/15 flex items-center justify-center text-primary text-4xl font-bold border-4 border-primary/40 shadow-glow">
                  {incoming.fromName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-center">
                <p className="text-xl font-display font-bold text-foreground">{incoming.fromName}</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                  <Video size={14} /> Kiruvchi video qo'ng'iroq...
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-10">
              <button onClick={rejectCall} className="flex flex-col items-center gap-2">
                <span className="p-5 rounded-full bg-destructive text-destructive-foreground shadow-elevated">
                  <PhoneOff size={26} />
                </span>
                <span className="text-xs text-muted-foreground">Rad etish</span>
              </button>
              <button onClick={acceptCall} className="flex flex-col items-center gap-2">
                <span className="p-5 rounded-full bg-medical-green text-white shadow-glow animate-pulse">
                  <Phone size={26} />
                </span>
                <span className="text-xs text-muted-foreground">Qabul qilish</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active 1:1 video call */}
      {active && user && (
        <VideoCall
          roomId={active.roomId}
          selfId={user.id}
          selfName={myProfile.full_name}
          title={active.peer.full_name}
          onConnected={handleConnected}
          onEnd={endActive}
        />
      )}
    </CallContext.Provider>
  );
};
