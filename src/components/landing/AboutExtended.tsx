import { motion } from "framer-motion";
import { Brain, Shield, Users, Target, Eye, Award, Cpu, Globe2, Sparkles, Stethoscope } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

type Lang = "uz" | "ru" | "en";

const copy = {
  uz: {
    values: [
      { title: "Missiyamiz", desc: "Har bir insonga sifatli va tez tibbiy yordamni sun'iy intellekt orqali yetkazish." },
      { title: "Vizyonimiz", desc: "O'zbekistonda raqamli salomatlik ekotizimining yetakchi platformasiga aylanish." },
      { title: "Qadriyatlarimiz", desc: "Aniqlik, maxfiylik, insonparvarlik va uzluksiz innovatsiya." },
    ],
    capabilities: [
      { title: "AI Tashxis", desc: "Rentgen, UTT va MRI tasvirlarini soniyalarda tahlil qilish." },
      { title: "Shifokor bilan aloqa", desc: "Chat, video qo'ng'iroq va onlayn qabulga yozilish." },
      { title: "Smart Advisor", desc: "Simptomlar asosida bosqichma-bosqich tavsiyalar." },
      { title: "Xavfsizlik", desc: "Uchdan-uchgacha shifrlash va qat'iy ruxsat siyosati." },
      { title: "3 til", desc: "O'zbek, rus va ingliz tillarida to'liq interfeys." },
      { title: "Rolli tizim", desc: "Bemor, shifokor va administrator uchun alohida imkoniyatlar." },
    ],
    timeline: [
      { title: "G'oya", desc: "Tibbiy tasvirlarni AI bilan tahlil qilish bo'yicha ilk tadqiqotlar." },
      { title: "Prototip", desc: "Birinchi radiologiya moduli va shifokor kabineti ishga tushirildi." },
      { title: "Platforma", desc: "Ratsion AI, video qabul va super admin monitoringi qo'shildi." },
    ],
    stats: ["Tahlil qilingan tasvir", "Foydalanuvchi mamnunligi", "AI qo'llab-quvvatlash", "Til"],
    capabilitiesTitle: "Nimalarni qila olamiz",
    timelineTitle: "Bizning yo'limiz",
    note: "AI Medic natijalari maslahat xarakteriga ega bo'lib, malakali shifokor tashxisini almashtirmaydi. Har qanday jiddiy holatda mutaxassisga murojaat qiling.",
  },
  ru: {
    values: [
      { title: "Наша миссия", desc: "Обеспечить каждого человека качественной и быстрой медицинской помощью с помощью искусственного интеллекта." },
      { title: "Наше видение", desc: "Стать ведущей платформой цифровой экосистемы здоровья в Узбекистане." },
      { title: "Наши ценности", desc: "Точность, конфиденциальность, человечность и непрерывные инновации." },
    ],
    capabilities: [
      { title: "AI-диагностика", desc: "Анализ рентгена, УЗИ и МРТ-изображений за секунды." },
      { title: "Связь с врачом", desc: "Чат, видеозвонки и онлайн-запись на приём." },
      { title: "Smart Advisor", desc: "Пошаговые рекомендации на основе симптомов." },
      { title: "Безопасность", desc: "Сквозное шифрование и строгая политика доступа." },
      { title: "3 языка", desc: "Полный интерфейс на узбекском, русском и английском." },
      { title: "Ролевая система", desc: "Отдельные возможности для пациента, врача и администратора." },
    ],
    timeline: [
      { title: "Идея", desc: "Первые исследования по анализу медицинских изображений с помощью ИИ." },
      { title: "Прототип", desc: "Запущены первый модуль радиологии и кабинет врача." },
      { title: "Платформа", desc: "Добавлены AI-рацион, видеоприём и мониторинг супер-администратора." },
    ],
    stats: ["Проанализированных снимков", "Удовлетворённость пользователей", "AI-поддержка", "Языка"],
    capabilitiesTitle: "Что мы умеем",
    timelineTitle: "Наш путь",
    note: "Результаты AI Medic носят рекомендательный характер и не заменяют диагноз квалифицированного врача. При любом серьёзном состоянии обратитесь к специалисту.",
  },
  en: {
    values: [
      { title: "Our Mission", desc: "Deliver fast, high-quality medical support to everyone through artificial intelligence." },
      { title: "Our Vision", desc: "Become the leading platform of Uzbekistan's digital health ecosystem." },
      { title: "Our Values", desc: "Accuracy, privacy, humanity and continuous innovation." },
    ],
    capabilities: [
      { title: "AI Diagnostics", desc: "Analyze X-ray, ultrasound and MRI images in seconds." },
      { title: "Doctor Connection", desc: "Chat, video calls and online appointment booking." },
      { title: "Smart Advisor", desc: "Step-by-step guidance based on your symptoms." },
      { title: "Security", desc: "End-to-end encryption and strict access policies." },
      { title: "3 Languages", desc: "A complete interface in Uzbek, Russian and English." },
      { title: "Role System", desc: "Dedicated capabilities for patients, doctors and administrators." },
    ],
    timeline: [
      { title: "The Idea", desc: "First research into analyzing medical images with AI." },
      { title: "Prototype", desc: "The first radiology module and doctor workspace went live." },
      { title: "Platform", desc: "Nutrition AI, video appointments and super-admin monitoring were added." },
    ],
    stats: ["Images analyzed", "User satisfaction", "AI support", "Languages"],
    capabilitiesTitle: "What we can do",
    timelineTitle: "Our journey",
    note: "AI Medic results are advisory only and do not replace a qualified doctor's diagnosis. Always consult a specialist for any serious condition.",
  },
} as const;

