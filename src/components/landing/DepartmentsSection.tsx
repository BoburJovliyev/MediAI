import { motion } from "framer-motion";
import { Brain, Activity, FileImage, Dumbbell, Users, Shield } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const DepartmentsSection = () => {
  const { t } = useLanguage();

  const departments = [
    { icon: <Brain size={28} />, name: t("landing.dept.neurology"), color: "from-medical-purple to-medical-purple/70" },
    { icon: <Activity size={28} />, name: t("landing.dept.cardiology"), color: "from-medical-red to-medical-red/70" },
    { icon: <FileImage size={28} />, name: t("landing.dept.radiology"), color: "from-primary to-primary/70" },
    { icon: <Dumbbell size={28} />, name: t("landing.dept.rehabilitation"), color: "from-accent to-accent/70" },
    { icon: <Users size={28} />, name: t("landing.dept.general"), color: "from-medical-teal to-medical-teal/70" },
    { icon: <Shield size={28} />, name: t("landing.dept.emergency"), color: "from-medical-orange to-medical-orange/70" },
  ];

  return (
    <section id="departments" className="py-12 sm:py-20 px-4 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            {t("landing.departments.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {departments.map((dept, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group bg-card/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-border/50 hover:border-primary/30 shadow-card hover:shadow-elevated transition-all text-center cursor-pointer"
            >
              <motion.div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${dept.color} flex items-center justify-center text-primary-foreground mx-auto mb-3`}
                whileHover={{ rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {dept.icon}
              </motion.div>
              <h3 className="text-sm md:text-base font-semibold text-foreground">{dept.name}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DepartmentsSection;
