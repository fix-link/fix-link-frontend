import React from "react";
import { Link } from "react-router-dom";


interface ScheduleListProps {
    jobs: any[];
    loading?: boolean;
}

const ScheduleList: React.FC<ScheduleListProps> = ({ jobs, loading }) => {
    if (loading) {
        return (
            <div className="bg-white dark:bg-card-dark rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-xl">
                 <div className="h-6 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-6"></div>
                 <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                    ))}
                 </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card-dark rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden group">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary font-black">calendar_today</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-text-primary dark:text-white">Booked Jobs</h2>
                        <p className="text-xs text-text-secondary dark:text-gray-400 font-bold uppercase tracking-wider mt-0.5">Confirmed & in-progress only</p>
                    </div>
                </div>
                <Link to="/professional/messages" className="text-xs font-black text-primary hover:underline uppercase tracking-widest px-4 py-2 bg-primary/5 rounded-full">
                    View All
                </Link>
            </div>

            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {jobs.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-card-dark shadow-inner">
                            <span className="material-symbols-outlined text-slate-300 text-4xl">event_busy</span>
                        </div>
                        <h3 className="text-lg font-black text-text-primary dark:text-white">No booked jobs yet</h3>
                        <p className="text-text-secondary dark:text-gray-400 text-sm mt-1 max-w-[240px] mx-auto font-medium">Jobs that are booked or in-progress will appear here.</p>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div
                            key={job.id}
                            className="flex items-center gap-5 p-5 rounded-2xl bg-neutral-50 dark:bg-slate-900/40 border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-slate-800 transition-all group/item shadow-sm hover:shadow-md"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 group-hover/item:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-primary text-2xl font-black">
                                    {job.description?.toLowerCase().includes('electric') ? 'electrical_services' : 
                                     job.description?.toLowerCase().includes('plumb') ? 'plumbing' : 'work'}
                                </span>
                            </div>

                            <div className="flex-1">
                                <p className="font-black text-text-primary dark:text-white text-lg">
                                    {job.customer_detail?.first_name} {job.customer_detail?.last_name}
                                </p>
                                <p className="text-sm text-text-secondary dark:text-gray-400 font-bold mt-0.5 line-clamp-1">
                                    {job.description || "Service Request"}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                        job.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                                        job.status === 'done' ? 'bg-amber-100 text-amber-600' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {job.status}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">schedule</span>
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <Link
                                to={`/professional/messages?job=${job.id}`}
                                className="px-6 py-3 bg-white dark:bg-slate-800 text-primary border border-primary/20 rounded-xl text-sm font-black hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                                Details
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ScheduleList;
