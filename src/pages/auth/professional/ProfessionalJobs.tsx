import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";
import { 
    Clock, 
    CheckCircle2, 
    Calendar, 
    Hammer, 
    CheckCircle, 
    BadgeCheck, 
    XCircle, 
    Rocket, 
    RefreshCw, 
    History, 
    Terminal,
    MapPin,
    CreditCard,
    Briefcase,
    Phone,
    Search
} from 'lucide-react';

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

const STATUS_ICONS: Record<string, any> = {
    pending:     Clock,
    accepted:    CheckCircle2,
    booked:      Calendar,
    in_progress: Hammer,
    done:        CheckCircle,
    completed:   BadgeCheck,
    approved:    BadgeCheck,
    cancelled:   XCircle,
};

const FILTERS = ["All", "Pending", "Active", "Completed", "Cancelled"];

const ProfessionalJobs: React.FC = () => {
    const { user } = useAuth();
    const { jobs, jobsLoading, refreshJobs } = useData();
    const [activeFilter, setActiveFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [selectedJob, setSelectedJob] = useState<any>(null);

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
        <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Background decorative blobs - matching customer dashboard */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>
            <div className="fixed top-[30%] left-[20%] w-[30%] h-[30%] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:4s]"></div>

            <Sidebar />

            <div className="flex flex-1 flex-col lg:ml-64 relative z-10">
                <Header />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 custom-scrollbar relative">
                    <div className="max-w-7xl mx-auto w-full space-y-12">

                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-in-up">
                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-accent-cyan">List</span>
                                </h1>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full">
                                        <span className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(13,147,242,0.6)]"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">All Systems Green</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                        Managing {myJobs.length} active job details
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={refreshJobs}
                                className="flex items-center gap-3 px-8 py-3.5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-xl active:scale-95 group"
                            >
                                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                                Refresh Roster
                            </button>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 animate-fade-in-up [animation-delay:100ms]">
                            {[
                                { label: "Pending", count: counts.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/10" },
                                { label: "Active", count: counts.active, icon: Rocket, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/10" },
                                { label: "Completed", count: counts.completed, icon: BadgeCheck, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
                                { label: "Cancelled", count: counts.cancelled, icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/5", border: "border-rose-500/10" },
                            ].map(s => (
                                <div key={s.label} className={`bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group`}>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className={`size-14 rounded-2xl ${s.bg} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-inner border ${s.border}`}>
                                            <s.icon className={`${s.color} transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`} size={28} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{s.count}</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Filters + Search */}
                        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-slate-100 dark:border-slate-800/50 shadow-xl p-5 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between animate-fade-in-up [animation-delay:200ms] transition-all duration-500 hover:shadow-2xl">
                            <div className="flex flex-wrap gap-3">
                                {FILTERS.map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setActiveFilter(f)}
                                        className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300 relative overflow-hidden group
                                            ${activeFilter === f
                                                ? "bg-primary text-white border-primary shadow-xl shadow-primary/30 scale-105"
                                                : "bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:border-primary/30"
                                        }`}
                                    >
                                        <span className="relative z-10">{f}</span>
                                        {filterCounts[f] > 0 && <span className={`ml-2 px-2 py-0.5 rounded-lg text-[8px] font-black ${activeFilter === f ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>({filterCounts[f]})</span>}
                                        {activeFilter === f && <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500"></div>}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl px-6 py-3.5 w-full sm:w-96 transition-all duration-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:shadow-2xl focus-within:shadow-primary/10 focus-within:border-primary/40 group">
                                <Search className="text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
                                <input
                                    type="text"
                                    placeholder="Filter by customer name..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="bg-transparent outline-none text-[13px] font-black text-slate-700 dark:text-white placeholder-slate-400/60 w-full tracking-tight"
                                />
                            </div>
                        </div>

                        {/* Jobs Table */}
                        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-slate-100 dark:border-slate-800/50 shadow-xl overflow-hidden animate-fade-in-up [animation-delay:300ms] transition-all duration-500 hover:shadow-2xl">
                            {jobsLoading && myJobs.length === 0 ? (
                                <div className="py-32 flex flex-col items-center gap-6 text-slate-400">
                                    <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center">
                                        <RefreshCw size={48} className="animate-spin text-primary" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing encrypted data-stream...</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="py-32 flex flex-col items-center gap-8 text-slate-400">
                                    <div className="size-28 bg-slate-50/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <Briefcase size={48} className="text-slate-300" />
                                    </div>
                                    <div className="text-center space-y-3">
                                        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">No matching leads detected</p>
                                        <p className="text-xs font-bold text-slate-400 max-w-[280px] mx-auto uppercase tracking-widest leading-relaxed">
                                            {activeFilter !== "All" ? `No jobs found in the "${activeFilter.toLowerCase()}" category.` : "New job requests will appear here."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/40">
                                                {["Job Details", "Customer", "Status", "Date", "Action"].map(h => (
                                                    <th key={h} className="px-6 py-6 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400/80">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                            {filtered.map((job: any) => (
                                                <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 group">
                                                    {/* Job */}
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="size-12 rounded-[1rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                                                                {(() => {
                                                                    const Icon = STATUS_ICONS[job.status] || Briefcase;
                                                                    return <Icon size={24} className="text-primary" />;
                                                                })()}
                                                            </div>
                                                            <div className="min-w-0 space-y-1">
                                                                <p className="text-[14px] font-black text-slate-900 dark:text-white tracking-tight truncate group-hover:text-primary transition-colors">{job.title || "Job Details Hidden"}</p>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate max-w-[200px] uppercase tracking-widest opacity-60">{job.description || "Project details and status."}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Customer */}
                                                    <td className="px-6 py-6">
                                                        <div 
                                                            className="flex items-center gap-4 cursor-pointer group/name"
                                                            onClick={() => setSelectedJob(job)}
                                                        >
                                                            <div className="size-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center font-black text-xs text-primary border border-primary/10 shadow-sm group-hover/name:scale-110 transition-transform">
                                                                {getCustomerName(job).charAt(0)}
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="text-[13px] font-black text-slate-800 dark:text-white tracking-tight group-hover/name:text-primary transition-colors">{getCustomerName(job)}</p>
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verified Customer</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Status */}
                                                    <td className="px-6 py-6">
                                                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border shadow-xl transition-all duration-500 group-hover:scale-105 ${STATUS_COLORS[job.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                            <span className="size-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
                                                            {job.status?.replace(/_/g, " ")}
                                                        </span>
                                                    </td>
                                                    {/* Date */}
                                                    <td className="px-6 py-6">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <History size={14} className="text-slate-400" />
                                                                <p className="text-[11px] font-black text-slate-800 dark:text-300 tracking-tight">
                                                                    {job.created_at ? new Date(job.created_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                                                </p>
                                                            </div>
                                                            {job.scheduled_at && (
                                                                <div className="flex items-center gap-2 px-2 py-1 bg-primary/5 rounded-lg w-fit">
                                                                    <Calendar size={14} className="text-primary" />
                                                                    <p className="text-[9px] text-primary font-black uppercase tracking-widest">
                                                                        {new Date(job.scheduled_at).toLocaleDateString([], { day: "numeric", month: "short" })}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Action */}
                                                    <td className="px-6 py-6 text-right">
                                                        <Link
                                                            to={`/professional/messages?requestId=${job.id}`}
                                                            className="inline-flex items-center gap-2 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-primary bg-primary/5 hover:bg-primary hover:text-white rounded-[1rem] border border-primary/10 transition-all duration-300 active:scale-95 group/btn shadow-xl shadow-transparent hover:shadow-primary/20"
                                                        >
                                                            Open Details
                                                            <Terminal size={18} className="transition-transform duration-500 group-hover/btn:translate-x-1 group-hover/btn:-rotate-12" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>

            {/* Customer Detail Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0" 
                        onClick={() => setSelectedJob(null)}
                    />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
                        {/* Modal Header */}
                        <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="size-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-3xl font-black text-primary border-4 border-white dark:border-slate-800 shadow-2xl">
                                    {getCustomerName(selectedJob).charAt(0)}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{getCustomerName(selectedJob)}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="size-1.5 rounded-full bg-emerald-500 shadow-sm animate-pulse"></div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verified Identity</p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedJob(null)}
                                className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-slate-700 shadow-xl active:scale-90"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 md:p-10 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Briefcase size={20} className="text-primary" />
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Project Details</h4>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                                    <h5 className="text-lg font-black text-slate-900 dark:text-white mb-3 tracking-tight">{selectedJob.title || "Job Details Hidden"}</h5>
                                    <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed">{selectedJob.description || "No project description provided."}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Phone size={18} className="text-primary" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number</p>
                                    </div>
                                    <div className="pl-8 space-y-1">
                                        <p className="text-sm font-black text-slate-800 dark:text-white">
                                            {selectedJob.customer_detail?.phonenumber || selectedJob.customer_detail?.phone || "Private Information"}
                                        </p>
                                        <p className="text-xs font-bold text-slate-400">{selectedJob.customer_detail?.email || "Email pending"}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={18} className="text-primary" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location Area</p>
                                    </div>
                                    <p className="text-sm font-black text-slate-800 dark:text-white pl-8">{selectedJob.address || selectedJob.city || "Addis Ababa, ET"}</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <CreditCard size={18} className="text-emerald-500" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Budget Estimate</p>
                                    </div>
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 pl-8">
                                        {selectedJob.budget ? `ETB ${selectedJob.budget}` : "To be negotiated"}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={18} className="text-primary" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Date</p>
                                    </div>
                                    <p className="text-sm font-black text-slate-800 dark:text-white pl-8">
                                        {selectedJob.scheduled_at ? new Date(selectedJob.scheduled_at).toLocaleDateString([], { day: 'numeric', month: 'short' }) : "Not scheduled yet"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                            <Link 
                                to={`/professional/messages?requestId=${selectedJob.id}`}
                                className="flex-1 py-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <Terminal size={18} />
                                Open Message Center
                            </Link>
                            <button 
                                onClick={() => setSelectedJob(null)}
                                className="px-10 py-5 bg-white dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessionalJobs;
