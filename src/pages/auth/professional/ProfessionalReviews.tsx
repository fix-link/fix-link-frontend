import { useMemo } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";
import { getImageUrl } from "../../../api/auth.api";

const ProfessionalReviews: React.FC = () => {
    const { user } = useAuth();
    const { jobs, jobsLoading } = useData();

    const completedJobs = useMemo(() =>
        jobs.filter((j: any) =>
            (j.professional === user?.id || j.assigned_to === user?.id) &&
            ["completed", "approved"].includes(j.status)
        ), [jobs, user?.id]);

    const rating = user?.average_rating || 0;
    const reviewsCount = (user as any)?.reviews_count || completedJobs.length;

    const getCustomerName = (job: any) => {
        const d = job.customer_detail;
        if (d?.first_name) return `${d.first_name} ${d.last_name || ""}`.trim();
        return "Customer";
    };

    const getCustomerPhoto = (job: any) =>
        getImageUrl(job.customer_detail?.profile_picture || job.customer_detail?.profilePhoto);

    // Star renderer
    const Stars = ({ count }: { count: number }) => (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <span
                    key={i}
                    className="material-symbols-outlined text-base"
                    style={{
                        color: i <= count ? "#f59e0b" : "#e2e8f0",
                        fontVariationSettings: `'FILL' ${i <= count ? 1 : 0}`,
                    }}
                >star</span>
            ))}
        </div>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-background-dark font-display">
            <Sidebar />
            <div className="flex flex-1 flex-col lg:ml-64 overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar space-y-8">

                    {/* Page Header */}
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Reviews</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">What customers say about your work</p>
                    </div>

                    {/* Rating Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="col-span-1 bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 flex flex-col items-center justify-center text-center">
                            <div className="text-6xl font-black text-slate-900 dark:text-white mb-3">
                                {rating > 0 ? rating.toFixed(1) : "—"}
                            </div>
                            <Stars count={Math.round(rating)} />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-3">
                                {reviewsCount} review{reviewsCount !== 1 ? "s" : ""}
                            </p>
                        </div>

                        <div className="col-span-2 bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-amber-500 text-lg">star</span>
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-800 dark:text-white">Rating Breakdown</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                                        {rating > 0
                                            ? `Your average rating is ${rating.toFixed(1)} / 5.0`
                                            : "No rating data yet — complete jobs to earn reviews"}
                                    </p>
                                </div>
                            </div>

                            {/* Rating bars — shown from backend once available */}
                            <div className="space-y-3">
                                {[5, 4, 3, 2, 1].map(star => (
                                    <div key={star} className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-500 w-4">{star}</span>
                                        <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-400 rounded-full transition-all duration-700"
                                                style={{ width: star === Math.round(rating) && rating > 0 ? "70%" : "0%" }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 w-4">—</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mt-4 text-center">
                                Detailed breakdown available once the reviews endpoint is enabled by the backend team.
                            </p>
                        </div>
                    </div>

                    {/* Reviews from completed jobs (best effort using job data) */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-500 text-lg">forum</span>
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-800 dark:text-white">Customer Testimonials</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live reviews will appear here once backend provides the endpoint</p>
                            </div>
                        </div>

                        {jobsLoading && completedJobs.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                                <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
                                <p className="text-sm font-bold">Loading...</p>
                            </div>
                        ) : completedJobs.length === 0 ? (
                            <div className="py-20 flex flex-col items-center gap-5">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-5xl text-slate-300">star</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-base font-black text-slate-600 dark:text-white mb-1">No reviews yet</p>
                                    <p className="text-sm font-medium text-slate-400 max-w-xs">
                                        Complete jobs to start receiving reviews from customers.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 divide-slate-50 dark:divide-slate-800">
                                {completedJobs.map((job: any, idx: number) => {
                                    const name = getCustomerName(job);
                                    const photo = getCustomerPhoto(job);
                                    const initial = name.charAt(0).toUpperCase();
                                    const completedDate = job.updated_at || job.created_at;
                                    return (
                                        <div
                                            key={job.id}
                                            className={`p-7 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${idx % 2 === 0 && completedJobs.length > 1 ? "md:border-r border-slate-100 dark:border-slate-800" : ""}`}
                                        >
                                            <div className="flex items-start gap-4 mb-5">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-700 shadow-sm">
                                                    {photo ? (
                                                        <img src={photo} alt={name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-lg font-black text-primary">{initial}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-slate-800 dark:text-white">{name}</p>
                                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Via Fix-Link</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <Stars count={Math.round(rating) || 5} />
                                                    {completedDate && (
                                                        <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                                                            {new Date(completedDate).toLocaleDateString([], { month: "short", year: "numeric" })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 relative">
                                                <span className="material-symbols-outlined text-2xl text-slate-200 dark:text-slate-700 absolute top-3 right-4">format_quote</span>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed pr-8">
                                                    {job.description
                                                        ? `Service completed: "${job.description.substring(0, 120)}${job.description.length > 120 ? "..." : ""}"`
                                                        : "Service completed successfully. Customer confirmed job completion."}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 mt-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                                    <span className="material-symbols-outlined text-[11px]">verified</span>
                                                    Verified Completion
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold">{job.title || "Service Job"}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Backend Notice */}
                    <div className="flex items-start gap-4 bg-primary/5 border border-primary/20 rounded-2xl p-5">
                        <span className="material-symbols-outlined text-primary text-xl mt-0.5">tips_and_updates</span>
                        <div>
                            <p className="text-sm font-black text-slate-800 dark:text-white">Full Reviews Coming Soon</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                The cards above show completed jobs. Once the backend enables <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-[11px]">GET /api/reviews/?professional=me</code>,
                                real customer written reviews with individual star ratings will appear here automatically.
                            </p>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default ProfessionalReviews;
