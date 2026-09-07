import { useNavigate } from "react-router-dom";
import FloatingObjects from "@/components/landing/FloatingObjects";
import ScrollProgress from "@/components/shared/ScrollProgress";
import LandingHeader from "@/components/landing/LandingHeader";
import DepartmentsSection from "@/components/landing/DepartmentsSection";
import SiteFooter from "@/components/landing/SiteFooter";

const DepartmentsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ScrollProgress />
      <FloatingObjects />
      <LandingHeader onGetStarted={() => navigate("/?auth=1")} />
      <div className="pt-16 sm:pt-24"><DepartmentsSection /></div>
      <SiteFooter />
    </div>
  );
};

export default DepartmentsPage;
