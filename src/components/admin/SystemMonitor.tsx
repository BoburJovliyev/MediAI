import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Cpu, HardDrive, MemoryStick, Database, Gauge, RefreshCw, Server, Monitor,
  Wifi, BatteryCharging, Globe, Timer, Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LiveChart from "./LiveChart";


interface Metrics {
  generated_at: string;
  runtime: { deno: string; v8: string; typescript: string; region: string; uptime_s: number };
  memory: { rss_mb: number; heap_total_mb: number; heap_used_mb: number; external_mb: number; system_total_mb: number | null; heap_percent: number };
  cpu: { load_avg: number[] | null; cores: number | null };
  database: { latency_ms: number; status: string; rows: Record<string, number> };
  traffic: { activity_last_24h: number };
}

interface DeviceInfo {
  platform: string;
  cores: number | string;
  memoryGb: number | string;
  screen: string;
  dpr: number;
  language: string;
  timezone: string;
  online: boolean;
  network: string;
  downlink: string;
  storageUsedMb: string;
  storageQuotaMb: string;
  storagePercent: number;
  battery: string;
  batteryPercent: number;
  charging: boolean;
  userAgent: string;
}

/* ---------- 3D-looking radial gauge ---------- */
const Gauge3D = ({ value, label, sub, hue }: { value: number; label: string; sub: string; hue: string }) => {
  const pct = Math.max(0, Math.min(100, value));
  const R = 42;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative bg-card border border-border rounded-2xl p-5 overflow-hidden shadow-card">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: hue }} />
      <div className="relative flex items-center gap-4">
        <div className="relative w-[104px] h-[104px] shrink-0" style={{ perspective: 600 }}>
          <motion.svg
            width="104" height="104" viewBox="0 0 104 104"
            initial={{ rotateX: 24, rotateZ: -6 }}
            animate={{ rotateX: [24, 16, 24] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d", filter: `drop-shadow(0 8px 14px ${hue}55)` }}
          >
            <circle cx="52" cy="52" r={R} fill="none" stroke="hsl(var(--secondary))" strokeWidth="11" />
            <motion.circle
              cx="52" cy="52" r={R} fill="none" stroke={hue} strokeWidth="11" strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C - (C * pct) / 100 }}
              transition={{ duration: 1, ease: "easeOut" }}
              transform="rotate(-90 52 52)"
            />
          </motion.svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-display font-bold text-foreground">{pct.toFixed(0)}%</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm">{label}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{sub}</p>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) => (
  <motion.div
    whileHover={{ y: -3, rotateX: 4 }}
    style={{ transformStyle: "preserve-3d" }}
    className="bg-card border border-border rounded-2xl p-4 shadow-card"
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${accent ?? "bg-primary/10 text-primary"}`}>{icon}</div>
    <p className="text-base font-display font-bold text-foreground break-all">{value}</p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </motion.div>
);

const fmtUptime = (s: number) => {
  if (!s) return "—";
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return `${d ? d + "k " : ""}${h}s ${m}d`;
};

const SystemMonitor = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [fps, setFps] = useState(0);
  const [history, setHistory] = useState<Record<string, number[]>>({
    heap: [], rss: [], latency: [], traffic: [], fps: [], storage: [], battery: [],
  });
  const lastAlert = useRef(0);

  const push = useCallback((key: string, value: number) => {
    setHistory((h) => {
      const arr = [...(h[key] || []), Number.isFinite(value) ? value : 0];
      return { ...h, [key]: arr.slice(-60) };
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("system-metrics");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const m = data as Metrics;
      setMetrics(m);
      push("heap", m.memory.heap_percent);
      push("rss", m.memory.rss_mb);
      push("latency", m.database.latency_ms);
      push("traffic", m.traffic.activity_last_24h);
      // anomaly detection
      const now = Date.now();
      const anomalies: string[] = [];
      if (m.memory.heap_percent > 85) anomalies.push(`RAM yuklamasi yuqori: ${m.memory.heap_percent.toFixed(0)}%`);
      if (m.database.latency_ms > 600) anomalies.push(`Baza javob vaqti sekin: ${m.database.latency_ms} ms`);
      if (m.database.status !== "healthy") anomalies.push(`Baza holati: ${m.database.status}`);
      if (anomalies.length && now - lastAlert.current > 60000) {
        lastAlert.current = now;
        toast.warning("Anomaliya aniqlandi", { description: anomalies.join(" · ") });
      }
    } catch (e: any) {
      toast.error(e.message || "Server ma'lumotlarini olishda xatolik");
    } finally {
      setLoading(false);
    }
  }, [push]);


  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  /* Device / browser telemetry */
  useEffect(() => {
    let cancelled = false;
    const collect = async () => {
      const nav: any = navigator;
      let storageUsed = 0, storageQuota = 0;
      try {
        const est = await navigator.storage?.estimate?.();
        storageUsed = est?.usage ?? 0; storageQuota = est?.quota ?? 0;
      } catch { /* ignore */ }
      let batteryPercent = -1, charging = false;
      try {
        const b = await nav.getBattery?.();
        if (b) { batteryPercent = Math.round(b.level * 100); charging = b.charging; }
      } catch { /* ignore */ }
      const conn = nav.connection || {};
      if (cancelled) return;
      setDevice({
        platform: nav.userAgentData?.platform || nav.platform || "Noma'lum",
        cores: nav.hardwareConcurrency ?? "—",
        memoryGb: nav.deviceMemory ?? "—",
        screen: `${window.screen.width}×${window.screen.height}`,
        dpr: window.devicePixelRatio,
        language: nav.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        online: nav.onLine,
        network: conn.effectiveType || "—",
        downlink: conn.downlink ? `${conn.downlink} Mb/s` : "—",
        storageUsedMb: (storageUsed / 1048576).toFixed(1),
        storageQuotaMb: (storageQuota / 1048576).toFixed(0),
        storagePercent: storageQuota ? (storageUsed / storageQuota) * 100 : 0,
        battery: batteryPercent >= 0 ? `${batteryPercent}%` : "—",
        batteryPercent: batteryPercent >= 0 ? batteryPercent : 0,
        charging,
        userAgent: nav.userAgent,
      });
    };
    collect();
    const t = setInterval(collect, 15000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  /* live FPS meter (client render load) */
  useEffect(() => {
    let frames = 0, last = performance.now(), raf = 0;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) { setFps(frames); frames = 0; last = now; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* sample client-side series every 2s */
  useEffect(() => {
    const t = setInterval(() => {
      push("fps", fps);
      push("storage", device?.storagePercent ?? 0);
      push("battery", device?.batteryPercent ?? 0);
    }, 2000);
    return () => clearInterval(t);
  }, [fps, device, push]);



  const dbStatusColor = metrics?.database.status === "healthy"
    ? "bg-medical-green-light text-medical-green"
    : metrics?.database.status === "degraded"
      ? "bg-medical-orange-light text-medical-orange"
      : "bg-medical-red-light text-medical-red";

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Server size={20} /></div>
          <div>
            <h3 className="font-display font-bold text-foreground">Tizim nazorati</h3>
            <p className="text-xs text-muted-foreground">
              {metrics ? `Yangilandi: ${new Date(metrics.generated_at).toLocaleTimeString()}` : "Yuklanmoqda..."}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Yangilash
        </button>
      </div>

      {/* SERVER */}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Server (backend runtime)</p>
        <div className="grid md:grid-cols-3 gap-4">
          <Gauge3D
            value={metrics?.memory.heap_percent ?? 0}
            label="RAM (heap)"
            sub={`${metrics?.memory.heap_used_mb ?? 0} MB / ${metrics?.memory.heap_total_mb ?? 0} MB · RSS ${metrics?.memory.rss_mb ?? 0} MB`}
            hue="hsl(195, 85%, 45%)"
          />
          <Gauge3D
            value={Math.min(100, ((metrics?.database.latency_ms ?? 0) / 800) * 100)}
            label="Baza javob vaqti"
            sub={`${metrics?.database.latency_ms ?? 0} ms · ${metrics?.database.status ?? "—"}`}
            hue="hsl(165, 60%, 45%)"
          />
          <Gauge3D
            value={Math.min(100, (metrics?.traffic.activity_last_24h ?? 0) / 5)}
            label="24 soatlik yuklama"
            sub={`${metrics?.traffic.activity_last_24h ?? 0} ta hodisa oxirgi kunda`}
            hue="hsl(270, 60%, 58%)"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Stat icon={<Cpu size={17} />} label="Runtime yadrolari" value={String(metrics?.cpu.cores ?? "—")} />
          <Stat icon={<Timer size={17} />} label="Uptime" value={fmtUptime(metrics?.runtime.uptime_s ?? 0)} accent="bg-medical-teal-light text-medical-teal" />
          <Stat icon={<Globe size={17} />} label="Region" value={metrics?.runtime.region ?? "—"} accent="bg-medical-blue-light text-medical-blue" />
          <Stat icon={<MemoryStick size={17} />} label="Tashqi xotira" value={`${metrics?.memory.external_mb ?? 0} MB`} accent="bg-medical-purple-light text-medical-purple" />
        </div>

        {/* DB rows */}
        <div className="bg-card border border-border rounded-2xl p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2"><Database size={17} className="text-primary" /> Baza hajmi (yozuvlar)</h4>
            <span className={`medical-badge ${dbStatusColor}`}>{metrics?.database.status ?? "—"}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(metrics?.database.rows ?? {}).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-secondary/60 px-4 py-3">
                <p className="text-lg font-display font-bold text-foreground">{v}</p>
                <p className="text-[11px] text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DEVICE */}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Super admin qurilmasi</p>
        <div className="grid md:grid-cols-3 gap-4">
          <Gauge3D
            value={device?.storagePercent ?? 0}
            label="Qurilma xotirasi (ROM)"
            sub={`${device?.storageUsedMb ?? 0} MB / ${device?.storageQuotaMb ?? 0} MB band`}
            hue="hsl(25, 90%, 55%)"
          />
          <Gauge3D
            value={device?.batteryPercent ?? 0}
            label={device?.charging ? "Batareya (quvvatlanmoqda)" : "Batareya"}
            sub={`Holat: ${device?.battery ?? "—"}`}
            hue="hsl(142, 60%, 45%)"
          />
          <Gauge3D
            value={Math.min(100, (fps / 60) * 100)}
            label="Render unumdorligi"
            sub={`${fps} FPS · ekran ${device?.screen ?? "—"} @${device?.dpr ?? 1}x`}
            hue="hsl(220, 80%, 58%)"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Stat icon={<Monitor size={17} />} label="Platforma" value={device?.platform ?? "—"} />
          <Stat icon={<Cpu size={17} />} label="Protsessor yadrolari" value={String(device?.cores ?? "—")} accent="bg-medical-teal-light text-medical-teal" />
          <Stat icon={<MemoryStick size={17} />} label="Qurilma RAM" value={device?.memoryGb === "—" ? "—" : `${device?.memoryGb} GB`} accent="bg-medical-purple-light text-medical-purple" />
          <Stat icon={<HardDrive size={17} />} label="Kesh hajmi" value={`${device?.storageUsedMb ?? 0} MB`} accent="bg-medical-orange-light text-medical-orange" />
          <Stat icon={<Wifi size={17} />} label="Tarmoq turi" value={device?.network ?? "—"} accent="bg-medical-blue-light text-medical-blue" />
          <Stat icon={<Activity size={17} />} label="Tezlik" value={device?.downlink ?? "—"} />
          <Stat icon={<BatteryCharging size={17} />} label="Quvvat" value={device?.battery ?? "—"} accent="bg-medical-green-light text-medical-green" />
          <Stat icon={<Gauge size={17} />} label="Vaqt mintaqasi" value={device?.timezone ?? "—"} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 mt-4">
          <p className="text-[11px] text-muted-foreground break-all">{device?.userAgent}</p>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
