import { useMemo, useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";
import { getEarningsSummary, listPayments, withdrawFunds } from "../../../api/payments.api";
import {
    TrendingUp,
    Clock,
    CreditCard,
    ArrowUpRight,
    FileText,
    Lock,
    CheckCircle2,
    RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfessionalEarnings: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { jobs, jobsLoading } = useData();
    const [earningsSummary, setEarningsSummary] = useState<any>(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const userId = (user as any)?.user?.id || user?.id;
                if (!userId) return;
                const summary = await getEarningsSummary(userId);
                setEarningsSummary(summary);
            } catch (err) {
                console.error("Failed to fetch earnings summary", err);
            }
        };
        fetchSummary();
    }, [user?.id]);

    const myCompletedJobs = useMemo(() => {
        const userId = (user as any)?.user?.id || user?.id;
        const proId = (user as any)?.id;
        
        return jobs.filter((j: any) =>
            (j.professional === userId || j.professional === proId || j.assigned_to === userId || j.assigned_to === proId) &&
            ["completed", "approved"].includes(j.status)
        );
    }, [jobs, user?.id]);

    const myActiveJobs = useMemo(() => {
        const userId = (user as any)?.user?.id || user?.id;
        const proId = (user as any)?.id;
        
        return jobs.filter((j: any) =>
            (j.professional === userId || j.professional === proId || j.assigned_to === userId || j.assigned_to === proId) &&
            ["accepted", "booked", "in_progress", "done"].includes(j.status)
        );
    }, [jobs, user?.id]);

    // Use backend values if available, fallback to frontend calculations
    const totalEarned =
        Number(earningsSummary?.gross_earned ?? NaN) ||
        myCompletedJobs.reduce((sum: number, j: any) => sum + Number(j.price || j.budget || 0), 0);
    const pendingAmount =
        Number(earningsSummary?.pending_withdrawal_total ?? NaN) ||
        myActiveJobs.reduce((sum: number, j: any) => sum + Number(j.price || j.budget || 0), 0);
    const availableToWithdraw = Number(earningsSummary?.available_withdrawal_total ?? 0);

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
            const userId = (user as any)?.user?.id || user?.id;
            if (!userId) throw new Error("Not authenticated.");

            // NOTE: backend withdraw endpoint currently requires a payment_id or escrow_id.
            // We withdraw against the most recent released payment. Multiple withdrawals may be required
            // if the professional's available balance spans multiple payments.
            const paymentsPayload = await listPayments({ professional: userId });
            const payments = Array.isArray(paymentsPayload?.results) ? paymentsPayload.results : (Array.isArray(paymentsPayload) ? paymentsPayload : []);
            const candidate = payments.find((p: any) => String(p.status).toLowerCase() === "released" || String(p?.escrow?.status).toLowerCase() === "released");

            if (!candidate?.id) {
                throw new Error("No released payment found to withdraw from yet.");
            }

            const accountName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "Professional";

            await withdrawFunds({
                payment_id: candidate.id,
                amount: String(availableToWithdraw),
                bank_code: method,
                account_name: accountName,
                account_number: account,
            });
            alert("Withdrawal request sent successfully!");
            // Refresh summary
            const summary = await getEarningsSummary(userId);
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
        <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark font-display overflow-hidden">
            {/* Background decorative blobs - matching customer dashboard */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>
            <div className="fixed top-[20%] left-[30%] w-[35%] h-[35%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:4s]"></div>

            <Sidebar />
            <div className="flex flex-1 flex-col lg:ml-64 relative z-10">
                <Header />

                <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 custom-scrollbar relative">
                    <div className="max-w-[1600px] mx-auto w-full space-y-12">

                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-in-up">
                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    Earnings <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-emerald-400 to-accent-cyan">Summary</span>
                                </h1>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Secure Payments</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                        Track your income and withdraw funds easily
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 animate-fade-in-up [animation-delay:100ms]">
                            {[
                                {
                                    label: "Total Income",
                                    value: `${totalEarned.toLocaleString()} ETB`,
                                    icon: <CreditCard size={28} className="text-emerald-500" />,
                                    accent: "text-emerald-500",
                                    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
                                    sub: `${myCompletedJobs.length} Completed Jobs`,
                                    loading: jobsLoading
                                },
                                {
                                    label: "Pending Payouts",
                                    value: `${pendingAmount.toLocaleString()} ETB`,
                                    icon: <Clock size={28} className="text-amber-500" />,
                                    accent: "text-amber-500",
                                    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
                                    sub: `${myActiveJobs.length} Active Jobs`,
                                    loading: jobsLoading
                                },
                                {
                                    label: "Average Income",
                                    value: `${avgPerJob.toLocaleString()} ETB`,
                                    icon: <TrendingUp size={28} className="text-blue-500" />,
                                    accent: "text-blue-500",
                                    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
                                    sub: "Average earnings per job",
                                    loading: jobsLoading
                                },
                            ].map(card => (
                                <div key={card.label} className="group relative overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl p-10 border border-slate-100 dark:border-slate-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                                    <div className="relative z-10 flex flex-col gap-6">
                                        <div className={`size-16 rounded-2xl ${card.iconBg} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-inner border border-slate-100/50 dark:border-slate-700/50`}>
                                            {card.icon}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 mb-3">{card.label}</p>
                                            {card.loading ? (
                                                <div className="h-10 w-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                                            ) : (
                                                <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{card.value}</h3>
                                            )}
                                            <div className="flex items-center gap-2 mt-4">
                                                <div className={`size-1.5 rounded-full ${card.accent.replace('text-', 'bg-')} animate-pulse`}></div>
                                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                    {card.sub}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full ${card.accent.replace('text-', 'bg-')} opacity-[0.03] dark:opacity-[0.05] blur-3xl group-hover:opacity-[0.1] transition-all duration-700`} />
                                </div>
                            ))}
                        </div>

                        {/* Withdrawal Section */}
                        <div className="bg-slate-900 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3.5rem] p-10 lg:p-16 shadow-2xl relative overflow-hidden group border border-white/5 animate-fade-in-up [animation-delay:200ms]">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
                            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-blob"></div>
                            <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-blob [animation-delay:2s]"></div>

                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                                <div className="flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
                                    <div className="size-32 rounded-[2.5rem] bg-white/5 flex items-center justify-center backdrop-blur-2xl border border-white/10 shadow-3xl group-hover:scale-105 transition-all duration-700 group-hover:rotate-6">
                                        <span className="material-symbols-outlined text-7xl text-emerald-400 font-light">account_balance_wallet</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center lg:justify-start gap-3">
                                            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Withdrawable Balance</p>
                                        </div>
                                        {jobsLoading ? (
                                            <div className="h-20 w-64 bg-white/10 rounded-3xl animate-pulse"></div>
                                        ) : (
                                            <h2 className="text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none">
                                                {availableToWithdraw.toLocaleString()} <span className="text-3xl font-bold opacity-30 tracking-normal ml-3">ETB</span>
                                            </h2>
                                        )}
                                        <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed mx-auto lg:mx-0">
                                            Your revenue is authenticated and cleared for immediate dispatch to <span className="text-white font-black tracking-wide uppercase text-xs">Telebirr</span> or <span className="text-white font-black tracking-wide uppercase text-xs">CBE</span>.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleWithdraw}
                                    disabled={isWithdrawing || availableToWithdraw <= 0}
                                    className={`relative z-10 px-16 py-7 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] transition-all duration-500 shadow-3xl hover:scale-[1.03] active:scale-95 disabled:opacity-30 disabled:grayscale disabled:hover:scale-100 flex items-center justify-center gap-6 group/btn overflow-hidden
                                        ${availableToWithdraw > 0
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/30'
                                            : 'bg-slate-800 text-slate-500 border border-white/5'}`}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out"></div>
                                    <span className="relative flex items-center gap-4">
                                        {isWithdrawing ? (
                                            <RefreshCw size={24} className="animate-spin" />
                                        ) : (
                                            <ArrowUpRight size={24} className="group-hover/btn:rotate-12 transition-transform" />
                                        )}
                                        {isWithdrawing ? "Processing..." : "Withdraw Funds"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* History Tabs/Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in-up [animation-delay:300ms]">
                            {/* Earnings History */}
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-slate-100 dark:border-slate-800/50 shadow-xl overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl">
                                <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/40 flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/10 shadow-inner">
                                            <FileText size={24} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">Income History</h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Confirmed payments</p>
                                        </div>
                                    </div>
                                    <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{myCompletedJobs.length} jobs</span>
                                </div>

                                <div className="flex-1 max-h-[550px] overflow-y-auto custom-scrollbar">
                                    {jobsLoading && myCompletedJobs.length === 0 ? (
                                        <div className="py-32 flex flex-col items-center gap-6 text-slate-400">
                                            <div className="size-16 bg-primary/5 rounded-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl animate-spin text-primary font-light">autorenew</span>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing encrypted ledger...</p>
                                        </div>
                                    ) : myCompletedJobs.length === 0 ? (
                                        <div className="py-32 flex flex-col items-center gap-8 text-center">
                                            <div className="size-24 bg-slate-50/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                <span className="material-symbols-outlined text-4xl text-slate-300 font-light">payments</span>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest">No transaction data</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Complete your first job to see history.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                            {[...myCompletedJobs]
                                                .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
                                                .map((job: any) => (
                                                    <div 
                                                        key={job.id} 
                                                        onClick={() => navigate(`/professional/messages?requestId=${job.id}`)}
                                                        className="flex items-center gap-6 px-10 py-7 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 group cursor-pointer"
                                                    >
                                                        <div className="size-14 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                                                            <CheckCircle2 size={24} className="text-emerald-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[15px] font-black text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors tracking-tight">{job.title || "Job Details"}</p>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">{getCustomerName(job)}</p>
                                                                <span className="size-1 rounded-full bg-slate-300"></span>
                                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em]">Job ID: {job.id.substring(0, 8)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 space-y-1.5">
                                                            <p className="text-[18px] font-black text-emerald-500 tracking-tighter">
                                                                +{getAmount(job).toLocaleString()} <span className="text-[11px] font-bold ml-1 opacity-70">ETB</span>
                                                            </p>
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <span className="material-symbols-outlined text-[14px] text-slate-400">event</span>
                                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                                    {job.updated_at ? new Date(job.updated_at).toLocaleDateString([], { day: "numeric", month: "short" }) : "—"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Active/Pending Earnings */}
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-slate-100 dark:border-slate-800/50 shadow-xl overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl">
                                <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800/50 bg-amber-500/5 dark:bg-amber-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="size-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/10 shadow-inner">
                                            <Lock size={24} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">Pending Payouts</h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Funds held securely</p>
                                        </div>
                                    </div>
                                    <span className="px-4 py-1.5 bg-amber-500/10 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">{myActiveJobs.length} active</span>
                                </div>

                                <div className="flex-1 max-h-[550px] overflow-y-auto custom-scrollbar">
                                    {myActiveJobs.length === 0 ? (
                                        <div className="py-32 flex flex-col items-center gap-8 text-center">
                                            <div className="size-24 bg-slate-50/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                <span className="material-symbols-outlined text-4xl text-slate-300 font-light">lock_open</span>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest">Escrow clear</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No funds currently held in transit.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                            {myActiveJobs.map((job: any) => (
                                                <div 
                                                    key={job.id} 
                                                    onClick={() => navigate(`/professional/messages?requestId=${job.id}`)}
                                                    className="flex items-center gap-6 px-10 py-7 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 group cursor-pointer"
                                                >
                                                    <div className="size-14 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/10 group-hover:scale-110 transition-all duration-500 shadow-inner">
                                                        <span className="material-symbols-outlined text-amber-500 text-2xl font-black">lock</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[15px] font-black text-slate-900 dark:text-white truncate tracking-tight leading-tight">{job.title || "Job details hidden"}</p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                                {job.status?.replace(/_/g, " ")}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">Verification Pending</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 space-y-1.5">
                                                        <p className="text-[18px] font-black text-amber-500 tracking-tighter">
                                                            {getAmount(job) > 0 ? `${getAmount(job).toLocaleString()}` : "—"} <span className="text-[11px] font-bold ml-1 opacity-70">ETB</span>
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Secured</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default ProfessionalEarnings;
