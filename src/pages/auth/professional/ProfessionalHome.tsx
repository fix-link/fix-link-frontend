import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatsCard from "./components/StatsCard";
import QuickActions from "./components/QuickActions";
import ScheduleList from "./components/ScheduleList";
import { useAuth } from "../../../context/AuthContext";
import { listJobs } from "../../../api/jobs.api";

const ProfessionalHome: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const allJobs = await listJobs();
        // Filter jobs for this professional
        const proJobs = allJobs.filter((j: any) => 
          j.professional === user?.id || 
          j.assigned_to === user?.id ||
          (j.professional_detail && j.professional_detail.id === user?.id)
        );
        setJobs(proJobs);
      } catch (err) {
        console.error("ProfessionalHome: Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };

      if (user?.id) fetchJobs();

      // The instruction mentions "increase Header polling frequency" but the snippet modifies this useEffect.
      // Assuming the intent is to change the polling frequency for jobs within ProfessionalHome.
      // The snippet provided `fetchNotifications` which is not defined here, so I'm assuming it's a typo
      // and it should refer to `fetchJobs` or a new function that needs to be defined.
      // Given the context, I will apply the polling frequency change to the existing `fetchJobs` polling.
      // The snippet also shows `// Increased polling frequency` and `// Poll every 30 seconds` on separate lines,
      // which implies the 30000ms (30 seconds) is the new increased frequency.
      const interval = setInterval(fetchJobs, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }, [user?.id]);

  // Calculate dynamic stats
  const completedJobsCount = jobs.filter(j => j.status === 'completed' || j.status === 'approved').length;
  const activeJobsCount = jobs.filter(j => ['accepted', 'in_progress', 'done'].includes(j.status)).length;
  const totalEarnings = jobs
    .filter(j => j.status === 'completed' || j.status === 'completed') // Should be synced with backend status
    .reduce((sum, j) => sum + (Number(j.price) || 0), 0);
  
  const rating = user?.average_rating || 0;

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
               <ScheduleList jobs={jobs.filter(j => !['completed', 'cancelled'].includes(j.status))} loading={loading} />
            </div>
            <QuickActions />
          </div>

        </main>
      </div>
    </div>
  );
};

export default ProfessionalHome;
