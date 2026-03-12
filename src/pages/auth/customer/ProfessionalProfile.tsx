import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import CustomerNavbar from './components/CustomerNavbar';
import CustomerFooter from './components/CustomerFooter';
import RequestEstimateModal from './components/RequestEstimateModal';
import Sidebar from '../professional/components/Sidebar';
import Header from '../professional/components/Header';
import { useAuth } from '../../../context/AuthContext';
import LocationInput from '../../../components/LocationInput';
import { getUserDetails, updateUserProfile } from '../../../api/auth.api';

const ProfessionalProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(!window.location.pathname.startsWith('/professional'));
    const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);

    // Check if we are in professional management mode
    const isProView = window.location.pathname.startsWith('/professional');
    const [isEditing, setIsEditing] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const handleChat = () => {
        if (isProView) return;
        navigate('/customer/messages/1');
    };

    const handleEstimateRequest = () => {
        if (isProView) return;
        setIsEstimateModalOpen(true);
    };

    const togglePreview = () => {
        setIsPreviewMode(!isPreviewMode);
        setIsEditing(false);
    };


    const handleDeletePortfolio = (idx: number) => {
        setProfilePortfolio(profilePortfolio.filter((_: any, i: number) => i !== idx));
    };

    const handleAddPortfolio = () => {
        const url = prompt("Enter Image URL:");
        const title = prompt("Enter Project Title:");
        if (url && title) {
            setProfilePortfolio([...profilePortfolio, { img: url, title }]);
        }
    };

    const handleDayToggle = (day: number) => {
        if (!isEditing) return;
        if (availableDays.includes(day)) {
            setAvailableDays(availableDays.filter(d => d !== day));
        } else {
            setAvailableDays([...availableDays, day]);
        }
    };
    const [profileName, setProfileName] = useState("");
    const [profileRole, setProfileRole] = useState("");
    const [profileAbout, setProfileAbout] = useState("");
    const [profileSkills, setProfileSkills] = useState("");
    const [profileExperience, setProfileExperience] = useState("");
    const [profileLocation, setProfileLocation] = useState("");
    const [profileLanguages, setProfileLanguages] = useState<string[]>([]);
    const [profilePortfolio, setProfilePortfolio] = useState<{ img: string; title: string }[]>([]);
    const [availableDays, setAvailableDays] = useState<number[]>([1, 6]);
    const [profileRating, setProfileRating] = useState(0);
    const [profileReviewsCount, setProfileReviewsCount] = useState(0);
    const [profileServiceId, setProfileServiceId] = useState<string | undefined>(undefined);

    // Use effect to initialize or update data
    useEffect(() => {
        const fetchProfileData = async () => {
            if (isProView && user) {
                setProfileName(user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.name || "Jane Doe");
                setProfileRole(user.profession || "Certified Master Electrician");
                setProfileAbout(user.bio || "With over 12 years of experience...");
                setProfileSkills(user.skills || "Residential Wiring, Commercial Systems, Smart Home Setup");
                setProfileExperience(user.years_of_experience?.toString() || "12");
                setProfileLocation(user.city && user.subcity ? `${user.city}, ${user.subcity}` : "Addis Ababa, Bole");
                setProfileLanguages(user.languages || ["Amharic (Native)", "English (Fluent)"]);
                setProfilePortfolio(user.portfolio || [
                    { img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400", title: "Kitchen Illumination" },
                    { img: "https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&q=80&w=400", title: "Main Panel Upgrade" }
                ]);
                setIsLoading(false);
            } else if (!isProView && id) {
                try {
                    console.log(`ProfessionalProfile: Fetching data for professional ID: ${id}`);
                    const fetchedUser = await getUserDetails(id);
                    console.log("ProfessionalProfile: Fetched user data:", fetchedUser);

                    const name = fetchedUser.first_name ? `${fetchedUser.first_name} ${fetchedUser.last_name || ''}`.trim() : fetchedUser.username || "Anonymous Professional";
                    setProfileName(name);
                    setProfileRole(fetchedUser.profession_name || fetchedUser.profession || "Professional Specialist");
                    setProfileAbout(fetchedUser.bio || `With extensive experience in ${fetchedUser.profession_name || fetchedUser.profession || 'their field'}, ${name.split(' ')[0]} provides high-quality service.`);
                    setProfileSkills(fetchedUser.skills || "");
                    setProfileExperience(fetchedUser.years_of_experience?.toString() || "0");
                    
                    // Map location dynamically
                    const city = fetchedUser.city || '';
                    const area = fetchedUser.subcity || fetchedUser.neighborhood || '';
                    setProfileLocation(city && area ? `${city}, ${area}` : city || area || "Addis Ababa");
                    
                    setProfileLanguages(fetchedUser.languages || ["Amharic", "English"]);
                    setProfilePortfolio(fetchedUser.portfolio || [
                        { img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400", title: "Showcase Project 1" },
                        { img: "https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&q=80&w=400", title: "Showcase Project 2" }
                    ]);
                    
                    // Store ratings and reviews if available (fallback to 0)
                    setProfileRating(fetchedUser.average_rating || fetchedUser.rating || 0);
                    setProfileReviewsCount(fetchedUser.total_jobs_completed || fetchedUser.reviews_count || 0);
                    // Store service/profession UUID for estimate modal
                    setProfileServiceId(fetchedUser.profession || undefined);

                } catch (error) {
                    console.error("Failed to fetch professional details:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [isProView, user, id]);

    const handleSave = async () => {
        if (isProView) {
            try {
                const updated = await updateUserProfile(user!.id, {
                    bio: profileAbout,
                    profession: profileRole,
                    years_of_experience: Number(profileExperience),
                    city: profileLocation.split(',')[0].trim(),
                    subcity: profileLocation.split(',')[1]?.trim() || ''
                });
                updateUser(updated);
                setIsEditing(false);
            } catch (err) {
                console.error("Save failed:", err);
            }
        }
    };

    // Helper to format image URLs
    const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'><rect width='150' height='150' fill='%23e2e8f0'/><circle cx='75' cy='58' r='30' fill='%2394a3b8'/><ellipse cx='75' cy='130' rx='50' ry='35' fill='%2394a3b8'/></svg>`;
    const getImageUrl = (path: string | undefined) => {
        if (!path) return defaultAvatar;
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${(import.meta.env.VITE_API_URL || 'https://fix-link-5332f899c079.herokuapp.com').replace(/\/$/, '')}${cleanPath}`;
    };

    // Simplified professional data object for UI components
    const professional = {
        name: profileName,
        role: profileRole,
        verified: true, // We assume verified if they appear on dashboard for now
        rating: profileRating,
        reviewsCount: profileReviewsCount,
        experience: `${profileExperience}+ years experience`,
        location: profileLocation,
        coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCVqLxahM8mBBENqzv_93ZaZeNL1f0E4OzaxyeOFzKw3OmNbp_zAyVx3JtjzUkCcPITJYiDapRmZtn_EutJF9SyzhnQ47oEkrtpf_jkjYABsBbV2tyj8e9WaqpeNQBOKuU9gk8fPtFDxKzEmVI1H1HYd1VtpX_XZnxZV8jzd8tGafsAt9maXvNzTDR8sbsW1KfEJQ-3aQeOKZar1jTjMwaVQsT8m4MKp1md-ihGBr36VqI7SnxPjsrNrGTqY0ua9N7_QRGDkEMx3Q",
        profileImage: getImageUrl(user?.profilePhoto || (user as any)?.profile_picture),
        about: profileAbout,
        skills: profileSkills.split(',').map((s: string) => s.trim()).filter(Boolean),
        languages: profileLanguages,
        portfolio: profilePortfolio,
        reviews: [
            { name: "Elias Tesfaye", date: "Oct 12, 2024", rating: 5, content: `${profileName.split(' ')[0]} was exceptionally professional. They finished the work ahead of schedule. Highly recommend!`, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDKa3eBgX2EeYh5Q75Q2Hbj0WjYe9IsF6t8KEV_eon4ge-xUBSkfEBHSsNHawHOdb8_fds3jx3ExL153TixBekkr3Gz2QpCq4RQ9-FSEUOcNrjf8HbC1zxP0hZNWNoyhndiVgLFPSTUw7O7Lvnru6ec_4UfiadbcECznu62_dPvFQqcAtec45a__4aGi6kJseaX_iFqEC9P2RU8uQ68dB10a1V-aUMlf9-9imF_FaN_zP4LbJDc7icuIUD_qu_ZaTI-EqxsJh-FQ" },
            { name: "Aster Bekele", date: "Sep 28, 2024", rating: 5, content: "Excellent service. Explained everything clearly before starting. Best in Addis.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuACoZiPLzz95MnWiTcKwFSDZIsMZdrgjDIRDAIOqrKhbRCGL6qFqAjxRvHPLMkhHDRLtHgIqSwAlAcabY3HJ6Tp2uLQjyed__myy7gGZM4soPbPodDahgHZhXsAx1txGP4Tjv0jV1sdrDTgHkD5r71EUwRTOEkT6lmny6hAzI9b9hHyZ-rm0aXh8W24KqJFLflvC-MXinoXnPwcOPz2JG3stMIbPBiAaSKMMcd0dN8qbqLqsmG7JxoYHmckq-0oVZEa7fj9ew0Jcg" }
        ]
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
                    <p className="font-bold text-text-secondary">Loading Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-text-primary dark:text-white">
            {isProView && <Sidebar />}

            <div className={`flex flex-col flex-1 overflow-hidden ${isProView ? 'lg:ml-64' : ''}`}>
                {!isProView ? <CustomerNavbar /> : <Header />}

                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 py-8">
                        <div className="w-full rounded-2xl shadow-soft bg-white dark:bg-card-dark mb-8 border border-border-color dark:border-slate-800">
                            <div
                                className="h-56 bg-cover bg-center rounded-t-2xl"
                                style={{ backgroundImage: `url('${professional.coverImage}')` }}
                            ></div>
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row -mt-28 items-end">
                                    <div
                                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-2xl size-40 border-4 border-white dark:border-card-dark shadow-lg"
                                        style={{ backgroundImage: `url('${professional.profileImage}')` }}
                                    ></div>
                                    <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full mt-6 md:mt-0 md:ml-8">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 group/edit">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={profileName}
                                                        onChange={(e) => setProfileName(e.target.value)}
                                                        className="text-3xl font-extrabold tracking-tight bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-xl px-3 py-1 outline-none text-text-primary dark:text-white shadow-sm"
                                                    />
                                                ) : (
                                                    <h1 className="text-3xl font-extrabold tracking-tight text-text-primary dark:text-white">{profileName}</h1>
                                                )}
                                                {professional.verified && !isEditing && (
                                                    <span className="material-symbols-outlined text-primary text-2xl" title="Verified Professional">verified</span>
                                                )}
                                                {isProView && !isEditing && !isPreviewMode && (
                                                    <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                                                        <span className="material-symbols-outlined text-sm text-primary">edit</span>
                                                    </button>
                                                )}
                                            </div>

                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={profileRole}
                                                    onChange={(e) => setProfileRole(e.target.value)}
                                                    className="text-xl font-medium bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-xl px-3 py-1 outline-none mt-3 text-text-secondary dark:text-gray-400 shadow-sm"
                                                />
                                            ) : (
                                                <p className="text-xl font-medium text-text-secondary dark:text-gray-400 mt-1">{profileRole}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-gray-400 mt-3 flex-wrap">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-full">
                                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    <span className="font-bold">{professional.rating}</span>
                                                    <span className="text-xs opacity-75">({professional.reviewsCount} reviews)</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-base">work_history</span>
                                                    {isEditing ? (
                                                        <input type="text" value={profileExperience} onChange={(e) => setProfileExperience(e.target.value)} className="w-12 bg-slate-50 dark:bg-slate-800 border-b border-primary outline-none" />
                                                    ) : (
                                                        <span>{profileExperience}+ years experience</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-1 max-w-md">
                                                    <span className="material-symbols-outlined text-base">location_on</span>
                                                    {isEditing ? (
                                                        <LocationInput
                                                            value={profileLocation}
                                                            onSelect={(loc) => setProfileLocation(loc)}
                                                            className="w-full bg-slate-50 dark:bg-slate-800 border-b border-primary outline-none px-2"
                                                        />
                                                    ) : (
                                                        <span>{profileLocation}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex w-full md:w-auto items-center gap-3 mt-6 md:mt-0">
                                            {isProView && !isEditing && (
                                                <button
                                                    onClick={togglePreview}
                                                    className={`flex h-10 items-center justify-center rounded-full px-6 text-sm font-black transition-all border-2 shadow-md ${isPreviewMode ? 'bg-primary text-white border-primary ring-4 ring-primary/20' : 'bg-white text-primary border-primary hover:bg-primary/5'}`}
                                                >
                                                    <span className="material-symbols-outlined mr-2 text-base">{isPreviewMode ? 'edit_note' : 'visibility'}</span>
                                                    <span>{isPreviewMode ? 'Back to Editor' : 'See Customer View'}</span>
                                                </button>
                                            )}
                                            {isEditing ? (
                                                <button
                                                    onClick={handleSave}
                                                    className="flex-1 md:flex-auto flex h-12 items-center justify-center rounded-xl bg-green-500 px-8 text-base font-bold text-white shadow-lg hover:bg-green-600 transition-all hover:scale-[1.02] active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined mr-2">save</span>
                                                    <span>Save Changes</span>
                                                </button>
                                            ) : (
                                                <>
                                                    {(!isProView || isPreviewMode) && (
                                                        <>
                                                            <button
                                                                onClick={handleEstimateRequest}
                                                                className={`flex-1 md:flex-auto flex h-12 items-center justify-center rounded-xl px-8 text-base font-bold text-white shadow-lg transition-all ${isProView ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95'}`}
                                                                title={isProView ? "You cannot request an estimate from yourself" : ""}
                                                            >
                                                                <span>Request Estimate</span>
                                                            </button>
                                                            <button
                                                                onClick={handleChat}
                                                                className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all ${isProView ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark text-text-secondary dark:text-gray-400 hover:text-primary hover:border-primary'}`}
                                                                title={isProView ? "You cannot message yourself" : ""}
                                                            >
                                                                <span className="material-symbols-outlined">chat_bubble</span>
                                                            </button>
                                                            <button
                                                                className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all ${isProView ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark text-text-secondary dark:text-gray-400 hover:text-pink-500 hover:border-pink-200'}`}
                                                            >
                                                                <span className="material-symbols-outlined">favorite_border</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8">
                            <aside className="w-full lg:w-72 flex-shrink-0">
                                <div className="sticky top-28 space-y-4">
                                    <nav className="p-3 rounded-2xl shadow-soft bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800">
                                        <div className="flex flex-col gap-1">
                                            <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold text-sm transition-all" href="#about">
                                                <span className="material-symbols-outlined">person</span>
                                                <span>About</span>
                                            </a>
                                            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all font-semibold text-sm" href="#portfolio">
                                                <span className="material-symbols-outlined">grid_view</span>
                                                <span>Portfolio</span>
                                            </a>

                                            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all font-semibold text-sm" href="#availability">
                                                <span className="material-symbols-outlined">calendar_today</span>
                                                <span>Availability</span>
                                            </a>
                                            {(!isProView || isPreviewMode) && (
                                                <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all font-semibold text-sm" href="#reviews">
                                                    <span className="material-symbols-outlined">star</span>
                                                    <span>Reviews</span>
                                                </a>
                                            )}
                                        </div>
                                    </nav>
                                    {(!isProView || isPreviewMode) && (
                                        <div className="p-6 rounded-2xl shadow-soft bg-primary text-white">
                                            <h4 className="font-bold mb-2">Need a custom quote?</h4>
                                            <p className="text-xs opacity-90 mb-4 leading-relaxed">Jane typically responds within 2 hours for electrical service inquiries.</p>
                                            <button className="w-full py-2.5 bg-white text-primary rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors">Contact Professional</button>
                                        </div>
                                    )}
                                </div>
                            </aside>

                            <div className="flex-1 flex flex-col gap-8">
                                <section className="p-8 rounded-2xl shadow-soft bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 scroll-mt-28" id="about">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold tracking-tight text-text-primary dark:text-white">About {profileName.split(' ')[0]}</h2>
                                        {isProView && !isEditing && !isPreviewMode && (
                                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-primary text-xs font-bold hover:underline">
                                                <span className="material-symbols-outlined text-sm">edit</span> Edit Bio
                                            </button>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <textarea
                                            value={profileAbout}
                                            onChange={(e) => setProfileAbout(e.target.value)}
                                            rows={6}
                                            className="w-full text-text-secondary dark:text-gray-400 leading-relaxed text-lg bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-xl p-4 outline-none resize-none focus:ring-2 ring-primary/20 shadow-inner"
                                        />
                                    ) : (
                                        <p className="text-text-secondary dark:text-gray-400 leading-relaxed text-lg">
                                            {profileAbout}
                                        </p>
                                    )}
                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-text-primary dark:text-white">
                                                <span className="material-symbols-outlined text-primary">bolt</span> Skills
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {isEditing ? (
                                                    <textarea
                                                        value={profileSkills}
                                                        onChange={(e) => setProfileSkills(e.target.value)}
                                                        placeholder="Add skills separated by commas..."
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-xl p-3 outline-none text-sm text-text-secondary"
                                                    />
                                                ) : (
                                                    professional.skills.map((skill: string) => (
                                                        <span key={skill} className="px-4 py-1.5 text-sm rounded-full bg-primary/5 text-primary font-semibold border border-primary/10">{skill}</span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-text-primary dark:text-white">
                                                <span className="material-symbols-outlined text-primary">translate</span> Languages
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {isEditing ? (
                                                    <textarea
                                                        value={profileLanguages.join(', ')}
                                                        onChange={(e) => setProfileLanguages(e.target.value.split(',').map(l => l.trim()))}
                                                        placeholder="English (Fluent), Amharic (Native)..."
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-xl p-3 outline-none text-sm text-text-secondary"
                                                    />
                                                ) : (
                                                    profileLanguages.map((lang: string) => (
                                                        <span key={lang} className="px-4 py-1.5 text-sm rounded-full bg-slate-100 dark:bg-slate-800 text-text-primary dark:text-white font-semibold border border-slate-200 dark:border-slate-700">{lang}</span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="p-8 rounded-2xl shadow-soft bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 scroll-mt-28" id="portfolio">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold tracking-tight text-text-primary dark:text-white">Portfolio</h2>
                                        <button className="text-primary font-bold text-sm hover:underline">View All Projects</button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        {profilePortfolio.map((item: any, index: number) => (
                                            <div key={index} className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={item.img} alt={item.title} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                    <span className="text-white text-xs font-bold">{item.title}</span>
                                                    {isEditing && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeletePortfolio(index); }}
                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isEditing && (
                                            <button
                                                onClick={handleAddPortfolio}
                                                className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-primary hover:text-primary transition-all group"
                                            >
                                                <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add_a_photo</span>
                                                <span className="text-xs font-bold">Add Project</span>
                                            </button>
                                        )}
                                    </div>
                                </section>





                                <section className="p-8 rounded-2xl shadow-soft bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 scroll-mt-28" id="availability">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold tracking-tight text-text-primary dark:text-white">Availability Calendar</h2>
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary"></div><span className="text-text-secondary dark:text-gray-400">Available</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div><span className="text-text-secondary dark:text-gray-400">Booked</span></div>
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        <div className="flex justify-between items-center mb-6 px-4">
                                            <button className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <span className="material-symbols-outlined text-xl text-text-primary dark:text-white">chevron_left</span>
                                            </button>
                                            <h3 className="font-extrabold text-xl text-text-primary dark:text-white">November 2024</h3>
                                            <button className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <span className="material-symbols-outlined text-xl text-text-primary dark:text-white">chevron_right</span>
                                            </button>
                                        </div>
                                        {/* Calendar Grid - Simplified Version of HTML */}
                                        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                                <div key={day} className="bg-slate-50 dark:bg-slate-900 py-4 text-center text-xs font-black text-text-secondary dark:text-gray-400">{day}</div>
                                            ))}

                                            {/* Empty Previous Month Days */}
                                            {[27, 28, 29, 30, 31].map(d => (
                                                <div key={d} className="bg-white dark:bg-slate-800 h-28 p-2 opacity-30 text-xs text-text-secondary dark:text-gray-500">{d}</div>
                                            ))}

                                            {/* Month Days */}
                                            {[...Array(30)].map((_, i: number) => {
                                                const day = i + 1;
                                                const isBooked = day === 4;
                                                const isToday = day === 6;
                                                const isSelected = availableDays.includes(day);

                                                let bgClass = "bg-white dark:bg-slate-800 hover:bg-primary/5 cursor-pointer";
                                                let textClass = "text-text-primary dark:text-white";

                                                if (isBooked) {
                                                    bgClass = "bg-red-50/50 dark:bg-red-900/10 cursor-not-allowed";
                                                    textClass = "text-red-500";
                                                } else if (isToday) {
                                                    bgClass = "bg-primary/10 dark:bg-primary/20 border-2 border-primary";
                                                    textClass = "text-primary";
                                                } else if (isSelected) {
                                                    bgClass = "bg-green-50/50 dark:bg-green-900/10 border-2 border-green-500";
                                                    textClass = "text-green-600";
                                                }

                                                return (
                                                    <div
                                                        key={day}
                                                        onClick={() => !isBooked && handleDayToggle(day)}
                                                        className={`${bgClass} h-28 p-2 transition-colors group relative`}
                                                    >
                                                        <span className={`text-sm font-bold ${textClass}`}>{day}</span>
                                                        {isSelected && !isBooked && <div className="mt-2 text-[10px] text-green-600 font-bold">• Available</div>}
                                                        {isBooked && <div className="mt-2 text-[10px] text-red-400 font-bold">• Fully Booked</div>}
                                                        {isToday && <div className="mt-2 text-[10px] text-primary font-bold">Today</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>

                                {(!isProView || isPreviewMode) && (
                                    <section className="p-8 rounded-2xl shadow-soft bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 scroll-mt-28" id="reviews">
                                        <div className="flex justify-between items-center mb-8">
                                            <h2 className="text-2xl font-bold tracking-tight text-text-primary dark:text-white">Client Feedback</h2>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-lg">
                                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                <span className="font-bold">{professional.rating}</span>
                                                <span className="text-xs opacity-75">/ 5.0</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-6">
                                            {professional.reviews.map((review, idx) => (
                                                <div key={idx} className="pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                                                    <div className="flex items-start gap-4">
                                                        <img className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-200" src={review.image} alt={review.name} />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-bold text-text-primary dark:text-white">{review.name}</h4>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <div className="flex text-yellow-400 text-xs">
                                                                            {[...Array(5)].map((_, i: number) => (
                                                                                <span key={i} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "" }}>star</span>
                                                                            ))}
                                                                        </div>
                                                                        <span className="text-xs text-text-secondary dark:text-gray-500 font-medium">• {review.date}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="mt-3 text-text-secondary dark:text-gray-400 leading-relaxed italic">"{review.content}"</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="w-full mt-8 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-sm font-bold text-text-secondary dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Show More Reviews</button>
                                    </section>
                                )}
                            </div>
                        </div>
                        {!isProView && <CustomerFooter />}
                    </div>
                </main>

            </div>

            <RequestEstimateModal
                isOpen={isEstimateModalOpen}
                onClose={() => setIsEstimateModalOpen(false)}
                professionalName={professional.name}
                serviceId={profileServiceId}
                professionalId={id}
            />
        </div>
    );
};

export default ProfessionalProfile;
