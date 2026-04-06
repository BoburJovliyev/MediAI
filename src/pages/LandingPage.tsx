import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import FloatingObjects from "@/components/landing/FloatingObjects";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import ShowcaseSlider from "@/components/landing/ShowcaseSlider";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PartnersSection from "@/components/landing/PartnersSection";
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
      <TestimonialsSection />
      <Divider />
      <PartnersSection />
      <Divider />
      <FAQSection />

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 border-t border-border/50 py-8 text-center text-sm text-muted-foreground"
      >
        <div className="max-w-5xl mx-auto px-4">
          © 2026 Medi AI. {t("landing.footer")}
        </div>
      </motion.footer>
    </div>
  );
};

export default LandingPage;
