import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Moon, Sun } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate, useLocation } from "react-router-dom";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import logo from "@/assets/logo.png";

interface LandingHeaderProps {
  onGetStarted: () => void;
}

const LandingHeader = ({ onGetStarted }: LandingHeaderProps) => {
  const { t } = useLanguage();
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: t("landing.nav.home"), href: "/" },
    { label: t("landing.nav.about"), href: "/about" },
    { label: t("landing.nav.departments"), href: "/departments" },
    { label: t("landing.nav.contact"), href: "/contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-3">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto bg-card/70 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-elevated px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.img
                src={logo}
                alt="Medi AI"
                className="w-10 h-10 rounded-xl object-cover"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <h1 className="text-xl font-display font-bold text-foreground">Medi AI</h1>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <motion.button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  whileHover={{ y: -2 }}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                    location.pathname === link.href
                      ? "text-foreground bg-foreground/10 dark:bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </motion.button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <Search size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggle}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>
              <LanguageSwitcher compact />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold shadow-glow"
              >
                {t("landing.login")}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mt-2"
          >
            <div className="max-w-6xl mx-auto bg-card/80 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-elevated px-4 py-3">
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
      </AnimatePresence>
    </header>
  );
};

export default LandingHeader;
