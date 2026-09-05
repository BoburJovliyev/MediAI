import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, FileImage, Dumbbell, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const slides = [
  {
    icon: <Brain size={48} />,
    gradient: "from-purple-500/20 via-primary/10 to-transparent",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=400&fit=crop",
    title: { uz: "AI Tashxis Tizimi", ru: "AI Диагностика", en: "AI Diagnostics" },
    desc: {
      uz: "Sun'iy intellekt yordamida kasalliklarni aniqlash va dastlabki tashxis qo'yish. Aniqlik darajasi 95% gacha.",
      ru: "Обнаружение заболеваний и предварительная диагностика с помощью ИИ. Точность до 95%.",
      en: "Disease detection and preliminary diagnosis using AI. Accuracy up to 95%.",
    },
    stats: { uz: "95% aniqlik", ru: "95% точность", en: "95% accuracy" },
  },
  {
    icon: <FileImage size={48} />,
    gradient: "from-blue-500/20 via-primary/10 to-transparent",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&h=400&fit=crop",
    title: { uz: "Rentgen & MRT Tahlili", ru: "Рентген & МРТ Анализ", en: "X-Ray & MRI Analysis" },
    desc: {
      uz: "Tibbiy tasvirlarni AI bilan tahlil qiling. Rentgen, MRT va UZI natijalarini daqiqalar ichida oling.",
      ru: "Анализируйте медицинские изображения с ИИ. Результаты рентгена, МРТ и УЗИ за минуты.",
      en: "Analyze medical images with AI. Get X-ray, MRI and ultrasound results in minutes.",
    },
    stats: { uz: "3 daqiqada natija", ru: "Результат за 3 мин", en: "Results in 3 min" },
  },
  {
    icon: <Dumbbell size={48} />,
    gradient: "from-green-500/20 via-accent/10 to-transparent",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop",
    title: { uz: "Tele-Reabilitatsiya", ru: "Теле-Реабилитация", en: "Tele-Rehabilitation" },
    desc: {
      uz: "Kamera orqali mashqlarni nazorat qiling. AI real-vaqt rejimida harakatlaringizni tahlil qiladi.",
      ru: "Контролируйте упражнения через камеру. ИИ анализирует движения в реальном времени.",
      en: "Monitor exercises via camera. AI analyzes your movements in real-time.",
    },
    stats: { uz: "Real-vaqt nazorat", ru: "Контроль в реальном времени", en: "Real-time monitoring" },
  },
  {
    icon: <MessageCircle size={48} />,
    gradient: "from-teal-500/20 via-primary/10 to-transparent",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop",
    title: { uz: "Xavfsiz Chat", ru: "Защищённый Чат", en: "Secure Chat" },
    desc: {
      uz: "Shifokoringiz bilan xavfsiz tarzda muloqot qiling. Ovozli xabar, fayl yuborish va boshqalar.",
      ru: "Безопасно общайтесь с врачом. Голосовые сообщения, отправка файлов и многое другое.",
      en: "Communicate securely with your doctor. Voice messages, file sharing and more.",
    },
    stats: { uz: "E2E shifrlash", ru: "E2E шифрование", en: "E2E encryption" },
  },
];

const ShowcaseSlider = () => {
  const { lang } = useLanguage();
  const currentLang = (lang || "en") as "uz" | "ru" | "en";
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const go = (dir: number) => {
    setDirection(dir);
    setCurrent((prev) => (prev + dir + slides.length) % slides.length);
  };

  const slide = slides[current];

  const sectionTitle = {
    uz: "Platformamiz imkoniyatlari",
    ru: "Возможности платформы",
    en: "Platform Capabilities",
  };

  return (
    <section className="relative z-10 py-12 sm:py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-foreground text-center mb-8 sm:mb-14"
        >
          {sectionTitle[currentLang]}
        </motion.h2>

        <div className="relative bg-card/60 backdrop-blur-xl rounded-3xl border border-border/50 shadow-elevated overflow-hidden">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-700`} />

          <div className="relative z-10 grid md:grid-cols-2 gap-0 min-h-[400px]">
            {/* Text side */}
            <div className="flex flex-col justify-center p-5 sm:p-8 md:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6"
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  >
                    {slide.icon}
                  </motion.div>

                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {slide.title[currentLang]}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {slide.desc[currentLang]}
                  </p>

                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                    {slide.stats[currentLang]}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Image side */}
            <div className="relative hidden md:flex items-center justify-center p-5 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                  transition={{ duration: 0.6 }}
                  className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl"
                >
                  <img
                    src={slide.image}
                    alt={slide.title[currentLang]}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <div className="relative z-10 flex items-center justify-between px-8 pb-6">
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === current ? "w-8 bg-primary" : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => go(-1)}
                className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground transition-colors"
              >
                <ChevronLeft size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => go(1)}
                className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground transition-colors"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSlider;
