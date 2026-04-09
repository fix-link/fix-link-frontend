import { useState, useEffect } from "react";
import CustomerNavbar from "./components/CustomerNavbar";
import ProfessionalCard, { type Professional } from "./components/ProfessionalCard";
import CustomerFooter from "./components/CustomerFooter";
import FiltersSidebar from "./components/FiltersSidebar";
import { getProfessionals, getServiceCategories } from "../../../api/jobs.api";

const CustomerHome = () => {
  // Professionals state
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch professionals and categories from backend
  useEffect(() => {
    console.log("CustomerHome: Fetching professionals and categories...");
    
    Promise.all([getProfessionals(), getServiceCategories()])
      .then(([userData, categoriesData]) => {
        console.log("CustomerHome: Raw User Data:", userData);
        console.log("CustomerHome: Raw Categories Data:", categoriesData);

        const categoryMap: Record<string, string> = {};
        if (Array.isArray(categoriesData)) {
          categoriesData.forEach((cat: any) => {
            categoryMap[cat.id] = cat.name;
          });
        }

        let fetchedProfessionals = [];
        if (Array.isArray(userData)) {
            fetchedProfessionals = userData;
        } else if (userData && Array.isArray(userData.results)) {
            fetchedProfessionals = userData.results;
        } else if (userData && typeof userData === 'object') {
            fetchedProfessionals = userData.professionals || userData.data || [];
        }

        // Helper to format image URLs
        // Default avatar as a data URI to avoid broken external image links
        const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'><rect width='150' height='150' fill='%23e2e8f0'/><circle cx='75' cy='58' r='30' fill='%2394a3b8'/><ellipse cx='75' cy='130' rx='50' ry='35' fill='%2394a3b8'/></svg>`;
        const getImageUrl = (path: string) => {
          if (!path) return defaultAvatar;
          if (path.startsWith('http')) return path;
          // Handle both /media/... and media/... paths
          const cleanPath = path.startsWith('/') ? path : `/${path}`;
          return `${(import.meta.env.VITE_API_URL || 'https://fix-link-5332f899c079.herokuapp.com').replace(/\/$/, '')}${cleanPath}`;
        };

        // Filter for professionals and map data
        const verifiedProfessionals = fetchedProfessionals
          .filter((u: any) => u.role === 'professional' || u.is_professional || (u.user && u.user.role === 'professional'))
          .map((prof: any) => {
            const userData = prof.user || {};
            const firstName = prof.first_name || userData.first_name || '';
            const lastName = prof.last_name || userData.last_name || '';
            const roleId = prof.profession || userData.profession;
            
            // Map location dynamically
            const city = prof.city || userData.city || '';
            const area = prof.subcity || userData.subcity || prof.neighborhood || userData.neighborhood || '';
            const locationString = city && area ? `${city}, ${area}` : city || area || 'Addis Ababa';

            return {
              id: prof.id || prof.user_id || userData.id,
              name: `${firstName} ${lastName}`.trim() || prof.username || userData.username || "Anonymous Professional",
              role: categoryMap[roleId] || roleId || 'Professional',
              rating: prof.average_rating || prof.rating || 0,
              reviews: prof.total_jobs_completed || prof.reviews_count || 0,
              price: prof.hourly_rate || 0,
              verified: prof.is_verified_professional || false,
              image: getImageUrl(prof.profile_picture || userData.profile_picture),
              location: locationString
            };
          });

        console.log(`CustomerHome: Displaying ${verifiedProfessionals.length} professionals.`);
        setProfessionals(verifiedProfessionals);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard data", err);
        setLoading(false);
      });
  }, []);

  // Filter Visibility State
  const [showFilters, setShowFilters] = useState(true);

  // Filter States
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(10000);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("recommended");

  // Derived filtered and sorted list
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortOptions = [
    { value: "recommended", label: "Recommended", icon: "stars" },
    { value: "rating", label: "Top Rated", icon: "grade" },
    { value: "reviews", label: "Most Jobs", icon: "work" },
    { value: "experience", label: "Experienced", icon: "timeline" },
    { value: "price-low", label: "Price: Low to High", icon: "arrow_upward" },
    { value: "price-high", label: "Price: High to Low", icon: "arrow_downward" },
  ];

  const filteredProfessionals = professionals
    .filter((pro: any) => {
      const matchesPrice = pro.price >= priceMin && pro.price <= priceMax;
      const matchesRating = pro.rating >= selectedRating;
      const matchesVerified = verifiedOnly ? pro.verified : true;

      const matchesExperience = selectedExperience.length === 0 || selectedExperience.some(exp =>
        (exp === "Junior (1-2 yrs)" && pro.experience === "Junior") ||
        (exp === "Mid-level (3-5 yrs)" && pro.experience === "Mid-level") ||
        (exp === "Senior (5+ yrs)" && pro.experience === "Senior")
      );

      const matchesAvailability = selectedAvailability.length === 0 || (pro.availability && selectedAvailability.includes(pro.availability));
      const matchesLanguage = selectedLanguages.length === 0 || (pro.languages && pro.languages.some((lang: string) => selectedLanguages.includes(lang)));

      return matchesPrice && matchesRating && matchesVerified && matchesExperience && matchesAvailability && matchesLanguage;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "reviews") return b.reviews - a.reviews;
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "experience") {
        const aVal = a.experience === "Senior" ? 3 : (a.experience === "Mid-level" ? 2 : 1);
        const bVal = b.experience === "Senior" ? 3 : (b.experience === "Mid-level" ? 2 : 1);
        return bVal - aVal;
      }
      return 0;
    });

  const handleClearAll = () => {
    setPriceMin(0);
    setPriceMax(10000);
    setSelectedRating(0);
    setSelectedExperience([]);
    setVerifiedOnly(false);
    setSelectedAvailability([]);
    setSelectedLanguages([]);
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display">
      <CustomerNavbar />

      <main className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Professional Services</h1>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500"></span>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {loading ? 'Loading experts...' : `${filteredProfessionals.length} Experts Available in Addis Ababa`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition ${showFilters ? 'bg-primary text-white border-primary' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="material-symbols-outlined text-lg">tune</span> Filters
            </button>
            <div className="relative group">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${isSortOpen ? 'bg-white dark:bg-slate-800 border-primary ring-4 ring-primary/5 shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'}`}
              >
                <span className="material-symbols-outlined text-lg text-slate-400">sort</span>
                <span className="text-slate-700 dark:text-slate-200">
                  {sortOptions.find(o => o.value === sortBy)?.label || "Sort Results"}
                </span>
                <span className={`material-symbols-outlined text-slate-400 text-lg transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              
              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[60] overflow-hidden p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort Professionals By</p>
                    </div>
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${sortBy === option.value ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-lg">
                            {option.icon}
                          </span>
                          {option.label}
                        </div>
                        {sortBy === option.value && <span className="material-symbols-outlined text-lg">check</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 transition-all duration-300">
          {/* Conditional Sidebar */}
          {showFilters && (
            <aside className="w-full lg:w-1/4 xl:w-1/5 flex-shrink-0 animate-in slide-in-from-left-5 fade-in duration-300">
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
          )}

          {/* Professionals Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-text-secondary dark:text-gray-400">Loading professionals...</p>
                </div>
              </div>
            ) : professionals.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <p className="text-lg font-semibold text-text-primary dark:text-white mb-2">No verified professionals found</p>
                  <p className="text-sm text-text-secondary dark:text-gray-400">Check back later or adjust your filters</p>
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${showFilters ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} 2xl:grid-cols-4 gap-6`}>
                {filteredProfessionals.map((pro) => (
                  <ProfessionalCard key={pro.id} pro={pro} />
                ))}
              </div>
            )}

            {/* End of results placeholder */}
          </div>
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
};

export default CustomerHome;
