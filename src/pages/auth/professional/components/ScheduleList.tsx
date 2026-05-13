import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";


interface ScheduleListProps {
    jobs: any[];
    loading?: boolean;
}

const ScheduleList: React.FC<ScheduleListProps> = ({ jobs, loading }) => {
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 p-10 shadow-xl">
                 <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse mb-10"></div>
                 <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 bg-slate-50/50 dark:bg-slate-800/30 rounded-[1.5rem] animate-pulse"></div>
                    ))}
                 </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-primary text-2xl font-black">calendar_today</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{t('professional.work_schedule')}</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{t('professional.confirmed_active')}</p>
                    </div>
                </div>
                <Link to="/professional/jobs" className="text-[10px] font-black text-primary hover:bg-primary transition-all hover:text-white uppercase tracking-[0.15em] px-6 py-2.5 bg-primary/5 rounded-xl border border-primary/10">
                    {t('professional.full_roster')}
                </Link>
            </div>

            <div className="p-8 space-y-5 max-h-[580px] overflow-y-auto custom-scrollbar">
                {jobs.length === 0 ? (
                    <div className="py-24 text-center space-y-6">
                        <div className="size-24 bg-slate-50/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl font-light">event_busy</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">{t('common.clear_horizon')}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-[240px] mx-auto font-medium leading-relaxed uppercase tracking-widest">{t('common.awaiting_upcoming_jobs')}</p>
                        </div>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div
                            key={job.id}
                            className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group/item shadow-sm"
                        >
                            <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-700 transition-all duration-500 group-hover/item:scale-110 group-hover/item:rotate-3">
                                <span className="material-symbols-outlined text-primary text-2xl font-black">
                                    {job.description?.toLowerCase().includes('electric') ? 'electrical_services' : 
                                     job.description?.toLowerCase().includes('plumb') ? 'plumbing' : 'precision_manufacturing'}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-black text-slate-900 dark:text-white text-base tracking-tight truncate">
                                        {job.customer_detail?.first_name} {job.customer_detail?.last_name}
                                    </p>
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
                                        <span className="material-symbols-outlined text-[14px]">event</span>
                                        {new Date(job.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate max-w-[300px]">
                                    {job.description || t('common.job_details_pending')}
                                </p>
                                <div className="flex items-center gap-3 pt-1">
                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                                        job.status === 'booked' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                        job.status === 'in_progress' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' :
                                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {job.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <Link
                                to={`/professional/messages?requestId=${job.id}`}
                                className="size-12 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700 group/btn"
                            >
                                <span className="material-symbols-outlined text-2xl transition-transform group-hover/btn:translate-x-1">chevron_right</span>
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ScheduleList;
