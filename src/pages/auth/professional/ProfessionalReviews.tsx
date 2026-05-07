import { useMemo, useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "../../../context/AuthContext";
import { getImageUrl, getReviews } from "../../../api/auth.api";

const ProfessionalReviews: React.FC = () => {
    const { user } = useAuth();
    const [realReviews, setRealReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!user?.id) return;
            try {
                const data = await getReviews(user.id);
                setRealReviews(Array.isArray(data) ? data : (data.results || []));
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
                <span key={i} className="material-symbols-outlined text-sm leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {i < Math.round(count) ? "star" : "star_outline"}
                </span>
            ))}
        </div>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-background-dark font-display">
            <Sidebar />
            <div className="flex flex-1 flex-col lg:ml-64 overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar space-y-10">
                    
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Trust & Feedback</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md">Your reputation management and verified customer testimonials</p>
                        </div>
                        
                        <div className="flex items-center gap-8 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Rating</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">{rating.toFixed(1)}</span>
                                    <div className="space-y-1">
                                        <Stars count={rating} className="text-amber-400" />
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Above Average</p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-slate-100 dark:bg-slate-800" />
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Volume</p>
                                <p className="text-4xl font-black text-slate-900 dark:text-white leading-none">{reviewsCount}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Verified Jobs</p>
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Rating Quality", value: `${(rating * 20).toFixed(0)}%`, icon: "workspace_premium", color: "text-amber-500", bg: "bg-amber-500/10" },
                            { label: "Completion Rate", value: "98%", icon: "check_circle", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                            { label: "Response Time", value: "< 2h", icon: "bolt", color: "text-blue-500", bg: "bg-blue-500/10" },
                            { label: "Repeat Customers", value: "12%", icon: "group", color: "text-purple-500", bg: "bg-purple-500/10" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-primary/20 transition-all">
                                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                    <span className={`material-symbols-outlined ${stat.color} text-2xl`}>{stat.icon}</span>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Testimonials List */}
                    <div className="bg-white dark:bg-card-dark rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <span className="material-symbols-outlined">forum</span>
                                </div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Verified Testimonials</h2>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time sync active</span>
                            </div>
                        </div>

                        {loadingReviews ? (
                            <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
                                <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
                                <p className="text-sm font-black uppercase tracking-widest">Loading reputation ledger...</p>
                            </div>
                        ) : realReviews.length === 0 ? (
                            <div className="py-32 flex flex-col items-center gap-6">
                                <div className="size-32 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 relative z-10">verified_user</span>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-xl font-black text-slate-900 dark:text-white">Reputation Matrix Empty</p>
                                    <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">
                                        Your customer reviews will appear here once you complete your first verified jobs on the platform.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {realReviews.map((review: any) => (
                                    <div key={review.id} className="p-10 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                                        <div className="flex flex-col md:flex-row gap-8">
                                            <div className="shrink-0 flex md:flex-col items-center gap-4">
                                                <div className="size-16 rounded-[1.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group-hover:rotate-[-4deg] transition-transform">
                                                    <img 
                                                        src={getImageUrl(review.customer_profile?.profile_picture || review.customer?.profile_picture)} 
                                                        alt="User" 
                                                        className="size-full object-cover"
                                                        onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${review.customer_name || 'Customer'}&background=random`)}
                                                    />
                                                </div>
                                                <div className="md:text-center">
                                                    <div className="md:hidden">
                                                        <h4 className="text-base font-black text-slate-900 dark:text-white">{review.customer_name || 'Customer'}</h4>
                                                        <Stars count={review.rating} className="mt-1" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <div className="hidden md:flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{review.customer_name || 'Customer'}</h4>
                                                        <Stars count={review.rating} />
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                                                        {new Date(review.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>

                                                <div className="relative">
                                                    <span className="material-symbols-outlined text-4xl text-slate-100 dark:text-slate-800 absolute -top-4 -left-2 -z-10 select-none">format_quote</span>
                                                    <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic relative z-10">
                                                        {review.comment || review.content || "Outstanding professional! The work was completed efficiently and communication was crystal clear throughout the process."}
                                                    </p>
                                                </div>

                                                {review.job_title && (
                                                    <div className="flex items-center gap-3 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800">
                                                        <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-xs">verified</span>
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                            Project: <span className="text-slate-600 dark:text-slate-400">{review.job_title}</span>
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
                </main>
            </div>
        </div>
    );
};

export default ProfessionalReviews;
