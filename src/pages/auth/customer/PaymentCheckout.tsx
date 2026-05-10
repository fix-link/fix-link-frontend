import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { initializePayment, getExistingPayment } from '../../../api/payments.api';
import CustomerNavbar from './components/CustomerNavbar';
import { getImageUrl, getUserDetails } from '../../../api/auth.api';
import { 
  ArrowLeft, CreditCard, Smartphone, 
  Building2, ShieldCheck, Lock, 
  User, Check, Globe, Quote,
  ChevronRight, Info, AlertCircle, Loader2
} from "lucide-react";

const PaymentCheckout = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { jobs, jobsLoading } = useData();
    
    const [selectedProvider, setSelectedProvider] = useState<'chapa' | 'telebirr' | 'cbebirr'>('chapa');
    const [accountNumber, setAccountNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [professionalDetails, setProfessionalDetails] = useState<any>(null);

    const job = jobs.find(j => j.id === jobId);

    useEffect(() => {
        if (job) {
            const proId = job.professional || job.assigned_to;
            if (proId) {
                getUserDetails(proId).then(setProfessionalDetails).catch(console.error);
            }
        }
    }, [job]);

    if (jobsLoading && !job) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-6 animate-pulse">
                    <Loader2 size={48} className="text-primary animate-spin" />
                    <p className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Initalizing Secure Tunnel...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 space-y-8">
                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                    <AlertCircle size={40} className="text-slate-400" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Payment Cancelled</h2>
                    <p className="text-slate-500 font-medium">We couldn't locate the transaction record in our database.</p>
                </div>
                <button 
                  onClick={() => navigate(-1)} 
                  className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  Return to Dashboard
                </button>
            </div>
        );
    }

    const handleCheckout = async () => {
        if (selectedProvider !== 'chapa' && !accountNumber) {
            alert(`Please enter your ${selectedProvider === 'telebirr' ? 'phone' : 'account'} number to proceed.`);
            return;
        }

        setIsProcessing(true);
        
        // Normalize Ethiopian phone number if needed (convert 09... to +2519...)
        let normalizedAccount = accountNumber;
        if (selectedProvider === 'telebirr' && accountNumber.startsWith('0')) {
            normalizedAccount = '+251' + accountNumber.substring(1);
        } else if (selectedProvider === 'telebirr' && !accountNumber.startsWith('+') && accountNumber.startsWith('9')) {
             normalizedAccount = '+251' + accountNumber;
        }

        const originalAmount = Number(job.budget) || 0;
        const totalAmount = originalAmount * 1.05; // Add 5% fee

        try {
            const resp = await initializePayment(job.id, normalizedAccount, {
                amount: totalAmount,
                currency: "ETB",
                email: user?.email,
                first_name: user?.first_name || user?.username,
                last_name: user?.last_name || "",
                title: job.title || "Fix-Link Service",
                description: job.description || "Escrow payment for professional services.",
                payment_method: selectedProvider
            });
            if (resp.checkout_url) {
                window.location.replace(resp.checkout_url);
            } else {
                alert("Payment initiation failed: The server didn't provide a checkout link.");
            }
        } catch (error: any) {
            console.error("PaymentCheckout: FULL ERROR", error?.response?.data || error);
            const serverMsg = error?.response?.data?.message || error?.response?.data?.detail || error?.message;
            
            if (serverMsg && serverMsg.toLowerCase().includes("already exists")) {
                // Try to recover the existing checkout URL so user can resume
                setIsProcessing(true);
                const existing = await getExistingPayment(job.id);
                if (existing?.checkout_url) {
                    // Resume the existing payment session
                    window.location.replace(existing.checkout_url);
                    return;
                }
                // No URL found — tell user clearly what happened
                alert(
                    "⚠️ Unfinished Payment Session\n\n" +
                    "A payment was already started for this job but wasn't completed. " +
                    "Please ask the support team or the backend developer to clear the pending " +
                    "escrow for this job so you can try again."
                );
            } else {
                alert(`Payment Failed: ${serverMsg || "Unknown error. Please try again."}`);
            }
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display relative overflow-hidden">
            {/* Background Blobs */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

            <CustomerNavbar />

            <main className="max-w-[1400px] mx-auto px-6 py-10 lg:py-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Back Link */}
                <button 
                  onClick={() => navigate(-1)} 
                  className="flex items-center gap-3 text-slate-400 hover:text-primary transition-all group mb-16"
                >
                    <div className="size-9 rounded-xl glass-panel flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50 shadow-sm group-hover:-translate-x-1.5 transition-transform">
                        <ArrowLeft size={16} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Abort Transaction</span>
                </button>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 xl:gap-24 items-start">
                    
                    {/* LEFT PANEL: Identity & Project Context */}
                    <div className="xl:col-span-5 space-y-12">
                        <div className="space-y-4">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                                Secure your <span className="text-gradient">Service Payment</span>.
                            </h1>
                            <p className="text-lg font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                                Protected by secure payment security. Your money is held safely and will only be released once you confirm the job is finished.
                            </p>
                        </div>

                        <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800/50 shadow-xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 size-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative z-10 space-y-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 w-fit">
                                        <Quote size={12} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Project Manifest</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                                        {job.description || job.title || "Project specific services"}
                                    </h3>
                                </div>

                                {/* Professional Identity */}
                                {professionalDetails && (
                                    <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors duration-500">
                                        <div className="size-14 rounded-xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl shrink-0 rotate-[-1deg]">
                                            <img 
                                              src={getImageUrl(professionalDetails.profile_picture || professionalDetails.profile_photo)} 
                                              alt="Pro" 
                                              className="size-full object-cover" 
                                              onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${professionalDetails.first_name}&background=random`)}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">Assigned Expert</p>
                                            <p className="text-base font-black text-slate-800 dark:text-white">
                                                {professionalDetails.first_name || professionalDetails.user?.first_name} {professionalDetails.last_name || professionalDetails.user?.last_name || ""}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-8 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">Service Price</span>
                                        <span className="text-slate-900 dark:text-white">{job.budget} ETB</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">Transaction Fee (5%)</span>
                                        <span className="text-primary">{(Number(job.budget) * 0.05).toFixed(2)} ETB</span>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Investment</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                    {(Number(job.budget) * 1.05).toFixed(2)}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ETB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Trust Mechanism */}
                        <div className="flex items-start gap-5 p-6 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                            <div className="size-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-emerald-500/20">
                                <ShieldCheck size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Fix-Link Safe-Lock</h4>
                                <p className="text-xs text-emerald-800/60 dark:text-emerald-400/60 font-medium leading-relaxed">
                                    Your funds live in a cryptographic escrow. Release is contingent on your satisfaction.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Financial Handshake */}
                    <div className="xl:col-span-1 border-l border-slate-100 dark:border-slate-800 hidden xl:block h-full mx-auto" />

                    <div className="xl:col-span-6 space-y-8">
                        <div className="glass-panel p-6 md:p-10 rounded-[3rem] border border-white/50 dark:border-slate-800/50 shadow-2xl space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-3">
                                        <Lock size={12} className="text-primary" />
                                        Secure Channel Selection
                                    </h3>
                                    <div className="hidden sm:flex items-center gap-2 text-slate-300 dark:text-slate-600">
                                        <Globe size={14} />
                                        <span className="text-[10px] font-black uppercase">Encrypted Point-to-Point</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {([
                                        { id: 'chapa', label: 'Chapa', desc: 'Secure Web', icon: CreditCard },
                                        { id: 'telebirr', label: 'TeleBirr', desc: 'USSD Push', icon: Smartphone },
                                        { id: 'cbebirr', label: 'CBE Birr', desc: 'Digital Rail', icon: Building2 }
                                    ] as const).map(provider => (
                                        <button 
                                            key={provider.id}
                                            onClick={() => setSelectedProvider(provider.id as any)}
                                            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-500 border-2 active:scale-95 ${
                                                selectedProvider === provider.id 
                                                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' 
                                                    : 'border-slate-50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-200 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            {selectedProvider === provider.id && (
                                                <div className="absolute top-2 right-2 size-3.5 bg-primary text-white rounded-full flex items-center justify-center animate-in zoom-in duration-300 shadow-md">
                                                    <Check size={8} strokeWidth={4} />
                                                </div>
                                            )}
                                            <div className={`size-10 rounded-xl flex items-center justify-center transition-all duration-500 ${selectedProvider === provider.id ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'}`}>
                                                <provider.icon size={18} />
                                            </div>
                                            <div className="text-center">
                                                <h4 className={`text-[11px] font-black tracking-tight ${selectedProvider === provider.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {provider.label}
                                                </h4>
                                                <p className="text-[7px] font-bold uppercase tracking-widest text-slate-400 mt-0.5 opacity-60">{provider.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {selectedProvider !== 'chapa' ? (
                                    <div className="space-y-3 bg-slate-50/50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 relative group">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                                            Handset Authentication Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                                <User size={20} />
                                            </div>
                                            <input 
                                                type="tel"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                placeholder={selectedProvider === 'telebirr' ? '0911 ...' : 'Enter account ID'}
                                                className="w-full pl-20 pr-6 py-5 bg-white dark:bg-slate-800 border-none rounded-[1.5rem] focus:ring-4 focus:ring-primary/10 transition-all text-lg font-black text-slate-800 dark:text-white placeholder-slate-300 shadow-xl"
                                            />
                                        </div>
                                        <div className="flex gap-3 px-2 pt-2">
                                            <Info size={14} className="text-primary shrink-0" />
                                            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium leading-relaxed">
                                                System will initialize a secure connection with your {selectedProvider === 'telebirr' ? 'TeleBirr' : 'CBE'} terminal.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-primary/5 p-8 rounded-[3rem] border-2 border-dashed border-primary/20 flex gap-6 items-center">
                                        <div className="size-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center shrink-0 shadow-2xl shadow-primary/20">
                                            <Globe size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <h5 className="text-sm font-black text-slate-900 dark:text-white tracking-wide uppercase">Gateway Synchronization</h5>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                                Redirecting to Chapa's encrypted financial cloud. External debit/bank authentication required.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6 pt-2">
                                    <button 
                                        onClick={handleCheckout}
                                        disabled={isProcessing || (selectedProvider !== 'chapa' && !accountNumber)}
                                        className={`w-full py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-xl shadow-primary/20 relative overflow-hidden group/btn hover:-translate-y-1 active:scale-[0.98]
                                            ${isProcessing 
                                                ? 'bg-slate-500/10 text-slate-400 cursor-wait shadow-none grayscale' 
                                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary dark:hover:text-white'
                                            }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                                        <span className="flex items-center justify-center gap-4 relative z-10">
                                            {isProcessing ? (
                                                <><Loader2 size={24} className="animate-spin" /> Synchronizing...</>
                                            ) : (
                                                <>Authorize ETB {(Number(job.budget) * 1.05).toFixed(2)} Payment <ChevronRight size={20} strokeWidth={3} /></>
                                            )}
                                        </span>
                                    </button>
                                    
                                    <div className="flex items-center justify-center gap-3 opacity-30 group">
                                        <ShieldCheck size={14} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Secure Payment Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{ __html: `
                .text-gradient {
                    background: linear-gradient(135deg, #0d93f2 0%, #075985 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .glass-panel {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                }
                .dark .glass-panel {
                    background: rgba(15, 23, 42, 0.4);
                }
            `}} />
        </div>
    );
};

export default PaymentCheckout;
