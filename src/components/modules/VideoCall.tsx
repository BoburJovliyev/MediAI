import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VideoCallProps {
  roomId: string;
  isCaller: boolean;
  peerName: string;
  peerAvatar: string | null;
  selfId: string;
  onEnd: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const VideoCall = ({ roomId, isCaller, peerName, peerAvatar, selfId, onEnd }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "ended">("connecting");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (status !== "connected") return;
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    let cancelled = false;

    const send = (type: string, payload: any) => {
      channelRef.current?.send({ type: "broadcast", event: "signal", payload: { type, from: selfId, ...payload } });
    };

    const setup = async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        onEnd();
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        setStatus("connected");
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) send("ice", { candidate: e.candidate });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("connected");
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          if (!cancelled) end();
        }
      };

      const channel = supabase.channel(`webrtc-${roomId}`, { config: { broadcast: { self: false } } });
      channelRef.current = channel;

      channel.on("broadcast", { event: "signal" }, async ({ payload }: any) => {
        if (!payload || payload.from === selfId) return;
        try {
          if (payload.type === "ready" && isCaller) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send("offer", { sdp: offer });
          } else if (payload.type === "offer" && !isCaller) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            send("answer", { sdp: answer });
          } else if (payload.type === "answer" && isCaller) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          } else if (payload.type === "ice") {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else if (payload.type === "bye") {
            end();
          }
        } catch (err) {
          console.error("signal error", err);
        }
      });

      channel.subscribe((s) => {
        if (s === "SUBSCRIBED" && !isCaller) send("ready", {});
      });
    };

    setup();
    return () => {
      cancelled = true;
      cleanup(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = (silent = false) => {
    if (!silent) channelRef.current?.send({ type: "broadcast", event: "signal", payload: { type: "bye", from: selfId } });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
  };

  const end = () => {
    setStatus("ended");
    cleanup();
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col">
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {status !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card">
            {peerAvatar ? (
              <img src={peerAvatar} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                {peerName.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-lg font-display font-bold text-foreground">{peerName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Ulanmoqda...
            </p>
          </div>
        )}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 w-32 h-44 md:w-40 md:h-56 object-cover rounded-2xl border-2 border-border shadow-elevated bg-secondary"
        />
        {status === "connected" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/50 text-white text-sm">
            {peerName} • {fmt(duration)}
          </div>
        )}
      </div>

      <div className="p-6 flex items-center justify-center gap-4">
        <button onClick={toggleMic} className={`p-4 rounded-full transition-colors ${micOn ? "bg-secondary text-foreground" : "bg-destructive text-destructive-foreground"}`}>
          {micOn ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
        <button onClick={end} className="p-5 rounded-full bg-destructive text-destructive-foreground shadow-glow">
          <PhoneOff size={24} />
        </button>
        <button onClick={toggleCam} className={`p-4 rounded-full transition-colors ${camOn ? "bg-secondary text-foreground" : "bg-destructive text-destructive-foreground"}`}>
          {camOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
      </div>
    </motion.div>
  );
};

export default VideoCall;
