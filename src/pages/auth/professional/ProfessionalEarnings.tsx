import { useMemo, useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";
import { getEarningsSummary, withdrawFunds } from "../../../api/payments.api";

const ProfessionalEarnings: React.FC = () => {
    const { user } = useAuth();
    const { jobs, jobsLoading } = useData();
    const [earningsSummary, setEarningsSummary] = useState<any>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const summary = await getEarningsSummary();
                setEarningsSummary(summary);
            } catch (err) {
                console.error("Failed to fetch earnings summary", err);
            } finally {
                setLoadingSummary(false);
            }
        };
        fetchSummary();
    }, []);

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

    // Use backend values if available, fallback to frontend calculations
    const totalEarned = earningsSummary?.total_earned || myCompletedJobs.reduce((sum: number, j: any) => sum + Number(j.price || j.budget || 0), 0);
    const pendingAmount = earningsSummary?.pending_release || myActiveJobs.reduce((sum: number, j: any) => sum + Number(j.price || j.budget || 0), 0);
    const availableToWithdraw = earningsSummary?.withdrawable_balance || 0;

    const avgPerJob = myCompletedJobs.length > 0
        ? Math.round(totalEarned / myCompletedJobs.length)
        : 0;

    const handleWithdraw = async () => {
        if (availableToWithdraw <= 0) {
            alert("No funds available for withdrawal.");
            return;
        }
        
        const method = user?.preferred_payout_method || "telebirr";
        const account = user?.payout_account_number || user?.phonenumber;

        if (!account) {
            alert("Please set up your payout account in profile settings first.");
            return;
        }

        if (!confirm(`Request withdrawal of ${availableToWithdraw} ETB to your ${method} account (${account})?`)) return;

        setIsWithdrawing(true);
        try {
            await withdrawFunds(availableToWithdraw, method, account);
            alert("Withdrawal request sent successfully!");
            // Refresh summary
            const summary = await getEarningsSummary();
            setEarningsSummary(summary);
        } catch (err: any) {
            alert(`Withdrawal failed: ${err.message || "Unknown error"}`);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const getCustomerName = (job: any) => {
        const d = job.customer_detail;
        if (d?.first_name) return `${d.first_name} ${d.last_name || ""}`.trim();
        return "Customer";
    };

    const getAmount = (job: any) => {
        return Number(job.price || job.budget || 0);
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

                    {/* Withdrawal Section */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 dark:bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="size-20 rounded-[2rem] bg-white/10 dark:bg-slate-900/10 flex items-center justify-center backdrop-blur-xl border border-white/20 dark:border-slate-800/20 rotate-[-4deg]">
                                <span className="material-symbols-outlined text-4xl text-emerald-400">account_balance_wallet</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Withdrawable Balance</p>
                                <h2 className="text-4xl md:text-5xl font-black text-white dark:text-slate-900 tracking-tighter">
                                    {availableToWithdraw.toLocaleString()} <span className="text-lg opacity-50">ETB</span>
                                </h2>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 max-w-xs">
                                    Funds are automatically moved here 24h after job completion.
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={handleWithdraw}
                            disabled={isWithdrawing || availableToWithdraw <= 0}
                            className={`relative z-10 px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 flex items-center gap-3
                                ${availableToWithdraw > 0 
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20' 
                                    : 'bg-slate-700 text-slate-400'}`}
                        >
                            {isWithdrawing ? (
                                <span className="material-symbols-outlined animate-spin">autorenew</span>
                            ) : (
                                <span className="material-symbols-outlined">payments</span>
                            )}
                            {isWithdrawing ? "Processing..." : "Request Payout"}
                        </button>
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
