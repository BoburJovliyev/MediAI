import { useNavigate } from "react-router-dom";
import FloatingObjects from "@/components/landing/FloatingObjects";
import LandingHeader from "@/components/landing/LandingHeader";
import AboutSection from "@/components/landing/AboutSection";
import AboutExtended from "@/components/landing/AboutExtended";
import SiteFooter from "@/components/landing/SiteFooter";

const AboutPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingObjects />
      <LandingHeader onGetStarted={() => navigate("/?auth=1")} />
      <div className="pt-24">
        <AboutSection />
        <AboutExtended />
      </div>
      <SiteFooter />
    </div>
  );
};

export default AboutPage;
