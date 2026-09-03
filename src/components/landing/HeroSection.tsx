import { motion } from "framer-motion";
import { ArrowRight, Activity, Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const { t } = useLanguage();

  return (
    <section id="home" className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] sm:text-sm font-medium mb-5 sm:mb-8"
          >
            <Sparkles size={16} className="animate-pulse" />
            {t("landing.badge")}
            <Activity size={16} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-[clamp(1.65rem,7.5vw,2.25rem)] sm:text-5xl md:text-7xl font-display font-bold text-foreground leading-[1.15] sm:leading-[1.1] mb-4 sm:mb-8"
          >
            {t("landing.hero.title").split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className={i % 3 === 2 ? "text-primary" : ""}
              >
                {word}{" "}
              </motion.span>
            ))}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed"
          >
            {t("landing.hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px -5px hsl(var(--primary) / 0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="gradient-primary text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-base sm:text-lg font-semibold inline-flex items-center justify-center gap-3 shadow-glow"
            >
              {t("landing.getStarted")}
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <ArrowRight size={20} />
              </motion.span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative gradient blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
    </section>
  );
};

export default HeroSection;
