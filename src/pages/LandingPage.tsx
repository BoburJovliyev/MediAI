import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import FloatingObjects from "@/components/landing/FloatingObjects";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import AboutSection from "@/components/landing/AboutSection";
import DepartmentsSection from "@/components/landing/DepartmentsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ContactSection from "@/components/landing/ContactSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingObjects />
      <LandingHeader onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <StatsSection />
      
      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <AboutSection />
      
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <DepartmentsSection />
      
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <FeaturesSection />
      
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <TestimonialsSection />
      
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <FAQSection />
      
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <ContactSection />

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
