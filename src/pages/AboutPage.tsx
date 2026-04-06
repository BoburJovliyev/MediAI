import { useNavigate } from "react-router-dom";
import FloatingObjects from "@/components/landing/FloatingObjects";
import LandingHeader from "@/components/landing/LandingHeader";
import AboutSection from "@/components/landing/AboutSection";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

const AboutPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingObjects />
      <LandingHeader onGetStarted={() => navigate("/?auth=1")} />
      <div className="pt-24"><AboutSection /></div>
      <motion.footer initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="relative z-10 border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <div className="max-w-5xl mx-auto px-4">© 2026 Medi AI. {t("landing.footer")}</div>
      </motion.footer>
    </div>
  );
};

export default AboutPage;
