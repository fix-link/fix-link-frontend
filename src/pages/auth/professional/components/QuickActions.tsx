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
            onClick: () => navigate("/professional/reviews"),
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
        <div className="flex flex-col rounded-2xl bg-white dark:bg-card-dark p-6 shadow-xl border border-slate-100 dark:border-slate-800">
            <h2 className="mb-5 text-lg font-black text-slate-800 dark:text-white tracking-tight">
                Quick Actions
            </h2>

            <div className="flex flex-col gap-3">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={action.onClick}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-all active:scale-95 group
                            ${action.highlight
                                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-xl hover:brightness-105"
                                : "border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/20"
                            }
                        `}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${action.highlight ? "bg-white/20" : "bg-primary/10"}`}>
                            <span className={`material-symbols-outlined text-xl ${action.highlight ? "text-white" : "text-primary"}`}>
                                {action.icon}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-black leading-none mb-0.5 ${action.highlight ? "text-white" : "text-slate-800 dark:text-white"}`}>
                                {action.label}
                            </p>
                            <p className={`text-[10px] font-medium ${action.highlight ? "text-white/70" : "text-slate-400"}`}>
                                {action.sub}
                            </p>
                        </div>
                        <span className={`material-symbols-outlined text-lg transition-transform group-hover:translate-x-1 ${action.highlight ? "text-white/70" : "text-slate-300 group-hover:text-primary"}`}>
                            chevron_right
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;