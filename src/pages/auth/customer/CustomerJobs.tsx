import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import CustomerNavbar from "./components/CustomerNavbar";
import CustomerFooter from "./components/CustomerFooter";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";
import { getImageUrl } from "../../../api/auth.api";
import { 
    Briefcase, 
    Clock, 
    Calendar, 
    CheckCircle2, 
    XCircle, 
    Hammer,
    MapPin,
    CreditCard,
    Terminal,
    Sparkles,
    User,
    Check
} from "lucide-react";
import { getJobBids, acceptJobBid } from "../../../api/jobs.api";

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
    done:        CheckCircle2,
    completed:   CheckCircle2,
    approved:    CheckCircle2,
    cancelled:   XCircle,
};

const CustomerJobs = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { jobs, jobsLoading, refreshJobs } = useData();
    const navigate = useNavigate();

    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [bids, setBids] = useState<any[]>([]);
    const [bidsLoading, setBidsLoading] = useState(false);
    const [acceptingBid, setAcceptingBid] = useState<string | null>(null);

    // Filter only this customer's jobs
    const myJobs = useMemo(() => {
        const userId = (user as any)?.user?.id || user?.id;
        const customerId = (user as any)?.id; // Usually integer for customers
        
        return jobs.filter((j: any) => {
            const jCust = j.customer;
            const jCustDetailId = j.customer_detail?.id;
            
            return (
                jCust === userId || jCust === customerId ||
                jCustDetailId === userId || jCustDetailId === customerId
            );
        });
    }, [jobs, user?.id]);

    useEffect(() => {
        setBids([]); // Clear stale bids immediately
        if (selectedJob) {
            fetchBids(selectedJob.id);
        }
    }, [selectedJob]);

    const fetchBids = async (jobId: string) => {
        setBidsLoading(true);
        try {
            const data = await getJobBids(jobId);
            const rawBids = Array.isArray(data) ? data : (data?.results || []);
            // Safety filter to ensure we ONLY show bids for THIS specific job
            const filteredBids = rawBids.filter((bid: any) => 
                String(bid.job) === String(jobId) || 
                String(bid.job?.id) === String(jobId)
            );
            setBids(filteredBids);
        } catch (error) {
            console.error("Failed to fetch bids", error);
        } finally {
            setBidsLoading(false);
        }
    };

    const handleAcceptBid = async (bidId: string, jobId: string) => {
        setAcceptingBid(bidId);
        try {
            const response = await acceptJobBid(jobId, bidId);
            const conversationId = response.conversation_id || response.conversation?.id;
            
            await refreshJobs(true);
            
            // Redirect to messages page so they can chat and then complete checkout booking
            if (conversationId) {
                navigate(`/customer/messages?requestId=${jobId}&conversationId=${conversationId}`);
            } else {
                navigate(`/customer/messages?requestId=${jobId}`);
            }
        } catch (error) {
            console.error("Failed to accept bid", error);
            alert("Failed to accept bid. Please try again.");
            setAcceptingBid(null);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display">
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>

            <CustomerNavbar />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-in-up mb-10">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px] mb-2">
                            <Briefcase size={14} />
                            <span>{t('common.job_management')}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                            {t('common.my_posted_jobs')}
                        </h1>
                        <p className="text-sm font-bold text-slate-500 max-w-lg">
                            {t('common.track_status_posted')}
                        </p>
                    </div>
                    <Link
                        to="/customer/post-job"
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        <Sparkles size={16} /> {t('common.post_new_job')}
                    </Link>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-slate-100 dark:border-slate-800/50 shadow-xl overflow-hidden animate-fade-in-up [animation-delay:200ms]">
                    {jobsLoading && myJobs.length === 0 ? (
                        <div className="py-32 flex flex-col items-center gap-6 text-slate-400">
                            <Clock size={48} className="animate-spin text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">{t('common.syncing_data_stream')}</p>
                        </div>
                    ) : myJobs.length === 0 ? (
                        <div className="py-32 flex flex-col items-center gap-6 text-slate-400 text-center">
                            <div className="size-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <Briefcase size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('common.no_jobs_posted_yet')}</h3>
                            <p className="text-sm font-bold text-slate-500 max-w-xs">{t('common.no_jobs_posted_yet_subtitle')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/40">
                                        <th className="px-6 py-6 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.job_details')}</th>
                                        <th className="px-6 py-6 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.budget')}</th>
                                        <th className="px-6 py-6 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.status')}</th>
                                        <th className="px-6 py-6 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.date')}</th>
                                        <th className="px-6 py-6 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                    {myJobs.map((job: any) => (
                                        <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 group">
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="size-12 rounded-[1rem] bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10 transition-all duration-500 group-hover:scale-110">
                                                        {(() => {
                                                            const Icon = STATUS_ICONS[job.status] || Briefcase;
                                                            return <Icon size={20} className="text-primary" />;
                                                        })()}
                                                    </div>
                                                    <div className="min-w-0 space-y-1">
                                                        <p className="text-[14px] font-black text-slate-900 dark:text-white tracking-tight truncate group-hover:text-primary transition-colors">
                                                            {job.title || t('common.job_details_hidden')}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                                                            <MapPin size={10} /> {job.address || job.city || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                    {job.budget ? `${job.budget} ${t('common.etb')}` : t('common.to_be_negotiated')}
                                                </p>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm ${STATUS_COLORS[job.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                    <span className="size-1.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
                                                    {t(`common.${job.status}`, { defaultValue: job.status?.replace(/_/g, " ") })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-2 text-[11px] font-black text-slate-800 dark:text-slate-300">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {job.created_at ? new Date(job.created_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                {job.status === 'pending' ? (
                                                    <button
                                                        onClick={() => setSelectedJob(job)}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-white bg-primary hover:bg-primary-dark rounded-[1rem] transition-all duration-300 active:scale-95 shadow-xl shadow-primary/30"
                                                    >
                                                        {t('common.review_bids')}
                                                    </button>
                                                ) : (
                                                    <Link
                                                        to={`/customer/messages?requestId=${job.id}`}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-[1rem] transition-all duration-300 active:scale-95 group/btn"
                                                    >
                                                        {t('common.view_job')} <Terminal size={14} className="transition-transform group-hover/btn:translate-x-1" />
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Bids Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => setSelectedJob(null)} />
                    <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col animate-in zoom-in slide-in-from-bottom-8 duration-500">
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('common.review_proposals')}</h3>
                                <p className="text-xs font-bold text-slate-500 mt-1">{selectedJob.title}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedJob(null)}
                                className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-slate-700 shadow-sm active:scale-90"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                            {bidsLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                    <Clock size={40} className="animate-spin text-primary mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">{t('common.fetching_proposals')}</p>
                                </div>
                            ) : bids.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
                                    <div className="size-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 mb-6">
                                        <Briefcase size={32} className="text-slate-300" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white">{t('common.no_bids_yet')}</h4>
                                    <p className="text-xs font-bold text-slate-500 max-w-sm mt-2">{t('common.no_bids_yet_subtitle')}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {bids.map(bid => (
                                        <div key={bid.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-colors">
                                            <div className="flex flex-col sm:flex-row gap-6">
                                                {/* Pro Profile Summary */}
                                                <div className="flex-1 space-y-4">
                                                    <Link 
                                                        to={`/customer/profile/${bid.professional?.id || bid.professional_detail?.user_id || bid.professional}`}
                                                        className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                                                        title={t('common.view_profile')}
                                                    >
                                                        <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20 overflow-hidden shrink-0">
                                                            {bid.professional_detail?.profile_picture_url || bid.professional_detail?.profile_picture || bid.professional_detail?.profile_photo_url || bid.professional_detail?.profile_photo ? (
                                                                <img src={getImageUrl(bid.professional_detail.profile_picture_url || bid.professional_detail.profile_picture || bid.professional_detail.profile_photo_url || bid.professional_detail.profile_photo)} alt="" className="w-full h-full object-cover" />
                                                            ) : bid.professional_detail?.first_name ? (
                                                                bid.professional_detail.first_name.charAt(0).toUpperCase()
                                                            ) : (
                                                                <User size={24} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h5 className="text-lg font-black text-slate-900 dark:text-white hover:text-primary transition-colors">
                                                                {bid.professional_detail?.first_name} {bid.professional_detail?.last_name}
                                                            </h5>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg font-black uppercase tracking-widest flex items-center gap-1">
                                                                    <Check size={10} /> {t('common.verified_expert')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                    {bid.message && (
                                                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 italic">
                                                            "{bid.message}"
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Action/Price */}
                                                <div className="sm:w-48 flex flex-col items-end justify-center shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-6 sm:pt-0 sm:pl-6">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('common.proposed_budget')}</p>
                                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-4">{bid.amount} {t('common.etb')}</p>
                                                    
                                                    <button
                                                        onClick={() => handleAcceptBid(bid.id, selectedJob.id)}
                                                        disabled={acceptingBid === bid.id}
                                                        className="w-full py-3 bg-gradient-to-r from-primary to-accent-cyan text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center disabled:opacity-70"
                                                    >
                                                        {acceptingBid === bid.id ? t('common.accepting') : t('common.accept_pay')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <CustomerFooter />
        </div>
    );
};

export default CustomerJobs;
