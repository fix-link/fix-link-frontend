import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { 
    LayoutDashboard, 
    Briefcase, 
    MessageSquare, 
    CreditCard, 
    User, 
    Star, 
    Rocket, 
    Bell,
    LogOut
} from 'lucide-react';

const navItems = [
    { to: "/professional/home",          icon: LayoutDashboard,  label: "dashboard" },
    { to: "/professional/jobs",           icon: Briefcase,        label: "jobs" },
    { to: "/professional/messages",       icon: MessageSquare,    label: "messages" },
    { to: "/professional/earnings",       icon: CreditCard,       label: "earnings" },
    { to: "/professional/profile",        icon: User,             label: "profile" },
    { to: "/professional/reviews",        icon: Star,             label: "reviews" },
    { to: "/professional/promote",        icon: Rocket,           label: "promote" },
    { to: "/professional/notifications",  icon: Bell,             label: "notifications" },
];

const Sidebar: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <aside className="fixed z-20 h-full w-64 flex-col bg-slate-900 dark:bg-slate-950 border-r border-white/5 hidden lg:flex shadow-2xl">
            {/* Background accent */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            {/* LOGO */}
            <div className="relative flex items-center gap-3 px-6 py-6 border-b border-white/5">
                <h1 className="text-xl font-black tracking-tighter text-white">{t('common.logo')}</h1>
            </div>

            {/* NAV */}
            <nav className="relative flex flex-col gap-1 flex-1 px-3 py-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                            ${isActive
                                ? "bg-primary/15 text-primary"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />}
                                <item.icon size={20} className={`transition-colors ${isActive ? "text-primary" : "text-slate-500 group-hover:text-white"}`} />
                                <p className="text-sm font-bold flex-1">{t(`common.${item.label}`)}</p>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* BOTTOM */}
            <div className="px-3 py-4 border-t border-white/5 space-y-1">
                <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all group"
                >
                    <LogOut size={20} className="transition-colors group-hover:text-red-400" />
                    <p className="text-sm font-bold">{t('common.logout')}</p>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;


