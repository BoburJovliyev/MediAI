import FloatingObjects from "@/components/landing/FloatingObjects";
import SiteFooter from "@/components/landing/SiteFooter";

import FloatingObjects from "@/components/landing/FloatingObjects";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import ShowcaseSlider from "@/components/landing/ShowcaseSlider";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import FAQSection from "@/components/landing/FAQSection";

interface LandingPageProps {
  onGetStarted: () => void;
}

const Divider = () => (
  <div className="max-w-5xl mx-auto px-4">
    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
  </div>
);

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingObjects />
      <LandingHeader onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <StatsSection />
      <Divider />
      <ShowcaseSlider />
      <Divider />
      <HowItWorksSection />
      <Divider />
      <FeaturesSection />
      <Divider />
      <FAQSection />

      <SiteFooter />
    </div>
  );
};


export default LandingPage;
