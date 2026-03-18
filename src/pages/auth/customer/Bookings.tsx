import { useEffect, useState } from "react";
import CustomerNavbar from "./components/CustomerNavbar";
import CustomerFooter from "./components/CustomerFooter";
import { useAuth } from "../../../context/AuthContext";
import { listJobs, updateJobStatus } from "../../../api/jobs.api";
import { Link } from "react-router-dom";

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
  service_title?: string; // Optional if joined
}

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const allJobs = await listJobs();
      // Filter out 'pending' jobs - only show bookings that are accepted or beyond
      const confirmedBookings = allJobs.filter((job: Job) => 
        job.customer === user?.id && job.status.toLowerCase() !== 'pending'
      );
      setBookings(confirmedBookings);
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

  const handleApprove = async (jobId: string) => {
    try {
      await updateJobStatus(jobId, 'completed');
      await fetchBookings(); // Refresh list
    } catch (error: any) {
      alert("Failed to approve: " + error.message);
    }
  };

  const getStatusDetails = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "pending": 
        return { 
          label: "Request Sent", 
          desc: "Awaiting professional's response", 
          color: "bg-amber-100 text-amber-700 border-amber-200",
          icon: "hourglass_empty"
        };
      case "accepted":
      case "assigned":
        return { 
          label: "Pro Accepted & Booked", 
          desc: "Professional is ready to start", 
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: "check_circle"
        };
      case "in_progress":
        return { 
          label: "Work in Progress", 
          desc: "Professional is currently on the job", 
          color: "bg-indigo-100 text-indigo-700 border-indigo-200",
          icon: "engineering"
        };
      case "done":
        return { 
          label: "Job Completed", 
          desc: "Awaiting your final approval", 
          color: "bg-purple-100 text-purple-700 border-purple-200",
          icon: "assignment_turned_in"
        };
      case "completed":
        return { 
          label: "Approved & Paid", 
          desc: "Funds released to professional", 
          color: "bg-emerald-100 text-emerald-700 border-emerald-200",
          icon: "verified"
        };
      case "cancelled":
        return { 
          label: "Cancelled", 
          desc: "This request was cancelled", 
          color: "bg-red-100 text-red-700 border-red-200",
          icon: "cancel"
        };
      default:
        return { 
          label: status, 
          desc: "Status update pending", 
          color: "bg-slate-100 text-slate-700 border-slate-200",
          icon: "info"
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark font-display">
      <CustomerNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-text-primary dark:text-white tracking-tight">My Bookings</h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2 font-medium">Track your service requests and professional assignments.</p>
          </div>
          <Link 
            to="/customer/search" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined">add</span>
            Request New Service
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold mt-4">Fetching your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-card-dark rounded-[2.5rem] p-12 text-center shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <span className="material-symbols-outlined text-slate-300 text-5xl">calendar_today</span>
            </div>
            <h2 className="text-2xl font-black text-text-primary dark:text-white mb-3">No bookings yet</h2>
            <p className="text-text-secondary dark:text-gray-400 max-w-md mx-auto mb-10 font-medium">
              You haven't requested any services yet. Find expert professionals in your area and get the job done!
            </p>
            <Link 
              to="/customer/search" 
              className="px-10 py-4 bg-slate-900 dark:bg-primary hover:bg-slate-800 text-white font-black rounded-2xl transition-all inline-block shadow-xl shadow-slate-200 dark:shadow-none"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => {
              const status = getStatusDetails(booking.status);
              return (
                <div 
                  key={booking.id} 
                  className="bg-white dark:bg-card-dark rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-slate-100 dark:border-slate-800 group relative flex flex-col"
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${status.color}`}>
                        <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                        {status.label}
                      </div>
                      <p className="text-xs text-slate-400 font-bold">
                        {new Date(booking.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    
                    <h3 className="text-xl font-black text-text-primary dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {booking.title}
                    </h3>
                    <p className="text-sm text-text-secondary dark:text-gray-400 line-clamp-2 mb-6 font-medium italic leading-relaxed h-10">
                      "{booking.description || "No description provided"}"
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-xl">
                            {booking.assigned_to ? 'person' : 'contact_support'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Professional</p>
                          <p className="text-sm font-black text-text-primary dark:text-white truncate">
                            {booking.assigned_to ? "Request Accepted" : "Awaiting Pro Response"}
                          </p>
                        </div>
                        {booking.assigned_to && (
                          <Link 
                            to={`/customer/messages/${booking.id}`} 
                            className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 hover:text-primary transition-colors"
                            title="Message Professional"
                          >
                            <span className="material-symbols-outlined text-xl">chat</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        Status: <span className="text-text-primary dark:text-white">{status.desc}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
                    {booking.status.toLowerCase() === 'done' ? (
                      <button 
                        onClick={() => handleApprove(booking.id)}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">payments</span>
                        Approve & Release Payment
                      </button>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400">payments</span>
                            <span className="text-sm font-black text-text-primary dark:text-white">
                              {booking.budget ? `ETB ${booking.budget}` : 'Flexible'}
                            </span>
                        </div>
                        <button className="text-primary font-black text-sm hover:underline flex items-center gap-1">
                            Details
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <CustomerFooter />
    </div>
  );
};

export default Bookings;
