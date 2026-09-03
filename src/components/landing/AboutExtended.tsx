import { motion } from "framer-motion";
import { Brain, Shield, Users, Target, Eye, Award, Cpu, Globe2, Sparkles, Stethoscope } from "lucide-react";

const values = [
  { icon: Target, title: "Missiyamiz", desc: "Har bir insonga sifatli va tez tibbiy yordamni sun'iy intellekt orqali yetkazish." },
  { icon: Eye, title: "Vizyonimiz", desc: "O'zbekistonda raqamli salomatlik ekotizimining yetakchi platformasiga aylanish." },
  { icon: Award, title: "Qadriyatlarimiz", desc: "Aniqlik, maxfiylik, insonparvarlik va uzluksiz innovatsiya." },
];

const capabilities = [
  { icon: Brain, title: "AI Tashxis", desc: "Rentgen, UTT va MRI tasvirlarini soniyalarda tahlil qilish." },
  { icon: Stethoscope, title: "Shifokor bilan aloqa", desc: "Chat, video qo'ng'iroq va onlayn qabulga yozilish." },
  { icon: Cpu, title: "Smart Advisor", desc: "Simptomlar asosida bosqichma-bosqich tavsiyalar." },
  { icon: Shield, title: "Xavfsizlik", desc: "Uchdan-uchgacha shifrlash va qat'iy ruxsat siyosati." },
  { icon: Globe2, title: "3 til", desc: "O'zbek, rus va ingliz tillarida to'liq interfeys." },
  { icon: Users, title: "Rolli tizim", desc: "Bemor, shifokor va administrator uchun alohida imkoniyatlar." },
];

const timeline = [
  { year: "2024", title: "G'oya", desc: "Tibbiy tasvirlarni AI bilan tahlil qilish bo'yicha ilk tadqiqotlar." },
  { year: "2025", title: "Prototip", desc: "Birinchi radiologiya moduli va shifokor kabineti ishga tushirildi." },
  { year: "2026", title: "Platforma", desc: "Ratsion AI, video qabul va super admin monitoringi qo'shildi." },
];

const stats = [
  { value: "12k+", label: "Tahlil qilingan tasvir" },
  { value: "98%", label: "Foydalanuvchi mamnunligi" },
  { value: "24/7", label: "AI qo'llab-quvvatlash" },
  { value: "3", label: "Til" },
];

const AboutExtended = () => (
  <div className="relative z-10 px-4 pb-10">
    <div className="max-w-6xl mx-auto space-y-20">
      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 30, rotateX: -8 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            whileHover={{ y: -8, rotateY: 4 }}
            style={{ transformStyle: "preserve-3d", perspective: 900 }}
            className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 shadow-card hover:shadow-elevated transition-shadow"
          >
            <div className="w-14 h-14 rounded-2xl gradient-primary text-primary-foreground flex items-center justify-center shadow-glow mb-5">
              <v.icon size={22} />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{v.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 140 }}
            whileHover={{ y: -6 }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6 text-center backdrop-blur-xl"
          >
            <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
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
          Nimalarni qila olamiz
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -6, rotateX: 5 }}
              style={{ transformStyle: "preserve-3d", perspective: 900 }}
              className="group rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-6 shadow-card hover:border-primary/40 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <c.icon size={20} />
              </div>
              <h4 className="font-semibold text-foreground mb-1.5">{c.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
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
          Bizning yo'limiz
        </motion.h2>
        <div className="relative pl-8 md:pl-0">
          <div className="absolute left-3 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
          <div className="space-y-8">
            {timeline.map((t, i) => (
              <motion.div
                key={t.year}
                initial={{ opacity: 0, x: i % 2 ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`relative md:w-1/2 ${i % 2 ? "md:ml-auto md:pl-10" : "md:pr-10 md:text-right"}`}
              >
                <span className={`absolute top-6 w-3 h-3 rounded-full gradient-primary shadow-glow -left-[26px] md:left-auto ${i % 2 ? "md:-left-1.5" : "md:-right-1.5"}`} />
                <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-card">
                  <span className="text-xs font-semibold text-primary">{t.year}</span>
                  <h4 className="font-semibold text-foreground mt-1">{t.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1.5">{t.desc}</p>
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
        className="rounded-3xl border border-accent/30 bg-accent/5 p-8 text-center backdrop-blur-xl"
      >
        <Sparkles className="mx-auto text-accent mb-3" size={26} />
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Medi AI natijalari maslahat xarakteriga ega bo'lib, malakali shifokor tashxisini almashtirmaydi.
          Har qanday jiddiy holatda mutaxassisga murojaat qiling.
        </p>
      </motion.div>
    </div>
  </div>
);

export default AboutExtended;
