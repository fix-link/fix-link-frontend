import React from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLng = i18n.language === "en" ? "am" : "en";
    i18n.changeLanguage(nextLng);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-white transition-all duration-300 shadow-sm group"
      title="Switch Language / ቋንቋ ይቀይሩ"
    >
      <Languages size={18} className="group-hover:rotate-12 transition-transform" />
      <span className="text-[11px] font-black uppercase tracking-widest">
        {i18n.language === "en" ? "EN" : "አማ"}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
