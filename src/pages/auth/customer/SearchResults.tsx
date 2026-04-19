import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import CustomerNavbar from "./components/CustomerNavbar";
import ProfessionalCard from "./components/ProfessionalCard";
import CustomerFooter from "./components/CustomerFooter";
import FiltersSidebar from "./components/FiltersSidebar";
import { getProfessionals, getServiceCategories } from "../../../api/jobs.api";
import { 
  Search, SlidersHorizontal, ArrowUpDown, 
  MapPin, Loader2, SearchX, ChevronDown,
  Check, Star, Briefcase
} from "lucide-react";

const SearchResults = () => {
    const location = useLocation();

    // Parse query params to show in header title
    const queryParams = new URLSearchParams(location.search);
    const serviceQuery = (queryParams.get("service") || "").toLowerCase();
    const locationQuery = (queryParams.get("location") || "").toLowerCase();

    const [professionals, setProfessionals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [priceMin, setPriceMin] = useState<number>(0);
    const [priceMax, setPriceMax] = useState<number>(10000);
    const [selectedRating, setSelectedRating] = useState<number>(0);
    const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
    const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

    // New Filters
    const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>("recommended");

    useEffect(() => {
        Promise.all([getProfessionals(), getServiceCategories()])
            .then(([userData, categoriesData]) => {
                const categoryMap: Record<string, string> = {};
                if (Array.isArray(categoriesData)) {
                    categoriesData.forEach((cat: any) => {
                        categoryMap[cat.id] = cat.name;
                    });
                }

                let fetched = [];
                if (Array.isArray(userData)) fetched = userData;
                else if (userData?.results) fetched = userData.results;
                else fetched = userData?.professionals || userData?.data || [];

                const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'><rect width='150' height='150' fill='%23e2e8f0'/><circle cx='75' cy='58' r='30' fill='%2394a3b8'/><ellipse cx='75' cy='130' rx='50' ry='35' fill='%2394a3b8'/></svg>`;
                const getImageUrl = (path: string) => {
                    if (!path) return defaultAvatar;
                    if (path.startsWith('http')) return path;
                    const cleanPath = path.startsWith('/') ? path : `/${path}`;
                    return `${(import.meta.env.VITE_API_URL || 'https://fix-link-5332f899c079.herokuapp.com').replace(/\/$/, '')}${cleanPath}`;
                };

                const mapped = fetched
                    .filter((u: any) => u.role === 'professional' || u.is_professional || u.user?.role === 'professional')
                    .map((prof: any) => {
                        const ud = prof.user || {};
                        const roleName = categoryMap[prof.profession || ud.profession] || 'Professional';
                        
                        // Map location dynamically
                        const city = prof.city || ud.city || '';
                        const area = prof.subcity || ud.subcity || prof.neighborhood || ud.neighborhood || '';
                        const locationString = city && area ? `${city}, ${area}` : city || area || 'Addis Ababa';

                        return {
                            id: prof.id || prof.user_id || ud.id,
                            name: `${prof.first_name || ud.first_name || ''} ${prof.last_name || ud.last_name || ''}`.trim() || prof.username || ud.username || "Anonymous Professional",
                            role: roleName,
                            rating: prof.average_rating || prof.rating || 0,
                            reviews: prof.total_jobs_completed || prof.reviews_count || 0,
                            price: prof.hourly_rate || 0,
                            verified: prof.is_verified_professional || false,
                            image: getImageUrl(prof.profile_picture || ud.profile_picture),
                            location: locationString,
                            experience: prof.years_of_experience > 5 ? "Senior" : prof.years_of_experience > 2 ? "Mid-level" : "Junior",
                            availability: "Today",
                            languages: ["Amharic", "English"]
                        };
                    });

                // Filter by service query if present
                const filteredByService = serviceQuery 
                    ? mapped.filter((p: any) => p.role.toLowerCase().includes(serviceQuery) || p.name.toLowerCase().includes(serviceQuery))
                    : mapped;

                setProfessionals(filteredByService);
                setLoading(false);
            })
            .catch(err => {
                console.error("Search fetch error:", err);
                setLoading(false);
            });
    }, [serviceQuery]);

    // Filter Logic
    const filteredProfessionals = professionals.filter((pro: any) => {
        const matchesPrice = pro.price >= priceMin && (priceMax === 10000 || pro.price <= priceMax);
        const matchesRating = pro.rating >= selectedRating;
        const matchesVerified = verifiedOnly ? pro.verified : true;

        const matchesExperience = selectedExperience.length === 0 || selectedExperience.some(exp =>
            (exp === "Junior (1-2 yrs)" && pro.experience === "Junior") ||
            (exp === "Mid-level (3-5 yrs)" && pro.experience === "Mid-level") ||
            (exp === "Senior (5+ yrs)" && pro.experience === "Senior")
        );

        const matchesAvailability = selectedAvailability.length === 0 || selectedAvailability.includes(pro.availability);

        const matchesLanguage = selectedLanguages.length === 0 || pro.languages.some((lang: string) => selectedLanguages.includes(lang));

        return matchesPrice && matchesRating && matchesVerified && matchesExperience && matchesAvailability && matchesLanguage;
    }).sort((a: any, b: any) => {
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "reviews") return b.reviews - a.reviews;
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "experience") {
            const expOrder: Record<string, number> = { "Senior": 3, "Mid-level": 2, "Junior": 1 };
            return (expOrder[b.experience] || 0) - (expOrder[a.experience] || 0);
        }
        if (sortBy === "nearby" && locationQuery) {
            const aMatch = a.location.toLowerCase().includes(locationQuery);
            const bMatch = b.location.toLowerCase().includes(locationQuery);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
        }
        return 0;
    });

    const handleClearAll = () => {
        setPriceMin(0);  // Reset to lower wide range
        setPriceMax(10000);
        setSelectedRating(0);
        setSelectedExperience([]);
        setVerifiedOnly(false);
        setSelectedAvailability([]);
        setSelectedLanguages([]);
    };

    // Filter Visibility State
    const [showFilters, setShowFilters] = useState(true);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const sortOptions = [
        { value: "recommended", label: "Recommended", icon: Search },
        { value: "rating", label: "Top Rated", icon: Star },
        { value: "reviews", label: "Most Jobs", icon: Briefcase },
        { value: "experience", label: "Experience", icon: ArrowUpDown },
        { value: "price-low", label: "Lowest Price", icon: ArrowUpDown },
        { value: "price-high", label: "Highest Price", icon: ArrowUpDown },
    ];

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-6 animate-pulse">
                    <Loader2 size={48} className="text-primary animate-spin" />
                    <p className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Discovering Experts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display overflow-x-hidden">
            {/* Background Blobs */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

            <CustomerNavbar />

            <main className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8 relative z-10">
                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-up relative z-[60]">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                            Search results for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan capitalize">
                                {serviceQuery || 'Every Task'}
                            </span> {locationQuery && <span>in <span className="capitalize">{locationQuery}</span></span>}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                Discovery Engine Active
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 relative z-[60]">
                        <div className="px-6 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm hidden md:flex items-center gap-3 mr-2 shadow-sm">
                            <span className="text-primary font-black text-xl">{filteredProfessionals.length}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Experts Found</span>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 shadow-sm ${showFilters ? 'bg-primary text-white shadow-primary/20 hover:bg-primary-dark' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}
                        >
                            <ArrowUpDown size={18} /> Filters
                        </button>
                        
                        <div className="relative group z-[60]">
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-300 ${isSortOpen ? 'bg-white dark:bg-slate-800 border-primary ring-4 ring-primary/10 shadow-lg' : 'glass-panel text-slate-700 dark:text-slate-200 hover:border-primary/50'}`}
                            >
                                <ArrowUpDown size={18} className="text-slate-400" />
                                <span>
                                    {sortOptions.find(o => o.value === sortBy)?.label || "Sort Results"}
                                </span>
                                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180 text-primary' : ''}`} />
                            </button>
                            
                            {isSortOpen && (
                                <>
                                    <div className="fixed inset-0 z-[55]" onClick={() => setIsSortOpen(false)} />
                                    <div className="absolute right-0 top-[calc(100%+16px)] w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/60 dark:border-slate-700/50 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-200">
                                        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                                        <div className="px-5 py-4 border-b border-slate-100/50 dark:border-slate-800/50 relative z-10 flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sort Results By</p>
                                        </div>
                                        <div className="p-2 relative z-10 space-y-1">
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSortBy(option.value);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[14px] font-bold transition-all duration-300 group ${sortBy === option.value ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <div className={`flex items-center gap-3 transition-transform duration-300 ${sortBy !== option.value ? 'group-hover:translate-x-1' : ''}`}>
                                                        <option.icon size={18} strokeWidth={2.5} className={`${sortBy === option.value ? 'text-white' : 'text-slate-400 group-hover:text-primary'} transition-colors`} />
                                                        {option.label}
                                                    </div>
                                                    {sortBy === option.value && <Check size={18} strokeWidth={4} className="animate-in zoom-in spin-in-180 duration-300" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 transition-all duration-500">
                    {/* Conditional Sidebar */}
                    {showFilters && (
                        <aside className="w-full lg:w-1/4 xl:w-1/5 flex-shrink-0 animate-in slide-in-from-left-5 fade-in duration-300 relative z-10">
                            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 sticky top-8">
                                <FiltersSidebar
                                    priceMin={priceMin}
                                    setPriceMin={setPriceMin}
                                    priceMax={priceMax}
                                    setPriceMax={setPriceMax}
                                    selectedRating={selectedRating}
                                    setSelectedRating={setSelectedRating}
                                    selectedExperience={selectedExperience}
                                    setSelectedExperience={setSelectedExperience}
                                    verifiedOnly={verifiedOnly}
                                    setVerifiedOnly={setVerifiedOnly}
                                    selectedAvailability={selectedAvailability}
                                    setSelectedAvailability={setSelectedAvailability}
                                    selectedLanguages={selectedLanguages}
                                    setSelectedLanguages={setSelectedLanguages}
                                    onClearAll={handleClearAll}
                                />
                            </div>
                        </aside>
                    )}

                    {/* RESULTS LIST */}
                    <div className="flex-1">
                        {filteredProfessionals.length > 0 ? (
                            <div className={`grid grid-cols-1 sm:grid-cols-2 ${showFilters ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700`}>
                                {filteredProfessionals.map((pro) => (
                                    <ProfessionalCard key={pro.id} pro={pro} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 glass-panel rounded-[32px] border-dashed border-2 border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-500">
                                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
                                    <SearchX size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">No Results Found</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
                                    We couldn't find any experts matching your specific criteria. Try broadening your filter parameters.
                                </p>
                                <button 
                                    onClick={handleClearAll} 
                                    className="px-8 py-3 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <CustomerFooter />
        </div>
    );
};

export default SearchResults;

