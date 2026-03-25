import { useState } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHome from "@/components/dashboard/DashboardHome";
import AIRadiologist from "@/components/modules/AIRadiologist";
import SmartMedicalAdvisor from "@/components/modules/SmartMedicalAdvisor";
import TeleRehab from "@/components/modules/TeleRehab";
import AuthPage from "./AuthPage";
import { Loader2 } from "lucide-react";

type Tab = "dashboard" | "radiologist" | "advisor" | "rehab";

const AppContent = () => {
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        onAuth={async (mode, email, password, fullName) => {
          if (mode === "signup") return signUp(email, password, fullName || "");
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
    <AppContent />
  </AuthProvider>
);

export default Index;
