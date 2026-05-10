import React from "react";

interface StatsCardProps {
    title: string;
    count: number | string;
    icon: string;
    color?: string; // color is now used as a background accent for the icon box
    bgGradient?: string; // no longer used for the whole card, but kept for compatibility
    isCurrency?: boolean;
    isRating?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, count, icon, color = "bg-primary", isCurrency, isRating }) => {
    const formattedCount = isCurrency 
        ? `${Number(count).toLocaleString()} ETB` 
        : isRating 
            ? Number(count).toFixed(1)
            : count;

    const getIconColor = () => {
        if (color.includes('green') || color.includes('emerald')) return 'text-emerald-500 bg-emerald-500/10';
        if (color.includes('blue') || color.includes('indigo')) return 'text-blue-500 bg-blue-500/10';
        if (color.includes('purple') || color.includes('fuchsia')) return 'text-purple-500 bg-purple-500/10';
        if (color.includes('yellow') || color.includes('orange')) return 'text-orange-500 bg-orange-500/10';
        return 'text-primary bg-primary/10';
    };

    const iconClasses = getIconColor();

    return (
        <div className="group relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl p-7 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"></div>
            
            <div className="relative z-10 flex flex-col gap-6">
                <div className={`size-14 rounded-2xl ${iconClasses} flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <span className="material-symbols-outlined text-3xl font-black">
                        {icon}
                    </span>
                </div>
                
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{title}</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        {formattedCount}
                    </h3>
                </div>
            </div>
            
            {/* Visual highlight on hover */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
        </div>
    );
};

export default StatsCard;

