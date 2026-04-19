import React, { useState } from "react";
import { createJob } from "../../../../api/jobs.api";
import { useAuth } from "../../../../context/AuthContext";
import LocationInput from "../../../../components/LocationInput";
import { 
  X, Calendar, 
  Wallet, MapPin, Send, 
  CheckCircle2, Loader2, LocateFixed,
  FileText
} from "lucide-react";

interface RequestEstimateModalProps {
    isOpen: boolean;
    onClose: () => void;
    professionalName: string;
    serviceId?: string;
    professionalId?: string | number;
}

const RequestEstimateModal: React.FC<RequestEstimateModalProps> = ({ isOpen, onClose, professionalName, serviceId, professionalId }) => {
    const { user } = useAuth();

    const [description, setDescription] = useState("");
    const [preferredDate, setPreferredDate] = useState("");
    const [location, setLocation] = useState("");
    const [budget, setBudget] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleGetCurrentLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    setLocation("Addis Ababa (Current Location)");
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setIsLocating(false);
                    alert("Could not get current location. Please type manually.");
                }
            );
        } else {
            setIsLocating(false);
            alert("Geolocation is not supported by your browser.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const currentRole = user?.role?.toLowerCase();
            if (currentRole !== 'customer') {
                alert(`Current role is ${currentRole}. Only customers can create jobs. Please switch accounts.`);
                return;
            }

            const budgetNum = parseFloat(budget.replace(/[^0-9.]/g, ''));
            
            await createJob({
                title: description.split('\n')[0].substring(0, 50) || "Job Request",
                description: description,
                service: serviceId || undefined, 
                address: location,
                scheduled_at: preferredDate ? new Date(preferredDate).toISOString() : undefined,
                budget: isNaN(budgetNum) ? undefined : budgetNum.toString(),
                assigned_to: professionalId?.toString(),
            } as any);

            setIsSubmitted(true);
        } catch (err: any) {
            alert(err.message || "Failed to submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetAndClose = () => {
        setIsSubmitted(false);
        setDescription("");
        setLocation("");
        setBudget("");
        setPreferredDate("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
            <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity" onClick={handleResetAndClose} />

            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800/50 animate-in fade-in zoom-in duration-500">
                {/* Close Button - Universal */}
                <button 
                    onClick={handleResetAndClose} 
                    className="absolute -top-3 -right-3 sm:top-4 sm:right-4 z-[160] size-11 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 hover:scale-110 active:scale-90 transition-all group"
                    aria-label="Close modal"
                >
                    <X size={22} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>

                {isSubmitted ? (
                    <div className="p-12 flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="relative">
                            <div className="size-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500">
                                <CheckCircle2 size={56} strokeWidth={1.5} className="animate-in zoom-in spin-in-12 duration-1000" />
                            </div>
                            <div className="absolute -top-2 -right-2 size-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <CheckCircle2 size={16} strokeWidth={3} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Request Transmitted!</h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium text-sm leading-relaxed">
                                Your estimate inquiry has been dispatched to <span className="font-black text-primary">{professionalName}</span>. They will respond via the secure messenger shortly.
                            </p>
                        </div>
                        <button 
                            onClick={handleResetAndClose} 
                            className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                        >
                            Return to Portal
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="relative p-8 pb-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl">
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Request Estimate</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connect with {professionalName}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 ml-1">
                                    <div className="size-1.5 rounded-full bg-primary"></div>
                                    Project Scope & Details
                                </label>
                                <textarea 
                                    required 
                                    className="w-full h-32 p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all resize-none text-sm font-medium outline-none" 
                                    placeholder="Briefly describe what you need help with..." 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 ml-1">
                                        <div className="size-1.5 rounded-full bg-primary"></div>
                                        Target Date
                                    </label>
                                    <input 
                                        required 
                                        type="date" 
                                        className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-black outline-none" 
                                        value={preferredDate} 
                                        onChange={(e) => setPreferredDate(e.target.value)} 
                                        min={new Date().toISOString().split('T')[0]} 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 ml-1">
                                        <div className="size-1.5 rounded-full bg-primary"></div>
                                        Budget (ETB)
                                    </label>
                                    <input 
                                        required 
                                        type="text" 
                                        className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-black outline-none" 
                                        placeholder="e.g. 1500" 
                                        value={budget} 
                                        onChange={(e) => setBudget(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 ml-1">
                                    <div className="size-1.5 rounded-full bg-primary"></div>
                                    Deployment Location
                                </label>
                                <div className="relative group">
                                    <LocationInput 
                                        value={location} 
                                        onSelect={setLocation} 
                                        className="w-full pl-6 pr-14 h-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-black shadow-sm" 
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocation}
                                        disabled={isLocating}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-xl flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50 z-10"
                                        title="Use current location"
                                    >
                                        {isLocating ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_40px_rgba(13,147,242,0.3)] hover:bg-primary/90 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Transmitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Dispatch Request</span>
                                        <Send size={16} strokeWidth={3} className="-rotate-12" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/50">
                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-center uppercase tracking-widest opacity-60">
                                Protected by secure end-to-end mission encryption.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RequestEstimateModal;
