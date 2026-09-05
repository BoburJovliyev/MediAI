import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const testimonials = [
  {
    name: "Dr. Aziza Karimova",
    role: { uz: "Nevropatolog", ru: "Невропатолог", en: "Neurologist" },
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aziza",
    rating: 5,
    text: {
      uz: "Medi AI platformasi mening kundalik amaliyotimni tubdan o'zgartirdi. AI tahlil natijalari juda aniq va tezkor.",
      ru: "Платформа Medi AI кардинально изменила мою ежедневную практику. Результаты AI-анализа очень точные и быстрые.",
      en: "Medi AI has fundamentally transformed my daily practice. AI analysis results are highly accurate and fast.",
    },
  },
  {
    name: "Bobur Toshmatov",
    role: { uz: "Bemor", ru: "Пациент", en: "Patient" },
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bobur",
    rating: 5,
    text: {
      uz: "Reabilitatsiya mashqlari va kamera orqali nazorat juda qulay. Uydan turib davolanish imkoniyati ajoyib!",
      ru: "Реабилитационные упражнения с контролем камеры очень удобны. Возможность лечиться из дома — замечательно!",
      en: "Rehabilitation exercises with camera monitoring are very convenient. Being able to recover from home is amazing!",
    },
  },
  {
    name: "Dr. Sardor Aliyev",
    role: { uz: "Radiolog", ru: "Радиолог", en: "Radiologist" },
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sardor",
    rating: 4,
    text: {
      uz: "Rentgen va MRT tahlili moduli vaqtimni sezilarli darajada tejaydi. AI yordamchisi dastlabki skrining uchun juda foydali.",
      ru: "Модуль анализа рентгена и МРТ значительно экономит моё время. AI-помощник очень полезен для первичного скрининга.",
      en: "The X-ray and MRI analysis module saves me significant time. The AI assistant is very useful for initial screening.",
    },
  },
];

const TestimonialsSection = () => {
  const { lang: currentLang } = useLanguage();

  const title = { uz: "Foydalanuvchi sharhlari", ru: "Отзывы пользователей", en: "User Testimonials" };
  const subtitle = {
    uz: "Platformamizdan foydalanayotgan shifokorlar va bemorlarning fikrlari",
    ru: "Мнения врачей и пациентов, использующих нашу платформу",
    en: "Feedback from doctors and patients using our platform",
  };

  return (
    <section className="relative z-10 py-12 sm:py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-7 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            {title[currentLang]}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle[currentLang]}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -6 }}
              className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-4 sm:p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-12 h-12 rounded-full bg-secondary"
                />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.role[currentLang]}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    size={14}
                    className={si < t.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{t.text[currentLang]}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
