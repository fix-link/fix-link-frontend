import React from "react";

interface StatsCardProps {
    title: string;
    count: number | string;
    icon: string;
    color?: string;
    bgGradient?: string;
    isCurrency?: boolean;
    isRating?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, count, icon, color = "text-white", bgGradient, isCurrency, isRating }) => {
    const formattedCount = isCurrency 
        ? `${Number(count).toLocaleString()} ETB` 
        : isRating 
            ? Number(count).toFixed(1)
            : count;

    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg transition-transform hover:scale-[1.02] ${bgGradient ? bgGradient : "bg-surface-light"} ${color}`}>
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold uppercase tracking-wider opacity-80">{title}</p>
                    <h3 className="mt-1 text-3xl font-black">{formattedCount}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                    <span className="material-symbols-outlined text-3xl">{icon}</span>
                </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-black/10 blur-2xl"></div>
        </div>
    );
};

export default StatsCard;
