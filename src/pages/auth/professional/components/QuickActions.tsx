const actions = [
    { icon: "search", label: "View Available Jobs" },
    { icon: "event_available", label: "Update Availability" },
    { icon: "account_balance_wallet", label: "Withdraw Earnings" },
    { icon: "rocket_launch", label: "Promote My Profile", highlight: true },
];

const QuickActions: React.FC = () => {
    return (
        <div className="flex flex-col rounded-2xl bg-surface-light p-6 shadow-card dark:bg-surface-dark">
            <h2 className="mb-4 text-xl font-bold text-text-light dark:text-text-dark">
                Quick Actions
            </h2>

            <div className="flex flex-col gap-3">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 text-left font-semibold transition
              ${action.highlight
                                ? "bg-gradient-to-br from-accent-gold to-yellow-400 text-yellow-900 shadow-md"
                                : "border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:bg-primary/10 hover:text-primary"
                            }
            `}
                    >
                        <span className="material-symbols-outlined">
                            {action.icon}
                        </span>
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;