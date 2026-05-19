import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useData } from "../../../context/DataContext";
import { placeBid, getDiscoveryJobs, getServiceCategories } from "../../../api/jobs.api";
import { 
    Briefcase, 
    MapPin, 
    Calendar, 
    CreditCard, 
    Search,
    Filter,
    Send,
    XCircle,
    Loader2,
    Sparkles,
    CheckCircle2
} from "lucide-react";

// Helpers for extracting and cleaning category info from titles/descriptions
const getJobCategory = (job: any) => {
    if (job.title) {
        const match = job.title.match(/^\[([^\]]+)\]/);
        if (match) return match[1];
    }
    if (job.description) {
        const match = job.description.match(/Category:\s*([^\n\r]+)/i);
        if (match) return match[1].trim();
    }
    if (job.service) {
        return job.service.name || job.service;
    }
    return "Other";
};

const cleanTitle = (title: string) => {
    return title ? title.replace(/^\[[^\]]+\]\s*/, "") : "";
};

const cleanDescription = (desc: string) => {
    return desc ? desc.replace(/^Category:\s*[^\n\r]+\s*/i, "").trim() : "";
};

const ProfessionalJobBoard = () => {
    const { t } = useTranslation();
    const { jobs, jobsLoading, refreshJobs } = useData();
    const navigate = useNavigate();

    const [discoveryJobs, setDiscoveryJobs] = useState<any[]>([]);
    const [discoveryLoading, setDiscoveryLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("recent");

    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [bidAmount, setBidAmount] = useState("");
    const [bidMessage, setBidMessage] = useState("");
    const [isBidding, setIsBidding] = useState(false);
    const [bidSuccess, setBidSuccess] = useState(false);

    const fetchDiscoveryJobs = useCallback(async () => {
        setDiscoveryLoading(true);
        try {
            const data = await getDiscoveryJobs();
            const jobsList = Array.isArray(data) ? data : data.results || [];
            setDiscoveryJobs(jobsList);
        } catch (error) {
            console.error("Failed to fetch discovery jobs", error);
        } finally {
            setDiscoveryLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const cats = await getServiceCategories();
            setCategories(Array.isArray(cats) ? cats : []);
        } catch (error) {
            console.error("Failed to fetch service categories", error);
        }
    }, []);

    useEffect(() => {
        fetchDiscoveryJobs();
        fetchCategories();
    }, [jobs, fetchDiscoveryJobs, fetchCategories]);

    // Open jobs are pending and not assigned to anyone
    const openJobs = useMemo(() => {
        return discoveryJobs.filter((j: any) => 
            j.status === 'pending' && 
            !j.assigned_to && 
            !j.professional
        );
    }, [discoveryJobs]);

    const filteredJobs = useMemo(() => {
        let result = openJobs;

        // Category Filter
        if (selectedCategory && selectedCategory !== "All") {
            result = result.filter((j: any) => {
                const category = getJobCategory(j);
                return category.toLowerCase() === selectedCategory.toLowerCase();
            });
        }

        // Search Filter
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((j: any) => 
                j.title?.toLowerCase().includes(q) || 
                j.description?.toLowerCase().includes(q) ||
                j.city?.toLowerCase().includes(q) ||
                j.address?.toLowerCase().includes(q)
            );
        }

        // Sort By
        if (sortBy === "recent") {
            result = [...result].sort((a: any, b: any) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
        } else if (sortBy === "budget") {
            result = [...result].sort((a: any, b: any) => {
                const budgetA = a.budget ? Number(a.budget) : 0;
                const budgetB = b.budget ? Number(b.budget) : 0;
                return budgetB - budgetA;
            });
        }

        return result;
    }, [openJobs, selectedCategory, search, sortBy]);

    const handleBidSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJob) return;

        setIsBidding(true);
        try {
            await placeBid(selectedJob.id, Number(bidAmount), bidMessage);
            setBidSuccess(true);
            setTimeout(() => {
                setBidSuccess(false);
                setSelectedJob(null);
                setBidAmount("");
                setBidMessage("");
                refreshJobs();
            }, 2000);
        } catch (error: any) {
            console.error("Failed to place bid", error);
            alert("Failed to submit bid. Please try again.");
        } finally {
            setIsBidding(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>

            <Sidebar />

            <div className="flex flex-1 flex-col lg:ml-64 relative z-10">
                <Header />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar relative">
                    <div className="max-w-7xl mx-auto w-full space-y-10">
                        
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-in-up">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px] mb-2">
                                    <Sparkles size={14} className="animate-pulse" />
                                    <span>Opportunities</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan">Board</span>
                                </h1>
                                <p className="text-sm font-bold text-slate-500 max-w-lg">
                                    Browse open requests from customers in your area and submit competitive proposals to win more work.
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                {/* Search Input */}
                                <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 w-full sm:w-72 shadow-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                    <Search className="text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search jobs..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="bg-transparent outline-none w-full text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                </div>

                                {/* Sort Select */}
                                <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 w-full sm:w-56 shadow-xl transition-all">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">{t('common.sort_by')}:</span>
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value)}
                                        className="bg-transparent outline-none w-full text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 cursor-pointer"
                                    >
                                        <option value="recent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t('common.recent_posts')}</option>
                                        <option value="budget" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t('common.budget_high_low')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Category Filter Pills */}
                        {categories.length > 0 && (
                            <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none animate-fade-in-up [animation-delay:100ms]">
                                <button
                                    onClick={() => setSelectedCategory("All")}
                                    className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider border shrink-0 transition-all duration-300 flex items-center gap-2
                                        ${selectedCategory === "All"
                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                            : "bg-white/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-primary/50"
                                        }`}
                                >
                                    {t('common.all_categories')}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${selectedCategory === "All" ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                        {openJobs.length}
                                    </span>
                                </button>
                                {categories.map((cat: any) => {
                                    const count = openJobs.filter(j => getJobCategory(j).toLowerCase() === cat.name.toLowerCase()).length;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.name)}
                                            className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider border shrink-0 transition-all duration-300 flex items-center gap-2
                                                ${selectedCategory === cat.name
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                    : "bg-white/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-primary/50"
                                                }`}
                                        >
                                            {t(`categories.${cat.name}`, { defaultValue: cat.name })}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${selectedCategory === cat.name ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Job Grid */}
                        <div className="animate-fade-in-up [animation-delay:200ms]">
                            {discoveryLoading && openJobs.length === 0 ? (
                                <div className="py-32 flex flex-col items-center gap-6 text-slate-400">
                                    <Loader2 size={48} className="animate-spin text-primary" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Scanning market...</p>
                                </div>
                            ) : filteredJobs.length === 0 ? (
                                <div className="py-32 flex flex-col items-center gap-6 text-slate-400 text-center bg-white/50 dark:bg-slate-900/40 rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50">
                                    <div className="size-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <Briefcase size={40} className="text-slate-300" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">No open jobs found</h3>
                                    <p className="text-sm font-bold text-slate-500 max-w-xs">There are no new job requests matching your criteria right now. Check back later.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredJobs.map((job: any) => (
                                        <div 
                                            key={job.id}
                                            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 flex flex-col group cursor-pointer"
                                            onClick={() => setSelectedJob(job)}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-110 transition-transform">
                                                        <Briefcase size={24} className="text-primary" />
                                                    </div>
                                                    <span className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-slate-200/30 dark:border-slate-700/50">
                                                        {t(`categories.${getJobCategory(job)}`, { defaultValue: getJobCategory(job) })}
                                                    </span>
                                                </div>
                                                {job.budget && (
                                                    <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-xl font-black text-xs border border-emerald-500/20 flex items-center gap-1.5 animate-fade-in">
                                                        <CreditCard size={12} /> ETB {job.budget}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2 line-clamp-1">{cleanTitle(job.title)}</h3>
                                            <p className="text-sm font-bold text-slate-500 line-clamp-2 mb-6 flex-1">{cleanDescription(job.description)}</p>
                                            
                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <MapPin size={12} /> {job.address || job.city || "Various"}
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-primary group-hover:underline flex items-center gap-1">
                                                    View Details <Send size={10} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Job Details & Bidding Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => !isBidding && setSelectedJob(null)} />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col animate-in zoom-in slide-in-from-bottom-8 duration-500 max-h-[90vh]">
                        
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Submit Proposal</h3>
                            <button 
                                onClick={() => !isBidding && setSelectedJob(null)}
                                className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            {bidSuccess ? (
                                <div className="py-20 flex flex-col items-center text-center">
                                    <div className="size-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 size={40} className="text-emerald-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Proposal Submitted!</h4>
                                    <p className="text-slate-500 font-bold">The customer will review your bid shortly.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Job Details Box */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700">
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{cleanTitle(selectedJob.title)}</h4>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">{cleanDescription(selectedJob.description)}</p>
                                        
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-2 text-xs font-black text-slate-500 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <Briefcase size={14} className="text-primary" /> 
                                                {t(`categories.${getJobCategory(selectedJob)}`, { defaultValue: getJobCategory(selectedJob) })}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-black text-slate-500 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <MapPin size={14} className="text-primary" /> {selectedJob.address || selectedJob.city || "Location not specified"}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-black text-slate-500 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <Calendar size={14} className="text-primary" /> 
                                                {selectedJob.scheduled_at ? new Date(selectedJob.scheduled_at).toLocaleDateString() : "Flexible Date"}
                                            </div>
                                            {selectedJob.budget && (
                                                <div className="flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                                                    <CreditCard size={14} /> Customer Budget: ETB {selectedJob.budget}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bidding Form */}
                                    <form id="bid-form" onSubmit={handleBidSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <CreditCard size={14} className="text-primary" /> Your Bid Amount (ETB) *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={bidAmount}
                                                onChange={e => setBidAmount(e.target.value)}
                                                placeholder="e.g. 500"
                                                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-xl"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <Send size={14} className="text-primary" /> Pitch Message (Optional)
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={bidMessage}
                                                onChange={e => setBidMessage(e.target.value)}
                                                placeholder="Tell the customer why you are the best fit for this job..."
                                                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                            />
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                        
                        {!bidSuccess && (
                            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end shrink-0">
                                <button
                                    type="submit"
                                    form="bid-form"
                                    disabled={isBidding || !bidAmount}
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/30 transition-all active:scale-95 disabled:opacity-70 group w-full sm:w-auto justify-center"
                                >
                                    {isBidding ? (
                                        <><Loader2 className="animate-spin" size={16} /> Submitting...</>
                                    ) : (
                                        <>Submit Proposal <Send size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessionalJobBoard;
