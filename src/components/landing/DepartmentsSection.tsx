import { useState, useRef, MouseEvent } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Brain,
  HeartPulse,
  ScanLine,
  Salad,
  Stethoscope,
  Siren,
  Star,
  Users,
  ChevronDown,
  Check,
  Sparkles,
  Activity,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { departments, deptCopy, DepartmentInfo } from "@/data/departments";

const icons: Record<string, React.ElementType> = {
  Brain,
  HeartPulse,
  ScanLine,
  Salad,
  Stethoscope,
  Siren,
};

const departmentDetails = {
  uz: {
    eyebrow: "Yagona raqamli tibbiyot muhiti",
    title: "Sog‘lig‘ingizga har tomonlama yondashuv",
    description:
      "Medi AI bo‘limlari bir-biri bilan uzviy bog‘langan: dastlabki murojaatdan boshlab tahlil, shifokor konsultatsiyasi, kundalik kuzatuv va keyingi tavsiyalargacha bo‘lgan jarayon bitta xavfsiz tizimda davom etadi.",
    items: [
      {
        title: "Aniq va tezkor tahlil",
        text: "Tibbiy tasvirlar, simptomlar va kundalik ko‘rsatkichlar zamonaviy AI yordamida tahlil qilinib, shifokor uchun tushunarli ma’lumotga aylantiriladi.",
      },
      {
        title: "Doimiy kuzatuv",
        text: "Salomatlik holatidagi muhim o‘zgarishlar, qabul va tavsiyalar tarixi bir joyda saqlanadi hamda kerakli paytda eslatib turiladi.",
      },
      {
        title: "Ishonchli himoya",
        text: "Shaxsiy va tibbiy ma’lumotlar maxfiylik tamoyillari asosida himoyalanadi, natijalar esa faqat ruxsat berilgan foydalanuvchilarga ko‘rinadi.",
      },
    ],
    note: "Medi AI shifokor o‘rnini bosmaydi — u to‘g‘ri qaror qabul qilish va mutaxassisga o‘z vaqtida murojaat qilishga yordam beradi.",
  },
  ru: {
    eyebrow: "Единая цифровая медицинская среда",
    title: "Комплексный подход к вашему здоровью",
    description:
      "Отделения Medi AI связаны между собой: первичное обращение, анализ, консультация врача, ежедневное наблюдение и дальнейшие рекомендации проходят в единой защищённой системе.",
    items: [
      {
        title: "Точный и быстрый анализ",
        text: "Медицинские изображения, симптомы и ежедневные показатели анализируются с помощью современного ИИ и превращаются в понятные врачу данные.",
      },
      {
        title: "Постоянное наблюдение",
        text: "Важные изменения здоровья, история приёмов и рекомендаций хранятся в одном месте и напоминают о себе в нужный момент.",
      },
      {
        title: "Надёжная защита",
        text: "Личные и медицинские данные защищены принципами конфиденциальности, а результаты доступны только авторизованным пользователям.",
      },
    ],
    note: "Medi AI не заменяет врача — платформа помогает принимать взвешенные решения и вовремя обращаться к специалисту.",
  },
  en: {
    eyebrow: "One connected digital care environment",
    title: "A complete approach to your health",
    description:
      "Medi AI departments work together: initial assessment, analysis, doctor consultation, daily monitoring and follow-up guidance continue within one secure system.",
    items: [
      {
        title: "Fast, precise insights",
        text: "Medical images, symptoms and daily health indicators are analysed with modern AI and transformed into clear information for clinicians.",
      },
      {
        title: "Continuous monitoring",
        text: "Important health changes, appointments and recommendations stay organised in one place, with timely reminders when they matter.",
      },
      {
        title: "Trusted protection",
        text: "Personal and medical information is protected by privacy-first safeguards, and results remain visible only to authorised users.",
      },
    ],
    note: "Medi AI does not replace a doctor — it helps you make informed decisions and seek professional care at the right time.",
  },
};

const detailIcons = [Activity, Clock3, ShieldCheck];

