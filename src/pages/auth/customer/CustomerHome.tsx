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
  const [showFilters, setShowFilters] = useState(false);

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
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-white">Professional Services in Addis Ababa</h1>
            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Found {filteredProfessionals.length} verified professionals ready to help.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition ${showFilters ? 'bg-primary text-white border-primary' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="material-symbols-outlined text-lg">tune</span> Filters
            </button>
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
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 text-slate-400 pointer-events-none text-lg">expand_more</span>
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
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${showFilters ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-4 xl:grid-cols-4'} 2xl:grid-cols-4 gap-6`}>
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
