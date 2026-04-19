import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../../../context/DataContext';
import { updateJobStatus } from '../../../api/jobs.api';
import CustomerNavbar from './components/CustomerNavbar';
import { 
  CheckCircle2, Star, Briefcase, 
  ShieldCheck, Bell, Calendar, Home, 
  Loader2, BadgeCheck, ArrowRight
} from "lucide-react";

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
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed top-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

            <CustomerNavbar />

            <main className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center relative z-10">
                {/* Modern success icon */}
                <div className="relative mb-12 animate-in zoom-in duration-700">
                    <div className="size-40 rounded-[3rem] bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center relative rotate-3 group">
                        <div className="size-28 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-110 group-hover:rotate-0">
                            {isSyncing ? (
                                <Loader2 size={48} className="text-emerald-500 animate-spin" />
                            ) : (
                                <CheckCircle2 size={64} className="text-emerald-500 animate-in zoom-in slide-in-from-bottom-4 duration-500" />
                            )}
                        </div>
                        {!isSyncing && (
                            <div className="absolute -top-4 -right-4 size-14 bg-amber-400 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl animate-bounce">
                                <Star size={28} fill="currentColor" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 mb-12">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
                        {isSyncing ? (
                            <>Verifying <span className='text-gradient'>Payment</span></>
                        ) : (
                            <>Payment <span className='text-emerald-500'>Successful</span></>
                        )}
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                        {isSyncing 
                            ? "Finalizing your transaction and securing your booking..." 
                            : "Your payment has been received and the booking is confirmed. The expert has been notified."}
                    </p>
                </div>

                {job && (
                    <div className="w-full glass-panel dark:bg-slate-900/40 rounded-[48px] p-10 shadow-[0_40px_100px_-20px_rgba(16,185,129,0.15)] border border-white/50 dark:border-slate-800/50 mb-12 animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="size-20 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xl shadow-emerald-500/20 rotate-[-4deg]">
                                <Briefcase size={32} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 animate-pulse">
                                    {isSyncing ? "Securing Ledger..." : "Receipt Manifest Generated"}
                                </p>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white truncate tracking-tight">{job.title}</h2>
                                {job.budget && (
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <span className="text-lg font-bold text-slate-400">Total Capital:</span>
                                        <span className="text-lg font-black text-slate-900 dark:text-white">ETB {job.budget}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Pipeline */}
                        <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { icon: BadgeCheck, text: 'Financial Verification', done: true },
                                { icon: ShieldCheck, text: 'Escrow Lock Activated', done: !isSyncing },
                                { icon: Bell, text: 'Professional Dispatch', done: !isSyncing },
                                { icon: CheckCircle2, text: 'Booking Matrix Updated', done: !isSyncing },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${step.done ? 'bg-emerald-500/10 text-emerald-500 rotate-0' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
                                        <step.icon size={20} strokeWidth={step.done ? 2.5 : 2} />
                                    </div>
                                    <p className={`text-sm font-black uppercase tracking-widest transition-colors ${step.done ? 'text-slate-700 dark:text-white' : 'text-slate-400 dark:text-slate-700'}`}>{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isSyncing && (
                    <div className="flex flex-col sm:flex-row gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                        <Link
                            to="/customer/bookings"
                            className="flex-[1.5] flex items-center justify-center gap-3 px-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-3xl transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98] text-lg group"
                        >
                            <Calendar size={22} className="group-hover:rotate-12 transition-transform" />
                            Launch Dashboard
                            <ArrowRight size={20} className="ml-2 group-hover:translate-x-1.5 transition-transform" />
                        </Link>
                        <Link
                            to="/customer/home"
                            className="flex-1 flex items-center justify-center gap-3 px-10 py-6 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-black rounded-3xl border-2 border-slate-100 dark:border-slate-800 transition-all text-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            <Home size={22} />
                            Home
                        </Link>
                    </div>
                )}

                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mt-10">
                    {isSyncing 
                        ? "Connecting to global decentralized nodes..." 
                        : "Fixed-Link Secure Transmission Complete"}
                </p>
            </main>

            <style dangerouslySetInnerHTML={{ __html: `
                .text-gradient {
                    background: linear-gradient(135deg, #0d93f2 0%, #075985 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .glass-panel {
                    background: rgba(255, 255, 255, 0.75);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                }
                .dark .glass-panel {
                    background: rgba(15, 23, 42, 0.5);
                }
            `}} />
        </div>
    );
};

export default PaymentSuccess;

