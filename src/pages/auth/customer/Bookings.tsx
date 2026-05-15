import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CustomerNavbar from "./components/CustomerNavbar";
import CustomerFooter from "./components/CustomerFooter";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";
import { listJobs, updateJobStatus } from "../../../api/jobs.api";
import { Link } from "react-router-dom";
import {
  Plus, Calendar, User, MessageCircle, CheckCircle2,
  Hourglass, AlertCircle, ShieldCheck, XCircle, CreditCard,
  ChevronRight, Loader2, Star, AlertTriangle
} from "lucide-react";
import DisputeModal from "../../../components/DisputeModal";
import ReviewModal from "../../../components/ReviewModal";

interface Job {
  id: string;
  title: string;
  description: string;
  service: string;
  status: string;
  scheduled_at: string;
  assigned_to?: string;
  customer: string;
  budget?: string;
  service_title?: string;
}

const Bookings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reviews, refreshReviews, refreshJobs } = useData();
  const [bookings, setBookings] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedJobForDispute, setSelectedJobForDispute] = useState<Job | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedJobForReview, setSelectedJobForReview] = useState<Job | null>(null);

  const [approvingJobId, setApprovingJobId] = useState<string | null>(null);

  const fetchBookings = async () => {
    // 1. Try cache for instant load
    if (user?.id) {
      const cached = localStorage.getItem(`cached_bookings_${user.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setBookings(parsed);
            setIsLoading(false);
          }
        } catch (e) {
          console.warn("Bookings: Cache parse fail", e);
        }
      }
    }

    try {
      const allJobs = await listJobs();
      const confirmedBookings = allJobs.filter((job: Job) =>
        String(job.customer) === String(user?.id) &&
        ['booked', 'in_progress', 'done', 'completed'].includes(job.status.toLowerCase())
      );
      setBookings(confirmedBookings);

      // Update cache
      if (user?.id) {
        localStorage.setItem(`cached_bookings_${user.id}`, JSON.stringify(confirmedBookings));
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchBookings();
    }
  }, [user]);

  const handleApprove = async (jobId: string, assignedTo: string) => {
    setApprovingJobId(jobId);
    try {
      await updateJobStatus(jobId, 'completed');

      // Auto-trigger Review Modal instantly
      const approvedJob = bookings.find(b => String(b.id) === String(jobId));
      if (approvedJob) {
        setSelectedJobForReview(approvedJob);
      } else {
        // Fallback placeholder to ensure modal opens even if not found
        setSelectedJobForReview({ id: jobId, assigned_to: assignedTo } as Job);
      }
      setReviewModalOpen(true);

      // Fetch bookings in the background
      fetchBookings();
    } catch (error: any) {
      alert(t('common.failed_update_profile') + ": " + error.message);
    } finally {
      setApprovingJobId(null);
    }
  };

  const handleRaiseDispute = (job: Job) => {
    setSelectedJobForDispute(job);
    setDisputeModalOpen(true);
  };

  const getStatusDetails = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "pending":
        return {
          label: t('common.request_sent'),
          desc: t('common.awaiting_response'),
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: Hourglass
        };
      case "accepted":
        return {
          label: t('common.accept'),
          desc: t('common.pay_to_book_now'),
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: AlertCircle
        };
      case "assigned":
      case "booked":
        return {
          label: t('common.booked'),
          desc: t('common.confirmed_project'),
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: ShieldCheck
        };
      case "in_progress":
        return {
          label: t('common.work_in_progress'),
          desc: t('common.pro_is_working'),
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          icon: Loader2
        };
      case "done":
        return {
          label: t('common.completed'),
          desc: t('common.awaiting_approval'),
          color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          icon: CheckCircle2
        };
      case "completed":
        return {
          label: t('common.published'),
          desc: t('common.finished_paid'),
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: CheckCircle2
        };
      case "cancelled":
        return {
          label: t('common.cancelled'),
          desc: t('common.project_stopped'),
          color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
          icon: XCircle
        };
      default:
        return {
          label: status,
          desc: t('common.update_pending'),
          color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
          icon: AlertCircle
        };
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display overflow-x-hidden relative">
      {/* Background Blobs */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <CustomerNavbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('common.my_bookings').split(' ')[0]} <span className="text-gradient">{t('common.my_bookings').split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
              {t('common.manage_project_timeline')}
            </p>
          </div>
          <Link
            to="/customer/search"
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            {t('common.book_new_service')}
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 size={48} className="text-primary animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('common.syncing_schedule')}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-panel rounded-[2.5rem] p-16 text-center border border-slate-200/50 dark:border-slate-800/50 max-w-3xl mx-auto">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-primary/20">
              <Calendar size={40} className="text-primary" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">{t('common.no_active_bookings')}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 font-medium text-lg leading-relaxed">
              {t('common.experience_best_service')}
            </p>
            <Link
              to="/customer/search"
              className="px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              {t('common.discover_services')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bookings.map((booking) => {
              const status = getStatusDetails(booking.status);
              const BookingIcon = status.icon;

              return (
                <div
                  key={booking.id}
                  className="glass-panel group relative flex flex-col rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                >

                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${status.color}`}>
                        <BookingIcon size={12} className={status.label === t('common.work_in_progress') ? "animate-spin" : ""} />
                        {status.label}
                      </div>
                      <div className="flex items-center gap-2">

                        <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-tighter bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                          <Calendar size={12} />
                          {new Date(booking.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        {['completed'].includes(booking.status.toLowerCase()) && !reviews.some(r => String(r.job) === String(booking.id)) && (
                          <button
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedJobForReview(booking);
                                setReviewModalOpen(true);
                            }}
                            className="p-1.5 bg-amber-500 text-white rounded-lg hover:scale-110 transition-transform shadow-lg shadow-amber-500/20"
                            title={t('common.rate_experience')}
                          >
                            <Star size={12} fill="currentColor" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight group-hover:text-primary transition-colors">
                      {booking.title}
                    </h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-8 font-medium italic leading-relaxed h-[3rem]">
                      "{booking.description || t('common.project_initiated_precision')}"
                    </p>

                    <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 mb-8 transform transition-transform group-hover:translate-x-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                          {booking.assigned_to ? <User size={22} /> : <AlertCircle size={22} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-0.5">{t('common.professional')}</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white truncate">
                            {booking.assigned_to ? t('common.pro_accepted') : t('common.matching_pro')}
                          </p>
                        </div>
                        {booking.assigned_to && (
                          <Link
                            to={`/customer/messages?requestId=${booking.id}`}
                            className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:text-primary hover:border-primary/30 transition-all shadow-sm group/msg"
                            title={t('common.message_pro')}
                          >
                            <MessageCircle size={18} className="group-hover/msg:scale-110 transition-transform" />
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-small"></div>
                        {status.desc}
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-6 bg-slate-50/30 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/50">
                    {booking.status.toLowerCase() === 'done' ? (
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => handleApprove(booking.id, booking.assigned_to || '')}
                          disabled={approvingJobId === booking.id}
                          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                          {approvingJobId === booking.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <CreditCard size={18} />
                          )}
                          {approvingJobId === booking.id ? t('common.processing') : t('common.release_payment')}
                        </button>
                        <button
                          onClick={() => handleRaiseDispute(booking)}
                          className="w-full py-3 bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                        >
                          <AlertTriangle size={16} />
                          {t('common.raise_dispute')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <CreditCard size={16} />
                          </div>
                          <span className="text-[15px] font-black text-slate-900 dark:text-white">
                            {booking.budget ? `${parseFloat(String(booking.budget)).toFixed(2)} ETB` : t('common.flex_rates')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {['in_progress', 'booked'].includes(booking.status.toLowerCase()) && (
                            <button
                              onClick={() => handleRaiseDispute(booking)}
                              className="text-red-500 hover:text-red-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                            >
                              <AlertTriangle size={12} />
                              {t('common.raise_dispute')}
                            </button>
                          )}
                          <Link
                            to={`/customer/messages?requestId=${booking.id}`}
                            className="flex items-center gap-1.5 text-primary text-[11px] font-black uppercase tracking-widest hover:translate-x-1 transition-transform"
                          >
                            {t('common.open_details')}
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DisputeModal
          isOpen={disputeModalOpen}
          onClose={() => { setDisputeModalOpen(false); setSelectedJobForDispute(null); }}
          jobId={selectedJobForDispute?.id || ''}
          jobTitle={selectedJobForDispute?.title || ''}
          againstUserId={selectedJobForDispute?.assigned_to || ''}
          onSuccess={() => {
            alert(t('common.dispute_success_msg'));
            fetchBookings();
          }}
        />

        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => { setReviewModalOpen(false); setSelectedJobForReview(null); }}
          jobId={selectedJobForReview?.id || ''}
          professionalId={selectedJobForReview?.assigned_to || ''}
          onSuccess={() => {
            refreshJobs();
            refreshReviews();
          }}
        />
      </main>

      <div className="py-12 relative z-10 border-t border-slate-100 dark:border-slate-800/50 mt-12 bg-white/30 dark:bg-transparent backdrop-blur-sm">
        <CustomerFooter />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .text-gradient {
            background: linear-gradient(135deg, #0d93f2 0%, #075985 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
        .dark .glass-panel {
            background: rgba(15, 23, 42, 0.6);
        }
        @keyframes pulse-small {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
        }
        .pulse-small {
            animation: pulse-small 2s infinite;
        }
      `}} />
    </div>
  );
};

export default Bookings;

