import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, Users, Signal, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VideoCallProps {
  /** Unique room identifier — everyone joining the same room is connected. */
  roomId: string;
  /** Current user id. */
  selfId: string;
  /** Current user display name. */
  selfName?: string;
  /** Optional title shown at top (peer name for 1:1, group name for calls). */
  title?: string;
  /** Fired once a remote peer's media is flowing. */
  onConnected?: () => void;
  onEnd: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

interface RemotePeer {
  id: string;
  name: string;
  stream: MediaStream | null;
}

const VideoCall = ({ roomId, selfId, selfName, title, onConnected, onEnd }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const makingOfferRef = useRef<Record<string, boolean>>({});
  const ignoreOfferRef = useRef<Record<string, boolean>>({});
  const pendingIceRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const peerNamesRef = useRef<Record<string, string>>({});
  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;
  const connectedFiredRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const restartAttemptsRef = useRef<Record<string, number>>({});

  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [status, setStatus] = useState<"connecting" | "active">("connecting");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [micLevel, setMicLevel] = useState(0); // 0..1 local mic input
  const [remoteActive, setRemoteActive] = useState(false); // remote audio detected
  const [quality, setQuality] = useState<"good" | "fair" | "poor">("good");

  const hasRemote = remotePeers.some((p) => p.stream);

  const fireConnected = useCallback(() => {
    if (!connectedFiredRef.current) {
      connectedFiredRef.current = true;
      onConnectedRef.current?.();
    }
  }, []);



  useEffect(() => {
    if (!hasRemote) return;
    setStatus("active");
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [hasRemote]);

  const upsertRemote = useCallback((id: string, patch: Partial<RemotePeer>) => {
    setRemotePeers((prev) => {
      const existing = prev.find((p) => p.id === id);
      if (existing) return prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      return [...prev, { id, name: peerNamesRef.current[id] || "Foydalanuvchi", stream: null, ...patch }];
    });
  }, []);

  const removeRemote = useCallback((id: string) => {
    peersRef.current[id]?.close();
    delete peersRef.current[id];
    delete makingOfferRef.current[id];
    delete ignoreOfferRef.current[id];
    delete pendingIceRef.current[id];
    setRemotePeers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const send = (payload: any) =>
      channelRef.current?.send({ type: "broadcast", event: "signal", payload: { ...payload, from: selfId } });

    const createPeer = (peerId: string) => {
      if (peersRef.current[peerId]) return peersRef.current[peerId];
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[peerId] = pc;

      localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));

      pc.onicecandidate = (e) => {
        if (e.candidate) send({ kind: "ice", to: peerId, candidate: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        upsertRemote(peerId, { stream: e.streams[0], name: peerNamesRef.current[peerId] });
        fireConnected();
      };
      pc.onnegotiationneeded = async () => {
        try {
          makingOfferRef.current[peerId] = true;
          await pc.setLocalDescription();
          send({ kind: "desc", to: peerId, description: pc.localDescription });
        } catch (err) {
          console.error("negotiation error", err);
        } finally {
          makingOfferRef.current[peerId] = false;
        }
      };
      pc.oniceconnectionstatechange = () => {
        // Auto-retry on failure via ICE restart (up to 3 attempts) before dropping.
        if (pc.iceConnectionState === "failed") {
          const attempts = restartAttemptsRef.current[peerId] || 0;
          if (attempts < 3) {
            restartAttemptsRef.current[peerId] = attempts + 1;
            try { pc.restartIce(); } catch { /* ignore */ }
          } else {
            removeRemote(peerId);
          }
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          restartAttemptsRef.current[peerId] = 0;
          fireConnected();
        }
        if (pc.connectionState === "failed") {
          const attempts = restartAttemptsRef.current[peerId] || 0;
          if (attempts >= 3) removeRemote(peerId);
        }
      };

      upsertRemote(peerId, {});
      return pc;
    };

    const flushIce = async (peerId: string, pc: RTCPeerConnection) => {
      const queued = pendingIceRef.current[peerId] || [];
      pendingIceRef.current[peerId] = [];
      for (const c of queued) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
      }
    };

    const handleSignal = async (payload: any) => {
      if (!payload || payload.from === selfId || payload.to !== selfId) return;
      const peerId = payload.from as string;
      if (payload.name) peerNamesRef.current[peerId] = payload.name;
      const polite = selfId < peerId; // deterministic role to resolve glare

      if (payload.kind === "desc" && payload.description) {
        const pc = peersRef.current[peerId] || createPeer(peerId);
        const description = payload.description as RTCSessionDescriptionInit;
        const offerCollision =
          description.type === "offer" && (makingOfferRef.current[peerId] || pc.signalingState !== "stable");
        ignoreOfferRef.current[peerId] = !polite && offerCollision;
        if (ignoreOfferRef.current[peerId]) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(description));
          await flushIce(peerId, pc);
          if (description.type === "offer") {
            await pc.setLocalDescription();
            send({ kind: "desc", to: peerId, description: pc.localDescription });
          }
        } catch (err) {
          console.error("desc error", err);
        }
      } else if (payload.kind === "ice" && payload.candidate) {
        const pc = peersRef.current[peerId];
        if (!pc || !pc.remoteDescription) {
          (pendingIceRef.current[peerId] ||= []).push(payload.candidate);
          return;
        }
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); }
        catch (err) { if (!ignoreOfferRef.current[peerId]) console.error("ice error", err); }
      }
    };

    const setup = async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch {
        alert("Kamera va mikrofonga ruxsat berilmadi. Iltimos, brauzer ruxsatlarini tekshiring.");
        onEnd();
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const channel = supabase.channel(`rtc-${roomId}`, {
        config: { broadcast: { self: false }, presence: { key: selfId } },
      });
      channelRef.current = channel;

      channel.on("broadcast", { event: "signal" }, ({ payload }) => handleSignal(payload));

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, any[]>;
        const presentIds = Object.keys(state).filter((id) => id !== selfId);
        presentIds.forEach((id) => {
          const meta = state[id]?.[0] as any;
          if (meta?.name) peerNamesRef.current[id] = meta.name;
          // Deterministic initiator: the lexicographically greater id starts the offer.
          if (!peersRef.current[id] && selfId > id) {
            createPeer(id); // adding tracks triggers onnegotiationneeded -> offer
          }
        });
        // Drop peers who left
        Object.keys(peersRef.current).forEach((id) => {
          if (!presentIds.includes(id)) removeRemote(id);
        });
      });

      channel.subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          await channel.track({ name: selfName || "Foydalanuvchi", at: Date.now() });
        }
      });
    };

    setup();
    return () => {
      cancelled = true;
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, selfId]);

  const end = () => {
    Object.values(peersRef.current).forEach((pc) => pc.close());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    onEnd();
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };
  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const activePeers = remotePeers.filter((p) => p.stream);
  const gridCols =
    activePeers.length <= 1 ? "grid-cols-1" : activePeers.length <= 4 ? "grid-cols-2" : "grid-cols-3";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col"
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-10 p-4 flex items-center justify-center">
        <div className="px-4 py-1.5 rounded-full bg-black/50 text-white text-sm flex items-center gap-2">
          {title && <span className="font-medium">{title}</span>}
          {status === "active" ? (
            <span className="flex items-center gap-1.5">
              <Users size={14} /> {activePeers.length + 1} • {fmt(duration)}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Loader2 size={14} className="animate-spin" /> Ulanmoqda...
            </span>
          )}
        </div>
      </div>

      {/* Remote videos grid */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-2">
        {activePeers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
              {(title || "?").charAt(0).toUpperCase()}
            </div>
            <p className="text-lg font-display font-bold text-foreground">{title || "Qo'ng'iroq"}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Ishtirokchilar kutilmoqda...
            </p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-2 w-full h-full`}>
            {activePeers.map((p) => (
              <div key={p.id} className="relative rounded-2xl overflow-hidden bg-secondary">
                <RemoteVideo stream={p.stream!} />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/50 text-white text-xs">
                  {p.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Local preview */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-24 right-4 w-28 h-40 md:w-36 md:h-52 object-cover rounded-2xl border-2 border-border shadow-elevated bg-secondary"
        />
      </div>

      {/* Controls */}
      <div className="p-6 flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-colors ${micOn ? "bg-secondary text-foreground" : "bg-destructive text-destructive-foreground"}`}
        >
          {micOn ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
        <button onClick={end} className="p-5 rounded-full bg-destructive text-destructive-foreground shadow-glow">
          <PhoneOff size={24} />
        </button>
        <button
          onClick={toggleCam}
          className={`p-4 rounded-full transition-colors ${camOn ? "bg-secondary text-foreground" : "bg-destructive text-destructive-foreground"}`}
        >
          {camOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
      </div>
    </motion.div>
  );
};

const RemoteVideo = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />;
};

export default VideoCall;