const DeptCard = ({
  dept,
  index,
  lang,
  open,
  onToggle,
}: {
  dept: DepartmentInfo;
  index: number;
  lang: "uz" | "ru" | "en";
  open: boolean;
  onToggle: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });
  const Icon = icons[dept.icon] ?? Brain;

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, rotateX: -12 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="group relative"
    >
      <div
        className={`absolute -inset-px rounded-3xl bg-gradient-to-br ${dept.color} opacity-0 group-hover:opacity-60 blur-lg transition-opacity duration-500`}
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/70 backdrop-blur-2xl shadow-card group-hover:shadow-elevated transition-shadow duration-500 p-4 sm:p-6">
        <div className="shine-sweep" aria-hidden />

        <div className="flex items-start gap-3 sm:gap-4">
          <motion.div
            whileHover={{ rotateY: 180 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: "preserve-3d", transform: "translateZ(40px)" }}
            className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${dept.color} flex items-center justify-center text-primary-foreground shadow-glow`}
          >
            <Icon size={24} />
          </motion.div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-display font-bold text-foreground truncate">{dept.name[lang]}</h3>
            <p className="text-[11px] sm:text-sm text-muted-foreground leading-snug">{dept.tagline[lang]}</p>
          </div>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {dept.description[lang]}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-xl bg-secondary/60 py-1.5">
            <div className="text-sm font-bold text-foreground">{dept.doctors}</div>
            <div className="text-[10px] text-muted-foreground">{deptCopy.doctors[lang]}</div>
          </div>
          <div className="rounded-xl bg-secondary/60 py-1.5">
            <div className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
              <Users size={11} /> {dept.patients}
            </div>
            <div className="text-[10px] text-muted-foreground">{deptCopy.patients[lang]}</div>
          </div>
          <div className="rounded-xl bg-secondary/60 py-1.5">
            <div className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
              <Star size={11} className="fill-current text-medical-orange" /> {dept.rating}
            </div>
            <div className="text-[10px] text-muted-foreground">rating</div>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-secondary/70 transition-colors"
        >
          {deptCopy.open[lang]}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown size={15} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  {deptCopy.services[lang]}
                </div>
                <ul className="space-y-1.5">
                  {dept.services[lang].map((s, i) => (
                    <motion.li
                      key={s}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-2 text-xs sm:text-sm text-foreground"
                    >
                      <span className="w-4 h-4 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                        <Check size={11} />
                      </span>
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const DepartmentsSection = () => {
  const { lang } = useLanguage();
  const [open, setOpen] = useState<string | null>(null);
  const l = (lang as "uz" | "ru" | "en") ?? "uz";

  return (
    <section id="departments" className="relative z-10 py-12 sm:py-24 px-4">
      <div className="aurora-blob aurora-blob--one" aria-hidden />
      <div className="aurora-blob aurora-blob--two" aria-hidden />

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] sm:text-sm font-medium mb-4">
            <Sparkles size={14} /> Medi AI
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-gradient-primary mb-3">
            {deptCopy.heading[l]}
          </h2>
          <p className="text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {deptCopy.sub[l]}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {departments.map((dept, i) => (
            <DeptCard
              key={dept.id}
              dept={dept}
              index={i}
              lang={l}
              open={open === dept.id}
              onToggle={() => setOpen(open === dept.id ? null : dept.id)}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-14 sm:mt-24 pt-10 sm:pt-16 border-t border-border/60"
        >
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 sm:gap-12 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-28">
              <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                {departmentDetails[l].eyebrow}
              </span>
              <h3 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
                {departmentDetails[l].title}
              </h3>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {departmentDetails[l].description}
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {departmentDetails[l].items.map((item, index) => {
                const DetailIcon = detailIcons[index] ?? Activity;
                return (
                  <motion.article
                    key={item.title}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.55 }}
                    whileHover={{ x: 6 }}
                    className="group flex gap-4 sm:gap-5 rounded-2xl border border-border/50 bg-card/45 p-4 sm:p-5 backdrop-blur-xl shadow-card transition-colors hover:border-primary/30"
                  >
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <DetailIcon size={21} />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-foreground">{item.title}</h4>
                      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-8 sm:mt-12 border-l-2 border-primary pl-4 text-xs sm:text-sm italic leading-relaxed text-muted-foreground"
          >
            {departmentDetails[l].note}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default DepartmentsSection;
