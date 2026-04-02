import { useLanguage } from "@/hooks/useLanguage";
import type { Lang } from "@/i18n/translations";

const FLAGS: Record<Lang, { src: string; label: string }> = {
  uz: {
    src: "https://img.icons8.com/color/48/uzbekistan-circular.png",
    label: "O'zbek",
  },
  ru: {
    src: "https://img.icons8.com/color/48/russian-federation-circular.png",
    label: "Русский",
  },
  en: {
    src: "https://img.icons8.com/color/48/great-britain-circular.png",
    label: "English",
  },
};

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LanguageSwitcher = ({ compact = false }: LanguageSwitcherProps) => {
  const { lang, setLang } = useLanguage();

  if (compact) {
    const nextLang: Lang = lang === "uz" ? "ru" : lang === "ru" ? "en" : "uz";
    return (
      <button
        onClick={() => setLang(nextLang)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all"
        title={FLAGS[lang].label}
      >
        <img src={FLAGS[lang].src} alt={FLAGS[lang].label} className="w-5 h-5 rounded-full" />
        <span className="text-xs font-bold text-primary">{lang.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {(["uz", "ru", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            lang === l
              ? "gradient-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          <img src={FLAGS[l].src} alt={FLAGS[l].label} className="w-4 h-4 rounded-full" />
          {FLAGS[l].label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
