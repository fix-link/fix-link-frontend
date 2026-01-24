import React from "react";

interface StatsCardProps {
    title: string;
    count: number;
    icon: string;
    color?: string;
    bgGradient?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, count, icon, color = "text-white", bgGradient }) => {
    return (
        <div className={`flex flex-col justify-between rounded-2xl p-6 shadow-card transition-transform hover:-translate-y-1 duration-300 ${bgGradient ? bgGradient : "bg-surface-light"}`}>
            <div className="flex items-start justify-between">
                <p className={`text-base font-medium leading-normal ${color}`}>{title}</p>
                <div className={`rounded-full p-2.5 ${color}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
            </div>
            <p className={`mt-4 text-5xl font-bold leading-tight tracking-tight ${color}`}>{count}</p>
        </div>
    );
};

export default StatsCard;
