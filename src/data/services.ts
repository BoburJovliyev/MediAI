import { Lang } from "@/i18n/translations";

export interface ServiceInfo {
  id: string;
  icon: string;
  color: string;
  /** unique animation style key */
  anim: "pulse" | "scan" | "orbit" | "wave" | "flip" | "float";
  price: Record<Lang, string>;
  period: Record<Lang, string>;
  name: Record<Lang, string>;
  desc: Record<Lang, string>;
  points: Record<Lang, string[]>;
}

export const services: ServiceInfo[] = [
  {
    id: "radiology",
    icon: "ScanLine",
    color: "from-primary to-medical-teal",
    anim: "scan",
    price: { uz: "89 000", ru: "89 000", en: "$9" },
    period: { uz: "so'm / tahlil", ru: "сум / анализ", en: "/ scan" },
    name: { uz: "AI Radiologiya", ru: "AI Радиология", en: "AI Radiology" },
    desc: {
      uz: "Rentgen, UZI va MRT tasvirini bir daqiqada tahlil qilish, patologiya belgilash va PDF hisobot.",
      ru: "Анализ рентгена, УЗИ и МРТ за минуту, разметка патологии и PDF-отчёт.",
      en: "X-ray, ultrasound and MRI analysed in a minute with pathology markup and a PDF report.",
    },
    points: {
      uz: ["Ishonch darajasi (%)", "Shifokorga tavsiya", "Tarixni saqlash"],
      ru: ["Уровень уверенности (%)", "Рекомендация врачу", "Сохранение истории"],
      en: ["Confidence score", "Clinical recommendation", "Saved history"],
    },
  },
  {
    id: "nutrition",
    icon: "Salad",
    color: "from-accent to-medical-green",
    anim: "float",
    price: { uz: "0", ru: "0", en: "$0" },
    period: { uz: "so'm / bepul", ru: "сум / бесплатно", en: "/ free" },
    name: { uz: "Kunlik Ratsion AI", ru: "Дневной рацион AI", en: "Daily Nutrition AI" },
    desc: {
      uz: "Ovqat rasmidan kaloriya, oqsil, yog' va uglevodni aniqlash; 14 kunlik trend bazadan avtomatik yangilanadi.",
      ru: "Калории и макросы по фото еды; 14-дневный тренд обновляется из базы автоматически.",
      en: "Calories and macros from a food photo; the 14-day trend updates automatically from your data.",
    },
    points: {
      uz: ["Me'yordan farqi", "Makro grafiklar", "AI menyu rejasi"],
      ru: ["Отклонение от нормы", "Графики макросов", "AI-план меню"],
      en: ["Deviation from norm", "Macro charts", "AI menu plan"],
    },
  },
  {
    id: "consult",
    icon: "Stethoscope",
    color: "from-medical-teal to-primary",
    anim: "pulse",
    price: { uz: "120 000", ru: "120 000", en: "$12" },
    period: { uz: "so'm / qabul", ru: "сум / приём", en: "/ visit" },
    name: { uz: "Onlayn konsultatsiya", ru: "Онлайн-консультация", en: "Online consultation" },
    desc: {
      uz: "Shifokor bilan chat va video qabul, elektron retsept hamda qabul joyiga navigatsiya.",
      ru: "Чат и видеоприём с врачом, э-рецепт и навигация до клиники.",
      en: "Chat and video visit with a doctor, e-prescription and clinic navigation.",
    },
    points: {
      uz: ["Video qo'ng'iroq", "Elektron retsept", "Navigatsiya"],
      ru: ["Видеозвонок", "Э-рецепт", "Навигация"],
      en: ["Video call", "E-prescription", "Navigation"],
    },
  },
  {
    id: "monitoring",
    icon: "Activity",
    color: "from-medical-red to-medical-orange",
    anim: "wave",
    price: { uz: "199 000", ru: "199 000", en: "$19" },
    period: { uz: "so'm / oy", ru: "сум / мес", en: "/ month" },
    name: { uz: "Uzluksiz monitoring", ru: "Непрерывный мониторинг", en: "Continuous monitoring" },
    desc: {
      uz: "Yurak, qon bosimi va ovqatlanish ko'rsatkichlarini kuzatish, anomaliya haqida bildirishnoma.",
      ru: "Отслеживание сердца, давления и питания с уведомлениями об аномалиях.",
      en: "Heart, blood pressure and nutrition tracking with anomaly alerts.",
    },
    points: {
      uz: ["Real vaqt grafiklari", "Anomaliya signali", "Haftalik hisobot"],
      ru: ["Графики в реальном времени", "Сигнал аномалии", "Недельный отчёт"],
      en: ["Realtime charts", "Anomaly alerts", "Weekly report"],
    },
  },
  {
    id: "emergency",
    icon: "Siren",
    color: "from-medical-orange to-medical-red",
    anim: "orbit",
    price: { uz: "49 000", ru: "49 000", en: "$5" },
    period: { uz: "so'm / chaqiruv", ru: "сум / вызов", en: "/ call" },
    name: { uz: "Shoshilinch yordam", ru: "Неотложная помощь", en: "Emergency care" },
    desc: {
      uz: "30 soniyada navbatchi shifokorga video chaqiruv va eng yaqin shifoxonaga yo'l.",
      ru: "Видеозвонок дежурному врачу за 30 секунд и маршрут до ближайшей клиники.",
      en: "Video call to an on-duty doctor in 30 seconds and a route to the nearest clinic.",
    },
    points: {
      uz: ["24/7 navbatchi", "Chaqiruvlar tarixi", "Tezkor bildirishnoma"],
      ru: ["Дежурный 24/7", "История вызовов", "Мгновенные уведомления"],
      en: ["24/7 on duty", "Call history", "Instant alerts"],
    },
  },
  {
    id: "clinic",
    icon: "Building2",
    color: "from-medical-purple to-medical-blue",
    anim: "flip",
    price: { uz: "Kelishuv", ru: "Договорная", en: "Custom" },
    period: { uz: "klinikalar uchun", ru: "для клиник", en: "for clinics" },
    name: { uz: "Klinika uchun Enterprise", ru: "Enterprise для клиник", en: "Clinic Enterprise" },
    desc: {
      uz: "Shifokorlar jamoasi, guruh chatlari, bemorlar bazasi, hisobotlar va admin monitoring paneli.",
      ru: "Команда врачей, групповые чаты, база пациентов, отчёты и админ-мониторинг.",
      en: "Doctor teams, group chats, patient base, reports and an admin monitoring panel.",
    },
    points: {
      uz: ["Cheksiz shifokor", "Audit va xavfsizlik", "Alohida qo'llab-quvvatlash"],
      ru: ["Без лимита врачей", "Аудит и безопасность", "Выделенная поддержка"],
      en: ["Unlimited doctors", "Audit & security", "Dedicated support"],
    },
  },
];

