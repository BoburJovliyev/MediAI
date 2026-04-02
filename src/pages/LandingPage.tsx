import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Brain, FileImage, Dumbbell, MessageCircle, Shield, Activity, Search, Moon, Sun, Phone, Building2, Users, Info } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import logo from "@/assets/logo.png";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const { t } = useLanguage();

  const features = [
    { icon: <FileImage size={28} />, title: "AI Radiologist", desc: "landing.feat.radiology" },
    { icon: <Brain size={28} />, title: "Smart Advisor", desc: "landing.feat.advisor" },
    { icon: <Dumbbell size={28} />, title: "Tele-Rehab", desc: "landing.feat.rehab" },
    { icon: <MessageCircle size={28} />, title: "Secure Chat", desc: "landing.feat.chat" },
    { icon: <Activity size={28} />, title: "Analytics", desc: "landing.feat.analytics" },
    { icon: <Shield size={28} />, title: "HIPAA Compliant", desc: "landing.feat.security" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Medi AI" className="w-10 h-10 rounded-xl object-cover" />
            <h1 className="text-xl font-display font-bold text-foreground">Medi AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <button
              onClick={onGetStarted}
              className="gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
            >
              {t("landing.login")}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Activity size={16} />
              {t("landing.badge")}
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              {t("landing.hero.title")}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("landing.hero.subtitle")}
            </p>
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="gradient-primary text-primary-foreground px-8 py-4 rounded-2xl text-lg font-semibold inline-flex items-center gap-3 shadow-glow hover:opacity-90 transition-all"
            >
              {t("landing.getStarted")}
              <ArrowRight size={20} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                {feat.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feat.title}</h3>
              <p className="text-sm text-muted-foreground">{t(feat.desc)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © 2026 Medi AI. {t("landing.footer")}
      </footer>
    </div>
  );
};

export default LandingPage;
