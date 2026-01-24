type ScheduleItem = {
    client: string;
    service: string;
    time: string;
    address: string;
    status: "active" | "completed" | "pending";
    icon: string;
};

const schedule: ScheduleItem[] = [
    {
        client: "John Smith",
        service: "Outlet Installation",
        time: "10:00 AM",
        address: "123 Main St",
        status: "active",
        icon: "electrical_services",
    },
    {
        client: "Emily White",
        service: "Lighting Fixture",
        time: "2:30 PM",
        address: "456 Oak Ave",
        status: "active",
        icon: "lightbulb",
    },
    {
        client: "Michael Johnson",
        service: "Breaker Fix",
        time: "4:00 PM",
        address: "789 Pine Ln",
        status: "completed",
        icon: "task_alt",
    },
];

const ScheduleList: React.FC = () => {
    return (
        <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
                    Today’s Schedule
                </h2>
                <button className="text-sm font-semibold text-primary hover:underline">
                    View Full Calendar
                </button>
            </div>

            <div className="space-y-3 rounded-2xl bg-surface-light p-4 shadow-card dark:bg-surface-dark">
                {schedule.map((item) => (
                    <div
                        key={item.client}
                        className="flex items-center gap-4 rounded-xl p-3 hover:bg-background-light dark:hover:bg-background-dark"
                    >
                        <div className="rounded-lg bg-primary/10 p-3">
                            <span className="material-symbols-outlined text-primary">
                                {item.icon}
                            </span>
                        </div>

                        <div className="flex-1">
                            <p className="font-semibold">{item.client}</p>
                            <p className="text-sm text-subtext-light dark:text-subtext-dark">
                                {item.service}
                            </p>
                            <p className="text-sm font-medium mt-1">{item.time}</p>
                        </div>

                        <button
                            className={`rounded-lg px-4 py-2 text-sm font-semibold
                ${item.status === "completed"
                                    ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                                    : "bg-primary text-white hover:bg-primary/90"
                                }
              `}
                        >
                            {item.status === "completed" ? "Done" : "Navigate"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScheduleList;
