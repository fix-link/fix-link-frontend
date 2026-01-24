import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatsCard from "./components/StatsCard";
import QuickActions from "./components/QuickActions";
import ScheduleList from "./components/ScheduleList";

const ProfessionalHome: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col lg:ml-64">
        <Header />

        <main className="p-6 lg:p-10 space-y-8">

          {/* STATS SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Jobs Completed"
              count={128}
              icon="task_alt"
              bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
            />

            <StatsCard
              title="Active Jobs"
              count={6}
              icon="work"
              bgGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            />

            <StatsCard
              title="Earnings"
              count={3240}
              icon="payments"
              bgGradient="bg-gradient-to-br from-purple-500 to-fuchsia-600"
            />

            <StatsCard
              title="Rating"
              count={48}
              icon="star"
              bgGradient="bg-gradient-to-br from-yellow-500 to-orange-500"
            />
          </div>


          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <QuickActions />
            <ScheduleList />
          </div>

        </main>
      </div>
    </div>
  );
};

export default ProfessionalHome;
