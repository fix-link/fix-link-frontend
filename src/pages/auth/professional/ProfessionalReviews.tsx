import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "../../../context/AuthContext";
import { getImageUrl, getReviews } from "../../../api/auth.api";
import { 
    Star as StarIcon, 
    CheckCircle2, 
    Award, 
    MessageSquare, 
    Users, 
    Zap,
    ShieldCheck,
    RefreshCw
} from "lucide-react";

const ProfessionalReviews: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [realReviews, setRealReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            const proId = (user as any)?.professional_id || (user as any)?.professional_detail?.id || user?.id;
            if (!proId) return;
            setRealReviews([]); // Clear previous reviews to prevent "ghosting"
            setLoadingReviews(true);
            try {
                const data = await getReviews(String(proId));
                const rawList = Array.isArray(data) ? data : (data.results || []);
                
                // Frontend Safety Filter
                const filteredList = rawList.filter((r: any) => {
                    const rPro = String(r.professional || r.professional_id || "");
                    const currentProId = String(proId || "");
                    const currentUserId = String(user?.id || "");
                    
                    return rPro === currentProId || rPro === currentUserId;
                });

                setRealReviews(filteredList);
            } catch (err) {
                console.error("Failed to fetch reviews", err);
            } finally {
                setLoadingReviews(false);
            }
        };
        fetchReviews();
    }, [user?.id]);

    const completedJobsCount = user?.total_jobs_completed || 0;
    const rating = user?.average_rating || 0;
    const reviewsCount = (user as any)?.reviews_count || realReviews.length || completedJobsCount;

    const Stars: React.FC<{ count: number; className?: string }> = ({ count, className }) => (
        <div className={`flex items-center gap-0.5 text-amber-400 ${className}`}>
            {[...Array(5)].map((_, i) => (
                <StarIcon 
                    key={i} 
                    size={14} 
                    fill={i < Math.round(count) ? "currentColor" : "none"} 
                    className={i < Math.round(count) ? "text-amber-400" : "text-slate-300 dark:text-slate-600"} 
                />
            ))}
        </div>
    );

    return (
        <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark font-display overflow-hidden">
            {/* Background decorative blobs - matching customer dashboard */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>

            <Sidebar />
            <div className="flex flex-1 flex-col lg:ml-64 relative z-10">
                <Header />

                <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar relative">
                    <div className="max-w-[1600px] mx-auto w-full">
                        
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-fade-in-up">
                            <div className="space-y-3">
                                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-primary">{t('common.reviews')}</span> {t('common.and_ratings')}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                        {t('common.verified_work_records')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 group-hover:text-amber-500 transition-colors">{t('common.total_rating')}</p>
                                    <div className="flex items-center gap-4">
                                        {loadingReviews ? (
                                            <div className="h-10 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                                        ) : (
                                            <span className="text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{rating.toFixed(1)}</span>
                                        )}
                                        <div className="space-y-1.5 text-left">
                                            <Stars count={rating} className="text-amber-400 text-lg" />
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                                <span className="size-1 rounded-full bg-current"></span>
                                                {t('common.exceptional')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-px h-12 bg-slate-100 dark:bg-slate-800/50" />
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 group-hover:text-primary transition-colors">{t('common.volume')}</p>
                                    <div className="flex flex-col items-center">
                                        {loadingReviews ? (
                                            <div className="h-10 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                                        ) : (
                                            <p className="text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{reviewsCount}</p>
                                        )}
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{t('common.jobs')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in-up [animation-delay:100ms]">
                            {[
                                { label: t('common.rating_quality'), value: `${(rating * 20).toFixed(0)}%`, icon: <Award size={24} className="text-amber-500" />, iconBg: "bg-amber-500/10" },
                                { label: t('common.completion_rate'), value: "98%", icon: <CheckCircle2 size={24} className="text-emerald-500" />, iconBg: "bg-emerald-500/10" },
                                { label: t('common.response_speed'), value: "< 2h", icon: <Zap size={24} className="text-blue-500" />, iconBg: "bg-blue-500/10" },
                                { label: t('common.client_loyalty'), value: "12%", icon: <Users size={24} className="text-purple-500" />, iconBg: "bg-purple-500/10" },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all hover:-translate-y-1">
                                    <div className={`w-14 h-14 rounded-2xl ${stat.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-white dark:border-slate-700`}>
                                        {stat.icon}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 mb-2">{stat.label}</p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Testimonials List */}
                        <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in-up [animation-delay:200ms]">
                            <div className="px-12 py-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="size-14 bg-amber-500/10 dark:bg-amber-500/20 rounded-[1.5rem] flex items-center justify-center border border-amber-500/10">
                                        <MessageSquare size={24} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('common.client_feedback')}</h2>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('common.verified_work_records')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('common.feedback_sync_active')}</span>
                                </div>
                            </div>

                            {loadingReviews ? (
                                <div className="py-32 flex flex-col items-center gap-6 text-slate-400">
                                    <RefreshCw size={48} className="animate-spin text-primary" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">{t('common.syncing_reputation')}</p>
                                </div>
                            ) : realReviews.length === 0 ? (
                                <div className="py-40 flex flex-col items-center gap-8">
                                    <div className="size-36 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center relative overflow-hidden group shadow-inner">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        <ShieldCheck size={72} className="text-slate-200 dark:text-slate-700 relative z-10" />
                                    </div>
                                    <div className="text-center space-y-3">
                                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('common.no_ratings_yet')}</p>
                                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
                                            {t('common.no_ratings_subtitle')}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {realReviews.map((review: any) => (
                                        <div key={review.id} className="p-12 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                                            <div className="flex flex-col md:flex-row gap-12">
                                                <div className="shrink-0 flex md:flex-col items-center gap-6">
                                                    <div className="size-20 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl group-hover:rotate-[-6deg] transition-all duration-500 ease-out">
                                                         <img 
                                                             src={getImageUrl(
                                                                 review.customer_profile?.profile_picture || 
                                                                 review.customer_detail?.profile_picture || 
                                                                 review.customer?.profile_picture ||
                                                                 review.reviewer_profile?.profile_picture ||
                                                                 review.reviewer_detail?.profile_picture ||
                                                                 review.reviewer?.profile_picture ||
                                                                 review.user_profile?.profile_picture ||
                                                                 review.user_detail?.profile_picture ||
                                                                 review.user?.profile_picture ||
                                                                 review.customer_profile?.profile_photo ||
                                                                 review.customer_detail?.profile_photo ||
                                                                 review.reviewer_detail?.profile_photo ||
                                                                 review.profile_picture
                                                             )} 
                                                             alt="User" 
                                                             className="size-full object-cover"
                                                             onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${review.customer_name || 'Customer'}&background=random`)}
                                                         />
                                                    </div>
                                                </div>

                                                <div className="flex-1 space-y-6">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="space-y-1.5">
                                                            <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">
                                                                {review.customer_name || 
                                                                    review.reviewer_name ||
                                                                    (review.customer_detail?.first_name ? `${review.customer_detail.first_name} ${review.customer_detail.last_name || ''}`.trim() : null) ||
                                                                    (review.reviewer_detail?.first_name ? `${review.reviewer_detail.first_name} ${review.reviewer_detail.last_name || ''}`.trim() : null) ||
                                                                    (review.user_detail?.first_name ? `${review.user_detail.first_name} ${review.user_detail.last_name || ''}`.trim() : null) ||
                                                                    t('common.verified_customer')}
                                                            </h4>
                                                            <div className="flex items-center gap-4">
                                                                <Stars count={review.rating} className="text-amber-400" />
                                                                <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                                    {new Date(review.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <span className="material-symbols-outlined text-7xl text-primary/5 dark:text-white/5 absolute -top-8 -left-6 -z-10 select-none font-black italic">format_quote</span>
                                                        <p className="text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic relative z-10 tracking-tight">
                                                            "{review.comment || review.content || t('common.exceptional_service_fallback')}"
                                                        </p>
                                                    </div>

                                                    {review.job_title && (
                                                        <div className="flex items-center gap-4 pt-6 border-t border-dashed border-slate-100 dark:border-slate-800">
                                                            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                                                                <span className="material-symbols-outlined text-sm font-black">verified</span>
                                                            </div>
                                                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                                                                {t('common.service')}: <span className="text-slate-900 dark:text-white">{review.job_title}</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfessionalReviews;