const valueIcons = [Target, Eye, Award];
const capabilityIcons = [Brain, Stethoscope, Cpu, Shield, Globe2, Users];
const statValues = ["12k+", "98%", "24/7", "3"];
const years = ["2024", "2025", "2026"];

const AboutExtended = () => {
  const { lang } = useLanguage();
  const c = copy[(lang || "en") as Lang] || copy.en;

  return (
  <div className="relative z-10 px-4 pb-10">
    <div className="max-w-6xl mx-auto space-y-20">
      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {c.values.map((v, i) => {
          const Icon = valueIcons[i];
          return (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 30, rotateX: -8 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            whileHover={{ y: -8, rotateY: 4 }}
            style={{ transformStyle: "preserve-3d", perspective: 900 }}
            className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 sm:p-8 shadow-card hover:shadow-elevated transition-shadow"
          >
            <div className="w-14 h-14 rounded-2xl gradient-primary text-primary-foreground flex items-center justify-center shadow-glow mb-5">
              <Icon size={22} />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{v.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
          </motion.div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {c.stats.map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 140 }}
            whileHover={{ y: -6 }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4 sm:p-6 text-center backdrop-blur-xl"
          >
            <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground">{statValues[i]}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Capabilities */}
      <div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground text-center mb-10"
        >
          {c.capabilitiesTitle}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {c.capabilities.map((cap, i) => {
            const Icon = capabilityIcons[i];
            return (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -6, rotateX: 5 }}
              style={{ transformStyle: "preserve-3d", perspective: 900 }}
              className="group card-3d relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-4 sm:p-6 shadow-card hover:border-primary/40 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon size={20} />
              </div>
              <h4 className="font-semibold text-foreground mb-1.5">{cap.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
            </motion.div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground text-center mb-10"
        >
          {c.timelineTitle}
        </motion.h2>
        <div className="relative pl-8 md:pl-0">
          <div className="absolute left-3 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
          <div className="space-y-8">
            {c.timeline.map((item, i) => (
              <motion.div
                key={years[i]}
                initial={{ opacity: 0, x: i % 2 ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`relative md:w-1/2 ${i % 2 ? "md:ml-auto md:pl-10" : "md:pr-10 md:text-right"}`}
              >
                <span className={`absolute top-6 w-3 h-3 rounded-full gradient-primary shadow-glow -left-[26px] md:left-auto ${i % 2 ? "md:-left-1.5" : "md:-right-1.5"}`} />
                <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 sm:p-6 shadow-card">
                  <span className="text-xs font-semibold text-primary">{years[i]}</span>
                  <h4 className="font-semibold text-foreground mt-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl border border-accent/30 bg-accent/5 p-5 sm:p-8 text-center backdrop-blur-xl"
      >
        <Sparkles className="mx-auto text-accent mb-3" size={26} />
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">{c.note}</p>
      </motion.div>
    </div>
  </div>
  );
};

export default AboutExtended;
