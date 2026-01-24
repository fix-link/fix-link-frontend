import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import ProfessionalCard from "./components/ProfessionalCard";

const SearchResults = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Filter State
    const [priceMin, setPriceMin] = useState<number>(2500);
    const [priceMax, setPriceMax] = useState<number>(10000);
    const [selectedRating, setSelectedRating] = useState<number>(0);
    const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
    const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

    // New Filters
    const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    // Mock Data for Professionals with extended fields
    const professionals = [
        {
            id: 1,
            name: "Alem Tadesse",
            role: "Plumber",
            rating: 4.9,
            quote: "Fast, reliable, and affordable plumbing solutions for your home.",
            price: 350,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlBd9E1G_iPXhVaUxUuidOCftDDUxHN5qWBaync__SWk7v86IBDaTdr6auZG42AJmEnUHUqOewxtFaZsSnwz6Vsx94afWJ8d6mERKfTvzxPNHKeWyvE5Dv31p1cD2-tDCKR7c-5lzK1oIxmaPde31dSd7dex7LtjoQarwSklKPoi3OntQ430EQMcMwue_6c7VKrW-HXF0eKXJ0IOapZvd9uKtjNUCFaXDs2OSi1DlHOLXifpqrO7Lk_-_kemAnsDiCDaejYPKNjg",
            verified: true,
            experience: "Senior",
            availability: "Today",
            languages: ["English", "Amharic"]
        },
        {
            id: 2,
            name: "Hanna Bekele",
            role: "Plumber",
            rating: 4.8,
            quote: "Your satisfaction is my priority. Quality work guaranteed.",
            price: 2600,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBa9iHjZpzWLPC8u-A7S2RSavE0HQBdYeA3wH7UYLVajk3rItsphm-DXE2re9U5SrCu8oUXnPJWS6rEwxexM1QqSL3ofVpA7QaSpImmcO5_fEgwqVVDt66CdiCTNP__Xg4rANfp-iX7BDRydHAGxl91O2geZSyTMNqa4HPaEZuw9heeEmEdb2Lmv4vjpHuA4vhz9XCm_iKExNc7F89ebCUl218n6lNKia9IboPKFVzpY2imVemz7HUzyKrZEGs7Vb6aPHsX-yXPUw",
            verified: true,
            experience: "Mid-level",
            availability: "This Week",
            languages: ["Amharic"]
        },
        {
            id: 3,
            name: "Yonas Gebru",
            role: "Plumber",
            rating: 4.7,
            quote: "Expert in residential and commercial plumbing repairs.",
            price: 3000,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMIMxpBKQ0-FNnKsA0P73VqmoE8zC-MJX6dTlQcLS2wesZ_BEjXM0sSDTum3K1A8rkm8bW3jXXgomo6XB0j62LG0YwbAHV2ylF3YV2tMLmarowJfzIyCJKTfxy-L1DpbX96OaCA7z4nLeT2lFNBWkdzmaOytnaMCDVDvIoEfDBfRqKcHtJhb9iNEWnHHpDzyJIvwP6RGyDga1T2xuwWPprB2tIIjcubNSLTdWEEskJpi0Y1-jyF8vqeCknGKip8yEtMhKLfvxKwQ",
            verified: false,
            experience: "Junior",
            availability: "Today",
            languages: ["English", "Amharic", "Oromiffa"]
        },
        {
            id: 4,
            name: "Sofia Assefa",
            role: "Plumber",
            rating: 5.0,
            quote: "Emergency services available 24/7. Your trusted expert.",
            price: 500,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2gz4gk-NChYKVBFkr0CYBK3mkRD5TB769MjJqCNj8jdTnDATiYS3uXdrHReW9O1EGqwNhy4kSfID1yCIojfOCvtynG1krVP_QQHEsOMWMWX1T1uAvBZ-md9hrTx617QSPNIXgj1mOnkru17svM4A_pt8ppnV0p2wMUs_gm_KZYfEsicteqhkvp_j2eLh8Kih3dJmmGBcF7IrLWNUe51KrgBARF6xh0jQybqBVL8G2gLWyOimRzmyqGsEs2UDWSUPAFUzORitNNg",
            verified: true,
            experience: "Senior",
            availability: "Today",
            languages: ["English"]
        },
        {
            id: 5,
            name: "Daniel Lemma",
            role: "Plumber",
            rating: 4.9,
            quote: "10+ years of experience in fixing complex pipe issues.",
            price: 450,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCYjFhA0fA2HdjJiTmJe9A5bEnx8p_WEXh9xGU0Sp-gPiexSdvnfui4Pjuzt-D802BQVrX-8koZNCMgXMi3xmz24lDW33EMEHVnO3R72hofd90shho7lX5J6VPzVDOMYCyj7Cd9sbgL1N1CzarcRjex8aDp1g86CUJX-3IpTi5I9o29gL2DXo9B84_KORzWkcGEBSUH4arhsoEaH_maZ9-wysOOytFbIBVJf21iv6gtf--SFX2yluxpVviDSo_qlsoZM237RTgQg",
            verified: false,
            experience: "Senior",
            availability: "This Week",
            languages: ["Amharic", "Tigrinya"]
        },
        {
            id: 6,
            name: "Sara Mekonnen",
            role: "Plumber",
            rating: 4.8,
            quote: "Clean, efficient work for modern homes and businesses.",
            price: 3800,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKhN0TyumIKZj7RYPgHFZ890eiZQDdkctTrs4kVPprPwq7v65YvqmboKGT5yrB6d_HqKwi8OJayJvy3faoHHgipM36bRop7GCr296KtmZpkMKAXElF6gdq8JWAmdPdbsh9cat2iQ0CfxCsa11f5Q73MgDBF_Bp3oxkExbOic5lqs-mgitrq48z8y40wN_pZRSlvxUMnx8Quj_cAKJd6HqORGW6zFFrnM796GleQpbEpmT0UJE85G1OOVgPhW4QaVvZmWcqh4-qSw",
            verified: true,
            experience: "Mid-level",
            availability: "Today",
            languages: ["English", "Amharic"]
        }
    ];

    // Filter Logic
    const filteredProfessionals = professionals.filter(pro => {
        const matchesPrice = pro.price >= priceMin && pro.price <= priceMax;
        const matchesRating = pro.rating >= selectedRating;
        const matchesVerified = verifiedOnly ? pro.verified : true;

        const matchesExperience = selectedExperience.length === 0 || selectedExperience.some(exp =>
            (exp === "Junior (1-2 yrs)" && pro.experience === "Junior") ||
            (exp === "Mid-level (3-5 yrs)" && pro.experience === "Mid-level") ||
            (exp === "Senior (5+ yrs)" && pro.experience === "Senior")
        );

        const matchesAvailability = selectedAvailability.length === 0 || selectedAvailability.includes(pro.availability);

        const matchesLanguage = selectedLanguages.length === 0 || pro.languages.some(lang => selectedLanguages.includes(lang));

        return matchesPrice && matchesRating && matchesVerified && matchesExperience && matchesAvailability && matchesLanguage;
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

    const toggleFilter = (state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        if (state.includes(value)) {
            setState(state.filter(item => item !== value));
        } else {
            setState([...state, value]);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-color px-4 sm:px-6 lg:px-10 py-3 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm">
                <div className="flex items-center gap-4 text-text-primary dark:text-white">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-transparent text-text-primary transition-colors hover:bg-gray-200/50 dark:text-white dark:hover:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 500" }}>arrow_back</span>
                    </button>
                    <Link to="/" className="flex items-center gap-3">
                        <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_6_319)">
                                <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z"></path>
                            </g>
                            <defs>
                                <clipPath id="clip0_6_319">
                                    <rect fill="white" height="48" width="48"></rect>
                                </clipPath>
                            </defs>
                        </svg>
                        <h1 className="text-text-primary dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em]">Fix-Link</h1>
                    </Link>
                </div>
                <div className="flex flex-1 justify-end gap-2 sm:gap-4 items-center">
                    <Link to="/customer/home" className="hidden sm:flex items-center gap-2 text-text-primary dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-semibold px-3 py-2 rounded-lg">
                        <span className="material-symbols-outlined text-xl">grid_view</span>
                        <span>Dashboard</span>
                    </Link>
                    <a href="#" className="hidden sm:flex items-center gap-2 text-text-primary dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-semibold px-3 py-2 rounded-lg">
                        <span className="material-symbols-outlined text-xl">calendar_month</span>
                        <span>Bookings</span>
                    </a>
                    <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-transparent text-text-primary dark:text-white hover:bg-background-light dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                    </button>
                    <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-transparent text-text-primary dark:text-white hover:bg-background-light dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-2xl">notifications</span>
                    </button>
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-border-color"
                        style={{ backgroundImage: `url("${user?.profilePhoto || "https://randomuser.me/api/portraits/men/1.jpg"}")` }}
                    ></div>
                </div>
            </header>

            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-wrap justify-between gap-4 mb-8">
                    <p className="text-text-primary dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
                        Professionals for 'Plumbing' in 'Addis Ababa'
                    </p>
                    <p className="text-text-secondary dark:text-gray-400 self-end mb-1">
                        Showing {filteredProfessionals.length} Result{filteredProfessionals.length !== 1 && 's'}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* FILTERS SIDEBAR */}
                    <aside className="w-full lg:w-1/4 xl:w-1/5">
                        <div className="sticky top-28 bg-white dark:bg-background-dark p-6 rounded-lg shadow-card max-h-[calc(100vh-8rem)] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-text-primary dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Filters</h3>
                                <button onClick={handleClearAll} className="text-sm font-medium text-primary hover:underline">Clear All</button>
                            </div>

                            {/* Price Range */}
                            <div className="border-t border-border-color dark:border-white/10 pt-6">
                                <h4 className="text-text-primary dark:text-white text-base font-bold leading-tight mb-4">Price Range (ETB)</h4>

                                <div className="space-y-4">
                                    <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 mt-2">
                                        <div
                                            className="absolute h-full bg-primary rounded-full"
                                            style={{
                                                left: `${(priceMin / 10000) * 100}%`,
                                                right: `${100 - (priceMax / 10000) * 100}%`
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
                                            className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm py-2 px-3"
                                            placeholder="Min"
                                        />
                                        <span className="text-gray-400">-</span>
                                        <input
                                            type="number"
                                            value={priceMax}
                                            onChange={(e) => setPriceMax(Number(e.target.value))}
                                            className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm py-2 px-3"
                                            placeholder="Max"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="border-t border-border-color dark:border-white/10 pt-6 mt-6">
                                <h4 className="text-text-primary dark:text-white text-base font-bold leading-tight mb-4">Rating</h4>
                                <div className="flex flex-col gap-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            name="rating-filter"
                                            type="radio"
                                            checked={selectedRating === 4}
                                            onChange={() => setSelectedRating(4)}
                                            className="h-5 w-5 border-2 border-border-color dark:border-white/30 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                                        />
                                        <div className="flex items-center gap-1"><span className="text-text-primary dark:text-white text-sm font-medium leading-normal">4★ and up</span></div>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            name="rating-filter"
                                            type="radio"
                                            checked={selectedRating === 3}
                                            onChange={() => setSelectedRating(3)}
                                            className="h-5 w-5 border-2 border-border-color dark:border-white/30 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                                        />
                                        <div className="flex items-center gap-1"><span className="text-text-primary dark:text-white text-sm font-medium leading-normal">3★ and up</span></div>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            name="rating-filter"
                                            type="radio"
                                            checked={selectedRating === 0}
                                            onChange={() => setSelectedRating(0)}
                                            className="h-5 w-5 border-2 border-border-color dark:border-white/30 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                                        />
                                        <div className="flex items-center gap-1"><span className="text-text-primary dark:text-white text-sm font-medium leading-normal">Any</span></div>
                                    </label>
                                </div>
                            </div>

                            {/* Experience */}
                            <div className="border-t border-border-color dark:border-white/10 pt-6 mt-6">
                                <h4 className="text-text-primary dark:text-white text-base font-bold leading-tight mb-4">Experience Level</h4>
                                <div className="flex flex-col gap-3">
                                    {["Junior (1-2 yrs)", "Mid-level (3-5 yrs)", "Senior (5+ yrs)"].map((exp) => (
                                        <label key={exp} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedExperience.includes(exp)}
                                                onChange={() => toggleFilter(selectedExperience, setSelectedExperience, exp)}
                                                className="h-5 w-5 rounded border-border-color dark:border-white/30 text-primary focus:ring-primary"
                                            />
                                            <span className="text-text-primary dark:text-white text-sm">{exp}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Verified */}
                            <div className="border-t border-border-color dark:border-white/10 pt-6 mt-6">
                                <label className="flex cursor-pointer items-center justify-between">
                                    <span className="text-text-primary dark:text-white text-base font-bold">Verified Professionals</span>
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
                                <h4 className="text-text-primary dark:text-white text-base font-bold leading-tight mb-4">Availability</h4>
                                <div className="flex flex-col gap-3">
                                    {["Today", "This Week"].map((avail) => (
                                        <label key={avail} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedAvailability.includes(avail)}
                                                onChange={() => toggleFilter(selectedAvailability, setSelectedAvailability, avail)}
                                                className="h-5 w-5 rounded border-border-color dark:border-white/30 text-primary focus:ring-primary"
                                            />
                                            <span className="text-text-primary dark:text-white text-sm">{avail}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Languages */}
                            <div className="border-t border-border-color dark:border-white/10 pt-6 mt-6">
                                <h4 className="text-text-primary dark:text-white text-base font-bold leading-tight mb-4">Language</h4>
                                <div className="flex flex-col gap-3">
                                    {["English", "Amharic", "Oromiffa", "Tigrinya"].map((lang) => (
                                        <label key={lang} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedLanguages.includes(lang)}
                                                onChange={() => toggleFilter(selectedLanguages, setSelectedLanguages, lang)}
                                                className="h-5 w-5 rounded border-border-color dark:border-white/30 text-primary focus:ring-primary"
                                            />
                                            <span className="text-text-primary dark:text-white text-sm">{lang}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </aside>

                    {/* RESULTS LIST */}
                    <div className="w-full lg:w-3/4 xl:w-4/5">
                        {filteredProfessionals.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

                        {/* Pagination (Mock) */}
                        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary dark:text-gray-400 bg-white dark:bg-background-dark shadow-card hover:bg-background-light dark:hover:bg-white/10">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-white bg-primary shadow-card">1</button>
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary dark:text-gray-400 bg-white dark:bg-background-dark shadow-card hover:bg-background-light dark:hover:bg-white/10">2</button>
                            {/* ... more pages ... */}
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary dark:text-gray-400 bg-white dark:bg-background-dark shadow-card hover:bg-background-light dark:hover:bg-white/10">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </nav>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SearchResults;
