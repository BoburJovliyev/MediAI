import { motion } from "framer-motion";
import { Mail, Phone, Send, Github, Linkedin, Instagram } from "lucide-react";

const items = [
  { icon: Mail, label: "Email", value: "jbobur005@gmail.com", href: "mailto:jbobur005@gmail.com" },
  { icon: Phone, label: "Phone", value: "+998 (93) 005-42-87", href: "tel:+998930054287" },
  { icon: Send, label: "Telegram", value: "Jovliyev_Bobur", href: "https://t.me/Jovliyev_Bobur" },
  { icon: Github, label: "GitHub", value: "github.com/JBoburHacker005", href: "https://github.com/JBoburHacker005" },
  { icon: Linkedin, label: "LinkedIn", value: "linkedin.com/in/Bobur005", href: "https://linkedin.com/in/Bobur005" },
  { icon: Instagram, label: "Instagram", value: "j.bobur005", href: "https://instagram.com/j.bobur005" },
];

const ContactInfoGrid = () => (
  <section className="relative z-10 py-12 px-4">
    <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
      {items.map((it, i) => (
        <motion.a
          key={it.label}
          href={it.href}
          target={it.href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07 }}
          whileHover={{ y: -5 }}
          className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-lg hover:border-primary/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-glow">
            <it.icon size={24} />
          </div>
          <span className="font-semibold text-foreground">{it.label}</span>
          <span className="text-sm text-muted-foreground break-all text-center">{it.value}</span>
        </motion.a>
      ))}
    </div>
  </section>
);

export default ContactInfoGrid;
