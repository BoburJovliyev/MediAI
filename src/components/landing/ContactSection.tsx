import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ContactSection = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;

    setSending(true);
    try {
      // Save to database
      const { error } = await supabase.from("contact_submissions").insert({
        full_name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });

      if (error) throw error;

      // Notify all admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const notifications = admins.map((a) => ({
          user_id: a.user_id,
          title: "Yangi xabar",
          message: `${form.name} (${form.email}) dan yangi xabar keldi`,
          type: "info",
        }));
        await supabase.from("notifications").insert(notifications);
      }

      setSent(true);
      setForm({ name: "", email: "", message: "" });
      toast.success(t("landing.contact.sent") || "Xabar yuborildi!");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-12 sm:py-20 px-4 relative z-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-7 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            {t("landing.contact.title")}
          </h2>
          <p className="text-muted-foreground text-lg">{t("landing.contact.desc")}</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card/60 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-elevated"
        >
          {sent ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <CheckCircle size={48} className="text-accent" />
              <p className="text-lg font-semibold text-foreground">
                {t("landing.contact.sent") || "Xabar muvaffaqiyatli yuborildi!"}
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-primary text-sm hover:underline"
              >
                {t("landing.contact.sendAnother") || "Yana xabar yuborish"}
              </button>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("landing.contact.name")}
                  required
                  maxLength={100}
                  className="px-4 py-3.5 rounded-2xl bg-secondary/50 text-foreground text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t("landing.contact.email")}
                  required
                  maxLength={255}
                  className="px-4 py-3.5 rounded-2xl bg-secondary/50 text-foreground text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={t("landing.contact.message")}
                required
                maxLength={1000}
                className="w-full px-4 py-3.5 rounded-2xl bg-secondary/50 text-foreground text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 resize-none transition-all"
              />
              <motion.button
                type="submit"
                disabled={sending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="gradient-primary text-primary-foreground px-6 py-3.5 rounded-2xl text-sm font-semibold shadow-glow w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {t("landing.contact.send")}
              </motion.button>
            </>
          )}
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;
