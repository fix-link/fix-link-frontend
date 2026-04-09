import { useParams, Link } from 'react-router-dom';
import { useData } from '../../../context/DataContext';
import CustomerNavbar from './components/CustomerNavbar';

const PaymentSuccess = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const { jobs } = useData() as any;

    const job = jobs?.find((j: any) => j.id === jobId);

    // NOTE: We intentionally do NOT auto-update job status here.
    // The backend receives a webhook from Chapa on successful payment
    // and updates the status server-side. The frontend just shows a
    // confirmation message and lets the user navigate to Bookings.

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-display">
            <CustomerNavbar />

            <main className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">

                {/* Animated success icon */}
                <div className="relative mb-8">
                    <div className="w-32 h-32 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-emerald-200 dark:bg-emerald-800/40 flex items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-emerald-600 dark:text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                                check_circle
                            </span>
                        </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                </div>

                {/* Main message */}
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    Payment Submitted! 🎉
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-md">
                    Your payment was submitted to Chapa. Once confirmed, your booking status will update automatically and the professional will be notified.
                </p>

                {/* Job detail card */}
                {job && (
                    <div className="w-full bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-emerald-100/50 dark:shadow-none border border-emerald-100 dark:border-slate-700 mb-8">
                        <div className="flex items-start gap-4 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Payment Submitted For</p>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white truncate">{job.title}</h2>
                                {job.budget && (
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                                        ETB {job.budget} · Awaiting Confirmation
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* What happens next */}
                        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700 space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 text-left mb-3">What happens next</p>
                            {[
                                { icon: 'verified', text: 'Chapa verifies your payment (usually instant)', done: true },
                                { icon: 'lock', text: 'Funds are secured in escrow on your behalf', done: true },
                                { icon: 'notifications', text: 'Professional gets notified automatically' },
                                { icon: 'calendar_month', text: 'Your booking appears as Confirmed in My Bookings' },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                        <span className={`material-symbols-outlined text-sm ${step.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 text-left">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Escrow info box */}
                <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 mb-8 text-left">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-blue-500 text-xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                            Your money is held safely in escrow and will only be released to the professional <strong>after you approve</strong> the completed work. You stay in full control.
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <Link
                        to="/customer/bookings"
                        className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none text-base"
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

                <p className="text-xs text-slate-400 dark:text-slate-600 mt-6 font-medium">
                    Booking status updates automatically once Chapa confirms the transaction.
                </p>
            </main>
        </div>
    );
};

export default PaymentSuccess;
