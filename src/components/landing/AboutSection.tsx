import { motion } from "framer-motion";
import { Brain, Shield, Users } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const AboutSection = () => {
  const { t } = useLanguage();

  const items = [
    { icon: <Brain size={24} />, title: t("landing.about.ai"), desc: t("landing.about.aiDesc"), gradient: "from-primary/20 to-primary/5" },
    { icon: <Shield size={24} />, title: t("landing.about.secure"), desc: t("landing.about.secureDesc"), gradient: "from-accent/20 to-accent/5" },
    { icon: <Users size={24} />, title: t("landing.about.team"), desc: t("landing.about.teamDesc"), gradient: "from-medical-purple/20 to-medical-purple/5" },
  ];

  return (
    <section id="about" className="py-12 sm:py-20 px-4 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            {t("landing.about.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t("landing.about.desc")}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative bg-card/60 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-card hover:shadow-elevated transition-all text-center overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
