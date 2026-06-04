import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHome from "@/components/dashboard/DashboardHome";
import AIRadiologist from "@/components/modules/AIRadiologist";
import SmartMedicalAdvisor from "@/components/modules/SmartMedicalAdvisor";
import DoctorsListing from "@/components/modules/DoctorsListing";
import TeleRehab from "@/components/modules/TeleRehab";
import PatientsManager from "@/components/modules/PatientsManager";
import AdminPanel from "@/components/modules/AdminPanel";
import ChatModule from "@/components/modules/ChatModule";
import AIChatModule from "@/components/modules/AIChatModule";
import ProfilePage from "@/components/modules/ProfilePage";
import AppointmentsModule from "@/components/modules/AppointmentsModule";
import PrescriptionsModule from "@/components/modules/PrescriptionsModule";
import AuthPage from "./AuthPage";
import LandingPage from "./LandingPage";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

type Tab = "dashboard" | "radiologist" | "advisor" | "rehab" | "patients" | "admin" | "chat" | "aichat" | "profile" | "doctors" | "appointments" | "prescriptions";

const AppContent = () => {
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showAuth, setShowAuth] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("auth") === "1") {
      setShowAuth(true);
    }
  }, [searchParams]);

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

  useEffect(() => {
    const handler = (e: any) => {
      const tab = e?.detail?.tab as Tab | undefined;
      const valid: Tab[] = ["dashboard","radiologist","advisor","rehab","patients","admin","chat","aichat","profile","doctors","appointments","prescriptions"];
      if (tab && valid.includes(tab)) setActiveTab(tab);
    };
    window.addEventListener("app:navigate", handler);
    return () => window.removeEventListener("app:navigate", handler);
  }, []);

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
            return signUp(email, password, fullName || "", role, extra);
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
      case "aichat": return <AIChatModule />;
      case "profile": return <ProfilePage />;
      case "doctors": return <DoctorsListing />;
      case "appointments": return <AppointmentsModule />;
      case "prescriptions": return <PrescriptionsModule />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab} onSignOut={signOut} userName={user.user_metadata?.full_name}>
      {renderContent()}
    </DashboardLayout>
  );
};

const Index = () => (
  <AuthProvider>
    <CallProvider>
      <AppContent />
    </CallProvider>
  </AuthProvider>
);

export default Index;
