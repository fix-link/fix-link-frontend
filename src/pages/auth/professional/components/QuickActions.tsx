import { useNavigate } from "react-router-dom";

const QuickActions: React.FC = () => {
    const navigate = useNavigate();

    const actions = [
        {
            icon: "calendar_month",
            label: "My Schedule",
            sub: "View booked & active jobs",
            onClick: () => navigate("/professional/jobs"),
            highlight: false,
        },
        {
            icon: "account_balance_wallet",
            label: "View Earnings",
            sub: "Payments & escrow balance",
            onClick: () => navigate("/professional/earnings"),
            highlight: false,
        },
        {
            icon: "star",
            label: "My Reviews",
            sub: "See customer feedback",
            onClick: () => navigate("/professional/profile/" + JSON.parse(localStorage.getItem('user') || '{}').id + "?tab=reviews"),
            highlight: false,
        },
        {
            icon: "rocket_launch",
            label: "Promote Profile",
            sub: "Boost your visibility",
            onClick: () => navigate("/professional/promote"),
            highlight: true,
        },
    ];

    return (
        <div className="flex flex-col rounded-[2.5rem] bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/50 transition-all duration-500">
            <h2 className="mb-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] px-1 flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                Quick Actions
            </h2>

            <div className="flex flex-col gap-3">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={action.onClick}
                        className={`flex items-center gap-5 rounded-2xl p-4 text-left transition-all duration-300 active:scale-[0.98] group relative overflow-hidden
                            ${action.highlight
                                ? "bg-primary text-white shadow-xl shadow-primary/30 hover:scale-[1.02]"
                                : "border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary/30 hover:shadow-lg"
                            }
                        `}
                    >
                        <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${action.highlight ? "bg-white/20" : "bg-primary/10"}`}>
                            <span className={`material-symbols-outlined text-2xl font-black ${action.highlight ? "text-white" : "text-primary"}`}>
                                {action.icon}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-black leading-tight mb-0.5 tracking-tight ${action.highlight ? "text-white" : "text-slate-900 dark:text-white"}`}>
                                {action.label}
                            </p>
                            <p className={`text-[10px] font-bold tracking-tight ${action.highlight ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                                {action.sub}
                            </p>
                        </div>
                        <div className={`transition-all duration-500 group-hover:translate-x-1 ${action.highlight ? "text-white/70" : "text-slate-300 group-hover:text-primary"}`}>
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </div>
                        
                        {action.highlight && (
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;