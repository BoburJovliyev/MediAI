import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, FileImage, LayoutDashboard,
  Shield, LogOut, User, Users, Moon, Sun, MessageCircle, Stethoscope, BotMessageSquare, CalendarClock, Pill,
  MoreHorizontal, X,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/notifications/NotificationBell";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import logo from "@/assets/logo.png";

type Tab = "dashboard" | "radiologist" | "advisor" | "patients" | "admin" | "chat" | "aichat" | "profile" | "doctors" | "appointments" | "prescriptions";

interface DashboardLayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
  onSignOut?: () => void;
  userName?: string;
}

const DashboardLayout = ({ activeTab, onTabChange, children, onSignOut, userName }: DashboardLayoutProps) => {
  const [railOpen, setRailOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [userRole, setUserRole] = useState<string>("user");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const allNavItems: { id: Tab; labelKey: string; icon: React.ReactNode; roles: string[] }[] = [
    { id: "dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard size={20} />, roles: ["admin", "doctor", "user", "moderator", "patient"] },
    { id: "radiologist", labelKey: "nav.radiologist", icon: <FileImage size={20} />, roles: ["admin", "doctor", "user", "patient"] },
    { id: "advisor", labelKey: "nav.advisor", icon: <Brain size={20} />, roles: ["admin", "doctor", "user", "patient"] },
    { id: "chat", labelKey: "nav.chat", icon: <MessageCircle size={20} />, roles: ["admin", "doctor", "patient", "user"] },
    { id: "aichat", labelKey: "nav.aichat", icon: <BotMessageSquare size={20} />, roles: ["admin", "doctor", "patient", "user"] },
    { id: "doctors", labelKey: "nav.doctors", icon: <Stethoscope size={20} />, roles: ["admin", "user", "patient"] },
    { id: "appointments", labelKey: "nav.appointments", icon: <CalendarClock size={20} />, roles: ["admin", "doctor", "user", "patient"] },
    { id: "prescriptions", labelKey: "nav.prescriptions", icon: <Pill size={20} />, roles: ["admin", "doctor", "user", "patient"] },
    { id: "patients", labelKey: "nav.patients", icon: <Users size={20} />, roles: ["admin", "doctor"] },
    { id: "admin", labelKey: "nav.admin", icon: <Shield size={20} />, roles: ["admin"] },
    { id: "profile", labelKey: "nav.profile", icon: <User size={20} />, roles: ["admin", "doctor", "user", "moderator", "patient"] },
  ];

  useEffect(() => {
    if (!user) return;
    const checkRoles = async () => {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as any });
      if (isAdmin) { setUserRole("admin"); return; }
      const { data: isDoctor } = await supabase.rpc("has_role", { _user_id: user.id, _role: "doctor" as any });
      if (isDoctor) { setUserRole("doctor"); return; }
      const { data: isPatient } = await supabase.rpc("has_role", { _user_id: user.id, _role: "patient" as any });
      if (isPatient) { setUserRole("patient"); return; }
      setUserRole("user");
    };
    checkRoles();
    supabase.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setAvatarUrl((data as any)?.avatar_url ?? null);
    });
  }, [user]);

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));
  const primary = navItems.slice(0, 4);
  const rest = navItems.slice(4);

  const Avatar = ({ small = false }: { small?: boolean }) => {
    const cls = small ? "w-8 h-8" : "w-9 h-9";
    return avatarUrl ? (
      <img src={avatarUrl} alt={userName || "user"} className={`${cls} rounded-full object-cover border border-border shrink-0`} />
    ) : (
      <div className={`${cls} rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 shadow-glow`}>
        {(userName || "U").charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-card fixed h-screen">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <motion.img whileHover={{ rotate: 10, scale: 1.08 }} src={logo} alt="Medi AI" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">Medi AI</h1>
              <p className="text-xs text-muted-foreground">Intelligent Healthcare</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-1">
          {navItems.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {item.icon}
              {t(item.labelKey)}
            </motion.button>
          ))}
        </nav>
      </aside>

      {/* Desktop horizontal top bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hidden lg:flex fixed top-0 left-72 right-0 z-40 h-16 items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-2xl"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield size={14} className="text-accent" />
          <span>HIPAA Compliant • Encrypted</span>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground bg-secondary hover:text-foreground transition-all border border-border/60"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {theme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
          </motion.button>

          <LanguageSwitcher compact />

          <NotificationBell />

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => onTabChange("profile")}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-2xl bg-secondary/50 border border-border/60 hover:bg-secondary transition-all"
          >
            <Avatar />
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">{userName || "Foydalanuvchi"}</p>
              <p className="text-[11px] text-muted-foreground capitalize leading-tight">{userRole}</p>
            </div>
          </motion.button>

          {onSignOut && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all border border-border/60"
            >
              <LogOut size={15} />
              {t("nav.signout")}
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Medi AI" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-display font-bold text-foreground">Medi AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher compact />
          <NotificationBell />
          <motion.button whileTap={{ scale: 0.9, rotate: 180 }} onClick={toggle} className="text-foreground p-1">
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
          <button onClick={() => onTabChange("profile")} aria-label="Profil">
            <Avatar small />
          </button>
        </div>
      </div>

      {/* Mobile right-edge rail */}
      <div className="lg:hidden fixed right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setRailOpen((v) => !v)}
          className="w-11 h-11 rounded-2xl gradient-primary text-primary-foreground shadow-glow flex items-center justify-center"
          aria-label="Menyu"
        >
          {railOpen ? <X size={19} /> : <MoreHorizontal size={19} />}
        </motion.button>

        <AnimatePresence>
          {railOpen && (
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="flex flex-col gap-2 p-2 rounded-3xl bg-card/90 backdrop-blur-2xl border border-border/60 shadow-elevated max-h-[60vh] overflow-y-auto"
            >
              {rest.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { onTabChange(item.id); setRailOpen(false); }}
                  title={t(item.labelKey)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                    activeTab === item.id ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground bg-secondary/70"
                  }`}
                >
                  {item.icon}
                </motion.button>
              ))}
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-destructive bg-destructive/10"
                  aria-label={t("nav.signout")}
                >
                  <LogOut size={19} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile bottom navigation */}
      <motion.nav
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto mb-2 max-w-md rounded-3xl bg-card/90 backdrop-blur-2xl border border-border/60 shadow-elevated px-2 py-1.5 flex items-center justify-around">
          {[...primary, navItems.find((n) => n.id === "profile")!].filter(Boolean).map((item) => {
            const active = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.88 }}
                onClick={() => onTabChange(item.id)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-2 min-w-0"
              >
                {active && (
                  <motion.span
                    layoutId="bottomNavPill"
                    className="absolute inset-0 rounded-2xl gradient-primary shadow-glow"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  />
                )}
                <span className={`relative z-10 ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{item.icon}</span>
                <span className={`relative z-10 text-[10px] font-medium truncate max-w-[64px] ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {t(item.labelKey)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-14 lg:pt-20 pb-24 lg:pb-6">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
