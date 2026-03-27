import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Search, Edit2, Trash2, X, ChevronRight, FileImage, Brain, Dumbbell, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Patient {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

interface PatientForm {
  full_name: string;
  age: string;
  gender: string;
  phone: string;
  notes: string;
}

const emptyForm: PatientForm = { full_name: "", age: "", gender: "", phone: "", notes: "" };

const PatientsManager = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<{ scans: any[]; diagnoses: any[]; rehabs: any[] }>({ scans: [], diagnoses: [], rehabs: [] });
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadPatients = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("patients").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setPatients(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const handleSave = async () => {
    if (!user || !form.full_name.trim()) return;
    const payload = {
      user_id: user.id,
      full_name: form.full_name,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
      phone: form.phone || null,
      notes: form.notes || null,
    };

    if (editingId) {
      const { error } = await supabase.from("patients").update(payload).eq("id", editingId);
      if (error) { toast.error("Xatolik"); return; }
      toast.success("Bemor yangilandi");
    } else {
      const { error } = await supabase.from("patients").insert(payload);
      if (error) { toast.error("Xatolik"); return; }
      toast.success("Bemor qo'shildi");
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    loadPatients();
  };

  const handleEdit = (p: Patient) => {
    setEditingId(p.id);
    setForm({ full_name: p.full_name, age: p.age?.toString() || "", gender: p.gender || "", phone: p.phone || "", notes: p.notes || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bemorni o'chirishni xohlaysizmi?")) return;
    await supabase.from("patients").delete().eq("id", id);
    toast.success("Bemor o'chirildi");
    loadPatients();
    if (selectedPatient?.id === id) setSelectedPatient(null);
  };

  const viewHistory = async (patient: Patient) => {
    setSelectedPatient(patient);
    const [scans, diagnoses, rehabs] = await Promise.all([
      supabase.from("scan_analyses").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }),
      supabase.from("diagnoses").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }),
      supabase.from("rehab_sessions").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }),
    ]);
    setHistory({ scans: scans.data || [], diagnoses: diagnoses.data || [], rehabs: rehabs.data || [] });
  };

  const generatePDF = async () => {
    if (!selectedPatient) return;
    setPdfLoading(true);

    try {
      // Build HTML content for PDF
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 40px; color: #1a1a2e; line-height: 1.6; }
h1 { color: #0891b2; border-bottom: 3px solid #0891b2; padding-bottom: 10px; font-size: 24px; }
h2 { color: #2563eb; margin-top: 25px; font-size: 18px; }
h3 { color: #7c3aed; font-size: 14px; margin: 15px 0 5px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.patient-info { background: #f0fdfa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
.patient-info p { margin: 4px 0; font-size: 14px; }
.section { margin-bottom: 20px; }
.item { background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #0891b2; }
.item-title { font-weight: bold; font-size: 14px; }
.item-detail { font-size: 12px; color: #64748b; margin-top: 4px; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
.badge-green { background: #dcfce7; color: #16a34a; }
.badge-red { background: #fef2f2; color: #dc2626; }
.badge-blue { background: #dbeafe; color: #2563eb; }
.footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
.disclaimer { background: #fef3c7; padding: 12px; border-radius: 8px; margin-top: 20px; font-size: 11px; color: #92400e; }
table { width: 100%; border-collapse: collapse; margin: 10px 0; }
th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
th { background: #f1f5f9; font-weight: bold; }
</style>
</head>
<body>
<h1>🏥 Medi AI - Bemor Hisoboti</h1>
<div class="patient-info">
  <p><strong>Bemor:</strong> ${selectedPatient.full_name}</p>
  <p><strong>Yosh:</strong> ${selectedPatient.age || "—"} | <strong>Jins:</strong> ${selectedPatient.gender === "male" ? "Erkak" : selectedPatient.gender === "female" ? "Ayol" : "—"}</p>
  <p><strong>Telefon:</strong> ${selectedPatient.phone || "—"}</p>
  <p><strong>Sana:</strong> ${format(new Date(), "dd.MM.yyyy HH:mm")}</p>
</div>

${history.scans.length > 0 ? `
<div class="section">
  <h2>📷 Skan Tahlillari (${history.scans.length})</h2>
  <table>
    <tr><th>Tur</th><th>Darajasi</th><th>Tavsiya</th><th>Sana</th></tr>
    ${history.scans.map((s: any) => `
    <tr>
      <td>${s.scan_type?.toUpperCase() || "—"}</td>
      <td><span class="badge ${s.severity === "severe" ? "badge-red" : "badge-green"}">${s.severity || "—"}</span></td>
      <td>${s.recommendation?.slice(0, 80) || "—"}...</td>
      <td>${format(new Date(s.created_at), "dd.MM.yyyy")}</td>
    </tr>`).join("")}
  </table>
</div>` : ""}

${history.diagnoses.length > 0 ? `
<div class="section">
  <h2>🧠 Tashxislar (${history.diagnoses.length})</h2>
  ${history.diagnoses.map((d: any) => `
  <div class="item">
    <div class="item-title">${d.condition_name || "Noma'lum"} ${d.confidence ? `<span class="badge badge-blue">${d.confidence}%</span>` : ""}</div>
    <div class="item-detail">${d.description?.slice(0, 200) || d.complaint?.slice(0, 200) || ""}</div>
    ${d.medications ? `<h3>💊 Dorilar:</h3><div class="item-detail">${Array.isArray(d.medications) ? d.medications.map((m: any) => `${m.name} ${m.dose} - ${m.frequency}`).join(", ") : JSON.stringify(d.medications)}</div>` : ""}
    <div class="item-detail">${format(new Date(d.created_at), "dd.MM.yyyy HH:mm")}</div>
  </div>`).join("")}
</div>` : ""}

${history.rehabs.length > 0 ? `
<div class="section">
  <h2>🏋️ Reabilitatsiya Seanslari (${history.rehabs.length})</h2>
  <table>
    <tr><th>Mashq</th><th>Takror</th><th>Aniqlik</th><th>Davomiylik</th><th>Sana</th></tr>
    ${history.rehabs.map((r: any) => `
    <tr>
      <td>${r.exercise_name}</td>
      <td>${r.completed_reps}/${r.total_reps}</td>
      <td><span class="badge badge-green">${r.accuracy_score}%</span></td>
      <td>${r.duration_seconds}s</td>
      <td>${format(new Date(r.created_at), "dd.MM.yyyy")}</td>
    </tr>`).join("")}
  </table>
</div>` : ""}

<div class="disclaimer">
  ⚠️ <strong>Ogohlantirish:</strong> Bu hisobot AI tomonidan yaratilgan bo'lib, faqat informatsion maqsadlarda. 
  Bu professional tibbiy maslahat o'rnini bosmaydi. Har doim malakali shifokor bilan maslahatlashing.
</div>

<div class="footer">
  MediFlow AI © ${new Date().getFullYear()} | Hisobot yaratilgan: ${format(new Date(), "dd.MM.yyyy HH:mm")}
</div>
</body>
</html>`;

      // Create a printable window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
        toast.success("PDF hisobot tayyor! Print dialog orqali PDF sifatida saqlang.");
      } else {
        // Fallback: download as HTML
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedPatient.full_name.replace(/\s+/g, "_")}_hisobot.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Hisobot yuklab olindi!");
      }
    } catch (err) {
      toast.error("PDF yaratishda xatolik");
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

  const filtered = patients.filter((p) => p.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Bemorlar</h2>
          <p className="text-muted-foreground mt-1">Bemorlarni boshqarish va tarixni ko'rish</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-glow">
          <Plus size={18} /> Yangi bemor
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bemor qidirish..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Bemorlar topilmadi</div>
          ) : filtered.map((p) => (
            <motion.div key={p.id} layout className={`bg-card rounded-xl p-4 border transition-all cursor-pointer ${selectedPatient?.id === p.id ? "border-primary shadow-glow" : "border-border hover:border-primary/30"}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1" onClick={() => viewHistory(p)}>
                  <p className="font-medium text-foreground">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.age ? `${p.age} yosh` : ""} {p.gender === "male" ? "• Erkak" : p.gender === "female" ? "• Ayol" : ""} {p.phone ? `• ${p.phone}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(p)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={16} /></button>
                  <button onClick={() => viewHistory(p)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><ChevronRight size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div>
          {selectedPatient ? (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-foreground text-lg">{selectedPatient.full_name}</h3>
                  <p className="text-xs text-muted-foreground">Ro'yxatga olingan: {format(new Date(selectedPatient.created_at), "dd.MM.yyyy")}</p>
                </div>
                <button onClick={generatePDF} disabled={pdfLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-medical-teal-light text-medical-teal text-sm font-semibold hover:opacity-80 disabled:opacity-50">
                  {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  PDF
                </button>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2"><FileImage size={16} className="text-medical-teal" /> Skan tahlillari ({history.scans.length})</h4>
                {history.scans.length === 0 ? <p className="text-xs text-muted-foreground">Hali tahlil yo'q</p> : history.scans.map((s) => (
                  <div key={s.id} className="bg-secondary rounded-lg p-3 mb-2 text-sm">
                    <div className="flex justify-between"><span className="font-medium text-foreground">{s.scan_type?.toUpperCase()}</span><span className={`medical-badge ${s.severity === "severe" ? "bg-medical-red-light text-medical-red" : "bg-medical-green-light text-medical-green"}`}>{s.severity}</span></div>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(s.created_at), "dd.MM.yyyy HH:mm")}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2"><Brain size={16} className="text-medical-purple" /> Tashxislar ({history.diagnoses.length})</h4>
                {history.diagnoses.length === 0 ? <p className="text-xs text-muted-foreground">Hali tashxis yo'q</p> : history.diagnoses.map((d) => (
                  <div key={d.id} className="bg-secondary rounded-lg p-3 mb-2 text-sm">
                    <p className="font-medium text-foreground">{d.condition_name || "Noma'lum"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{d.complaint?.slice(0, 60)}...</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(d.created_at), "dd.MM.yyyy HH:mm")}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2"><Dumbbell size={16} className="text-medical-orange" /> Reab. seanslar ({history.rehabs.length})</h4>
                {history.rehabs.length === 0 ? <p className="text-xs text-muted-foreground">Hali seans yo'q</p> : history.rehabs.map((r) => (
                  <div key={r.id} className="bg-secondary rounded-lg p-3 mb-2 text-sm">
                    <div className="flex justify-between"><span className="font-medium text-foreground">{r.exercise_name}</span><span className="text-xs text-muted-foreground">{r.accuracy_score}%</span></div>
                    <p className="text-xs text-muted-foreground">{r.completed_reps}/{r.total_reps} takror • {format(new Date(r.created_at), "dd.MM.yyyy")}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-12 border border-border text-center">
              <Users size={48} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Bemor tanlang tarixni ko'rish uchun</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-2xl p-6 w-full max-w-md shadow-elevated border border-border">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-display font-bold text-foreground">{editingId ? "Bemorni tahrirlash" : "Yangi bemor"}</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">To'liq ism *</label>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ism Familiya"
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Yosh</label>
                    <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="45"
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Jins</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Tanlang</option>
                      <option value="male">Erkak</option>
                      <option value="female">Ayol</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Telefon</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67"
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Izohlar</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Qo'shimcha ma'lumot..."
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <button onClick={handleSave} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-glow">
                  {editingId ? "Saqlash" : "Qo'shish"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PatientsManager;
