import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";

const STATUS_COLORS: Record<string, string> = {
    pending:     "bg-amber-100 text-amber-700 border-amber-200",
    accepted:    "bg-blue-100 text-blue-700 border-blue-200",
    booked:      "bg-indigo-100 text-indigo-700 border-indigo-200",
    in_progress: "bg-violet-100 text-violet-700 border-violet-200",
    done:        "bg-cyan-100 text-cyan-700 border-cyan-200",
    completed:   "bg-emerald-100 text-emerald-700 border-emerald-200",
    approved:    "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled:   "bg-red-100 text-red-600 border-red-200",
};

const STATUS_ICONS: Record<string, string> = {
    pending:     "hourglass_empty",
    accepted:    "check_circle",
    booked:      "event_available",
    in_progress: "engineering",
    done:        "task_alt",
    completed:   "verified",
    approved:    "verified",
    cancelled:   "cancel",
};

const FILTERS = ["All", "Pending", "Active", "Completed", "Cancelled"];

const ProfessionalJobs: React.FC = () => {
    const { user } = useAuth();
    const { jobs, jobsLoading, refreshJobs } = useData();
    const [activeFilter, setActiveFilter] = useState("All");
    const [search, setSearch] = useState("");

    // Filter only this professional's jobs
    const myJobs = useMemo(() =>
        jobs.filter((j: any) =>
            j.professional === user?.id ||
            j.assigned_to === user?.id ||
            (j.professional_detail?.id === user?.id)
        ), [jobs, user?.id]);

    const filtered = useMemo(() => {
        let result = myJobs;

        if (activeFilter === "Pending")   result = result.filter((j: any) => j.status === "pending");
        if (activeFilter === "Active")    result = result.filter((j: any) => ["accepted", "booked", "in_progress", "done"].includes(j.status));
        if (activeFilter === "Completed") result = result.filter((j: any) => ["completed", "approved"].includes(j.status));
        if (activeFilter === "Cancelled") result = result.filter((j: any) => j.status === "cancelled");

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((j: any) =>
                j.title?.toLowerCase().includes(q) ||
                j.description?.toLowerCase().includes(q) ||
                j.customer_detail?.first_name?.toLowerCase().includes(q) ||
                j.customer_detail?.last_name?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [myJobs, activeFilter, search]);

    const counts = useMemo(() => ({
        all:       myJobs.length,
        pending:   myJobs.filter((j: any) => j.status === "pending").length,
        active:    myJobs.filter((j: any) => ["accepted", "booked", "in_progress", "done"].includes(j.status)).length,
        completed: myJobs.filter((j: any) => ["completed", "approved"].includes(j.status)).length,
        cancelled: myJobs.filter((j: any) => j.status === "cancelled").length,
    }), [myJobs]);

    const filterCounts: Record<string, number> = {
        All: counts.all, Pending: counts.pending, Active: counts.active,
        Completed: counts.completed, Cancelled: counts.cancelled,
    };

    const getCustomerName = (job: any) => {
        const d = job.customer_detail;
        if (d?.first_name) return `${d.first_name} ${d.last_name || ""}`.trim();
        return "Customer";
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
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Jobs</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">All service requests assigned to you</p>
                        </div>
                        <button
                            onClick={refreshJobs}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-base">refresh</span>
                            Refresh
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Pending", count: counts.pending, icon: "hourglass_empty", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
                            { label: "Active", count: counts.active, icon: "engineering", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                            { label: "Completed", count: counts.completed, icon: "verified", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                            { label: "Cancelled", count: counts.cancelled, icon: "cancel", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-white/50 dark:border-slate-700 shadow-sm`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                                    <span className={`text-2xl font-black ${s.color}`}>{s.count}</span>
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Filters + Search */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            {FILTERS.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${
                                        activeFilter === f
                                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    {f} {filterCounts[f] > 0 && <span className="ml-1 opacity-70">({filterCounts[f]})</span>}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 w-full sm:w-64">
                            <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-white placeholder-slate-400 w-full"
                            />
                        </div>
                    </div>

                    {/* Jobs Table */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        {jobsLoading && myJobs.length === 0 ? (
                            <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
                                <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
                                <p className="text-sm font-bold">Loading jobs...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-300">work_off</span>
                                </div>
                                <p className="text-base font-black text-slate-600 dark:text-white">No jobs found</p>
                                <p className="text-sm font-medium text-slate-400">
                                    {activeFilter !== "All" ? `No ${activeFilter.toLowerCase()} jobs yet.` : "Your accepted requests will appear here."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                            {["Job", "Customer", "Status", "Date", "Action"].map(h => (
                                                <th key={h} className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {filtered.map((job: any) => (
                                            <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                {/* Job */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                            <span className="material-symbols-outlined text-primary text-lg">
                                                                {STATUS_ICONS[job.status] || "work"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">{job.title || "Service Request"}</p>
                                                            <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5">{job.description?.substring(0, 40)}...</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Customer */}
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{getCustomerName(job)}</p>
                                                </td>
                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[job.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                        <span className="material-symbols-outlined text-[12px]">{STATUS_ICONS[job.status] || "info"}</span>
                                                        {job.status?.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                {/* Date */}
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                        {job.created_at ? new Date(job.created_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                                    </p>
                                                    {job.scheduled_at && (
                                                        <p className="text-[10px] text-primary font-bold mt-0.5 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[11px]">event</span>
                                                            {new Date(job.scheduled_at).toLocaleDateString([], { day: "numeric", month: "short" })}
                                                        </p>
                                                    )}
                                                </td>
                                                {/* Action */}
                                                <td className="px-6 py-4">
                                                    <Link
                                                        to={`/professional/messages?requestId=${job.id}`}
                                                        className="px-4 py-2 text-xs font-black text-primary border border-primary/20 rounded-xl hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        Open Chat
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
};

export default ProfessionalJobs;
