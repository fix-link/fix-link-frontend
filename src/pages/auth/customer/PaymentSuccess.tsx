import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../../../context/DataContext';
import { updateJobStatus } from '../../../api/jobs.api';
import CustomerNavbar from './components/CustomerNavbar';

const PaymentSuccess = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const { jobs, refreshJobs } = useData() as any;
    const [isSyncing, setIsSyncing] = useState(true);

    const job = jobs?.find((j: any) => j.id === jobId);

    // Sync status with backend upon successful return from payment provider
    useEffect(() => {
        const syncPayment = async () => {
            if (!jobId) return;
            try {
                // Call the /book/ endpoint to confirm the job is now booked/paid
                await updateJobStatus(jobId, 'booked');
                await refreshJobs();
            } catch (err) {
                console.error("PaymentSuccess: Failed to sync status", err);
            } finally {
                setIsSyncing(false);
            }
        };
        syncPayment();
    }, [jobId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-display">
            <CustomerNavbar />

            <main className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">

                {/* Animated success icon */}
                <div className="relative mb-8">
                    <div className="w-32 h-32 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-emerald-200 dark:bg-emerald-800/40 flex items-center justify-center overflow-hidden">
                            {isSyncing ? (
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                            ) : (
                                <span className="material-symbols-outlined text-6xl text-emerald-600 dark:text-emerald-400 animate-in zoom-in duration-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    check_circle
                                </span>
                            )}
                        </div>
                    </div>
                    {!isSyncing && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg animate-bounce">
                            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                    )}
                </div>

                {/* Main message */}
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    {isSyncing ? "Verifying Payment..." : "Booking Confirmed! 🎉"}
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-md">
                    {isSyncing 
                        ? "We're securing your escrow deposit and updating your project status..." 
                        : "Your payment is secured and the professional has been notified to start the work."}
                </p>

                {/* Job detail card */}
                {job && (
                    <div className="w-full bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-emerald-100/50 dark:shadow-none border border-emerald-100 dark:border-slate-700 mb-8 transition-all hover:shadow-2xl">
                        <div className="flex items-start gap-4 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
                                    {isSyncing ? "Syncing Record..." : "Official Receipt"}
                                </p>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white truncate">{job.title}</h2>
                                {job.budget && (
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                                        ETB {job.budget} · {isSyncing ? 'Processing...' : 'Payment Secured'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* What happens next */}
                        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700 space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 text-left mb-3">Next Steps</p>
                            {[
                                { icon: 'verified', text: 'Chapa payment verification', done: true },
                                { icon: 'lock', text: 'Funds secured in Escrow', done: !isSyncing },
                                { icon: 'notifications', text: 'Professional notified to start', done: !isSyncing },
                                { icon: 'check_circle', text: 'Booking updated to "Paid"', done: !isSyncing },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 transition-all">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${step.done ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                        <span className={`material-symbols-outlined text-sm ${step.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                                    </div>
                                    <p className={`text-sm font-medium text-left ${step.done ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                {!isSyncing && (
                    <div className="flex flex-col sm:flex-row gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <Link
                            to="/customer/bookings"
                            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none text-base hover:-translate-y-1"
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                            View My Bookings
                        </Link>
                        <Link
                            to="/customer/home"
                            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-black rounded-2xl border border-slate-200 dark:border-slate-700 transition-all text-base"
                        >
                            <span className="material-symbols-outlined">home</span>
                            Go to Dashboard
                        </Link>
                    </div>
                )}

                <p className="text-xs text-slate-400 dark:text-slate-600 mt-6 font-medium">
                    {isSyncing 
                        ? "Contacting Chapa and Fix-Link secure servers..." 
                        : "Everything is set! You can now track your project in real-time."}
                </p>
            </main>
        </div>
    );
};

export default PaymentSuccess;
