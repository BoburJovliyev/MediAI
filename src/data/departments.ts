import { Lang } from "@/i18n/translations";

export interface DepartmentInfo {
  id: string;
  icon: string;
  color: string;
  accent: string;
  doctors: number;
  patients: string;
  rating: number;
  name: Record<Lang, string>;
  tagline: Record<Lang, string>;
  description: Record<Lang, string>;
  services: Record<Lang, string[]>;
}

export const departments: DepartmentInfo[] = [
  {
    id: "neurology",
    icon: "Brain",
    color: "from-medical-purple to-medical-blue",
    accent: "medical-purple",
    doctors: 14,
    patients: "6.2k",
    rating: 4.9,
    name: { uz: "Nevrologiya", ru: "Неврология", en: "Neurology" },
    tagline: {
      uz: "Miya va asab tizimi diagnostikasi",
      ru: "Диагностика мозга и нервной системы",
      en: "Brain & nervous system diagnostics",
    },
    description: {
      uz: "MRT tasvirlarini AI yordamida tahlil qilamiz, bosh og'rig'i, epilepsiya, insult xavfi va uyqu buzilishlari bo'yicha chuqur xulosa beramiz.",
      ru: "Анализируем МРТ с помощью ИИ, даём заключения по головным болям, эпилепсии, риску инсульта и нарушениям сна.",
      en: "We analyse MRI scans with AI and deliver deep insights on headaches, epilepsy, stroke risk and sleep disorders.",
    },
    services: {
      uz: ["MRT AI tahlili", "Insult xavfini baholash", "Uyqu monitoringi", "Onlayn konsultatsiya"],
      ru: ["ИИ-анализ МРТ", "Оценка риска инсульта", "Мониторинг сна", "Онлайн-консультация"],
      en: ["AI MRI analysis", "Stroke risk scoring", "Sleep monitoring", "Online consultation"],
    },
  },
  {
    id: "cardiology",
    icon: "HeartPulse",
    color: "from-medical-red to-medical-orange",
    accent: "medical-red",
    doctors: 18,
    patients: "9.4k",
    rating: 4.8,
    name: { uz: "Kardiologiya", ru: "Кардиология", en: "Cardiology" },
    tagline: {
      uz: "Yurak salomatligi 24/7 nazoratda",
      ru: "Здоровье сердца под контролем 24/7",
      en: "Heart health monitored 24/7",
    },
    description: {
      uz: "EKG va ko'krak qafasi tasvirlarini tahlil qilib, aritmiya, yurak yetishmovchiligi va qon bosimi trendlarini kuzatamiz.",
      ru: "Анализируем ЭКГ и снимки грудной клетки, отслеживаем аритмию, сердечную недостаточность и тренды давления.",
      en: "We read ECG and chest imaging to track arrhythmia, heart failure and blood-pressure trends.",
    },
    services: {
      uz: ["EKG tahlili", "Qon bosimi trendi", "Xolesterin nazorati", "Shoshilinch signal"],
      ru: ["Анализ ЭКГ", "Тренд давления", "Контроль холестерина", "Экстренный сигнал"],
      en: ["ECG analysis", "BP trends", "Cholesterol control", "Emergency alerts"],
    },
  },
  {
    id: "radiology",
    icon: "ScanLine",
    color: "from-primary to-medical-teal",
    accent: "primary",
    doctors: 21,
    patients: "12.8k",
    rating: 4.9,
    name: { uz: "AI Radiologiya", ru: "AI Радиология", en: "AI Radiology" },
    tagline: {
      uz: "Rentgen, UZI va MRT — bir daqiqada",
      ru: "Рентген, УЗИ и МРТ — за минуту",
      en: "X-ray, ultrasound and MRI in a minute",
    },
    description: {
      uz: "Tasvirni yuklang yoki kamerada suratga oling — AI patologiyani belgilaydi, ishonch darajasini va shifokorga tavsiyani chiqaradi.",
      ru: "Загрузите снимок или сфотографируйте — ИИ отметит патологию, покажет уверенность и рекомендации врачу.",
      en: "Upload or snap an image — AI marks pathology, shows confidence and clinical recommendations.",
    },
    services: {
      uz: ["Rentgen tahlili", "UZI tahlili", "MRT tahlili", "PDF hisobot"],
      ru: ["Анализ рентгена", "Анализ УЗИ", "Анализ МРТ", "PDF-отчёт"],
      en: ["X-ray analysis", "Ultrasound analysis", "MRI analysis", "PDF report"],
    },
  },
  {
    id: "nutrition",
    icon: "Salad",
    color: "from-accent to-medical-green",
    accent: "accent",
    doctors: 9,
    patients: "7.1k",
    rating: 4.7,
    name: { uz: "Kunlik Ratsion AI", ru: "Дневной рацион AI", en: "Daily Nutrition AI" },
    tagline: {
      uz: "Ovqat rasmidan kaloriya va makrolar",
      ru: "Калории и макросы по фото еды",
      en: "Calories and macros from a food photo",
    },
    description: {
      uz: "Ovqatni suratga oling — kaloriya, oqsil, yog' va uglevod ulushi, me'yordan farqi va 14 kunlik trend grafigi chiqadi.",
      ru: "Сфотографируйте еду — получите калории, белки, жиры, углеводы, отклонение от нормы и тренд за 14 дней.",
      en: "Photograph a meal — get calories, protein, fat, carbs, deviation from norm and a 14-day trend.",
    },
    services: {
      uz: ["Kaloriya hisobi", "Makro grafigi", "Menyu rejasi", "Trend tahlili"],
      ru: ["Подсчёт калорий", "График макросов", "План меню", "Анализ трендов"],
      en: ["Calorie count", "Macro charts", "Menu plan", "Trend analysis"],
    },
  },
  {
    id: "general",
    icon: "Stethoscope",
    color: "from-medical-teal to-primary",
    accent: "medical-teal",
    doctors: 32,
    patients: "18.3k",
    rating: 4.8,
    name: { uz: "Umumiy amaliyot", ru: "Общая практика", en: "General Practice" },
    tagline: {
      uz: "Birinchi murojaat va yo'naltirish",
      ru: "Первичный приём и маршрутизация",
      en: "First contact and referral",
    },
    description: {
      uz: "Simptomlaringizni yozing — AI dastlabki xulosani beradi va kerakli mutaxassisga navbat oching, retseptlarni saqlang.",
      ru: "Опишите симптомы — ИИ даст первичное заключение, запишет к нужному специалисту и сохранит рецепты.",
      en: "Describe symptoms — AI gives a first assessment, books the right specialist and stores prescriptions.",
    },
    services: {
      uz: ["Simptom tahlili", "Qabulga yozilish", "Elektron retsept", "Tibbiy tarix"],
      ru: ["Анализ симптомов", "Запись на приём", "Э-рецепт", "История болезни"],
      en: ["Symptom triage", "Appointments", "E-prescription", "Medical history"],
    },
  },
  {
    id: "emergency",
    icon: "Siren",
    color: "from-medical-orange to-medical-red",
    accent: "medical-orange",
    doctors: 11,
    patients: "4.5k",
    rating: 4.9,
    name: { uz: "Shoshilinch yordam", ru: "Неотложная помощь", en: "Emergency Care" },
    tagline: {
      uz: "Video chaqiruv 30 soniyada",
      ru: "Видеозвонок за 30 секунд",
      en: "Video call within 30 seconds",
    },
    description: {
      uz: "Kechayu kunduz navbatchi shifokorga video chaqiruv, eng yaqin shifoxonaga navigatsiya va chaqiruvlar tarixi.",
      ru: "Круглосуточный видеозвонок дежурному врачу, навигация до ближайшей клиники и история вызовов.",
      en: "Round-the-clock video call to an on-duty doctor, navigation to the nearest clinic and call history.",
    },
    services: {
      uz: ["24/7 video chaqiruv", "Navigatsiya", "Chaqiruvlar tarixi", "Tezkor bildirishnoma"],
      ru: ["Видеозвонок 24/7", "Навигация", "История вызовов", "Мгновенные уведомления"],
      en: ["24/7 video call", "Navigation", "Call history", "Instant alerts"],
    },
  },
];

export const deptCopy = {
  heading: {
    uz: "Bo'limlarimiz",
    ru: "Наши отделения",
    en: "Our Departments",
  },
  sub: {
    uz: "Har bir bo'lim AI diagnostikasi, jonli shifokorlar va uzluksiz nazorat bilan ta'minlangan.",
    ru: "Каждое отделение оснащено ИИ-диагностикой, живыми врачами и непрерывным мониторингом.",
    en: "Every department combines AI diagnostics, real doctors and continuous monitoring.",
  },
  doctors: { uz: "shifokor", ru: "врачей", en: "doctors" },
  patients: { uz: "bemor", ru: "пациентов", en: "patients" },
  services: { uz: "Xizmatlar", ru: "Услуги", en: "Services" },
  open: { uz: "Batafsil", ru: "Подробнее", en: "Explore" },
};
