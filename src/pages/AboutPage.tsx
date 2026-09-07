import { useNavigate } from "react-router-dom";
import FloatingObjects from "@/components/landing/FloatingObjects";
import ScrollProgress from "@/components/shared/ScrollProgress";
import LandingHeader from "@/components/landing/LandingHeader";
import AboutSection from "@/components/landing/AboutSection";
import AboutExtended from "@/components/landing/AboutExtended";
import SiteFooter from "@/components/landing/SiteFooter";

const AboutPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ScrollProgress />
      <FloatingObjects />
      <LandingHeader onGetStarted={() => navigate("/?auth=1")} />
      <div className="pt-16 sm:pt-24">
        <AboutSection />
        <AboutExtended />
      </div>
      <SiteFooter />
    </div>
  );
};

export default AboutPage;
