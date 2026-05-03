import { useMemo } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";

const ProfessionalEarnings: React.FC = () => {
    const { user } = useAuth();
    const { jobs, jobsLoading } = useData();

    const myCompletedJobs = useMemo(() =>
        jobs.filter((j: any) =>
            (j.professional === user?.id || j.assigned_to === user?.id) &&
            ["completed", "approved"].includes(j.status)
        ), [jobs, user?.id]);

    const myActiveJobs = useMemo(() =>
        jobs.filter((j: any) =>
            (j.professional === user?.id || j.assigned_to === user?.id) &&
            ["accepted", "booked", "in_progress", "done"].includes(j.status)
        ), [jobs, user?.id]);

    // Use price OR budget — whichever is present
    const getAmount = (job: any) => Number(job.price || job.budget || 0);

    const totalEarned = useMemo(() =>
        myCompletedJobs.reduce((sum: number, j: any) => sum + getAmount(j), 0),
        [myCompletedJobs]);

    const pendingAmount = useMemo(() =>
        myActiveJobs.reduce((sum: number, j: any) => sum + getAmount(j), 0),
        [myActiveJobs]);

    const avgPerJob = myCompletedJobs.length > 0
        ? Math.round(totalEarned / myCompletedJobs.length)
        : 0;

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

                <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar space-y-8">

                    {/* Page Header */}
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Earnings</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Your payment history and payout summary</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            {
                                label: "Total Earned",
                                value: `${totalEarned.toLocaleString()} ETB`,
                                icon: "payments",
                                gradient: "from-emerald-500 to-teal-600",
                                sub: `${myCompletedJobs.length} completed jobs`,
                            },
                            {
                                label: "Pending Release",
                                value: `${pendingAmount.toLocaleString()} ETB`,
                                icon: "hourglass_empty",
                                gradient: "from-amber-500 to-orange-500",
                                sub: `${myActiveJobs.length} active jobs in escrow`,
                            },
                            {
                                label: "Avg. Per Job",
                                value: `${avgPerJob.toLocaleString()} ETB`,
                                icon: "trending_up",
                                gradient: "from-blue-500 to-indigo-600",
                                sub: "Based on completed jobs",
                            },
                        ].map(card => (
                            <div key={card.label} className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br ${card.gradient}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                                        <span className="material-symbols-outlined text-2xl">{card.icon}</span>
                                    </div>
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">{card.label}</p>
                                <h3 className="text-3xl font-black">{card.value}</h3>
                                <p className="text-xs font-medium opacity-70 mt-2">{card.sub}</p>
                                <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                            </div>
                        ))}
                    </div>

                    {/* Payout Notice */}
                    <div className="flex items-start gap-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                        <span className="material-symbols-outlined text-blue-500 text-2xl mt-0.5">info</span>
                        <div>
                            <p className="text-sm font-black text-blue-800 dark:text-blue-300">Payout Withdrawals</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                Payout requests will be available once the backend team enables the withdrawal endpoint.
                                Funds are held in escrow and released after customers confirm job completion.
                            </p>
                        </div>
                    </div>

                    {/* Earnings History */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg">receipt_long</span>
                                </div>
                                <h2 className="text-base font-black text-slate-800 dark:text-white">Completed Job Payments</h2>
                            </div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{myCompletedJobs.length} records</span>
                        </div>

                        {jobsLoading && myCompletedJobs.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                                <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
                                <p className="text-sm font-bold">Loading earnings...</p>
                            </div>
                        ) : myCompletedJobs.length === 0 ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-300">payments</span>
                                </div>
                                <p className="text-base font-black text-slate-600 dark:text-white">No earnings yet</p>
                                <p className="text-sm font-medium text-slate-400 text-center max-w-xs">
                                    Completed jobs with confirmed payments will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {[...myCompletedJobs]
                                    .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
                                    .map((job: any) => (
                                        <div key={job.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg">check_circle</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 dark:text-white truncate">{job.title || "Service Job"}</p>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">{getCustomerName(job)}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-emerald-600">
                                                    {getAmount(job) > 0 ? `+${getAmount(job).toLocaleString()} ETB` : "Amount TBD"}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                    {job.updated_at
                                                        ? new Date(job.updated_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })
                                                        : "—"}
                                                </p>
                                            </div>
                                            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                Released
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Active/Pending Earnings */}
                    {myActiveJobs.length > 0 && (
                        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-900/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg">hourglass_empty</span>
                                    </div>
                                    <h2 className="text-base font-black text-slate-800 dark:text-white">In Escrow (Pending Release)</h2>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {myActiveJobs.map((job: any) => (
                                    <div key={job.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg">lock</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-800 dark:text-white truncate">{job.title || "Service Job"}</p>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                Status: <span className="capitalize font-bold text-amber-600">{job.status?.replace(/_/g, " ")}</span>
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-amber-600">
                                                {getAmount(job) > 0 ? `${getAmount(job).toLocaleString()} ETB` : "Pending"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">In escrow</p>
                                        </div>
                                        <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                            Locked
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default ProfessionalEarnings;
