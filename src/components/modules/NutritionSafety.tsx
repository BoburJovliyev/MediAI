import { ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import type { FoodResult } from "./FoodCalorieAI";

export interface SafetyProfile {
  ageGroup: "bola" | "osmir" | "katta" | "keksa";
  conditions: string[];
}

export const CONDITIONS = [
  { id: "diabet", label: "Diabet" },
  { id: "gipertoniya", label: "Yuqori bosim" },
  { id: "homiladorlik", label: "Homiladorlik" },
  { id: "buyrak", label: "Buyrak kasalligi" },
  { id: "allergiya", label: "Ovqat allergiyasi" },
  { id: "ovqat_buzilishi", label: "Ovqatlanish buzilishi" },
] as const;

export const AGE_GROUPS = [
  { id: "bola", label: "Bola (0–12)" },
  { id: "osmir", label: "O'smir (13–17)" },
  { id: "katta", label: "Katta (18–59)" },
  { id: "keksa", label: "Keksa (60+)" },
] as const;

/** Yosh va salomatlik holatiga qarab moslashuvchan xavfsizlik cheklovlari */
export const buildSafetyNotes = (p: SafetyProfile, r: FoodResult | null): string[] => {
  const notes: string[] = [];

  if (p.ageGroup === "bola" || p.ageGroup === "osmir") {
    notes.push("18 yoshgacha bo'lgan foydalanuvchilar uchun kaloriya cheklovi yoki parhez tavsiya etilmaydi — bu ko'rsatkichlar faqat ma'lumot uchun. Ratsionni pediatr bilan kelishing.");
  }
  if (p.ageGroup === "keksa") {
    notes.push("60+ yoshda oqsil va suyuqlik yetishmovchiligi xavfi yuqori. Kaloriyani kamaytirishdan oldin shifokor bilan maslahatlashing.");
  }
  if (p.conditions.includes("ovqat_buzilishi")) {
    notes.push("Ovqatlanish buzilishi belgilari mavjud bo'lsa, kaloriya sanash holatni yomonlashtirishi mumkin. Bu bo'limni mutaxassis nazoratisiz muntazam ishlatmang.");
  }
  if (p.conditions.includes("homiladorlik")) {
    notes.push("Homiladorlikda kaloriyani cheklash xavfli. Ko'rsatkichlarni faqat kuzatuv uchun ishlating.");
  }
  if (p.conditions.includes("diabet") && r && r.sugar_g > 25) {
    notes.push(`Ushbu porsiyada ${Math.round(r.sugar_g)} g shakar bor — diabetda bu ko'p. Qon shakarini o'lchang va endokrinolog tavsiyasiga amal qiling.`);
  }
  if (p.conditions.includes("gipertoniya") && r && r.sodium_mg > 800) {
    notes.push(`Natriy miqdori ${Math.round(r.sodium_mg)} mg — yuqori bosimda kunlik me'yorning katta qismi. Tuzni kamaytiring.`);
  }
  if (p.conditions.includes("buyrak") && r && (r.protein_g > 40 || r.sodium_mg > 700)) {
    notes.push("Buyrak kasalligida oqsil va natriy miqdori nazorat qilinadi — bu porsiya me'yordan oshishi mumkin, nefrolog bilan maslahatlashing.");
  }
  if (p.conditions.includes("allergiya")) {
    notes.push("AI tarkibdagi allergenlarni kafolatlab aniqlay olmaydi. Noma'lum taomni iste'mol qilishdan oldin tarkibini tekshiring.");
  }
  if (r && r.total_calories > 1200) {
    notes.push("Bitta ovqatda 1200 kkal dan ko'p — bu kunlik me'yorning katta qismi. Keyingi ovqatlarni yengilroq rejalashtiring.");
  }
  return notes;
};

const NutritionSafety = ({ notes }: { notes: string[] }) => {
  if (!notes.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-medical-red-light/40 border border-medical-red/20 rounded-2xl p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-medical-red" />
        <h5 className="text-sm font-semibold text-foreground">Xavfsizlik cheklovlari</h5>
      </div>
      {notes.map((n, i) => (
        <p key={i} className="text-xs text-foreground/80 leading-relaxed pl-6">• {n}</p>
      ))}
    </motion.div>
  );
};

export default NutritionSafety;
