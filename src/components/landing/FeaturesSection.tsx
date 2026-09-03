import { motion } from "framer-motion";
import { FileImage, Brain, Dumbbell, MessageCircle, Activity, Shield } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    { icon: <FileImage size={24} />, title: "AI Radiologist", desc: "landing.feat.radiology" },
    { icon: <Brain size={24} />, title: "Smart Advisor", desc: "landing.feat.advisor" },
    { icon: <Dumbbell size={24} />, title: "Tele-Rehab", desc: "landing.feat.rehab" },
    { icon: <MessageCircle size={24} />, title: "Secure Chat", desc: "landing.feat.chat" },
    { icon: <Activity size={24} />, title: "Analytics", desc: "landing.feat.analytics" },
    { icon: <Shield size={24} />, title: "HIPAA Compliant", desc: "landing.feat.security" },
  ];

  return (
    <section className="py-12 sm:py-20 px-4 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-foreground text-center mb-8 sm:mb-14"
        >
          {t("landing.features.title")}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="group relative bg-card/60 backdrop-blur-xl rounded-3xl p-7 border border-border/50 shadow-card hover:shadow-elevated transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <motion.div
                  className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5"
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  transition={{ type: "spring" }}
                >
                  {feat.icon}
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(feat.desc)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
