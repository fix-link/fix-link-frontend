import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useData } from "../../../context/DataContext";
import { markNotificationAsRead, markAllAsRead, type Notification } from "../../../api/notifications.api";

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
    job_request:  { icon: "work",              color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30" },
    new_job:      { icon: "work",              color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30" },
    new_request:  { icon: "work",              color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30" },
    accepted:     { icon: "check_circle",      color: "text-emerald-600",bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    completed:    { icon: "verified",          color: "text-emerald-600",bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    done:         { icon: "task_alt",          color: "text-emerald-600",bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    message:      { icon: "chat",             color: "text-primary",    bg: "bg-primary/10" },
    msg:          { icon: "chat",             color: "text-primary",    bg: "bg-primary/10" },
    chat:         { icon: "chat",             color: "text-primary",    bg: "bg-primary/10" },
    cancelled:    { icon: "cancel",           color: "text-red-500",    bg: "bg-red-100 dark:bg-red-900/30" },
    declined:     { icon: "cancel",           color: "text-red-500",    bg: "bg-red-100 dark:bg-red-900/30" },
    payment:      { icon: "payments",         color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
    info:         { icon: "info",             color: "text-slate-500",  bg: "bg-slate-100 dark:bg-slate-800" },
};

const getTypeMeta = (type: string) => {
    const key = Object.keys(TYPE_META).find(k => type?.toLowerCase().includes(k));
    return key ? TYPE_META[key] : TYPE_META.info;
};

const getDescriptiveMessage = (n: Notification) => {
    const who = n.sender_name?.trim() || null;
    const type = (n.type || "").toLowerCase();
    if (type.includes("job_request") || type.includes("new_job") || type.includes("new_request"))
        return who ? `New job request from ${who}` : "You received a new job request";
    if (type.includes("accepted"))
        return who ? `${who} accepted your services` : "Your services were accepted";
    if (type.includes("completed") || type.includes("done"))
        return who ? `${who} confirmed job completion` : "A job was marked as complete";
    if (type.includes("message") || type.includes("msg") || type.includes("chat"))
        return who ? `New message from ${who}` : "You have a new message";
    if (type.includes("cancelled") || type.includes("declined"))
        return who ? `${who} declined the request` : "A request was declined";
    const raw = (n.message || n.body || "").trim();
    const isGeneric = !raw || raw === "New Notification" || raw === "you have update" || raw.length < 5;
    return isGeneric ? "You have a new update" : raw;
};

const groupByDate = (notifications: Notification[]) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const groups: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] };
    notifications.forEach(n => {
        const d = new Date(n.created_at); d.setHours(0,0,0,0);
        if (d.getTime() === today.getTime()) groups.Today.push(n);
        else if (d.getTime() === yesterday.getTime()) groups.Yesterday.push(n);
        else groups.Earlier.push(n);
    });
    return groups;
};

const ProfessionalNotifications: React.FC = () => {
    const navigate = useNavigate();
    const { notifications, refreshNotifications } = useData();
    const [markingAll, setMarkingAll] = useState(false);

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const grouped = groupByDate([...notifications].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));

    const handleMarkAll = useCallback(async () => {
        if (markingAll || unreadCount === 0) return;
        setMarkingAll(true);
        try {
            await markAllAsRead();
            await refreshNotifications();
        } finally {
            setMarkingAll(false);
        }
    }, [markingAll, unreadCount, refreshNotifications]);

    const handleClick = async (n: Notification) => {
        markNotificationAsRead(n.id).then(refreshNotifications).catch(refreshNotifications);
        if (n.conversation_id) return navigate(`/professional/messages?conversationId=${n.conversation_id}`);
        if (n.job_id) return navigate(`/professional/messages?requestId=${n.job_id}`);
        if (n.message_session_id) return navigate(`/professional/messages?messageSessionId=${n.message_session_id}`);
        if (n.link) return navigate(n.link);
        navigate("/professional/messages");
    };

    const NotificationItem = ({ n }: { n: Notification }) => {
        const meta = getTypeMeta(n.type);
        const timeStr = n.created_at
            ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now";
        const dateStr = n.created_at
            ? new Date(n.created_at).toLocaleDateString([], { day: "numeric", month: "short" })
            : "";
        return (
            <div
                onClick={() => handleClick(n)}
                className={`flex items-start gap-4 px-6 py-5 cursor-pointer border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group ${!n.is_read ? "bg-primary/[0.02]" : ""}`}
            >
                {/* Unread dot */}
                <div className="mt-1 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${!n.is_read ? "bg-primary" : "bg-transparent"}`} />
                </div>

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                    <span className={`material-symbols-outlined text-lg ${meta.color}`}>{meta.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.is_read ? "font-black text-slate-900 dark:text-white" : "font-medium text-slate-500 dark:text-gray-400"}`}>
                        {getDescriptiveMessage(n)}
                    </p>
                    {n.sender_name && (
                        <p className="text-[11px] text-primary font-bold mt-0.5">{n.sender_name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="material-symbols-outlined text-[12px] text-slate-400">schedule</span>
                        <span className="text-[10px] text-slate-400 font-bold">{timeStr}</span>
                        {dateStr && <span className="text-[10px] text-slate-300 font-bold">• {dateStr}</span>}
                    </div>
                </div>

                {/* Arrow */}
                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all text-lg shrink-0 mt-1">
                    chevron_right
                </span>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-background-dark font-display">
            <Sidebar />
            <div className="flex flex-1 flex-col lg:ml-64 overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All caught up"}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                disabled={markingAll}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all shadow-sm disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-base">done_all</span>
                                Mark All Read
                            </button>
                        )}
                    </div>

                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        {notifications.length === 0 ? (
                            <div className="py-24 flex flex-col items-center gap-5">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-5xl text-slate-300">notifications_off</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-black text-slate-600 dark:text-white">No notifications yet</p>
                                    <p className="text-sm font-medium text-slate-400 mt-1">You're all caught up! New alerts will appear here.</p>
                                </div>
                            </div>
                        ) : (
                            Object.entries(grouped).map(([label, items]) =>
                                items.length === 0 ? null : (
                                    <div key={label}>
                                        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                                        </div>
                                        {items.map(n => <NotificationItem key={n.id} n={n} />)}
                                    </div>
                                )
                            )
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
};

export default ProfessionalNotifications;
