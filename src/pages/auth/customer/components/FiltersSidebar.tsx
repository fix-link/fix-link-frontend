import React from "react";

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
        <div className="bg-white dark:bg-background-dark p-6 rounded-lg shadow-card max-h-[calc(100vh-8rem)] overflow-y-auto border border-border-color dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-text-primary dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                    Filters
                </h3>
                <button
                    onClick={onClearAll}
                    className="text-sm font-medium text-primary hover:underline"
                >
                    Clear All
                </button>
            </div>

            {/* Price Range */}
            <div className="border-t border-border-color dark:border-white/10 pt-6">
                <h4 className="text-text-primary dark:text-white text-base font-bold leading-tight mb-4">
                    Price Range (ETB)
                </h4>

                <div className="space-y-4">
                    <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 mt-2">
                        <div
                            className="absolute h-full bg-primary rounded-full"
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
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                            style={{ zIndex: priceMin > 5000 ? 10 : 1 }}
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
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={priceMin}
                            onChange={(e) => setPriceMin(Number(e.target.value))}
                            className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-white"
                            placeholder="Min"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="number"
                            value={priceMax}
                            onChange={(e) => setPriceMax(Number(e.target.value))}
                            className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-white"
                            placeholder="Max"
                        />
                    </div>
                </div>
            </div>

            {/* Rating */}
            <div className="border-t border-border-color dark:border-white/10 pt-6 mt-6">
                <h4 className="text-text-primary dark:text-white text-base font-bold leading-tight mb-4">
                    Rating
                </h4>
                <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            name="rating-filter"
                            type="radio"
                            checked={selectedRating === 4}
                            onChange={() => setSelectedRating(4)}
                            className="h-5 w-5 border-2 border-border-color dark:border-white/30 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <div className="flex items-center gap-1">
                            <span className="text-text-primary dark:text-white text-sm font-medium leading-normal">
                                4★ and up
                            </span>
                        </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            name="rating-filter"
                            type="radio"
                            checked={selectedRating === 3}
                            onChange={() => setSelectedRating(3)}
                            className="h-5 w-5 border-2 border-border-color dark:border-white/30 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <div className="flex items-center gap-1">
                            <span className="text-text-primary dark:text-white text-sm font-medium leading-normal">
                                3★ and up
                            </span>
                        </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            name="rating-filter"
                            type="radio"
                            checked={selectedRating === 0}
                            onChange={() => setSelectedRating(0)}
                            className="h-5 w-5 border-2 border-border-color dark:border-white/30 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <div className="flex items-center gap-1">
                            <span className="text-text-primary dark:text-white text-sm font-medium leading-normal">
                                Any
                            </span>
                        </div>
                    </label>
                </div>
            </div>

            {/* Experience */}
            <div className="border-t border-border-color dark:border-white/10 pt-6 mt-6">
                <h4 className="text-text-primary dark:text-white text-base font-bold leading-tight mb-4">
                    Experience Level
                </h4>
                <div className="flex flex-col gap-3">
                    {["Junior (1-2 yrs)", "Mid-level (3-5 yrs)", "Senior (5+ yrs)"].map(
                        (exp) => (
                            <label key={exp} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedExperience.includes(exp)}
                                    onChange={() =>
                                        toggleFilter(selectedExperience, setSelectedExperience, exp)
                                    }
                                    className="h-5 w-5 rounded border-border-color dark:border-white/30 text-primary focus:ring-primary"
                                />
                                <span className="text-text-primary dark:text-white text-sm">
                                    {exp}
                                </span>
                            </label>
                        )
                    )}
                </div>
            </div>

            {/* Verified */}
            <div className="border-t border-border-color dark:border-white/10 pt-6 mt-6">
                <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-text-primary dark:text-white text-base font-bold">
                        Verified Professionals
                    </span>
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                    />
                    <div className="relative h-6 w-11 rounded-full bg-gray-200 dark:bg-white/20 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 dark:after:border-gray-600 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800"></div>
                </label>
            </div>

            {/* Availability */}
            <div className="border-t border-border-color dark:border-white/10 pt-6 mt-6">
                <h4 className="text-text-primary dark:text-white text-base font-bold leading-tight mb-4">
                    Availability
                </h4>
                <div className="flex flex-col gap-3">
                    {["Today", "This Week"].map((avail) => (
                        <label key={avail} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedAvailability.includes(avail)}
                                onChange={() =>
                                    toggleFilter(
                                        selectedAvailability,
                                        setSelectedAvailability,
                                        avail
                                    )
                                }
                                className="h-5 w-5 rounded border-border-color dark:border-white/30 text-primary focus:ring-primary"
                            />
                            <span className="text-text-primary dark:text-white text-sm">
                                {avail}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Languages */}
            <div className="border-t border-border-color dark:border-white/10 pt-6 mt-6">
                <h4 className="text-text-primary dark:text-white text-base font-bold leading-tight mb-4">
                    Language
                </h4>
                <div className="flex flex-col gap-3">
                    {["English", "Amharic", "Oromiffa", "Tigrinya"].map((lang) => (
                        <label key={lang} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedLanguages.includes(lang)}
                                onChange={() =>
                                    toggleFilter(selectedLanguages, setSelectedLanguages, lang)
                                }
                                className="h-5 w-5 rounded border-border-color dark:border-white/30 text-primary focus:ring-primary"
                            />
                            <span className="text-text-primary dark:text-white text-sm">
                                {lang}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FiltersSidebar;
