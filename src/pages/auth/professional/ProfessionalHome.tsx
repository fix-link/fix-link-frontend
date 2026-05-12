import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatsCard from "./components/StatsCard";
import QuickActions from "./components/QuickActions";
import ScheduleList from "./components/ScheduleList";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";

const ProfessionalHome: React.FC = () => {
  const { user } = useAuth();
  // ✅ Use shared DataContext — no duplicate polling, no lag
  const { jobs: allJobs, jobsLoading } = useData();

  // Filter only this professional's jobs - handle both UUID and integer IDs
  const userId = (user as any)?.user?.id || user?.id;
  const proId = (user as any)?.id; // Usually integer for pros
  
  const jobs = allJobs.filter((j: any) => {
    const jPro = j.professional;
    const jAssigned = j.assigned_to;
    const jProDetailId = j.professional_detail?.id;
    
    return (
      jPro === userId || jPro === proId ||
      jAssigned === userId || jAssigned === proId ||
      jProDetailId === userId || jProDetailId === proId
    );
  });



  // Stats — use price OR budget whichever the backend sends
  const getAmount = (j: any) => Number(j.price || j.budget || 0);

  const completedJobsCount = jobs.filter((j: any) =>
    ["completed", "approved"].includes(j.status)
  ).length;

  const activeJobsCount = jobs.filter((j: any) =>
    ["accepted", "booked", "in_progress", "done"].includes(j.status)
  ).length;

  const totalEarnings = jobs
    .filter((j: any) => ["completed", "approved"].includes(j.status))
    .reduce((sum: number, j: any) => sum + getAmount(j), 0);

  const rating = user?.average_rating || 0;

  // ✅ Schedule List: only show BOOKED + IN_PROGRESS jobs (confirmed, scheduled work)
  const scheduledJobs = jobs.filter((j: any) =>
    ["booked", "in_progress"].includes(j.status)
  );

    return (
        <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark font-display overflow-hidden">
            {/* Background decorative blobs - matching customer dashboard */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>
            <div className="fixed top-[20%] left-[10%] w-[30%] h-[30%] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:4s]"></div>
            
            <Sidebar />

            <div className="flex flex-1 flex-col lg:ml-64 relative z-10">
                <Header />

                <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 custom-scrollbar relative">
                    <div className="max-w-[1600px] mx-auto w-full space-y-12">
                        
                        {/* WELCOME - with modern gradient style */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-up">
                            <div className="space-y-2">
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    Welcome back, <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-accent-cyan animate-gradient-x">
                                        {user?.first_name || "Valued Member"}
                                    </span>
                                </h1>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">System Live</span>
                                    </div>
                                    {jobsLoading ? (
                                        <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                                    ) : (
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                            {activeJobsCount > 0 ? `Active Jobs: ${activeJobsCount}` : "Awaiting New Jobs"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-2 rounded-[2rem] border border-white/20 dark:border-slate-800/50 shadow-xl">
                                <div className="px-6 py-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Avg Rating</p>
                                    <div className="flex items-center gap-2 justify-center">
                                        {jobsLoading ? (
                                            <div className="h-6 w-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                                        ) : (
                                            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{Number(rating).toFixed(1)}</span>
                                        )}
                                        <span className="material-symbols-outlined text-amber-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-slate-200 dark:bg-slate-800"></div>
                                <div className="px-6 py-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Success Rate</p>
                                    <div className="flex items-center gap-2 justify-center">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">98%</span>
                                        <span className="material-symbols-outlined text-emerald-500 text-xl">verified</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STATS SECTION - Glass cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in-up [animation-delay:100ms]">
                            <StatsCard
                                title="Jobs Completed"
                                count={completedJobsCount}
                                icon="task_alt"
                                color="bg-emerald-500"
                                loading={jobsLoading}
                            />
                            <StatsCard
                                title="Active Engagements"
                                count={activeJobsCount}
                                icon="rocket_launch"
                                color="bg-blue-500"
                                loading={jobsLoading}
                            />
                            <StatsCard
                                title="Net Revenue"
                                count={totalEarnings}
                                icon="payments"
                                color="bg-purple-500"
                                isCurrency
                                loading={jobsLoading}
                            />
                            <StatsCard
                                title="Experience Score"
                                count={rating}
                                icon="verified_user"
                                color="bg-orange-500"
                                isRating
                                loading={jobsLoading}
                            />
                        </div>

                        {/* MAIN CONTENT - Organized grid */}
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 animate-fade-in-up [animation-delay:200ms]">
                            <div className="lg:col-span-2">
                                <ScheduleList jobs={scheduledJobs} loading={jobsLoading} />
                            </div>
                            <div className="space-y-10">
                                <QuickActions />
                                
                                {/* Secondary Info Card */}
                                <div className="glass-panel p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
                                    <div className="relative z-10 flex items-center gap-4 mb-6">
                                        <div className="size-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                                            <span className="material-symbols-outlined font-black">lightbulb</span>
                                        </div>
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Growth Pro-Tip</h3>
                                    </div>
                                    <p className="relative z-10 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                        "Professionals with a complete portfolio receive 4x more job requests. Update your profile today."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfessionalHome;
