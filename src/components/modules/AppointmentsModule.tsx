import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Clock, Plus, Check, X, CheckCircle2, Stethoscope,
  Trash2, CalendarClock, MapPin, Navigation, ExternalLink, Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Tooltip } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon (Leaflet + bundler issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom red icon for hospitals
const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// ─── Types ───────────────────────────────────────────────
interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string | null;
  notes: string | null;
  location_name: string | null;
  location_address: string | null;
  location_coords: string | null;
}

interface Availability {
  id: string;
  doctor_id: string;
  available_date: string;
  location_name: string | null;
  location_address: string | null;
  location_coords: string | null;
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

interface HospitalMarker {
  id: number;
  lat: number;
  lng: number;
  name: string;
}

// ─── Status styles ───────────────────────────────────────
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

// ─── Reverse geocode with Nominatim ─────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; address: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`,
      { headers: { "User-Agent": "MediAI-App/1.0" } }
    );
    const data = await res.json();
    const addr = data.address || {};
    const name =
      addr.hospital || addr.clinic || addr.building || addr.amenity ||
      addr.road || data.name || "Belgilangan joy";
    const parts = [addr.road, addr.suburb || addr.neighbourhood, addr.city || addr.town || addr.county].filter(Boolean);
    return { name, address: parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(",") || "" };
  } catch {
    return { name: "Belgilangan joy", address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
  }
}