export const servicesCopy = {
  heading: { uz: "Xizmatlar va narxlar", ru: "Услуги и цены", en: "Services & pricing" },
  sub: {
    uz: "Har bir xizmat AI diagnostikasi, jonli shifokorlar va real bazadagi ma'lumotlarga tayanadi.",
    ru: "Каждая услуга опирается на ИИ-диагностику, живых врачей и реальные данные.",
    en: "Every service is powered by AI diagnostics, real doctors and live data.",
  },
  request: { uz: "So'rov yuborish", ru: "Оставить заявку", en: "Send a request" },
  requestSub: {
    uz: "Xizmatni tanlang — biz siz bilan bog'lanamiz.",
    ru: "Выберите услугу — мы свяжемся с вами.",
    en: "Pick a service — we'll get back to you.",
  },
  name: { uz: "Ismingiz", ru: "Ваше имя", en: "Your name" },
  email: { uz: "Email", ru: "Email", en: "Email" },
  message: { uz: "Xabar", ru: "Сообщение", en: "Message" },
  send: { uz: "Yuborish", ru: "Отправить", en: "Send" },
  sent: { uz: "So'rov yuborildi!", ru: "Заявка отправлена!", en: "Request sent!" },
  choose: { uz: "Xizmat", ru: "Услуга", en: "Service" },
};
