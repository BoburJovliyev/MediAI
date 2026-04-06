import { motion } from "framer-motion";
import { UserPlus, Search, Brain, CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const titles = {
  uz: "Qanday ishlaydi?",
  ru: "Как это работает?",
  en: "How It Works?",
};

const steps = [
  {
    icon: <UserPlus size={28} />,
    title: { uz: "Ro'yxatdan o'ting", ru: "Зарегистрируйтесь", en: "Sign Up" },
    desc: {
      uz: "Doctor yoki foydalanuvchi sifatida ro'yxatdan o'ting",
      ru: "Зарегистрируйтесь как врач или пользователь",
      en: "Register as a doctor or user",
    },
  },
  {
    icon: <Search size={28} />,
    title: { uz: "Shifokor tanlang", ru: "Выберите врача", en: "Choose Doctor" },
    desc: {
      uz: "Yo'nalishi bo'yicha shifokorni tanlang va bog'laning",
      ru: "Выберите врача по специализации и свяжитесь",
      en: "Select a doctor by specialty and connect",
    },
  },
  {
    icon: <Brain size={28} />,
    title: { uz: "AI Tahlil", ru: "AI Анализ", en: "AI Analysis" },
    desc: {
      uz: "Sun'iy intellekt yordamida tashxis va tahlil oling",
      ru: "Получите диагностику и анализ с помощью ИИ",
      en: "Get diagnostics and analysis with AI assistance",
    },
  },
  {
    icon: <CheckCircle size={28} />,
    title: { uz: "Natija oling", ru: "Получите результат", en: "Get Results" },
    desc: {
      uz: "Natijalarni ko'ring va shifokor bilan muhokama qiling",
      ru: "Просмотрите результаты и обсудите с врачом",
      en: "View results and discuss with your doctor",
    },
  },
];

const HowItWorksSection = () => {
  const { lang } = useLanguage();
  const currentLang = (lang || "en") as "uz" | "ru" | "en";

  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-display font-bold text-foreground text-center mb-16"
        >
          {titles[currentLang]}
        </motion.h2>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-24 h-24 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-elevated flex items-center justify-center text-primary mx-auto mb-5 relative z-10"
                >
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-glow">
                    {i + 1}
                  </div>
                </motion.div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title[currentLang]}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc[currentLang]}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
