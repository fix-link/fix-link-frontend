import { useState, useEffect } from "react";
import CustomerNavbar from "./components/CustomerNavbar";
import ProfessionalCard, { type Professional } from "./components/ProfessionalCard";
import CustomerFooter from "./components/CustomerFooter";
import FiltersSidebar from "./components/FiltersSidebar";
import { getProfessionals, getServiceCategories } from "../../../api/jobs.api";
import { getProfessionalProfile } from "../../../api/auth.api";
import { Sparkles, Star, Briefcase, TrendingUp, ArrowUp, ArrowDown, Settings2, ArrowUpDown, ChevronDown, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const CustomerHome = () => {
  const { t } = useTranslation();
  // Professionals state
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch professionals and categories from backend
  useEffect(() => {
    // 1. Try to load from cache for instant UI (v3 cache has real location data)
    const cached = localStorage.getItem('cached_professionals_v3');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProfessionals(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.warn("CustomerHome: Failed to parse cache", e);
      }
    }

    const fetchAndEnrich = async () => {
      try {
        const [userData, categoriesData] = await Promise.all([getProfessionals(), getServiceCategories()]);

        const categoryMap: Record<string, string> = {};
        if (Array.isArray(categoriesData)) {
          categoriesData.forEach((cat: any) => { categoryMap[cat.id] = cat.name; });
        }

        let fetchedProfessionals: any[] = [];
        if (Array.isArray(userData)) {
          fetchedProfessionals = userData;
        } else if (userData && Array.isArray(userData.results)) {
          fetchedProfessionals = userData.results;
        } else if (userData && typeof userData === 'object') {
          fetchedProfessionals = userData.professionals || userData.data || [];
        }

        const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'><rect width='150' height='150' fill='%23e2e8f0'/><circle cx='75' cy='58' r='30' fill='%2394a3b8'/><ellipse cx='75' cy='130' rx='50' ry='35' fill='%2394a3b8'/></svg>`;
        const getImageUrl = (path: string) => {
          if (!path) return defaultAvatar;
          if (path.startsWith('http')) return path;
          const cleanPath = path.startsWith('/') ? path : `/${path}`;
          return `${(import.meta.env.VITE_API_URL || 'https://fix-link-5332f899c079.herokuapp.com').replace(/\/$/, '')}${cleanPath}`;
        };

        // Filter to professionals only
        const proList = fetchedProfessionals.filter(
          (u: any) => u.role === 'professional' || u.is_professional || (u.user && u.user.role === 'professional')
        );

        // Build base cards (location will be enriched below)
        const baseCards = proList.map((prof: any) => {
          const ud = prof.user || {};
          const roleId = prof.profession || ud.profession;
          const yoe = Number(prof.years_of_experience || ud.years_of_experience || 0);
          const locationParts = [
            prof.city || ud.city,
            prof.subcity || ud.subcity,
            prof.location,
            prof.neighborhood || ud.neighborhood,
          ]
            .filter(Boolean)
            .map((part: string) => part.trim());
          const location = locationParts.length > 0 ? locationParts.join(', ') : 'Addis Ababa';

          return {
            id: ud.id || prof.user_id || (typeof prof.user === 'string' ? prof.user : null) || prof.id,
            name: `${prof.first_name || ud.first_name || ''} ${prof.last_name || ud.last_name || ''}`.trim() || prof.username || ud.username || t('common.anonymous_pro'),
            role: t(`categories.${categoryMap[roleId] || roleId}`, { defaultValue: categoryMap[roleId] || roleId || t('common.professional') }),
            rating: prof.average_rating || prof.rating || 0,
            reviews: prof.total_jobs_completed || prof.reviews_count || 0,
            price: prof.hourly_rate || 0,
            verified: prof.is_verified_professional || false,
            image: getImageUrl(prof.profile_picture || ud.profile_picture),
            location,
            experience: yoe >= 5 ? 'Senior' : yoe >= 3 ? 'Mid-level' : 'Junior',
            languages: (() => {
              const raw = prof.languages ?? ud.languages;
              if (Array.isArray(raw)) return raw.filter(Boolean);
              if (typeof raw === 'string' && raw.trim()) return raw.split(',').map((l: string) => l.trim()).filter(Boolean);
              return [];
            })(),
          };
        });

        setProfessionals(baseCards);
        localStorage.setItem('cached_professionals_v3', JSON.stringify(baseCards));
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setLoading(false);
      }
    };

    fetchAndEnrich();
  }, []);

  // Filter Visibility State
  const [showFilters, setShowFilters] = useState(true);

  // Filter States
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(10000);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("recommended");

  // Derived filtered and sorted list
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortOptions = [
    { value: "recommended", label: t('common.recommended'), icon: Sparkles },
    { value: "rating", label: t('common.top_rated'), icon: Star },
    { value: "reviews", label: t('common.most_jobs'), icon: Briefcase },
    { value: "experience", label: t('common.experienced'), icon: TrendingUp },
    { value: "price-low", label: t('common.price_low_high'), icon: ArrowUp },
    { value: "price-high", label: t('common.price_high_low'), icon: ArrowDown },
  ];

  const filteredProfessionals = professionals
    .filter((pro: any) => {
      const matchesPrice = pro.price >= priceMin && pro.price <= priceMax;
      const matchesRating = pro.rating >= selectedRating;
      const matchesVerified = verifiedOnly ? pro.verified : true;

      const matchesExperience = selectedExperience.length === 0 || selectedExperience.some(exp => {
        if (exp === "Junior (1-2 yrs)") return pro.experience === "Junior";
        if (exp === "Mid-level (3-5 yrs)") return pro.experience === "Mid-level";
        if (exp === "Senior (5+ yrs)") return pro.experience === "Senior";
        return false;
      });

      const matchesLanguage = selectedLanguages.length === 0 || (Array.isArray(pro.languages) && pro.languages.some((lang: string) => selectedLanguages.includes(lang)));

      return matchesPrice && matchesRating && matchesVerified && matchesExperience && matchesLanguage;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "rating" || sortBy === "recommended") return b.rating - a.rating;
      if (sortBy === "reviews") return b.reviews - a.reviews;
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "experience") {
        const rank = (e: string) => e === "Senior" ? 3 : e === "Mid-level" ? 2 : 1;
        return rank(b.experience) - rank(a.experience);
      }
      return 0;
    });

  const handleClearAll = () => {
    setPriceMin(0);
    setPriceMax(10000);
    setSelectedRating(0);
    setSelectedExperience([]);
    setVerifiedOnly(false);
    setSelectedLanguages([]);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display">
      {/* Background Blobs */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <CustomerNavbar />

      <main className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8 relative z-10">
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up relative z-[60]">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan">{t('common.professional')}</span> {t('common.services')}
            </h1>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {loading ? t('common.finding_experts') : `${filteredProfessionals.length} ${t('common.experts_available')}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative z-[60]">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 shadow-sm ${showFilters ? 'bg-primary text-white shadow-primary/20 hover:bg-primary-dark' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}
            >
              <Settings2 size={18} /> {t('common.filters')}
            </button>
            <div className="relative group z-[60]">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-300 ${isSortOpen ? 'bg-white dark:bg-slate-800 border-primary ring-4 ring-primary/10 shadow-lg' : 'glass-panel text-slate-700 dark:text-slate-200 hover:border-primary/50'}`}
              >
                <ArrowUpDown size={18} className="text-slate-400" />
                <span>
                  {sortOptions.find(o => o.value === sortBy)?.label || t('common.sort_results')}
                </span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>
              
              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+16px)] w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/60 dark:border-slate-700/50 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-200">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="px-5 py-4 border-b border-slate-100/50 dark:border-slate-800/50 relative z-10 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.sort_results_by')}</p>
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
                          {sortBy === option.value && <Check size={18} strokeWidth={3} className="animate-in zoom-in spin-in-180 duration-300" />}
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
                  selectedLanguages={selectedLanguages}
                  setSelectedLanguages={setSelectedLanguages}
                  onClearAll={handleClearAll}
                />
              </div>
            </aside>
          )}

          {/* Professionals Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                     <span className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></span>
                     <span className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></span>
                  </div>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">{t('common.finding_experts')}</p>
                </div>
              </div>
            ) : professionals.length === 0 ? (
              <div className="flex justify-center items-center py-32 glass-panel rounded-[32px] border-dashed">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                     <Briefcase size={24} />
                  </div>
                   <p className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{t('common.no_results_found')}</p>
                   <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.could_not_find_experts')}</p>
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${showFilters ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} 3xl:grid-cols-5 gap-6`}>
                {filteredProfessionals.map((pro) => (
                  <ProfessionalCard key={pro.id} pro={pro} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
};

export default CustomerHome;
