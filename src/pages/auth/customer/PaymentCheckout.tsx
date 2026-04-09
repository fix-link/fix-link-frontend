import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { initializePayment, getExistingPayment } from '../../../api/payments.api';
import CustomerNavbar from './components/CustomerNavbar';
import { getImageUrl, getUserDetails } from '../../../api/auth.api';

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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-text-secondary dark:text-gray-400 font-medium">Loading session...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700">warning</span>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Transaction Not Found</h2>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-full font-bold text-xs uppercase tracking-widest">Go Back</button>
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

        try {
            const resp = await initializePayment(job.id, normalizedAccount, {
                amount: job.budget,
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display flex flex-col">
            <CustomerNavbar />

            <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 lg:py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* Back Button */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors group mb-8 md:mb-12">
                    <div className="size-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm group-hover:-translate-x-1 transition-transform">
                        <span className="material-symbols-outlined text-sm font-black">arrow_back_ios_new</span>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Return to Job</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                    
                    {/* Left Panel: Invoice & Summary */}
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Complete your booking.</h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                                You are about to deposit funds into the Fix-Link Escrow account. The money will only be released once you approve the completed service.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <span className="material-symbols-outlined text-9xl">receipt_long</span>
                            </div>

                            <div className="relative z-10 space-y-8">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full inline-block">Invoice Summary</span>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 leading-tight pr-12">
                                        "{job.description || job.title || "Project specific services"}"
                                    </h3>
                                </div>

                                {/* Professional Preview */}
                                {professionalDetails && (
                                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                        <div className="size-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                                            {professionalDetails.profile_picture || professionalDetails.profile_photo ? (
                                                <img src={getImageUrl(professionalDetails.profile_picture || professionalDetails.profile_photo)} alt="Pro" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-slate-400 flex items-center justify-center h-full">person</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Professional</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                {professionalDetails.first_name || professionalDetails.user?.first_name} {professionalDetails.last_name || professionalDetails.user?.last_name || ""}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Due Now</p>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                {job.budget || "TBD"} <span className="text-sm font-bold text-slate-400">ETB</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Escrow Guarantee Badge */}
                        <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm shadow-emerald-100/50 dark:shadow-none">
                            <div className="size-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">gpp_good</span>
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">100% Escrow Protection</h4>
                                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium leading-relaxed mt-0.5">
                                    Your money is safe. We monitor the transaction and release funds only when you are completely satisfied with the delivery.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Payment Selection */}
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
                                    Payment Method
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {([
                                        { id: 'chapa', label: 'Chapa', desc: 'Cards & Banks', icon: 'credit_card' },
                                        { id: 'telebirr', label: 'TeleBirr', desc: 'Mobile Money', icon: 'smartphone' },
                                        { id: 'cbebirr', label: 'CBE Birr', desc: 'Direct Transfer', icon: 'account_balance' }
                                    ] as const).map(provider => (
                                        <button 
                                            key={provider.id}
                                            onClick={() => setSelectedProvider(provider.id as any)}
                                            className={`relative overflow-hidden p-4 rounded-2xl text-left transition-all border-2 ${
                                                selectedProvider === provider.id 
                                                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-4 ring-primary/10' 
                                                    : 'border-slate-100 dark:border-slate-800 bg-transparent hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            {selectedProvider === provider.id && (
                                                <div className="absolute top-2 right-2 size-4 bg-primary rounded-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white text-[10px] font-black">check</span>
                                                </div>
                                            )}
                                            <span className={`material-symbols-outlined mb-2 block ${selectedProvider === provider.id ? 'text-primary' : 'text-slate-400'}`}>
                                                {provider.icon}
                                            </span>
                                            <h4 className={`text-sm font-black tracking-tight ${selectedProvider === provider.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {provider.label}
                                            </h4>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{provider.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                {selectedProvider !== 'chapa' ? (
                                    <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {selectedProvider === 'telebirr' ? 'TeleBirr Phone Number' : 'CBE Birr Account Number'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 font-light">dialpad</span>
                                            <input 
                                                type="tel"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                placeholder={selectedProvider === 'telebirr' ? '+251 911 ...' : 'Enter account number'}
                                                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-0 outline-none transition-all text-sm font-bold text-slate-800 dark:text-white placeholder-slate-300"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed px-1 pt-1">
                                            We will send a secure USSD payment prompt directly to this {selectedProvider === 'telebirr' ? 'phone' : 'account'} number.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                                        <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">language</span>
                                        <div>
                                            <h5 className="text-xs font-black text-slate-800 dark:text-white tracking-wide">Web Checkout</h5>
                                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                                                You will be elegantly redirected to Chapa's highly secure payment portal to enter your debit card or alternate bank details.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleCheckout}
                                disabled={isProcessing || (selectedProvider !== 'chapa' && !accountNumber)}
                                className={`w-full py-5 rounded-2xl font-black text-base tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-2
                                    ${isProcessing 
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                        : 'bg-primary hover:bg-primary-dark text-white hover:-translate-y-1 hover:shadow-primary/30'
                                    }`}
                            >
                                {isProcessing ? (
                                    <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Establishing Bridge...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-[18px]">lock</span> Pay {job.budget || "Amount"} ETB</>
                                )}
                            </button>
                            
                            <div className="flex items-center justify-center gap-2 opacity-40">
                                <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
                                <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted Handshake</span>
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
};

export default PaymentCheckout;
