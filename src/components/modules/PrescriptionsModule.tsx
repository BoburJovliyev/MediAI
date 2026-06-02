import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pill, Plus, FileText, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { toast } from "sonner";
import MedicalDisclaimer from "@/components/shared/MedicalDisclaimer";

interface Prescription {
  id: string;
  doctor_id: string;
  patient_id: string;
  medication: string;
  dosage: string | null;
  duration: string | null;
  instructions: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  specialty: string | null;
}

const PrescriptionsModule = () => {
  const { user } = useAuth();
  const { isDoctor, loading: roleLoading } = useUserRole();
  const [items, setItems] = useState<Prescription[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Profile[]>([]);
  const [form, setForm] = useState({ patient_id: "", medication: "", dosage: "", duration: "", instructions: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("prescriptions").select("*").order("created_at", { ascending: false });
    const list = (data as Prescription[]) || [];
    setItems(list);
    const ids = Array.from(new Set(list.flatMap((p) => [p.doctor_id, p.patient_id])));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, specialty").in("user_id", ids);
      const map: Record<string, Profile> = {};
      (profs as Profile[] | null)?.forEach((p) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  const loadPatients = async () => {
    if (!user) return;
    const { data: rels } = await supabase.from("doctor_patients").select("patient_id").eq("doctor_id", user.id);
    const ids = (rels as { patient_id: string }[] | null)?.map((r) => r.patient_id) || [];
    if (!ids.length) { setPatients([]); return; }
    const { data: profs } = await supabase.from("profiles").select("user_id, full_name, specialty").in("user_id", ids);
    setPatients((profs as Profile[]) || []);
  };

  useEffect(() => {
    if (roleLoading || !user) return;
    load();
    if (isDoctor) loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDoctor, roleLoading]);

  const save = async () => {
    if (!user) return;
    if (!form.patient_id || !form.medication.trim()) { toast.error("Bemor va dori nomini kiriting"); return; }
    setSaving(true);
    const { error } = await supabase.from("prescriptions").insert({
      doctor_id: user.id,
      patient_id: form.patient_id,
      medication: form.medication.trim(),
      dosage: form.dosage || null,
      duration: form.duration || null,
      instructions: form.instructions || null,
    });
    setSaving(false);
    if (error) { toast.error("Saqlashda xatolik"); return; }
    toast.success("Retsept yozildi");
    setForm({ patient_id: "", medication: "", dosage: "", duration: "", instructions: "" });
    load();
  };

  const printPrescription = (p: Prescription) => {
    const doctor = profiles[p.doctor_id];
    const patient = profiles[p.patient_id];
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Retsept</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#0f172a}h1{color:#0d9488}
      .row{margin:8px 0}.label{color:#64748b;font-size:13px}.val{font-size:16px;font-weight:600}
      .box{border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-top:20px}
      .foot{margin-top:40px;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}</style>
      </head><body>
      <h1>Medi AI — Retsept</h1>
      <div class="row"><span class="label">Shifokor:</span> <span class="val">${doctor?.full_name || "—"}${doctor?.specialty ? " (" + doctor.specialty + ")" : ""}</span></div>
      <div class="row"><span class="label">Bemor:</span> <span class="val">${patient?.full_name || "—"}</span></div>
      <div class="row"><span class="label">Sana:</span> <span class="val">${format(new Date(p.created_at), "dd.MM.yyyy")}</span></div>
      <div class="box">
        <div class="row"><span class="label">Dori:</span> <span class="val">${p.medication}</span></div>
        ${p.dosage ? `<div class="row"><span class="label">Doza:</span> <span class="val">${p.dosage}</span></div>` : ""}
        ${p.duration ? `<div class="row"><span class="label">Davomiylik:</span> <span class="val">${p.duration}</span></div>` : ""}
        ${p.instructions ? `<div class="row"><span class="label">Ko'rsatma:</span> <span class="val">${p.instructions}</span></div>` : ""}
      </div>
      <div class="foot">Ushbu retsept Medi AI platformasi orqali yaratilgan. Dori qabul qilishdan oldin shifokoringiz bilan maslahatlashing.</div>
      </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <Pill className="text-primary" /> Retseptlar
        </h2>
        <p className="text-muted-foreground mt-1">
          {isDoctor ? "Bemorlaringizga retsept yozing" : "Shifokoringiz yozgan retseptlar"}
        </p>
      </div>

      {isDoctor && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2"><Plus size={18} className="text-primary" /> Yangi retsept</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Bemor</label>
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground">
                <option value="">Tanlang...</option>
                {patients.map((p) => <option key={p.user_id} value={p.user_id}>{p.full_name || "Bemor"}</option>)}
              </select>
              {patients.length === 0 && <p className="text-xs text-muted-foreground mt-1">Hozircha bemorlaringiz yo'q.</p>}
            </div>
            <input value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} placeholder="Dori nomi *"
              className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
            <input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="Doza (masalan 1 tab x 2)"
              className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
            <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Davomiylik (masalan 7 kun)"
              className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
            <input value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Ko'rsatma"
              className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
          </div>
          <button onClick={save} disabled={saving} className="mt-4 flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm gradient-primary text-primary-foreground disabled:opacity-50">
            <Plus size={16} /> Saqlash
          </button>
        </motion.div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hozircha retseptlar yo'q.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((p) => {
            const other = profiles[isDoctor ? p.patient_id : p.doctor_id];
            return (
              <div key={p.id} className="bg-card rounded-2xl p-5 shadow-card border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-foreground flex items-center gap-2"><Pill size={16} className="text-primary" /> {p.medication}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Stethoscope size={12} /> {isDoctor ? "Bemor: " : "Shifokor: "}{other?.full_name || "—"}
                    </p>
                  </div>
                  <button onClick={() => printPrescription(p)} className="text-primary hover:opacity-70 shrink-0" title="Yuklab olish / chop etish">
                    <FileText size={18} />
                  </button>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {p.dosage && <p>Doza: <span className="text-foreground">{p.dosage}</span></p>}
                  {p.duration && <p>Davomiylik: <span className="text-foreground">{p.duration}</span></p>}
                  {p.instructions && <p>Ko'rsatma: <span className="text-foreground">{p.instructions}</span></p>}
                  <p className="text-xs pt-1">{format(new Date(p.created_at), "dd.MM.yyyy HH:mm")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && <MedicalDisclaimer type="medication" />}
    </div>
  );
};

export default PrescriptionsModule;
