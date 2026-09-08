import { useState } from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { services, servicesCopy, ServiceInfo } from "@/data/services";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Har bir xizmat uchun o'ziga xos ikonka animatsiyasi */
const iconMotion: Record<ServiceInfo["anim"], any> = {
  pulse: { animate: { scale: [1, 1.14, 1] }, transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } },
  scan: { animate: { y: [-6, 6, -6] }, transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
  orbit: { animate: { rotate: [0, 360] }, transition: { duration: 9, repeat: Infinity, ease: "linear" } },
  wave: { animate: { rotate: [-10, 10, -10] }, transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } },
  flip: { animate: { rotateY: [0, 180, 360] }, transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } },
  float: { animate: { y: [0, -8, 0], scale: [1, 1.05, 1] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
};

const ServiceCard = ({ s, i, onPick }: { s: ServiceInfo; i: number; onPick: (id: string) => void }) => {
  const { lang } = useLanguage();
  const Icon = (Icons as any)[s.icon] ?? Icons.Sparkles;
  const m = iconMotion[s.anim];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: i * 0.07, type: "spring", stiffness: 110, damping: 16 }}
      whileHover={{ y: -8 }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className="group relative bg-card/70 backdrop-blur-xl border border-border/60 rounded-3xl p-5 sm:p-6 shadow-card hover:border-primary/40 transition-colors overflow-hidden"
    >
      <div className={`absolute -top-24 -right-20 w-52 h-52 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-3xl group-hover:opacity-25 transition-opacity`} />

      <div className="relative flex items-start justify-between gap-3">
        <motion.div
          {...m}
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-primary-foreground shadow-glow shrink-0`}
        >
          <Icon size={26} />
        </motion.div>
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-display font-bold text-foreground leading-none">{s.price[lang]}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{s.period[lang]}</div>
        </div>
      </div>

      <h3 className="relative mt-4 text-lg font-semibold text-foreground">{s.name[lang]}</h3>
      <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc[lang]}</p>

      <ul className="relative mt-4 space-y-2">
        {s.points[lang].map((p, k) => (
          <motion.li
            key={p}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + k * 0.06 }}
            className="flex items-center gap-2 text-sm text-foreground/80"
          >
            <CheckCircle2 size={15} className="text-medical-green shrink-0" />
            {p}
          </motion.li>
        ))}
      </ul>

      <button
        onClick={() => onPick(s.id)}
        className="relative mt-5 w-full rounded-xl gradient-primary text-primary-foreground text-sm font-semibold py-2.5 shadow-glow hover:opacity-90 transition-opacity"
      >
        {servicesCopy.request[lang]}
      </button>
    </motion.div>
  );
};

const ServicesSection = () => {
  const { lang } = useLanguage();
  const [picked, setPicked] = useState(services[0].id);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const pick = (id: string) => {
    setPicked(id);
    document.getElementById("service-request")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    const svc = services.find((s) => s.id === picked);
    setSending(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        full_name: form.name.trim(),
        email: form.email.trim(),
        message: `[${svc?.name.uz} · ${svc?.price.uz} ${svc?.period.uz}] ${form.message.trim()}`,
      });
      if (error) throw error;
      setSent(true);
      setForm({ name: "", email: "", message: "" });
      toast.success(servicesCopy.sent[lang]);
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="services" className="relative z-10 py-14 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
            {servicesCopy.heading[lang]}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">{servicesCopy.sub[lang]}</p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <ServiceCard key={s.id} s={s} i={i} onPick={pick} />
          ))}
        </div>

        {/* Request form */}
        <motion.div
          id="service-request"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-card/70 backdrop-blur-xl border border-border/60 rounded-3xl p-5 sm:p-8 shadow-card"
        >
          <h3 className="text-xl font-display font-bold text-foreground">{servicesCopy.request[lang]}</h3>
          <p className="text-sm text-muted-foreground mt-1">{servicesCopy.requestSub[lang]}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setPicked(s.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  picked === s.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/60 text-foreground/80 border-border hover:border-primary/40"
                }`}
              >
                {s.name[lang]}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={servicesCopy.name[lang]}
              className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={servicesCopy.email[lang]}
              className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              required
            />
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={servicesCopy.message[lang]}
              rows={4}
              className="sm:col-span-2 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-primary resize-none"
            />
            <button
              type="submit"
              disabled={sending}
              className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl gradient-primary text-primary-foreground font-semibold py-3 shadow-glow disabled:opacity-60"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : sent ? <CheckCircle2 size={16} /> : <Send size={16} />}
              {sent ? servicesCopy.sent[lang] : servicesCopy.send[lang]}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
