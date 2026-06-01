import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Plus, Check, X, CheckCircle2, Stethoscope, Trash2, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/hooks/useLanguage";
import { format } from "date-fns";
import { toast } from "sonner";

interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string | null;
  notes: string | null;
}

interface Availability {
  id: string;
  doctor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

interface DoctorProfile {
  user_id: string;
  full_name: string | null;
  specialty: string | null;
  avatar_url: string | null;
}

const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  confirmed: "bg-medical-green-light text-medical-green",
  cancelled: "bg-destructive/15 text-destructive",
  completed: "bg-medical-blue-light text-medical-blue",
};

const statusLabel: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  cancelled: "Bekor qilingan",
  completed: "Yakunlangan",
};

const AppointmentsModule = () => {
  const { user } = useAuth();
  const { isDoctor, loading: roleLoading } = useUserRole();
  const { } = useLanguage();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, DoctorProfile>>({});
  const [loading, setLoading] = useState(true);

  // doctor availability management
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [newSlot, setNewSlot] = useState({ weekday: 1, start_time: "09:00", end_time: "17:00", slot_minutes: 30 });

  // patient booking
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [docAvailability, setDocAvailability] = useState<Availability[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ scheduled_at: string }[]>([]);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);

  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .order("scheduled_at", { ascending: true });
    const appts = (data as Appointment[]) || [];
    setAppointments(appts);

    // load names of counterparties
    const ids = Array.from(new Set(appts.flatMap((a) => [a.doctor_id, a.patient_id])));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, specialty, avatar_url")
        .in("user_id", ids);
      const map: Record<string, DoctorProfile> = {};
      (profs as DoctorProfile[] | null)?.forEach((p) => { map[p.user_id] = p; });
      setProfilesMap(map);
    }
    setLoading(false);
  };

  const loadDoctorData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("doctor_availability")
      .select("*")
      .eq("doctor_id", user.id)
      .order("weekday", { ascending: true });
    setAvailability((data as Availability[]) || []);
  };

  const loadDoctors = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, specialty, avatar_url")
      .eq("role", "doctor");
    setDoctors((data as DoctorProfile[]) || []);
  };

  useEffect(() => {
    if (roleLoading || !user) return;
    loadAppointments();
    if (isDoctor) loadDoctorData();
    else loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDoctor, roleLoading]);

  // realtime refresh
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("appointments-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        loadAppointments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // load slots when patient selects a doctor/date
  useEffect(() => {
    if (isDoctor || !selectedDoctor || !selectedDate) return;
    const load = async () => {
      const weekday = new Date(selectedDate + "T00:00:00").getDay();
      const { data: avail } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", selectedDoctor)
        .eq("weekday", weekday);
      setDocAvailability((avail as Availability[]) || []);
      const { data: booked } = await supabase.rpc("get_booked_slots", {
        _doctor_id: selectedDoctor,
        _day: selectedDate,
      });
      setBookedSlots((booked as { scheduled_at: string }[]) || []);
    };
    load();
  }, [selectedDoctor, selectedDate, isDoctor]);

  const availableSlots = useMemo(() => {
    if (!docAvailability.length) return [] as string[];
    const slots: string[] = [];
    const bookedTimes = new Set(
      bookedSlots.map((b) => new Date(b.scheduled_at).getTime())
    );
    const now = Date.now();
    for (const a of docAvailability) {
      const [sh, sm] = a.start_time.split(":").map(Number);
      const [eh, em] = a.end_time.split(":").map(Number);
      let cur = new Date(selectedDate + "T00:00:00");
      cur.setHours(sh, sm, 0, 0);
      const end = new Date(selectedDate + "T00:00:00");
      end.setHours(eh, em, 0, 0);
      while (cur < end) {
        const t = cur.getTime();
        if (t > now && !bookedTimes.has(t)) {
          slots.push(format(cur, "HH:mm"));
        }
        cur = new Date(t + a.slot_minutes * 60000);
      }
    }
    return Array.from(new Set(slots)).sort();
  }, [docAvailability, bookedSlots, selectedDate]);

  const book = async (slot: string) => {
    if (!user || !selectedDoctor) return;
    setBooking(true);
    const scheduled = new Date(selectedDate + "T" + slot + ":00");
    const { error } = await supabase.from("appointments").insert({
      doctor_id: selectedDoctor,
      patient_id: user.id,
      scheduled_at: scheduled.toISOString(),
      duration_minutes: docAvailability[0]?.slot_minutes || 30,
      reason: reason || null,
    });
    setBooking(false);
    if (error) { toast.error("Band qilishda xatolik"); return; }
    toast.success("Qabulga yozildingiz! Shifokor tasdiqlashini kuting.");
    setReason("");
    // refresh booked slots
    const { data: booked } = await supabase.rpc("get_booked_slots", { _doctor_id: selectedDoctor, _day: selectedDate });
    setBookedSlots((booked as { scheduled_at: string }[]) || []);
    loadAppointments();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) { toast.error("Xatolik"); return; }
    toast.success("Yangilandi");
    loadAppointments();
  };

  const addAvailability = async () => {
    if (!user) return;
    if (newSlot.start_time >= newSlot.end_time) { toast.error("Boshlanish vaqti tugashdan oldin bo'lishi kerak"); return; }
    const { error } = await supabase.from("doctor_availability").insert({
      doctor_id: user.id,
      weekday: newSlot.weekday,
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
      slot_minutes: newSlot.slot_minutes,
    });
    if (error) { toast.error("Xatolik"); return; }
    toast.success("Ish vaqti qo'shildi");
    loadDoctorData();
  };

  const removeAvailability = async (id: string) => {
    await supabase.from("doctor_availability").delete().eq("id", id);
    loadDoctorData();
  };

  const upcoming = appointments.filter((a) => a.status !== "cancelled" && a.status !== "completed");
  const past = appointments.filter((a) => a.status === "cancelled" || a.status === "completed");

  const renderAppointmentCard = (a: Appointment) => {
    const other = profilesMap[isDoctor ? a.patient_id : a.doctor_id];
    return (
      <div key={a.id} className="bg-card rounded-2xl p-5 shadow-card border border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {other?.avatar_url ? (
              <img src={other.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground">
                {(other?.full_name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{other?.full_name || (isDoctor ? "Bemor" : "Shifokor")}</p>
              {!isDoctor && other?.specialty && <p className="text-xs text-muted-foreground">{other.specialty}</p>}
              {a.reason && <p className="text-xs text-muted-foreground truncate">{a.reason}</p>}
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusStyles[a.status] || ""}`}>
            {statusLabel[a.status] || a.status}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Calendar size={14} /> {format(new Date(a.scheduled_at), "dd.MM.yyyy")}</span>
          <span className="flex items-center gap-1.5"><Clock size={14} /> {format(new Date(a.scheduled_at), "HH:mm")}</span>
        </div>
        {(a.status === "pending" || a.status === "confirmed") && (
          <div className="flex gap-2 mt-4">
            {isDoctor && a.status === "pending" && (
              <button onClick={() => updateStatus(a.id, "confirmed")} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-medical-green-light text-medical-green hover:opacity-90 transition">
                <Check size={15} /> Tasdiqlash
              </button>
            )}
            {isDoctor && a.status === "confirmed" && (
              <button onClick={() => updateStatus(a.id, "completed")} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-medical-blue-light text-medical-blue hover:opacity-90 transition">
                <CheckCircle2 size={15} /> Yakunlash
              </button>
            )}
            <button onClick={() => updateStatus(a.id, "cancelled")} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-destructive/15 text-destructive hover:opacity-90 transition">
              <X size={15} /> Bekor qilish
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <CalendarClock className="text-primary" /> Qabullar
        </h2>
        <p className="text-muted-foreground mt-1">
          {isDoctor ? "Bemorlaringiz qabullarini boshqaring va ish vaqtingizni belgilang" : "Shifokor bilan qabulga yoziling"}
        </p>
      </div>

      {/* DOCTOR: availability management */}
      {isDoctor && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2"><Clock size={18} className="text-primary" /> Ish vaqti</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Kun</label>
              <select value={newSlot.weekday} onChange={(e) => setNewSlot({ ...newSlot, weekday: Number(e.target.value) })}
                className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground">
                {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Boshlanish</label>
              <input type="time" value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tugash</label>
              <input type="time" value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Slot (daqiqa)</label>
              <select value={newSlot.slot_minutes} onChange={(e) => setNewSlot({ ...newSlot, slot_minutes: Number(e.target.value) })}
                className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground">
                {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button onClick={addAvailability} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm gradient-primary text-primary-foreground">
              <Plus size={16} /> Qo'shish
            </button>
          </div>
          {availability.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {availability.map((a) => (
                <span key={a.id} className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-1.5 text-sm text-foreground">
                  {WEEKDAYS[a.weekday]} {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
                  <button onClick={() => removeAvailability(a.id)} className="text-destructive hover:opacity-70"><Trash2 size={13} /></button>
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* PATIENT: booking */}
      {!isDoctor && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2"><Stethoscope size={18} className="text-primary" /> Yangi qabulga yozilish</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Shifokor</label>
              <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground">
                <option value="">Tanlang...</option>
                {doctors.map((d) => <option key={d.user_id} value={d.user_id}>{d.full_name || "Shifokor"}{d.specialty ? ` — ${d.specialty}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Sana</label>
              <input type="date" value={selectedDate} min={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-muted-foreground block mb-1">Sabab (ixtiyoriy)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Masalan: konsultatsiya"
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
          </div>
          {selectedDoctor && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Bo'sh vaqtlar:</p>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bu kunda bo'sh vaqt yo'q.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((s) => (
                    <button key={s} disabled={booking} onClick={() => book(s)}
                      className="px-3 py-2 rounded-xl text-sm bg-secondary hover:gradient-primary hover:text-primary-foreground transition border border-border disabled:opacity-50">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Appointments lists */}
      {loading ? (
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="font-display font-bold text-foreground mb-3">Faol qabullar</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Faol qabullar yo'q.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">{upcoming.map(renderAppointmentCard)}</div>
            )}
          </div>
          {past.length > 0 && (
            <div>
              <h3 className="font-display font-bold text-foreground mb-3">Tarix</h3>
              <div className="grid md:grid-cols-2 gap-4 opacity-70">{past.map(renderAppointmentCard)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentsModule;
