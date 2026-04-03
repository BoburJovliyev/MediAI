import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  type: "circle" | "ring" | "cross" | "dot";
}

const FloatingObjects = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const items: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.15 + 0.05,
      type: (["circle", "ring", "cross", "dot"] as const)[Math.floor(Math.random() * 4)],
    }));
    setParticles(items);
  }, []);

  const renderShape = (p: Particle) => {
    const cls = "text-primary";
    switch (p.type) {
      case "circle":
        return <div className={`rounded-full bg-primary`} style={{ width: p.size, height: p.size, opacity: p.opacity }} />;
      case "ring":
        return <div className="rounded-full border border-primary" style={{ width: p.size * 2, height: p.size * 2, opacity: p.opacity }} />;
      case "cross":
        return (
          <svg width={p.size * 2} height={p.size * 2} viewBox="0 0 12 12" style={{ opacity: p.opacity }}>
            <line x1="0" y1="6" x2="12" y2="6" stroke="hsl(var(--primary))" strokeWidth="1" />
            <line x1="6" y1="0" x2="6" y2="12" stroke="hsl(var(--primary))" strokeWidth="1" />
          </svg>
        );
      case "dot":
        return <div className="rounded-full bg-accent" style={{ width: p.size * 0.8, height: p.size * 0.8, opacity: p.opacity }} />;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 15, -10, 5, 0],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        >
          {renderShape(p)}
        </motion.div>
      ))}
      {/* Gradient orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
          left: "-10%",
          top: "20%",
        }}
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.05) 0%, transparent 70%)",
          right: "-5%",
          top: "60%",
        }}
        animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

export default FloatingObjects;
