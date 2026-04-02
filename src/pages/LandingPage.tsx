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
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  const navLinks = [
    { label: t("landing.nav.home"), href: "#home" },
    { label: t("landing.nav.about"), href: "#about" },
    { label: t("landing.nav.departments"), href: "#departments" },
    { label: t("landing.nav.contact"), href: "#contact" },
  ];

  const features = [
    { icon: <FileImage size={28} />, title: "AI Radiologist", desc: "landing.feat.radiology" },
    { icon: <Brain size={28} />, title: "Smart Advisor", desc: "landing.feat.advisor" },
    { icon: <Dumbbell size={28} />, title: "Tele-Rehab", desc: "landing.feat.rehab" },
    { icon: <MessageCircle size={28} />, title: "Secure Chat", desc: "landing.feat.chat" },
    { icon: <Activity size={28} />, title: "Analytics", desc: "landing.feat.analytics" },
    { icon: <Shield size={28} />, title: "HIPAA Compliant", desc: "landing.feat.security" },
  ];

  const departments = [
    { icon: <Brain size={32} />, name: t("landing.dept.neurology"), color: "text-medical-purple" },
    { icon: <Activity size={32} />, name: t("landing.dept.cardiology"), color: "text-medical-red" },
    { icon: <FileImage size={32} />, name: t("landing.dept.radiology"), color: "text-medical-blue" },
    { icon: <Dumbbell size={32} />, name: t("landing.dept.rehabilitation"), color: "text-medical-green" },
    { icon: <Users size={32} />, name: t("landing.dept.general"), color: "text-medical-teal" },
    { icon: <Shield size={32} />, name: t("landing.dept.emergency"), color: "text-medical-orange" },
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

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  i === 0
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Search size={18} />
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <LanguageSwitcher compact />
            <button
              onClick={onGetStarted}
              className="gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
            >
              {t("landing.login")}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border"
          >
            <div className="max-w-6xl mx-auto px-4 py-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  placeholder={t("landing.searchPlaceholder")}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="pt-28 pb-16 px-4">
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

      {/* About Us */}
      <section id="about" className="py-20 px-4 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              {t("landing.about.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t("landing.about.desc")}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Brain size={24} />, title: t("landing.about.ai"), desc: t("landing.about.aiDesc") },
              { icon: <Shield size={24} />, title: t("landing.about.secure"), desc: t("landing.about.secureDesc") },
              { icon: <Users size={24} />, title: t("landing.about.team"), desc: t("landing.about.teamDesc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section id="departments" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              {t("landing.departments.title")}
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {departments.map((dept, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all text-center group cursor-pointer"
              >
                <div className={`${dept.color} mb-3 group-hover:scale-110 transition-transform`}>{dept.icon}</div>
                <h3 className="text-sm font-semibold text-foreground">{dept.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-20 px-4 bg-secondary/30">
        <div className="max-w-5xl mx-auto pt-16">
          <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">{t("landing.features.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              {t("landing.contact.title")}
            </h2>
            <p className="text-muted-foreground">{t("landing.contact.desc")}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-8 border border-border"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                placeholder={t("landing.contact.name")}
                className="px-4 py-3 rounded-xl bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                placeholder={t("landing.contact.email")}
                className="px-4 py-3 rounded-xl bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <textarea
              rows={4}
              placeholder={t("landing.contact.message")}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 resize-none"
            />
            <button className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all w-full">
              {t("landing.contact.send")}
            </button>
          </motion.div>
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
