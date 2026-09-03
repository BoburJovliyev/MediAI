import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon: React.ReactNode;
}

const AnimatedCounter = ({ end, duration = 2, suffix = "", prefix = "", label, icon }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-1.5 sm:gap-3 p-2.5 sm:p-6"
    >
      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6">
        {icon}
      </div>
      <div className="text-xl sm:text-3xl md:text-4xl font-display font-bold text-foreground">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-[11px] sm:text-sm text-muted-foreground font-medium text-center leading-tight">{label}</div>
    </motion.div>
  );
};

export default AnimatedCounter;
