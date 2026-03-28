import React, { useState } from "react";
import { createJob } from "../../../../api/jobs.api";
import { useAuth } from "../../../../context/AuthContext";
import LocationInput from "../../../../components/LocationInput";

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

    // Removed photo handlers since backend doesn't support them

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={handleResetAndClose} />

            <div className="relative w-full max-w-xl bg-white dark:bg-card-dark rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {isSubmitted ? (
                    <div className="p-10 flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-500 dark:text-green-400">
                            <span className="material-symbols-outlined text-5xl">check_circle</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Request Sent Successfully!</h2>
                            <p className="text-text-secondary dark:text-gray-400 max-w-sm mx-auto">
                                Your estimate request has been sent to <strong>{professionalName}</strong>. They will review your project and get back to you soon via Messages.
                            </p>
                        </div>
                        <button onClick={handleResetAndClose} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">Done</button>
                    </div>
                ) : (
                    <>
                        <div className="relative h-24 bg-primary p-6 flex items-end">
                            <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Request an Estimate</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">description</span>What do you need help with?</label>
                                <textarea required className="w-full h-24 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-text-primary dark:text-white placeholder:text-text-secondary/50 dark:placeholder:text-gray-500 focus:border-primary focus:ring-0 transition-all resize-none text-sm" placeholder="Describe your project, e.g., 'Fixing a leaky kitchen faucet...'" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-primary dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">calendar_month</span>When do you want this done?</label>
                                    <input required type="date" className="w-full p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-text-primary dark:text-white focus:border-primary focus:ring-0 transition-all text-sm" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-primary dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">payments</span>Estimated Budget (ETB)</label>
                                    <input required type="text" className="w-full p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-text-primary dark:text-white placeholder:text-text-secondary/50 focus:border-primary focus:ring-0 transition-all text-sm" placeholder="e.g. 1500" value={budget} onChange={(e) => setBudget(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">location_on</span>Exact Location</label>
                                <div className="relative">
                                    <LocationInput value={location} onSelect={setLocation} className="w-full pl-4 pr-12 py-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-text-primary dark:text-white placeholder:text-text-secondary/50 focus:border-primary focus:ring-0 transition-all text-base font-medium shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocation}
                                        disabled={isLocating}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors disabled:opacity-50 z-10"
                                        title="Use current location"
                                    >
                                        <span className={`material-symbols-outlined text-2xl ${isLocating ? 'animate-spin' : ''}`}>{isLocating ? 'progress_activity' : 'my_location'}</span>
                                    </button>
                                </div>
                                <p className="text-[10px] text-text-secondary dark:text-gray-500 font-medium pl-1">Specify your subcity or area for a more accurate quote.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        <span>Sending Request...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Submit Request</span>
                                        <span className="material-symbols-outlined text-lg">send</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[11px] text-text-secondary/70 dark:text-gray-500 leading-relaxed text-center">
                                By clicking Submit, you agree to Fix-Link's terms. {professionalName} will receive your project details and contact you via the messaging system.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RequestEstimateModal;
