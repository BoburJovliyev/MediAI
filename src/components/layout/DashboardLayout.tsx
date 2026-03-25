import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Brain, FileImage, Dumbbell, LayoutDashboard,
  Shield, Menu, X, Heart, LogOut, User
} from "lucide-react";

type Tab = "dashboard" | "radiologist" | "advisor" | "rehab";

interface DashboardLayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
  onSignOut?: () => void;
  userName?: string;
}

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "radiologist", label: "AI Radiologist", icon: <FileImage size={20} /> },
  { id: "advisor", label: "Medical Advisor", icon: <Brain size={20} /> },
  { id: "rehab", label: "Tele-Rehab", icon: <Dumbbell size={20} /> },
];

const DashboardLayout = ({ activeTab, onTabChange, children, onSignOut, userName }: DashboardLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-card p-6 fixed h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Heart size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">MediFlow AI</h1>
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
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield size={14} />
            <span>HIPAA Compliant • Encrypted</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Heart size={16} className="text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">MediFlow AI</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground p-1">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
                {item.label}
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
