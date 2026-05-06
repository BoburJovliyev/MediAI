import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Stethoscope, Users, Search, Star, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Loader2 } from "lucide-react";

interface DoctorProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  specialty: string | null;
  patient_count: number;
}

const SPECIALTY_LABELS: Record<string, Record<string, string>> = {
  general: { uz: "Umumiy amaliyot", ru: "Общая практика", en: "General Practice" },
  cardiology: { uz: "Kardiologiya", ru: "Кардиология", en: "Cardiology" },
  neurology: { uz: "Nevrologiya", ru: "Неврология", en: "Neurology" },
  orthopedics: { uz: "Ortopediya", ru: "Ортопедия", en: "Orthopedics" },
  pediatrics: { uz: "Pediatriya", ru: "Педиатрия", en: "Pediatrics" },
  radiology: { uz: "Radiologiya", ru: "Радиология", en: "Radiology" },
  surgery: { uz: "Jarrohlik", ru: "Хирургия", en: "Surgery" },
  dermatology: { uz: "Dermatologiya", ru: "Дерматология", en: "Dermatology" },
  other: { uz: "Boshqa", ru: "Другое", en: "Other" },
};

const DoctorsListing = () => {
  const { lang } = useLanguage();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    // Get all doctor profiles (exclude admins)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, specialty, email")
      .eq("role", "doctor")
      .eq("is_blocked", false);

    if (!profiles || profiles.length === 0) {
      setDoctors([]);
      setLoading(false);
      return;
    }

    // Filter out admin users
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin" as any);
    const adminIds = new Set((adminRoles || []).map(r => r.user_id));
    const filteredProfiles = profiles.filter(p => !adminIds.has(p.user_id));

    // Get patient counts for each doctor (public aggregate via RPC)
    const doctorIds = filteredProfiles.map(p => p.user_id);
    if (doctorIds.length === 0) {
      setDoctors([]);
      setLoading(false);
      return;
    }
    const { data: counts } = await supabase.rpc("get_doctor_patient_counts");
    const countMap: Record<string, number> = {};
    (counts || []).forEach((r: any) => {
      countMap[r.doctor_id] = Number(r.patient_count) || 0;
    });

    const result: DoctorProfile[] = filteredProfiles.map(p => ({
      user_id: p.user_id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      email: p.email,
      specialty: p.specialty,
      patient_count: countMap[p.user_id] || 0,
    }));

    // Sort by patient count (top rating)
    result.sort((a, b) => b.patient_count - a.patient_count);
    setDoctors(result);
    setLoading(false);
  };

  // Get unique specialties that have doctors
  const availableSpecialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))] as string[];

  const filtered = doctors.filter(d => {
    if (selectedSpecialty !== "all" && d.specialty !== selectedSpecialty) return false;
    if (search && !d.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const titles: Record<string, string> = {
    uz: "Shifokorlar",
    ru: "Врачи",
    en: "Doctors",
  };

  const subtitles: Record<string, string> = {
    uz: "Ro'yxatdan o'tgan shifokorlar yo'nalishi bo'yicha",
    ru: "Зарегистрированные врачи по направлениям",
    en: "Registered doctors by specialty",
  };

  const allLabel: Record<string, string> = { uz: "Barchasi", ru: "Все", en: "All" };
  const searchPlaceholder: Record<string, string> = { uz: "Shifokor qidirish...", ru: "Поиск врача...", en: "Search doctor..." };
  const patientsLabel: Record<string, string> = { uz: "bemor", ru: "пациент", en: "patient" };
  const noDoctorsLabel: Record<string, string> = { uz: "Bu yo'nalishda shifokor topilmadi", ru: "Врачи не найдены", en: "No doctors found" };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">{titles[lang]}</h2>
        <p className="text-muted-foreground mt-1">{subtitles[lang]}</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder[lang]}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSpecialty("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedSpecialty === "all" ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {allLabel[lang]}
          </button>
          {availableSpecialties.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSpecialty(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedSpecialty === s ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {SPECIALTY_LABELS[s]?.[lang] || s}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{noDoctorsLabel[lang]}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc, i) => (
            <motion.div
              key={doc.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                {doc.avatar_url ? (
                  <img src={doc.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Stethoscope size={20} className="text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{doc.full_name || "Doctor"}</h3>
                  <p className="text-xs text-primary">
                    {doc.specialty ? (SPECIALTY_LABELS[doc.specialty]?.[lang] || doc.specialty) : "—"}
                  </p>
                </div>
                {i < 3 && doc.patient_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-yellow-600">TOP</span>
                  </div>
                )}
              </div>
              {doc.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Mail size={14} />
                  <span className="truncate">{doc.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users size={14} />
                <span>{doc.patient_count} {patientsLabel[lang]}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DoctorsListing;
