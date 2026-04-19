import React from "react";
import { FilterX, Check, Star } from "lucide-react";

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
        <div className="space-y-10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-900 dark:text-white text-xl font-black tracking-tight">
                    Discovery <span className="text-primary tracking-tighter">Filters</span>
                </h3>
                <button
                    onClick={onClearAll}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group"
                    title="Reset all filters"
                >
                    <FilterX size={18} className="group-hover:rotate-12 transition-transform" />
                </button>
            </div>

            {/* Price Range */}
            <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                    Budget Constraint
                </h4>

                <div className="space-y-6">
                    <div className="relative h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800/50">
                        <div
                            className="absolute h-full bg-primary rounded-full transition-all duration-300"
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
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-lg pointer-events-none transition-transform" style={{ left: `${(priceMin / 10000) * 100}%`, transform: 'translate(-50%, -50%)' }}></div>
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-lg pointer-events-none transition-transform" style={{ left: `${(priceMax / 10000) * 100}%`, transform: 'translate(-50%, -50%)' }}></div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Min</span>
                            <input
                                type="number"
                                value={priceMin}
                                onChange={(e) => setPriceMin(Number(e.target.value))}
                                className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-black focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-800 dark:text-white"
                            />
                        </div>
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Max</span>
                            {priceMax === 10000 ? (
                                <input
                                    type="text"
                                    value="10000+"
                                    readOnly
                                    className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-black focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-800 dark:text-white"
                                />
                            ) : (
                                <input
                                    type="number"
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(Number(e.target.value))}
                                    className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-black focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-800 dark:text-white"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                    Quality Rating
                </h4>
                <div className="space-y-2">
                    {[
                        { val: 4, label: "4.0+ Stars" },
                        { val: 3, label: "3.0+ Stars" },
                        { val: 0, label: "Default Any" }
                    ].map((opt) => (
                        <label key={opt.val} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group ${selectedRating === opt.val ? 'border-primary/20 bg-primary/5' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                            <div className="flex items-center gap-3">
                                <Star size={16} className={`${selectedRating === opt.val ? 'text-primary fill-primary' : 'text-slate-300 dark:text-slate-600 group-hover:text-amber-400'}`} />
                                <span className={`text-sm font-black tracking-tight transition-colors ${selectedRating === opt.val ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {opt.label}
                                </span>
                            </div>
                            <input
                                name="rating-filter"
                                type="radio"
                                checked={selectedRating === opt.val}
                                onChange={() => setSelectedRating(opt.val)}
                                className="sr-only"
                            />
                            {selectedRating === opt.val && <Check size={16} className="text-primary animate-in zoom-in duration-300" />}
                        </label>
                    ))}
                </div>
            </div>

            {/* Experience */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                    Expertise Depth
                </h4>
                <div className="flex flex-col gap-2">
                    {["Junior (1-2 yrs)", "Mid-level (3-5 yrs)", "Senior (5+ yrs)"].map(
                        (exp) => (
                            <label key={exp} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group ${selectedExperience.includes(exp) ? 'border-primary/20 bg-primary/5' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                <span className={`text-sm font-black tracking-tight transition-colors ${selectedExperience.includes(exp) ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {exp}
                                </span>
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedExperience.includes(exp)}
                                        onChange={() =>
                                            toggleFilter(selectedExperience, setSelectedExperience, exp)
                                        }
                                        className="sr-only"
                                    />
                                    <div className={`size-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedExperience.includes(exp) ? 'bg-primary border-primary' : 'border-slate-200 dark:border-slate-700'}`}>
                                        {selectedExperience.includes(exp) && <Check size={14} className="text-white" />}
                                    </div>
                                </div>
                            </label>
                        )
                    )}
                </div>
            </div>

            {/* Verified Only */}
            <div className="pt-2">
                <label className="flex cursor-pointer items-center justify-between p-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl transition-transform hover:scale-[1.02] active:scale-95 group">
                    <span className="text-xs font-black uppercase tracking-[0.15em] ml-2">
                        Trusted Only
                    </span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={verifiedOnly}
                            onChange={(e) => setVerifiedOnly(e.target.checked)}
                        />
                        <div className="block w-10 h-6 bg-white/20 dark:bg-slate-900/10 rounded-full transition-colors duration-300 peer-checked:bg-emerald-500"></div>
                        <div className="absolute left-1 top-1 bg-white dark:bg-slate-900 w-4 h-4 rounded-full transition-transform duration-300 peer-checked:translate-x-4 shadow-sm"></div>
                    </div>
                </label>
            </div>

            {/* Languages */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                    Native Proficiency
                </h4>
                <div className="flex flex-wrap gap-2">
                    {["English", "Amharic", "Oromiffa", "Tigrinya"].map((lang) => (
                        <button
                            key={lang}
                            onClick={() => toggleFilter(selectedLanguages, setSelectedLanguages, lang)}
                            className={`px-5 py-2.5 text-xs font-black rounded-2xl transition-all duration-300 border-2 uppercase tracking-tighter ${
                                selectedLanguages.includes(lang) 
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                                : 'bg-transparent border-slate-100 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
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

