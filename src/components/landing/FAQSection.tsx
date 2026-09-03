import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

const faqData = {
  uz: [
    { q: "Medi AI qanday ishlaydi?", a: "Medi AI sun'iy intellekt yordamida rentgen, MRT va UZI tasvirlarini tahlil qiladi, tashxis qo'yishda yordam beradi va davolash bo'yicha tavsiyalar beradi." },
    { q: "Platformadan foydalanish bepulmi?", a: "Ha, asosiy funksiyalar bepul. Har bir foydalanuvchi kuniga 5 ta AI maslahatlash imkoniyatiga ega." },
    { q: "Ma'lumotlarim xavfsizmi?", a: "Albatta. Barcha ma'lumotlar shifrlangan va HIPAA standartlariga mos tarzda saqlanadi." },
    { q: "Doktor bilan qanday bog'lanaman?", a: "Ro'yxatdan o'tib, Shifokorlar bo'limidan istagan doktoringizni tanlang va chat orqali bog'laning." },
    { q: "AI tashxisi qanchalik aniq?", a: "AI tashxislari yuqori aniqlikka ega, lekin professional shifokor tekshiruvini o'rnini bosmaydi. AI faqat yordamchi vosita sifatida ishlatiladi." },
    { q: "Mobil qurilmada ishlasa bo'ladimi?", a: "Ha, platforma to'liq responsive bo'lib, barcha qurilmalarda mukammal ishlaydi." },
  ],
  ru: [
    { q: "Как работает Medi AI?", a: "Medi AI анализирует рентген, МРТ и УЗИ изображения с помощью искусственного интеллекта, помогает в диагностике и даёт рекомендации по лечению." },
    { q: "Бесплатно ли использование платформы?", a: "Да, основные функции бесплатны. Каждый пользователь получает 5 AI-консультаций в день." },
    { q: "Мои данные в безопасности?", a: "Конечно. Все данные зашифрованы и хранятся в соответствии со стандартами HIPAA." },
    { q: "Как связаться с врачом?", a: "Зарегистрируйтесь, выберите врача в разделе Врачи и свяжитесь через чат." },
    { q: "Насколько точен AI-диагноз?", a: "AI-диагностика имеет высокую точность, но не заменяет осмотр профессионального врача. AI используется как вспомогательный инструмент." },
    { q: "Работает ли на мобильных устройствах?", a: "Да, платформа полностью адаптивна и отлично работает на всех устройствах." },
  ],
  en: [
    { q: "How does Medi AI work?", a: "Medi AI analyzes X-ray, MRI, and ultrasound images using artificial intelligence, assists in diagnosis, and provides treatment recommendations." },
    { q: "Is the platform free to use?", a: "Yes, basic features are free. Each user gets 5 AI consultations per day." },
    { q: "Is my data secure?", a: "Absolutely. All data is encrypted and stored in compliance with HIPAA standards." },
    { q: "How do I contact a doctor?", a: "Register, select a doctor from the Doctors section, and connect via chat." },
    { q: "How accurate is the AI diagnosis?", a: "AI diagnostics have high accuracy but do not replace professional medical examination. AI is used as an assistive tool." },
    { q: "Does it work on mobile devices?", a: "Yes, the platform is fully responsive and works perfectly on all devices." },
  ],
};

const titles = { uz: "Tez-tez so'raladigan savollar", ru: "Часто задаваемые вопросы", en: "Frequently Asked Questions" };

const FAQSection = () => {
  const { lang } = useLanguage();
  const currentLang = (lang || "en") as "uz" | "ru" | "en";
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = faqData[currentLang] || faqData.en;

  return (
    <section className="relative z-10 py-12 sm:py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-center text-foreground mb-7 sm:mb-12"
        >
          {titles[currentLang]}
        </motion.h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border border-border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-muted-foreground shrink-0 transition-transform duration-300 ${openIndex === i ? "rotate-180" : ""}`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: openIndex === i ? "auto" : 0, opacity: openIndex === i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
