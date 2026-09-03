import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Send, Github, Linkedin, Instagram, CheckCircle, Loader2, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const channels = [
  { icon: Mail, label: "Email", value: "jbobur005@gmail.com", href: "mailto:jbobur005@gmail.com" },
  { icon: Phone, label: "Phone", value: "+998 (93) 005-42-87", href: "tel:+998930054287" },
  { icon: Send, label: "Telegram", value: "Jovliyev_Bobur", href: "https://t.me/Jovliyev_Bobur" },
  { icon: Github, label: "GitHub", value: "github.com/JBoburHacker005", href: "https://github.com/JBoburHacker005" },
  { icon: Linkedin, label: "LinkedIn", value: "linkedin.com/in/Bobur005", href: "https://linkedin.com/in/Bobur005" },
  { icon: Instagram, label: "Instagram", value: "j.bobur005", href: "https://instagram.com/j.bobur005" },
];

const ContactHub = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        full_name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      if (error) throw error;

      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((a) => ({
            user_id: a.user_id,
            title: "Yangi xabar",
            message: `${form.name} (${form.email}) dan yangi xabar keldi`,
            type: "info",
          }))
        );
      }
      setSent(true);
      setForm({ name: "", email: "", message: "" });
      toast.success("Xabar yuborildi!");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="relative z-10 py-10 sm:py-16 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 items-start">
        {/* Left: heading + channels */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight">
              Get in Touch
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-xl">
              Savollaringiz bormi yoki ko'proq bilmoqchimisiz? Biz siz bilan bog'lanishdan mamnunmiz.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
            {channels.map((c, i) => (
              <motion.a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                initial={{ opacity: 0, y: 24, rotateX: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 120, damping: 16 }}
                whileHover={{ y: -6, rotateX: 6, rotateY: -4 }}
                style={{ transformStyle: "preserve-3d", perspective: 900 }}
                className="group relative flex items-center gap-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl px-5 py-4 shadow-card hover:shadow-elevated hover:border-primary/50 transition-colors"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-12 h-12 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-glow shrink-0">
                  <c.icon size={20} />
                </div>
                <div className="relative min-w-0">
                  <p className="font-semibold text-foreground text-sm">{c.label}</p>
                  <p className="text-sm text-muted-foreground truncate">{c.value}</p>
                </div>
              </motion.a>
            ))}
          </div>

          <div className="flex flex-wrap gap-5 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><MapPin size={15} className="text-primary" /> Toshkent, O'zbekiston</span>
            <span className="flex items-center gap-2"><Clock size={15} className="text-primary" /> 24/7 AI qo'llab-quvvatlash</span>
          </div>
        </div>

        {/* Right: form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ rotateY: -1.5, rotateX: 1.5 }}
          style={{ transformStyle: "preserve-3d", perspective: 1000 }}
          className="w-full rounded-3xl border border-primary/25 bg-card/60 backdrop-blur-2xl p-6 md:p-8 shadow-elevated"
        >
          {sent ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4 py-10">
              <CheckCircle size={48} className="text-accent" />
              <p className="text-lg font-semibold text-foreground text-center">Xabar muvaffaqiyatli yuborildi!</p>
              <button type="button" onClick={() => setSent(false)} className="text-primary text-sm hover:underline">
                Yana xabar yuborish
              </button>
            </motion.div>
          ) : (
            <div className="space-y-5">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your Name"
                required
                maxLength={100}
                className="w-full px-4 py-3.5 rounded-2xl bg-secondary/50 text-foreground text-sm border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Your Email"
                required
                maxLength={255}
                className="w-full px-4 py-3.5 rounded-2xl bg-secondary/50 text-foreground text-sm border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Your Message"
                required
                maxLength={1000}
                className="w-full px-4 py-3.5 rounded-2xl bg-secondary/50 text-foreground text-sm border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
              />
              <motion.button
                type="submit"
                disabled={sending}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="gradient-primary text-primary-foreground px-6 py-3.5 rounded-2xl text-sm font-semibold shadow-glow w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Send Message
              </motion.button>
            </div>
          )}
        </motion.form>
      </div>
    </section>
  );
};

export default ContactHub;
