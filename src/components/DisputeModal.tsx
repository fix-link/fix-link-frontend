import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { createDispute } from "../api/disputes.api";

interface DisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
    againstUserId: string;
    onSuccess: () => void;
}

const DisputeModal: React.FC<DisputeModalProps> = ({ isOpen, onClose, jobId, jobTitle, againstUserId, onSuccess }) => {
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!reason || !description) {
            setError("Please provide both a reason and a detailed description.");
            return;
        }

        setIsSubmitting(true);
        try {
            await createDispute(jobId, againstUserId, reason, description);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to raise dispute. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Raise a Dispute</h2>
                            <p className="text-xs font-medium text-slate-500">Job: {jobTitle}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-start gap-3">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                                Reason for Dispute
                            </label>
                            <select 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                required
                            >
                                <option value="">Select a reason...</option>
                                <option value="Non-delivery">Work not delivered</option>
                                <option value="Poor Quality">Poor quality of work</option>
                                <option value="Unresponsive">Professional is unresponsive</option>
                                <option value="Payment Issue">Customer refusing to release funds</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                                Detailed Description
                            </label>
                            <p className="text-xs text-slate-500 mb-3">Provide as much detail as possible to help our team resolve the issue.</p>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                                placeholder="Explain what happened..."
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl shadow-lg shadow-red-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
                            Submit Dispute
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DisputeModal;
