import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "./components/CustomerNavbar";
import CustomerFooter from "./components/CustomerFooter";
import { 
    Briefcase, 
    FileText, 
    MapPin, 
    CreditCard, 
    Calendar, 
    Image as ImageIcon,
    UploadCloud,
    X,
    CheckCircle2,
    Loader2,
    Sparkles
} from "lucide-react";
import { createJob, getServiceCategories } from "../../../api/jobs.api";

const CustomerPostJob = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        service: "",
        address: "Addis Ababa",
        budget: "",
        scheduled_at: "",
        photos: [] as File[]
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getServiceCategories();
                setCategories(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, service: data[0].name }));
                }
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setFormData(prev => ({ ...prev, photos: [...prev.photos, ...filesArray] }));
        }
    };

    const removePhoto = (index: number) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Find the category ID
            const selectedCategory = categories.find(c => c.name === formData.service);
            
            const payload = {
                title: `[${formData.service}] ${formData.title}`,
                description: `Category: ${formData.service}\n\n${formData.description}`,
                service: undefined, // Omit ServiceCategory UUID as it's not a valid Service PK
                address: formData.address,
                budget: formData.budget,
                scheduled_at: formData.scheduled_at,
                photos: formData.photos
            };

            await createJob(payload);
            setSuccess(true);
            setTimeout(() => {
                navigate('/customer/jobs');
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to post job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display selection:bg-primary/20 selection:text-primary">
            {/* Background Blobs */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>

            <CustomerNavbar />

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="space-y-2 mb-10 text-center animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px] mb-4">
                        <Sparkles size={14} className="animate-pulse" />
                        <span>New Job Request</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        Post a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan">Job</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xl mx-auto">
                        Describe what you need done and receive bids from top-rated professionals in your area.
                    </p>
                </div>

                {success ? (
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-12 text-center border border-emerald-500/20 shadow-2xl animate-in zoom-in duration-500">
                        <div className="size-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={48} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Job Posted Successfully!</h2>
                        <p className="text-slate-500 font-bold mb-8">Professionals will start bidding on your job soon. Redirecting to your jobs dashboard...</p>
                        <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-6 sm:p-10 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl animate-fade-in-up [animation-delay:100ms] space-y-8">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                    <Briefcase size={16} className="text-primary" /> Job Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Fix leaking pipe in kitchen"
                                    className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                    <FileText size={16} className="text-primary" /> Description
                                </label>
                                <textarea
                                    name="description"
                                    required
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Provide details about the job, what needs to be done, etc."
                                    className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                        <Briefcase size={16} className="text-primary" /> Service Category
                                    </label>
                                    <select
                                        name="service"
                                        value={formData.service}
                                        onChange={handleChange}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                                {t(`categories.${cat.name}`, { defaultValue: cat.name })}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                        <MapPin size={16} className="text-primary" /> Location
                                    </label>
                                    <select
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                    >
                                        {["Addis Ababa", "Adama", "Bahir Dar", "Hawassa", "Gondar", "Mekelle", "Dire Dawa", "Jimma", "Bishoftu", "Dessie"].map(loc => (
                                            <option key={loc} value={loc} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                                {loc}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                        <CreditCard size={16} className="text-emerald-500" /> Budget (ETB)
                                    </label>
                                    <input
                                        type="number"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        placeholder="Optional budget"
                                        className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                        <Calendar size={16} className="text-primary" /> Preferred Date
                                    </label>
                                    <input
                                        type="date"
                                        name="scheduled_at"
                                        value={formData.scheduled_at}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                                    <ImageIcon size={16} className="text-primary" /> Photos (Optional)
                                </label>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {formData.photos.map((photo, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                            <img src={URL.createObjectURL(photo)} alt="preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(idx)}
                                                className="absolute top-2 right-2 size-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400">
                                        <UploadCloud size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">Upload Photo</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin" size={18} /> Posting Job...</>
                                ) : (
                                    <>Post Job Request <Briefcase size={18} className="group-hover:rotate-12 transition-transform" /></>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </main>
            
            <CustomerFooter />
        </div>
    );
};

export default CustomerPostJob;
