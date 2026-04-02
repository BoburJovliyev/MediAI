import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Brain, FileImage, Dumbbell, LayoutDashboard,
  Shield, Menu, X, LogOut, User, Users, Moon, Sun, MessageCircle
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/notifications/NotificationBell";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import logo from "@/assets/logo.png";

type Tab = "dashboard" | "radiologist" | "advisor" | "rehab" | "patients" | "admin" | "chat" | "profile";

interface DashboardLayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
  onSignOut?: () => void;
  userName?: string;
}

const DashboardLayout = ({ activeTab, onTabChange, children, onSignOut, userName }: DashboardLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [userRole, setUserRole] = useState<string>("user");

  const allNavItems: { id: Tab; labelKey: string; icon: React.ReactNode; roles: string[] }[] = [
    { id: "dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard size={20} />, roles: ["admin", "doctor", "user", "moderator", "patient"] },
    { id: "radiologist", labelKey: "nav.radiologist", icon: <FileImage size={20} />, roles: ["admin", "doctor", "user", "moderator"] },
    { id: "advisor", labelKey: "nav.advisor", icon: <Brain size={20} />, roles: ["admin", "doctor", "user", "moderator"] },
    { id: "rehab", labelKey: "nav.rehab", icon: <Dumbbell size={20} />, roles: ["admin", "doctor", "user", "moderator"] },
    { id: "chat", labelKey: "nav.chat", icon: <MessageCircle size={20} />, roles: ["admin", "doctor", "patient"] },
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
  }, [user]);

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-card p-6 fixed h-screen">
        <div className="flex items-center gap-3 mb-10">
          <img src={logo} alt="Medi AI" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">Medi AI</h1>
            <p className="text-xs text-muted-foreground">Intelligent Healthcare</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {item.icon}
              {t(item.labelKey)}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            {userName && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <User size={16} className="text-muted-foreground" />
                <span className="truncate">{userName}</span>
              </div>
            )}
            <NotificationBell />
          </div>
          <div className="flex gap-2">
            <button onClick={toggle} className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              {theme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
            </button>
            <button onClick={() => setLang(nextLang as any)} className="px-3 py-2.5 rounded-xl text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all flex items-center gap-1">
              <Globe size={14} /> {langLabel}
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield size={14} />
            <span>HIPAA Compliant • Encrypted</span>
          </div>
          {onSignOut && (
            <button onClick={onSignOut} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
              <LogOut size={18} />
              {t("nav.signout")}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Medi AI" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-display font-bold text-foreground">Medi AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setLang(nextLang as any)} className="text-xs font-bold text-primary px-2 py-1 rounded-lg bg-primary/10">
            {langLabel}
          </button>
          <NotificationBell />
          <button onClick={toggle} className="text-foreground p-1">
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground p-1">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-card border-b border-border p-4 space-y-1"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "gradient-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {item.icon}
                {t(item.labelKey)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
