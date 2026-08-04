import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface MedicalDisclaimerProps {
  type?: "general" | "medication" | "diagnosis" | "nutrition";
}

const disclaimerTexts = {
  general: "Bu platforma faqat ma'lumot berish maqsadida yaratilgan. Tibbiy maslahat uchun mutaxassis shifokorga murojaat qiling.",
  medication: "⚠️ Ogohlantirish: Dori vositalari faqat shifokor nazorati ostida qabul qilinishi kerak. O'z-o'zini davolash xavfli bo'lishi mumkin. Dozalarni o'zgartirish yoki yangi dori boshlash uchun shifokoringizga murojaat qiling.",
  diagnosis: "Bu AI tomonidan taqdim etilgan dastlabki tahlil bo'lib, yakuniy tashxis sifatida qabul qilinmasligi kerak. Iltimos, rasmiy tashxis uchun tegishli mutaxassisga murojaat qiling.",
  nutrition: "Kaloriya va nutrientlar rasm asosida taxminiy hisoblanadi — laboratoriya aniqligiga ega emas. Ratsion tavsiyalari davolash usuli emas. Surunkali kasallik, homiladorlik, diabet yoki ovqat allergiyasi bo'lsa, parhezni faqat shifokor yoki nutritsiolog bilan kelishib o'zgartiring.",
};

const MedicalDisclaimer = ({ type = "general" }: MedicalDisclaimerProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-medical-orange-light border border-medical-orange/20 rounded-xl p-4 flex gap-3"
  >
    <AlertTriangle size={20} className="text-medical-orange shrink-0 mt-0.5" />
    <p className="text-sm text-foreground/80 leading-relaxed">{disclaimerTexts[type]}</p>
  </motion.div>
);

export default MedicalDisclaimer;
