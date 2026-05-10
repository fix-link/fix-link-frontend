import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useData } from "../../../context/DataContext";
import { markNotificationAsRead, markAllAsRead, type Notification } from "../../../api/notifications.api";
import { 
    Briefcase, 
    CheckCircle, 
    BadgeCheck, 
    MessageSquare, 
    XCircle, 
    CreditCard, 
    Info, 
    Clock, 
    BellOff, 
    CheckCheck,
    ChevronRight
} from 'lucide-react';

const TYPE_META: Record<string, { icon: any; color: string; bg: string }> = {
    job_request:  { icon: Briefcase,           color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30" },
    new_job:      { icon: Briefcase,           color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30" },
    new_request:  { icon: Briefcase,           color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30" },
    accepted:     { icon: CheckCircle,         color: "text-emerald-600",bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    completed:    { icon: BadgeCheck,          color: "text-emerald-600",bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    done:         { icon: CheckCircle,         color: "text-emerald-600",bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    message:      { icon: MessageSquare,       color: "text-primary",    bg: "bg-primary/10" },
    msg:          { icon: MessageSquare,       color: "text-primary",    bg: "bg-primary/10" },
    chat:         { icon: MessageSquare,       color: "text-primary",    bg: "bg-primary/10" },
    cancelled:    { icon: XCircle,             color: "text-red-500",    bg: "bg-red-100 dark:bg-red-900/30" },
    declined:     { icon: XCircle,             color: "text-red-500",    bg: "bg-red-100 dark:bg-red-900/30" },
    payment:      { icon: CreditCard,          color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
    info:         { icon: Info,                color: "text-slate-500",  bg: "bg-slate-100 dark:bg-slate-800" },
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
                    <meta.icon size={18} className={meta.color} />
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
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-bold">{timeStr}</span>
                        {dateStr && <span className="text-[10px] text-slate-300 font-bold">• {dateStr}</span>}
                    </div>
                </div>

                {/* Arrow */}
                <ChevronRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
            </div>
        );
    };

    return (
        <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Background decorative blobs - matching customer dashboard */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>

            <Sidebar />
            <div className="flex flex-1 flex-col lg:ml-64 relative z-10">
                <Header />

                <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar relative">
                    <div className="max-w-[1000px] mx-auto w-full">

                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 animate-fade-in-up">
                            <div className="space-y-3">
                                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan">Activity</span> Stream
                                </h1>
                                <div className="flex items-center gap-3">
                                    <span className={`size-2.5 rounded-full ${unreadCount > 0 ? "bg-primary animate-pulse" : "bg-emerald-500 shadow-lg shadow-emerald-500/20"}`} />
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                        {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}` : "All activities logged"}
                                    </p>
                                </div>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAll}
                                    disabled={markingAll}
                                    className="flex items-center gap-2.5 px-7 py-3.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm active:scale-95 group"
                                >
                                    <CheckCheck size={16} className="group-hover:rotate-12 transition-transform" />
                                    Clear Stream
                                </button>
                            )}
                        </div>

                        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in-up [animation-delay:100ms]">
                            {notifications.length === 0 ? (
                                <div className="py-40 flex flex-col items-center gap-8 text-center px-10">
                                    <div className="size-28 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-inner group transition-transform hover:scale-110 duration-700">
                                        <BellOff size={48} className="text-slate-200 dark:text-slate-700 group-hover:rotate-12 transition-transform" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Stream Silent</p>
                                        <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">No new updates or jobs at this moment.</p>
                                    </div>
                                </div>
                            ) : (
                                Object.entries(grouped).map(([label, items]) =>
                                    items.length === 0 ? null : (
                                        <div key={label}>
                                            <div className="px-10 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50">
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{label}</span>
                                            </div>
                                            <div className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                                {items.map(n => <NotificationItem key={n.id} n={n} />)}
                                            </div>
                                        </div>
                                    )
                                )
                            )}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default ProfessionalNotifications;
