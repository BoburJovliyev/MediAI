import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHome from "@/components/dashboard/DashboardHome";
import AIRadiologist from "@/components/modules/AIRadiologist";
import SmartMedicalAdvisor from "@/components/modules/SmartMedicalAdvisor";
import DoctorsListing from "@/components/modules/DoctorsListing";
import TeleRehab from "@/components/modules/TeleRehab";
import PatientsManager from "@/components/modules/PatientsManager";
import AdminPanel from "@/components/modules/AdminPanel";
import ChatModule from "@/components/modules/ChatModule";
import ProfilePage from "@/components/modules/ProfilePage";
import AuthPage from "./AuthPage";
import LandingPage from "./LandingPage";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Tab = "dashboard" | "radiologist" | "advisor" | "rehab" | "patients" | "admin" | "chat" | "profile" | "doctors";

const AppContent = () => {
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!user) return;
    const pendingDoctor = localStorage.getItem("pending_doctor_id");
    if (pendingDoctor) {
      supabase.from("doctor_patients").insert({
        doctor_id: pendingDoctor,
        patient_id: user.id,
      }).then(() => {
        localStorage.removeItem("pending_doctor_id");
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !showAuth) {
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  if (!user) {
    return (
      <AuthPage
        onBack={() => setShowAuth(false)}
        onAuth={async (mode, email, password, fullName, role, extra) => {
          if (mode === "signup") {
            const { error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { full_name: fullName, user_role: role || "user", ...extra },
                emailRedirectTo: window.location.origin,
              },
            });
            return { error: error as Error | null };
          }
          return signIn(email, password);
        }}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardHome onNavigate={setActiveTab} />;
      case "radiologist": return <AIRadiologist />;
      case "advisor": return <SmartMedicalAdvisor />;
      case "rehab": return <TeleRehab />;
      case "patients": return <PatientsManager />;
      case "admin": return <AdminPanel />;
      case "chat": return <ChatModule />;
      case "profile": return <ProfilePage />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab} onSignOut={signOut} userName={user.user_metadata?.full_name}>
      {renderContent()}
    </DashboardLayout>
  );
};

const Index = () => (
  <ThemeProvider>
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default Index;
