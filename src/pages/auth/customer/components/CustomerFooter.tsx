import { useTranslation } from "react-i18next";

const CustomerFooter = () => {
    const { t } = useTranslation();
    return (
        <footer className="mt-auto bg-transparent py-10 relative z-10 border-t border-slate-200 dark:border-slate-800/50">
            <div className="max-w-[1600px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="font-display font-black tracking-tight text-slate-900 dark:text-white text-lg group-hover:text-primary transition-colors">{t('common.logo')}</span>
                </div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                    © 2026 {t('common.logo')}. {t('common.premium_marketplace')}
                </p>
                <div className="flex gap-8 text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        {t('common.english')}
                    </span>
                    <a className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2" href="#">
                        {t('common.support_team')}
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default CustomerFooter;
