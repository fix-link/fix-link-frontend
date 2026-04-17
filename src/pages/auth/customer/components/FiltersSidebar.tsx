import React from "react";
import { FilterX } from "lucide-react";

interface FiltersSidebarProps {
    priceMin: number;
    setPriceMin: (val: number) => void;
    priceMax: number;
    setPriceMax: (val: number) => void;
    selectedRating: number;
    setSelectedRating: (val: number) => void;
    selectedExperience: string[];
    setSelectedExperience: React.Dispatch<React.SetStateAction<string[]>>;
    verifiedOnly: boolean;
    setVerifiedOnly: (val: boolean) => void;
    selectedAvailability: string[];
    setSelectedAvailability: React.Dispatch<React.SetStateAction<string[]>>;
    selectedLanguages: string[];
    setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>;
    onClearAll: () => void;
}

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    selectedRating,
    setSelectedRating,
    selectedExperience,
    setSelectedExperience,
    verifiedOnly,
    setVerifiedOnly,
    selectedAvailability,
    setSelectedAvailability,
    selectedLanguages,
    setSelectedLanguages,
    onClearAll,
}) => {
    const toggleFilter = (
        state: string[],
        setState: React.Dispatch<React.SetStateAction<string[]>>,
        value: string
    ) => {
        if (state.includes(value)) {
            setState(state.filter((item) => item !== value));
        } else {
            setState([...state, value]);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-[32px] shadow-sm border border-white/40 dark:border-slate-800/50 relative overflow-hidden">
            {/* Subtle Gradient Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-slate-900 dark:text-white text-xl font-black tracking-tight">
                    Filters
                </h3>
                <button
                    onClick={onClearAll}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors group px-3 py-1.5 rounded-full hover:bg-primary/5"
                >
                    <FilterX size={14} className="group-hover:scale-110 transition-transform" />
                    <span>Clear All</span>
                </button>
            </div>

            {/* Price Range */}
            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-6 relative z-10">
                <h4 className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest mb-4">
                    Price Range (ETB)
                </h4>

                <div className="space-y-6">
                    <div className="relative h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="absolute h-full bg-gradient-to-r from-primary to-accent-cyan rounded-full"
                            style={{
                                left: `${(priceMin / 10000) * 100}%`,
                                right: `${100 - (priceMax / 10000) * 100}%`,
                            }}
                        ></div>
                        <input
                            type="range"
                            min="0"
                            max="10000"
                            value={priceMin}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val < priceMax) setPriceMin(val);
                            }}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
                        />
                        <input
                            type="range"
                            min="0"
                            max="10000"
                            value={priceMax}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val > priceMin) setPriceMax(val);
                            }}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
                        />
                        {/* Custom Thumbs visually represented */}
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md pointer-events-none" style={{ left: `${(priceMin / 10000) * 100}%`, transform: 'translate(-50%, -50%)' }}></div>
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md pointer-events-none" style={{ left: `${(priceMax / 10000) * 100}%`, transform: 'translate(-50%, -50%)' }}></div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            value={priceMin}
                            onChange={(e) => setPriceMin(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 text-sm font-bold py-2.5 px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-slate-900 dark:text-white transition-all shadow-inner"
                            placeholder="Min"
                        />
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                        <input
                            type="number"
                            value={priceMax}
                            onChange={(e) => setPriceMax(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 text-sm font-bold py-2.5 px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-slate-900 dark:text-white transition-all shadow-inner"
                            placeholder="Max"
                        />
                    </div>
                </div>
            </div>

            {/* Rating */}
            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-6 mt-6">
                <h4 className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest mb-4">
                    Rating
                </h4>
                <div className="flex flex-col gap-3">
                    {[
                        { val: 4, label: "4★ and up" },
                        { val: 3, label: "3★ and up" },
                        { val: 0, label: "Any Rating" }
                    ].map((opt) => (
                        <label key={opt.val} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    name="rating-filter"
                                    type="radio"
                                    checked={selectedRating === opt.val}
                                    onChange={() => setSelectedRating(opt.val)}
                                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-full checked:border-primary checked:bg-primary transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20"
                                />
                                <div className="absolute w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                            <span className={`text-sm font-bold transition-colors ${selectedRating === opt.val ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                {opt.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Experience */}
            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-6 mt-6">
                <h4 className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest mb-4">
                    Experience Level
                </h4>
                <div className="flex flex-col gap-3">
                    {["Junior (1-2 yrs)", "Mid-level (3-5 yrs)", "Senior (5+ yrs)"].map(
                        (exp) => (
                            <label key={exp} className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                  <input
                                      type="checkbox"
                                      checked={selectedExperience.includes(exp)}
                                      onChange={() =>
                                          toggleFilter(selectedExperience, setSelectedExperience, exp)
                                      }
                                      className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-lg checked:border-primary checked:bg-primary transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20"
                                  />
                                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none">
                                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span className={`text-sm font-bold transition-colors ${selectedExperience.includes(exp) ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                    {exp}
                                </span>
                            </label>
                        )
                    )}
                </div>
            </div>

            {/* Verified Only (Modern Switch) */}
            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-6 mt-6">
                <label className="flex cursor-pointer items-center justify-between group">
                    <span className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest">
                        Verified Only
                    </span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={verifiedOnly}
                            onChange={(e) => setVerifiedOnly(e.target.checked)}
                        />
                        <div className="block w-12 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer-checked:bg-primary transition-colors duration-300"></div>
                        <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 peer-checked:translate-x-5 shadow-sm"></div>
                    </div>
                </label>
            </div>

            {/* Availability */}
            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-6 mt-6">
                <h4 className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest mb-4">
                    Availability
                </h4>
                <div className="flex flex-col gap-3">
                    {["Today", "This Week"].map((avail) => (
                        <label key={avail} className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative flex items-center justify-center">
                                  <input
                                      type="checkbox"
                                      checked={selectedAvailability.includes(avail)}
                                      onChange={() =>
                                          toggleFilter(selectedAvailability, setSelectedAvailability, avail)
                                      }
                                      className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-lg checked:border-primary checked:bg-primary transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20"
                                  />
                                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none">
                                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span className={`text-sm font-bold transition-colors ${selectedAvailability.includes(avail) ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                    {avail}
                                </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Languages */}
            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-6 mt-6 pb-2">
                <h4 className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest mb-4">
                    Language
                </h4>
                <div className="flex flex-wrap gap-2">
                    {["English", "Amharic", "Oromiffa", "Tigrinya"].map((lang) => (
                        <button
                            key={lang}
                            onClick={() => toggleFilter(selectedLanguages, setSelectedLanguages, lang)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 border ${
                                selectedLanguages.includes(lang) 
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                            }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FiltersSidebar;
