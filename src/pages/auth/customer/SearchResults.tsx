import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import CustomerNavbar from "./components/CustomerNavbar";
import ProfessionalCard from "./components/ProfessionalCard";
import CustomerFooter from "./components/CustomerFooter";
import FiltersSidebar from "./components/FiltersSidebar";
import { getProfessionals, getServiceCategories } from "../../../api/jobs.api";

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
        const matchesPrice = pro.price >= priceMin && pro.price <= priceMax;
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

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
                    <p className="font-bold text-text-secondary">Searching Professionals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display">
            <CustomerNavbar />

            <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-wrap justify-between gap-4 mb-8">
                    <p className="text-text-primary dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
                        Professionals for '{serviceQuery || 'All Services'}' in '{locationQuery || 'Addis Ababa'}'
                    </p>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 self-end mb-1">
                        <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition group relative shadow-sm">
                            <span className="material-symbols-outlined text-lg text-slate-500">sort</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-text-primary dark:text-white cursor-pointer p-0 pr-6 appearance-none"
                            >
                                <option value="recommended">Sort by: Recommended</option>
                                <option value="rating">Sort by: Top Rated</option>
                                <option value="reviews">Sort by: Most Jobs</option>
                                <option value="experience">Sort by: Experienced</option>
                                {locationQuery && <option value="nearby">Sort by: Nearby</option>}
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 text-slate-400 pointer-events-none text-lg">expand_more</span>
                        </div>
                        <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">
                            {filteredProfessionals.length} professional{filteredProfessionals.length !== 1 && 's'} found
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* FILTERS SIDEBAR */}
                    <aside className="w-full lg:w-1/4 xl:w-1/5">
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
                    </aside>

                    {/* RESULTS LIST */}
                    <div className="w-full lg:w-3/4 xl:w-4/5">
                        {filteredProfessionals.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProfessionals.map((pro) => (
                                    <ProfessionalCard key={pro.id} pro={pro} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-background-dark rounded-xl shadow-sm">
                                <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">search_off</span>
                                <h3 className="text-lg font-bold text-text-primary dark:text-white">No professionals found</h3>
                                <p className="text-text-secondary dark:text-gray-400 mt-2">Try adjusting your filters to see more results.</p>
                                <button onClick={handleClearAll} className="mt-6 text-primary font-bold hover:underline">Clear Filters</button>
                            </div>
                        )}

                        {/* Pagination - Temporarily hidden as results are few */}
                    </div>
                </div>
            </main>


            <CustomerFooter />
        </div>
    );
};

export default SearchResults;
