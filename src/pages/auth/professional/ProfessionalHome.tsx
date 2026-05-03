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

  // Filter only this professional's jobs
  const jobs = allJobs.filter((j: any) =>
    j.professional === user?.id ||
    j.assigned_to === user?.id ||
    (j.professional_detail?.id === user?.id)
  );

  const loading = jobsLoading && allJobs.length === 0;

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
    <div className="flex min-h-screen bg-slate-50 dark:bg-background-dark font-display">
      <Sidebar />

      <div className="flex flex-1 flex-col lg:ml-64 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar">

          {/* STATS SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Jobs Completed"
              count={loading ? 0 : completedJobsCount}
              icon="task_alt"
              bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
            />
            <StatsCard
              title="Active Jobs"
              count={loading ? 0 : activeJobsCount}
              icon="work"
              bgGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            />
            <StatsCard
              title="Total Earnings"
              count={loading ? 0 : totalEarnings}
              icon="payments"
              bgGradient="bg-gradient-to-br from-purple-500 to-fuchsia-600"
              isCurrency
            />
            <StatsCard
              title="Rating"
              count={loading ? 0 : rating}
              icon="star"
              bgGradient="bg-gradient-to-br from-yellow-500 to-orange-500"
              isRating
            />
          </div>

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* ✅ Only booked + in_progress jobs appear here */}
              <ScheduleList jobs={scheduledJobs} loading={loading} />
            </div>
            <QuickActions />
          </div>

        </main>
      </div>
    </div>
  );
};

export default ProfessionalHome;
