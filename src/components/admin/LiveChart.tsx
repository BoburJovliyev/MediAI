import { motion } from "framer-motion";

interface Props {
  data: number[];
  label: string;
  value: string;
  sub?: string;
  hue: string;
  max?: number;
  unit?: string;
}

/**
 * Windows Task Manager style live area chart with 3D-ish depth.
 */
const LiveChart = ({ data, label, value, sub, hue, max = 100, unit = "%" }: Props) => {
  const W = 300;
  const H = 92;
  const points = data.length ? data : [0];
  const step = points.length > 1 ? W / (points.length - 1) : W;
  const y = (v: number) => H - Math.max(0, Math.min(1, v / max)) * (H - 6) - 3;
  const line = points.map((v, i) => `${i * step},${y(v)}`).join(" ");
  const area = `0,${H} ${line} ${(points.length - 1) * step},${H}`;
  const id = label.replace(/\W/g, "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, rotateX: 3 }}
      style={{ transformStyle: "preserve-3d" }}
      className="bg-card border border-border rounded-2xl p-4 shadow-card overflow-hidden relative"
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: hue }} />
      <div className="relative flex items-baseline justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-lg font-display font-bold" style={{ color: hue }}>{value}{unit}</p>
      </div>
      <div className="relative rounded-xl overflow-hidden bg-secondary/40 border border-border/60">
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hue} stopOpacity="0.55" />
              <stop offset="100%" stopColor={hue} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" y1={H * f} x2={W} y2={H * f} stroke="hsl(var(--border))" strokeWidth="0.5" />
          ))}
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={`v${f}`} x1={W * f} y1="0" x2={W * f} y2={H} stroke="hsl(var(--border))" strokeWidth="0.5" />
          ))}
          <motion.polygon points={area} fill={`url(#g-${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
          <motion.polyline
            points={line}
            fill="none"
            stroke={hue}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 3px 6px ${hue}66)` }}
          />
        </svg>
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">60 soniya</span>
        <span className="text-[10px] text-muted-foreground">{sub}</span>
      </div>
    </motion.div>
  );
};

export default LiveChart;
