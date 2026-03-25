import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHome from "@/components/dashboard/DashboardHome";
import AIRadiologist from "@/components/modules/AIRadiologist";
import SmartMedicalAdvisor from "@/components/modules/SmartMedicalAdvisor";
import TeleRehab from "@/components/modules/TeleRehab";

type Tab = "dashboard" | "radiologist" | "advisor" | "rehab";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardHome onNavigate={setActiveTab} />;
      case "radiologist": return <AIRadiologist />;
      case "advisor": return <SmartMedicalAdvisor />;
      case "rehab": return <TeleRehab />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;