// ─── Map click handler component ────────────────────────
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ─── Overpass API Hospitals Loader ──────────────────────
function MapHospitals({ onSelect }: { onSelect: (lat: number, lng: number, name: string) => void }) {
  const [hospitals, setHospitals] = useState<HospitalMarker[]>([]);
  
  const map = useMapEvents({
    moveend: () => fetchHospitals(),
    zoomend: () => fetchHospitals(),
  });

  const fetchHospitals = async () => {
    // Only load if zoomed in enough to prevent huge queries
    if (map.getZoom() < 12) return;
    
    const bounds = map.getBounds();
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="hospital"](${bbox});
        way["amenity"="hospital"](${bbox});
        node["amenity"="clinic"](${bbox});
        way["amenity"="clinic"](${bbox});
      );
      out center;
    `;
    
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
      });
      const data = await res.json();
      const markers = data.elements.map((e: any) => ({
        id: e.id,
        lat: e.lat || e.center?.lat,
        lng: e.lon || e.center?.lon,
        name: e.tags?.name || (e.tags?.amenity === "hospital" ? "Kasalxona" : "Klinika")
      })).filter((m: any) => m.lat && m.lng);
      setHospitals(markers);
    } catch (err) {
      console.error("Overpass xatolik:", err);
    }
  };

  useEffect(() => {
    fetchHospitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {hospitals.map(h => (
        <Marker
          key={h.id}
          position={[h.lat, h.lng]}
          icon={hospitalIcon}
          eventHandlers={{
            click: () => onSelect(h.lat, h.lng, h.name)
          }}
        >
          <Tooltip direction="top" offset={[0, -30]} opacity={1}>
            <span className="font-semibold text-xs">{h.name}</span>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

// ─── Fly to location component ──────────────────────────
function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

// ─── Static preview map (no interaction) ────────────────
function StaticMapPreview({ coords, name }: { coords: string; name: string }) {
  const [lat, lng] = coords.split(",").map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-border/50 mt-2" style={{ height: 160 }}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ═══ MAIN MODULE ══════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
const AppointmentsModule = () => {
  const { user } = useAuth();
  const { isDoctor, loading: roleLoading } = useUserRole();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, DoctorProfile>>({});
  const [loading, setLoading] = useState(true);

  // doctor availability management
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [newSlot, setNewSlot] = useState({
    available_date: format(new Date(), "yyyy-MM-dd"),
    start_time: "09:00",
    end_time: "17:00",
    slot_minutes: 30,
  });

  // doctor map location picking
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // patient booking
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [docAvailability, setDocAvailability] = useState<Availability[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ scheduled_at: string }[]>([]);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);

  // ─── Data loaders ──────────────────────────────────────
  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .order("scheduled_at", { ascending: true });
    const appts = (data as Appointment[]) || [];
    setAppointments(appts);

    const ids = Array.from(new Set(appts.flatMap((a) => [a.doctor_id, a.patient_id])));
    const map: Record<string, DoctorProfile> = {};
    if (ids.length) {
      // Direct read returns rows RLS allows (own profile + related patients for doctors)
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, specialty, avatar_url")
        .in("user_id", ids);
      (profs as DoctorProfile[] | null)?.forEach((p) => { map[p.user_id] = p; });

      // Merge in public doctor directory so patients can see their doctor's name/photo
      const { data: pubDocs } = await supabase.rpc("get_public_doctors" as any);
      (pubDocs as DoctorProfile[] | null)?.forEach((p) => {
        if (ids.includes(p.user_id)) map[p.user_id] = { ...map[p.user_id], ...p };
      });
    }
    setProfilesMap(map);
    setLoading(false);
  };

  const loadDoctorData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("doctor_availability")
      .select("*")
      .eq("doctor_id", user.id)
      .order("available_date", { ascending: true });
    setAvailability((data as Availability[]) || []);
  };

  const loadDoctors = async () => {
    const { data } = await supabase.rpc("get_public_doctors" as any);
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
      const { data: avail } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", selectedDoctor)
        .eq("available_date", selectedDate);
      setDocAvailability((avail as Availability[]) || []);
      const { data: booked } = await supabase.rpc("get_booked_slots", {
        _doctor_id: selectedDoctor,
        _day: selectedDate,
      });
      setBookedSlots((booked as { scheduled_at: string }[]) || []);
    };
    load();
  }, [selectedDoctor, selectedDate, isDoctor]);

  // ─── Available slots computation ──────────────────────
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

  // ─── Map Search ───────────────────────────────────────
  const handleMapSearch = async () => {
    if (!searchQuery.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=uz&countrycodes=uz`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        toast.error("Hech narsa topilmadi. Boshqa nom bilan qidiring.");
      }
    } catch {
      toast.error("Qidiruvda xatolik yuz berdi");
    } finally {
      setGeocoding(false);
    }
  };

  // ─── Doctor: handle map click ─────────────────────────
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPickedCoords({ lat, lng });
    setGeocoding(true);
    const geo = await reverseGeocode(lat, lng);
    setLocationName(geo.name);
    setLocationAddress(geo.address);
    setGeocoding(false);
  }, []);

  const handleHospitalSelect = useCallback(async (lat: number, lng: number, name: string) => {
    setPickedCoords({ lat, lng });
    setLocationName(name);
    setGeocoding(true);
    const geo = await reverseGeocode(lat, lng);
    setLocationAddress(geo.address);
    setGeocoding(false);
    toast.success(`${name} tanlandi`);
  }, []);

  // ─── Doctor: add availability ─────────────────────────
  const addAvailability = async () => {
    if (!user) return;
    if (newSlot.start_time >= newSlot.end_time) {
      toast.error("Boshlanish vaqti tugashdan oldin bo'lishi kerak");
      return;
    }
    if (!pickedCoords) {
      toast.error("Iltimos xaritadan manzilni belgilang");
      return;
    }

    const isDuplicate = availability.some(a =>
      a.available_date === newSlot.available_date &&
      ((newSlot.start_time >= a.start_time && newSlot.start_time < a.end_time) ||
        (newSlot.end_time > a.start_time && newSlot.end_time <= a.end_time) ||
        (newSlot.start_time <= a.start_time && newSlot.end_time >= a.end_time))
    );

    if (isDuplicate) {
      toast.error("Ushbu sanada va vaqt oralig'ida allaqachon ish vaqti belgilangan. Vaqtlar to'qnashuvi!");
      return;
    }

    const coordsStr = `${pickedCoords.lat},${pickedCoords.lng}`;

    const { error } = await supabase.from("doctor_availability").insert({
      doctor_id: user.id,
      available_date: newSlot.available_date,
      
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
      slot_minutes: newSlot.slot_minutes,
      location_name: locationName || "Belgilangan joy",
      location_address: locationAddress || "",
      location_coords: coordsStr,
    });
    if (error) { toast.error("Xatolik: " + error.message); return; }
    toast.success("Ish vaqti va manzil muvaffaqiyatli qo'shildi! ✅");
    setPickedCoords(null);
    setLocationName("");
    setLocationAddress("");
    loadDoctorData();
  };

  const removeAvailability = async (id: string) => {
    await supabase.from("doctor_availability").delete().eq("id", id);
    toast.success("Ish vaqti o'chirildi");
    loadDoctorData();
  };

  // ─── Patient: book a slot ─────────────────────────────
  const book = async (slot: string) => {
    if (!user || !selectedDoctor) return;

    // Find which availability block this slot belongs to
    const [sh_val, sm_val] = slot.split(":").map(Number);
    const slotMins = sh_val * 60 + sm_val;
    const matchedAvail = docAvailability.find(a => {
      const [ash, asm] = a.start_time.split(":").map(Number);
      const [aeh, aem] = a.end_time.split(":").map(Number);
      return slotMins >= (ash * 60 + asm) && slotMins < (aeh * 60 + aem);
    }) || docAvailability[0];

    setBooking(true);

    const scheduled = new Date(selectedDate + "T" + slot + ":00");
    const scheduledIso = scheduled.toISOString();

    // Check for duplicate
    const isDuplicate = bookedSlots.some(b => b.scheduled_at === scheduledIso);
    if (isDuplicate) {
      toast.error("Bu vaqt allaqachon band qilingan.");
      setBooking(false);
      return;
    }

    const { error } = await supabase.from("appointments").insert({
      doctor_id: selectedDoctor,
      patient_id: user.id,
      scheduled_at: scheduledIso,
      duration_minutes: matchedAvail?.slot_minutes || 30,
      reason: reason || null,
      location_name: matchedAvail?.location_name || null,
      location_address: matchedAvail?.location_address || null,
      location_coords: matchedAvail?.location_coords || null,
    });
    setBooking(false);
    if (error) { toast.error("Band qilishda xatolik"); return; }
    toast.success("Qabulga yozildingiz! Shifokor tasdiqlashini kuting. 🎉");
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

  // ─── Categorize appointments ──────────────────────────
  const upcoming = appointments.filter((a) => a.status !== "cancelled" && a.status !== "completed");
  const past = appointments.filter((a) => a.status === "cancelled" || a.status === "completed");

  // ─── Render appointment card ──────────────────────────
  const renderAppointmentCard = (a: Appointment) => {
    const other = profilesMap[isDoctor ? a.patient_id : a.doctor_id];

    // Build Google Maps navigation URL
    const getNavigationUrl = () => {
      if (a.location_coords) {
        return `https://www.google.com/maps/dir/?api=1&destination=${a.location_coords}&travelmode=driving`;
      }
      if (a.location_name) {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${a.location_name} ${a.location_address || ""}`)}`;
      }
      return null;
    };

    const navUrl = getNavigationUrl();

    return (
      <motion.div
        key={a.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-5 shadow-card border border-border hover:shadow-lg transition-shadow duration-300"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {other?.avatar_url ? (
              <img src={other.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-semibold text-primary">
                {(other?.full_name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{other?.full_name || (isDoctor ? "Bemor" : "Shifokor")}</p>
              {!isDoctor && other?.specialty && <p className="text-xs text-muted-foreground">{other.specialty}</p>}
              {a.reason && <p className="text-xs text-muted-foreground truncate mt-0.5">{a.reason}</p>}
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusStyles[a.status] || ""}`}>
            {statusLabel[a.status] || a.status}
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {format(new Date(a.scheduled_at), "dd.MM.yyyy")}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {format(new Date(a.scheduled_at), "HH:mm")}</span>
          </div>

          {/* Location info + Navigator button */}
          {a.location_name && (
            <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 mt-1 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground text-xs block">{a.location_name}</span>
                  {a.location_address && <span className="text-muted-foreground text-xs">{a.location_address}</span>}
                </div>
              </div>

              {/* Mini map preview */}
              {a.location_coords && <StaticMapPreview coords={a.location_coords} name={a.location_name} />}

              {/* NAVIGATOR BUTTON */}
              {navUrl && (
                <a
                  href={navUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                    bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md
                    hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg hover:scale-[1.01]
                    active:scale-[0.99]"
                >
                  <Navigation size={16} />
                  Navigator orqali borish
                  <ExternalLink size={14} className="opacity-70" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
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
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════
  // ═══ RENDER ═══════════════════════════════════════════
  // ═══════════════════════════════════════════════════════
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

      {/* ═══ DOCTOR: Ish vaqti qo'shish ═══ */}
      {isDoctor && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary" /> Ish vaqti qo'shish
          </h3>

          <div className="flex flex-col gap-4">
            {/* Date/Time inputs */}
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Sana</label>
                <input type="date" value={newSlot.available_date} min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setNewSlot({ ...newSlot, available_date: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Boshlanish</label>
                <input type="time" value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tugash</label>
                <input type="time" value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Slot (daqiqa)</label>
                <select value={newSlot.slot_minutes}
                  onChange={(e) => setNewSlot({ ...newSlot, slot_minutes: Number(e.target.value) })}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground">
                  {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Location: Interactive Map */}
            <div>
              <label className="text-xs text-muted-foreground block mb-2 flex items-center gap-1.5">
                <MapPin size={14} /> Shifoxona manzilini xaritadan belgilang
              </label>

              {/* SEARCH INPUT */}
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Viloyat, tuman, shahar yoki shifoxona nomini qidiring..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
                    className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleMapSearch}
                  disabled={geocoding}
                  className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  {geocoding ? "Qidirilmoqda..." : "Qidirish"}
                </button>
              </div>

              <p className="text-xs text-muted-foreground/80 mb-2">
                Kattalashtirilgan hududdagi kasalxonalar qizil rangli belgilar 🏥 bilan ko'rsatiladi. Uni bosib tezda tanlashingiz mumkin.
              </p>

              <div className="rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: 380 }}>
                <MapContainer
                  center={[41.3111, 69.2797]} // Tashkent center
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <MapClickHandler onLocationSelect={handleMapClick} />
                  <MapHospitals onSelect={handleHospitalSelect} />
                  {pickedCoords && (
                    <>
                      <Marker position={[pickedCoords.lat, pickedCoords.lng]} />
                      {/* Only fly to picked if mapCenter wasn't just set by search */}
                    </>
                  )}
                  {mapCenter && <FlyToLocation lat={mapCenter.lat} lng={mapCenter.lng} />}
                </MapContainer>
              </div>
            </div>

            {/* Location details after picking */}
            {pickedCoords && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Shifoxona nomi</label>
                  <input
                    value={geocoding ? "Aniqlanmoqda..." : locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Masalan: Markaziy poliklinika"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                    disabled={geocoding}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Manzil</label>
                  <input
                    value={geocoding ? "Aniqlanmoqda..." : locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Masalan: Toshkent sh., Yunusobod tumani"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                    disabled={geocoding}
                  />
                </div>
                <div className="sm:col-span-2 text-xs text-muted-foreground/60">
                  📍 Koordinatalar: {pickedCoords.lat.toFixed(6)}, {pickedCoords.lng.toFixed(6)}
                </div>
              </motion.div>
            )}

            {/* Add button */}
            <button
              onClick={addAvailability}
              disabled={geocoding}
              className="mt-2 flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition w-max disabled:opacity-50"
            >
              <Plus size={16} /> Qo'shish
            </button>
          </div>

          {/* Existing availability list */}
          {availability.length > 0 && (
            <div className="flex flex-col gap-2 mt-6 border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-2">Mavjud ish vaqtlari</h4>
              {availability.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground">
                  <div className="min-w-0">
                    <span className="font-semibold block">{format(new Date(a.available_date), "dd.MM.yyyy")}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}
                      {a.location_name && ` • ${a.location_name}`}
                    </span>
                    {a.location_address && <span className="text-xs text-muted-foreground/70 block">{a.location_address}</span>}
                  </div>
                  <button onClick={() => removeAvailability(a.id)} className="p-2 bg-destructive/15 rounded-lg text-destructive hover:bg-destructive hover:text-destructive-foreground transition shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ PATIENT: Qabulga yozilish ═══ */}
      {!isDoctor && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Stethoscope size={18} className="text-primary" /> Yangi qabulga yozilish
          </h3>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
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
              <input type="date" value={selectedDate} min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Sabab (ixtiyoriy)</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Masalan: konsultatsiya"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
            </div>
          </div>

          {/* Show doctor's location on map */}
          {docAvailability.length > 0 && docAvailability[0]?.location_coords && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">{docAvailability[0].location_name}</span>
              </div>
              {docAvailability[0].location_address && (
                <p className="text-xs text-muted-foreground mb-2">{docAvailability[0].location_address}</p>
              )}
              <div className="rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: 200 }}>
                <MapContainer
                  center={docAvailability[0].location_coords.split(",").map(Number) as [number, number]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={true}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={docAvailability[0].location_coords.split(",").map(Number) as [number, number]} />
                </MapContainer>
              </div>
              {/* Navigate to doctor location */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${docAvailability[0].location_coords}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold
                  bg-gradient-to-r from-blue-500 to-indigo-600 text-white
                  hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                <Navigation size={14} /> Shifoxonaga navigatsiya
              </a>
            </div>
          )}

          {/* Available time slots */}
          {selectedDoctor && selectedDate && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Bo'sh vaqtlar:</p>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-xl border border-warning/20">Bu kunda bo'sh vaqt yo'q.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((s) => {
                    const isTaken = bookedSlots.some(b => b.scheduled_at === new Date(selectedDate + "T" + s + ":00").toISOString());
                    return (
                      <button key={s} disabled={booking || isTaken} onClick={() => !isTaken && book(s)}
                        className={`px-4 py-2 rounded-xl text-sm transition border ${
                          isTaken
                            ? "bg-secondary text-muted-foreground/50 border-border/50 cursor-not-allowed opacity-50"
                            : "bg-secondary hover:gradient-primary hover:text-primary-foreground border-border hover:border-transparent text-foreground shadow-sm"
                        }`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ Appointments Lists ═══ */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          <span className="ml-3 text-muted-foreground">Yuklanmoqda...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <CalendarClock size={18} className="text-primary" /> Faol qabullar
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl text-center">Faol qabullar yo'q.</p>
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
