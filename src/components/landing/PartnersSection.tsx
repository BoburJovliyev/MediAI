import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

const partners = [
  { name: "TashMI", desc: "Toshkent Tibbiyot Instituti" },
  { name: "MedTech", desc: "AI Solutions" },
  { name: "BioLab", desc: "Laboratoriya xizmatlari" },
  { name: "HealthNet", desc: "Telemedicina" },
  { name: "PharmAI", desc: "Farmatsevtika" },
  { name: "NeuroScan", desc: "Diagnostika" },
];

const titles = {
  uz: "Hamkorlarimiz",
  ru: "Наши партнёры",
  en: "Our Partners",
};

const PartnersSection = () => {
  const { lang } = useLanguage();
  const currentLang = (lang || "en") as "uz" | "ru" | "en";

  return (
    <section className="relative z-10 py-16 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-display font-bold text-foreground text-center mb-10"
        >
          {titles[currentLang]}
        </motion.h2>

        {/* Infinite scroll marquee */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

          <motion.div
            className="flex gap-6"
            animate={{ x: [0, -800] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {[...partners, ...partners, ...partners].map((p, i) => (
              <div
                key={i}
                className="flex-shrink-0 bg-card/40 backdrop-blur-xl border border-border/30 rounded-2xl px-8 py-5 flex flex-col items-center justify-center min-w-[160px] hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mb-2">
                  {p.name.substring(0, 2)}
                </div>
                <span className="text-sm font-semibold text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.desc}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
