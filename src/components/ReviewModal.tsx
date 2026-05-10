import React, { useState } from "react";
import { X, Star, Loader2, Send } from "lucide-react";
import api from "../api/auth.api";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    professionalId: string;
    onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, jobId, professionalId, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (rating === 0) {
            setError("Please provide a star rating.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post("/reviews/", {
                job: jobId,
                professional: professionalId,
                rating: rating,
                comment: comment
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                <div className="px-8 py-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Leave a Review</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">Share your experience with this professional.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 pb-8">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col items-center justify-center mb-8">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">Overall Rating</p>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star 
                                        size={36} 
                                        className={`transition-colors duration-200 ${
                                            (hoverRating || rating) >= star 
                                                ? "text-amber-400 fill-amber-400 drop-shadow-md" 
                                                : "text-slate-200 dark:text-slate-700"
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Your Feedback (Optional)
                        </label>
                        <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                            placeholder="What did you like about the service? How was the communication?"
                        />
                    </div>

                    <div className="mt-8">
                        <button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="w-full py-4 px-6 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl shadow-xl shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            Submit Review
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
