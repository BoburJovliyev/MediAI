import { motion } from "framer-motion";
import { FileImage, Brain, Dumbbell, Activity, TrendingUp, Users, Clock } from "lucide-react";

interface DashboardHomeProps {
  onNavigate: (tab: "radiologist" | "advisor" | "rehab") => void;
}

const stats = [
  { label: "Tahlillar", value: "1,247", icon: <Activity size={20} />, color: "bg-medical-teal-light text-medical-teal" },
  { label: "Tashxislar", value: "892", icon: <TrendingUp size={20} />, color: "bg-medical-green-light text-medical-green" },
  { label: "Bemorlar", value: "3,456", icon: <Users size={20} />, color: "bg-medical-blue-light text-medical-blue" },
  { label: "O'rtacha vaqt", value: "2.4 min", icon: <Clock size={20} />, color: "bg-medical-purple-light text-medical-purple" },
];

const modules = [
  {
    id: "radiologist" as const,
    title: "AI Radiologist",
    description: "MRT va Rentgen tasvirlarini AI yordamida tahlil qiling",
    icon: <FileImage size={28} />,
    gradient: "gradient-primary",
  },
  {
    id: "advisor" as const,
    title: "Smart Medical Advisor",
    description: "AI tashxis va dori tavsiyalari",
    icon: <Brain size={28} />,
    gradient: "gradient-accent",
  },
  {
    id: "rehab" as const,
    title: "Tele-Rehab AI",
    description: "Kamera orqali mashqlarni nazorat qilish",
    icon: <Dumbbell size={28} />,
    gradient: "gradient-warm",
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DashboardHome = ({ onNavigate }: DashboardHomeProps) => (
  <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
    <motion.div variants={item}>
      <h2 className="text-3xl font-display font-bold text-foreground">Xush kelibsiz, Doktor</h2>
      <p className="text-muted-foreground mt-1">MediFlow AI diagnostika platformasi</p>
    </motion.div>

    {/* Stats */}
    <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
            {s.icon}
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
          <p className="text-sm text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </motion.div>

    {/* Module Cards */}
    <motion.div variants={item} className="grid md:grid-cols-3 gap-6">
      {modules.map((m) => (
        <motion.button
          key={m.id}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate(m.id)}
          className="bg-card rounded-2xl p-6 shadow-card border border-border text-left hover:shadow-elevated transition-shadow group"
        >
          <div className={`w-14 h-14 rounded-2xl ${m.gradient} flex items-center justify-center mb-4 text-primary-foreground group-hover:scale-110 transition-transform`}>
            {m.icon}
          </div>
          <h3 className="text-lg font-display font-bold text-foreground mb-2">{m.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
        </motion.button>
      ))}
    </motion.div>
  </motion.div>
);

export default DashboardHome;
