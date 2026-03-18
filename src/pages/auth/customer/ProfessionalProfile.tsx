import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import CustomerNavbar from './components/CustomerNavbar';
import CustomerFooter from './components/CustomerFooter';
import RequestEstimateModal from './components/RequestEstimateModal';
import Sidebar from '../professional/components/Sidebar';
import Header from '../professional/components/Header';
import { useAuth } from '../../../context/AuthContext';
import LocationInput from '../../../components/LocationInput';
import { getUserDetails, updateUserProfile, getImageUrl } from '../../../api/auth.api';
import { getServiceCategories, listJobs } from '../../../api/jobs.api';

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

    const [activeJobId, setActiveJobId] = useState<string | null>(null);

    const handleChat = () => {
        if (activeJobId) {
            navigate(`/customer/messages?id=${activeJobId}`);
        } else {
            navigate('/customer/messages');
        }
    };

    const handleEstimateRequest = () => {
        console.log('Opening estimate modal, isEstimateModalOpen will be true');
        setIsEstimateModalOpen(true);
    };

    const togglePreview = () => {
        setIsPreviewMode(!isPreviewMode);
        setIsEditing(false);
    };


    const handleDayToggle = (day: number, dateString?: string) => {
        if (!isEditing) return;
        
        if (dateString) {
            // Toggle specific date block
            if (blockedDates.includes(dateString)) {
                setBlockedDates(blockedDates.filter(d => d !== dateString));
            } else {
                setBlockedDates([...blockedDates, dateString]);
            }
        } else {
            // Toggle weekly availability
            if (availableDays.includes(day)) {
                setAvailableDays(availableDays.filter(d => d !== day));
            } else {
                setAvailableDays([...availableDays, day]);
            }
        }
    };
    const [profileName, setProfileName] = useState("");
    const [profileRole, setProfileRole] = useState("");
    const [profileAbout, setProfileAbout] = useState("");
    const [profileSkills, setProfileSkills] = useState("");
    const [profileExperience, setProfileExperience] = useState("");
    const [profileLocation, setProfileLocation] = useState("");
    const [profileLanguages, setProfileLanguages] = useState<string[]>([]);
    const [profilePortfolio, setProfilePortfolio] = useState<any[]>([]);
    const [estimateRequested, setEstimateRequested] = useState(false);
    const [availableDays, setAvailableDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Default: All days available
    const [profileRating, setProfileRating] = useState(0);
    const [profileReviewsCount, setProfileReviewsCount] = useState(0);
    const [profileServiceId, setProfileServiceId] = useState<string | undefined>(undefined);
    const [isProfessional, setIsProfessional] = useState(true);
    const [profilePhone, setProfilePhone] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [hasAcceptedJob, setHasAcceptedJob] = useState(false);
    
    // Advanced Calendar States
    const [jobDates, setJobDates] = useState<string[]>([]); // Dates with confirmed bookings
    const [blockedDates, setBlockedDates] = useState<string[]>([]); // Manually blocked dates

    // Dynamic Calendar State
    const now = new Date();
    const [calendarView, setCalendarView] = useState({
        month: now.getMonth(),
        year: now.getFullYear()
    });
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Use effect to initialize or update data
    useEffect(() => {
        const fetchProfileData = async () => {
            if (isProView && user) {
                setIsLoading(true);
                try {
                    // FORCE FRESH FETCH for logged-in professional
                    const freshUser = await getUserDetails(user.id);
                    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                    
                    const rawName = freshUser.first_name ? `${freshUser.first_name} ${freshUser.last_name || ''}`.trim() : (isUUID(freshUser.name || "") ? "" : freshUser.name || "");
                    setProfileName(rawName); 

                    // Resolve profession name from UUID or Categories if needed
                    let resolvedRole = freshUser.profession_name || "";
                    const isGeneric = (str: string) => !str || isUUID(str) || str === "Professional Specialist" || str === "Member";

                    if (isGeneric(resolvedRole)) {
                        const candidate = freshUser.profession;
                        const sc = freshUser.service_categories;
                        const primaryId = (sc && Array.isArray(sc) && sc.length > 0) ? sc[0] : candidate;

                        if (primaryId && !isUUID(primaryId)) {
                            resolvedRole = primaryId;
                        } else if (primaryId && isUUID(primaryId)) {
                            try {
                                const categories = await getServiceCategories();
                                const catList = Array.isArray(categories) ? categories : (categories?.results || []);
                                const matched = catList.find((c: any) => c.id === primaryId);
                                if (matched) resolvedRole = matched.name;
                            } catch (e) {
                                console.error("Failed to resolve profession name:", e);
                            }
                        }
                    }
                    
                    setProfileRole(resolvedRole || "Professional Specialist");
                    setProfileAbout(freshUser.bio || "");
                    setProfileSkills(freshUser.skills || "");
                    setProfileExperience(freshUser.years_of_experience?.toString() || "0");
                    const city = freshUser.city || "";
                    const subcity = freshUser.subcity || "";
                    setProfileLocation(city && subcity ? `${city}, ${subcity}` : (city || subcity || "Addis Ababa"));
                    setProfileLanguages(freshUser.languages || ["Amharic", "English"]);
                    setProfilePortfolio(freshUser.portfolio || []);
                    setProfilePhone(freshUser.phonenumber || freshUser.phone || "");
                    setProfileImage(getImageUrl(freshUser.profile_picture || freshUser.profilePhoto));
                } catch (err) {
                    console.error("Failed to fetch fresh pro profile:", err);
                } finally {
                    setIsLoading(false);
                }
            } else if (!isProView && id) {
                try {
                    console.log(`ProfessionalProfile: Fetching data for professional ID: ${id}`);
                    const fetchedUser = await getUserDetails(id);
                    console.log("ProfessionalProfile: Fetched user data:", fetchedUser);

                    // REDIRECT: If this is the logged-in user and they are at the customer profile link, 
                    // go to account settings instead of showing a fake pro-profile of themselves.
                    if (fetchedUser.id === user?.id && !isProView) {
                        navigate('/account-settings');
                        return;
                    }

                    // SECURITY: If the fetched user is not a professional, we shouldn't show a professional profile layout.
                    if (fetchedUser.role !== 'professional' && !fetchedUser.is_professional) {
                        setProfileName(fetchedUser.first_name ? `${fetchedUser.first_name} ${fetchedUser.last_name || ''}`.trim() : fetchedUser.username || "User");
                        setIsProfessional(false);
                        setIsLoading(false);
                        return;
                    }

                    setIsProfessional(true);
                    const name = fetchedUser.first_name ? `${fetchedUser.first_name} ${fetchedUser.last_name || ''}`.trim() : fetchedUser.username || "Anonymous Professional";
                    setProfileName(name);
                    setProfileRole(fetchedUser.profession_name || fetchedUser.profession || "Professional Specialist");
                    setProfileAbout(fetchedUser.bio || `With extensive experience in ${fetchedUser.profession_name || fetchedUser.profession || 'their field'}, ${name.split(' ')[0]} provides high-quality service.`);
                    
                    // FALLBACK: If name looks like a UUID (length 36, contains dashes), use a friendly fallback
                    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                    if (isUUID(name)) {
                        setProfileName("Professional Specialist");
                    }

                    setProfileSkills(fetchedUser.skills || "");
                    setProfileExperience(fetchedUser.years_of_experience?.toString() || "0");
                    
                    // Map location dynamically
                    const city = fetchedUser.city || '';
                    const area = fetchedUser.subcity || fetchedUser.neighborhood || '';
                    setProfileLocation(city && area ? `${city}, ${area}` : city || area || "Addis Ababa");
                    
                    setProfilePhone(fetchedUser.phonenumber || fetchedUser.phone || "");
                    setProfileImage(getImageUrl(fetchedUser.profile_picture || (fetchedUser as any).profilePhoto));
                    
                    setProfileLanguages(fetchedUser.languages || ["Amharic", "English"]);
                    setProfilePortfolio(fetchedUser.portfolio || [
                        { img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400", title: "Showcase Project 1" },
                        { img: "https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&q=80&w=400", title: "Showcase Project 2" }
                    ]);
                    
                    // Store ratings and reviews if available (fallback to 0)
                    setProfileRating(fetchedUser.average_rating || fetchedUser.rating || 0);
                    setProfileReviewsCount(fetchedUser.total_jobs_completed || fetchedUser.reviews_count || 0);
                    // Fetch service categories to find the correct UUID for the createJob API
                    // The profession field is a profession UUID, NOT a service category UUID
                    try {
                        const categories = await getServiceCategories();
                        const catList = Array.isArray(categories) ? categories : (categories?.results || []);
                        const profName = (fetchedUser.profession_name || '').toLowerCase().trim();
                        const matched = catList.find((cat: any) =>
                            cat.name?.toLowerCase().trim() === profName
                        );
                        console.log("ProfessionalProfile: profession_name:", fetchedUser.profession_name, "| matched service category:", matched);
                        setProfileServiceId(matched?.id || undefined);
                    } catch (catErr) {
                        console.warn("ProfessionalProfile: Could not fetch service categories, estimate may fail:", catErr);
                        setProfileServiceId(undefined);
                    }

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

    // Check if there is an accepted job between this customer and this professional
    // AND fetch all jobs for this professional to populate the calendar
    useEffect(() => {
        const fetchJobsData = async () => {
            const targetId = isProView ? user?.id : id;
            if (!targetId) return;

            try {
                const allJobs = await listJobs();
                const acceptedStatuses = ['accepted', 'assigned', 'done', 'completed'];
                
                // 1. Check relationship with current user (if customer)
                if (!isProView && user) {
                    const jobBetweenUs = allJobs.find((j: any) => 
                        j.customer === user.id && 
                        j.professional === targetId && 
                        acceptedStatuses.includes(j.status)
                    );
                    setHasAcceptedJob(!!jobBetweenUs);
                    if (jobBetweenUs) {
                        setActiveJobId(jobBetweenUs.id);
                    }

                    // CHECK FOR EXISTING ESTIMATE REQUEST
                    const pendingRequest = allJobs.find((j: any) => 
                        j.customer === user.id && 
                        j.professional === targetId && 
                        !acceptedStatuses.includes(j.status)
                    );
                    if (pendingRequest) setEstimateRequested(true);
                }

                // 2. Extract all "Booked" dates for this professional
                const proJobs = allJobs.filter((j: any) => 
                    j.professional === targetId && 
                    acceptedStatuses.includes(j.status) &&
                    j.scheduled_at
                );
                
                const bookedDates = proJobs.map((j: any) => {
                    try {
                        return new Date(j.scheduled_at).toISOString().split('T')[0];
                    } catch {
                        return null;
                    }
                }).filter(Boolean) as string[];
                
                setJobDates(bookedDates);
            } catch (err) {
                console.error("ProfessionalProfile: Error fetching jobs for calendar:", err);
            }
        };
        fetchJobsData();
    }, [id, user, isProView]);

    const handleSave = async () => {
        if (isProView) {
            try {
                // Determine first/last name from profileName if it's not a UUID
                const nameParts = profileName.trim().split(' ');
                const fName = nameParts[0] || '';
                const lName = nameParts.slice(1).join(' ') || '';

                const updated = await updateUserProfile(user!.id, {
                    first_name: fName,
                    last_name: lName,
                    bio: profileAbout,
                    profession: profileRole,
                    years_of_experience: Number(profileExperience),
                    city: profileLocation.split(',')[0].trim(),
                    subcity: profileLocation.split(',')[1]?.trim() || '',
                    skills: profileSkills,
                    phonenumber: profilePhone,
                    languages: profileLanguages
                } as any);
                
                updateUser(updated);
                setIsEditing(false);
                alert("Profile updated successfully!");
            } catch (err) {
                console.error("Save failed:", err);
                alert("Failed to save changes. Please try again.");
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            const formData = new FormData();
            formData.append(type === 'profile' ? 'profile_picture' : 'cover_image', file);
            
            const updated = await updateUserProfile(user.id, formData);
            updateUser(updated);
            
            if (type === 'profile') {
                setProfileImage(getImageUrl(updated.profile_picture || updated.profilePhoto));
            } else {
                // For cover image, we might need a separate state or just rely on re-rendering if it's in the professional object
                alert("Cover photo updated!");
            }
        } catch (err) {
            console.error("Image upload failed:", err);
            alert("Failed to upload image.");
        }
    };

    // Helper to format image URLs
    const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'><rect width='150' height='150' fill='%23e2e8f0'/><circle cx='75' cy='58' r='30' fill='%2394a3b8'/><ellipse cx='75' cy='130' rx='50' ry='35' fill='%2394a3b8'/></svg>`;

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
        profileImage: profileImage || defaultAvatar,
        phone: profilePhone,
        about: profileAbout,
        skills: profileSkills.split(',').map((s: string) => s.trim()).filter(Boolean),
        languages: profileLanguages,
        portfolio: profilePortfolio,
        reviews: [
            { name: "Elias Tesfaye", date: "Oct 12, 2024", rating: 5, content: `${profileName.split(' ')[0]} was exceptionally professional. They finished the work ahead of schedule. Highly recommend!`, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDKa3eBgX2EeYh5Q75Q2Hbj0WjYe9IsF6t8KEV_eon4ge-xUBSkfEBHSsNHawHOdb8_fds3jx3ExL153TixBekkr3Gz2QpCq4RQ9-FSEUOcNrjf8HbC1zxP0hZNWNoyhndiVgLFPSTUw7O7Lvnru6ec_4UfiadbcECznu62_dPvFQqcAtec45a__4aGi6kJseaX_iFqECznu62_dPvFQqcAtec45a__4aGi6kJseaX_iFqEC9P2RU8uQ68dB10a1V-aUMlf9-9imF_FaN_zP4LbJDc7icuIUD_qu_ZaTI-EqxsJh-FQ" },
            { name: "Aster Bekele", date: "Sep 28, 2024", rating: 5, content: "Excellent service. Explained everything clearly before starting. Best in Addis.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuACoZiPLzz95MnWiTcKwFSDZIsMZdrgjDIRDAIOqrKhbRCGL6qFqAjxRvHPLMkhHDRLtHgIqSwAlAcabY3HJ6Tp2uLQjyed__myy7gGZM4soPbPodDahgHZhXsAx1txGP4Tjv0jV1sdrDTgHkD5r71EUwRTOEkT6lmny6hAzI9b9hHyZ-rm0aXh8W24KqJFLflvC-MXinoXnPwcOPz2JG3stMIbPBiAaSKMMcd0dN8qbqLqsmG7JxoYHmckq-0oVZEa7fj9ew0Jcg" }
        ]
    };

    if (!isProfessional) {
        return (
            <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark">
                {!isProView ? <CustomerNavbar /> : <Header />}
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-slate-400">person_off</span>
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-2">{profileName}</h2>
                    <p className="text-text-secondary dark:text-gray-400 max-w-sm">This user is not registered as a service professional. You can only request estimates from verified professionals.</p>
                    <button onClick={() => navigate(-1)} className="mt-8 px-6 py-2 bg-primary text-white rounded-lg font-bold">Go Back</button>
                </div>
            </div>
        );
    }

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
                                className="h-56 bg-cover bg-center rounded-t-2xl relative group"
                                style={{ backgroundImage: `url('${user?.cover_image ? getImageUrl(user.cover_image) : professional.coverImage}')` }}
                            >
                                {isEditing && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <label className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/20 cursor-pointer flex items-center gap-2 hover:scale-105 transition-all hover:bg-white dark:hover:bg-slate-700">
                                            <span className="material-symbols-outlined text-primary">landscape</span>
                                            <span className="text-sm font-black text-text-primary dark:text-white">Change Cover</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className="p-8 pb-12">
                                <div className="flex flex-col md:flex-row -mt-32 items-end relative z-10">
                                    <div
                                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-2xl size-40 border-4 border-white dark:border-card-dark shadow-lg relative group overflow-hidden"
                                        style={{ backgroundImage: `url('${professional.profileImage}')` }}
                                    >
                                        {isEditing && (
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <label className="cursor-pointer flex flex-col items-center">
                                                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                                                    <span className="text-[10px] text-white font-bold uppercase tracking-widest mt-1">Change</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full mt-6 md:mt-0 md:ml-8">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 group/edit">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={profileName}
                                                        onChange={(e) => {
                                                            const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                                                            if (!isUUID(e.target.value)) setProfileName(e.target.value);
                                                            else setProfileName("");
                                                        }}
                                                        placeholder="Your Professional Name"
                                                        className="text-3xl font-extrabold tracking-tight bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-xl px-3 py-1 outline-none text-text-primary dark:text-white shadow-sm w-full"
                                                    />
                                                ) : (
                                                    <h1 className="text-3xl font-extrabold tracking-tight text-text-primary dark:text-white">
                                                        {profileName || "Professional Specialist"}
                                                    </h1>
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
                                                    onChange={(e) => {
                                                        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                                                        if (!isUUID(e.target.value)) setProfileRole(e.target.value);
                                                        else setProfileRole("");
                                                    }}
                                                    placeholder="e.g. Master Electrician"
                                                    className="text-xl font-medium bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-xl px-3 py-1 outline-none mt-3 text-text-secondary dark:text-gray-400 shadow-sm w-full"
                                                />
                                            ) : (
                                                <p className="text-xl font-medium text-text-secondary dark:text-gray-400 mt-1">{profileRole || "Professional Specialist"}</p>
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
                                                                disabled={estimateRequested}
                                                                className={`flex-1 md:flex-auto flex h-12 items-center justify-center rounded-xl px-8 text-base font-bold text-white shadow-lg transition-all ${isProView || estimateRequested ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95'}`}
                                                                title={isProView ? "You cannot request an estimate from yourself" : estimateRequested ? "Estimate already requested" : ""}
                                                            >
                                                                <span>Request Estimate</span>
                                                            </button>
                                                            {hasAcceptedJob && (
                                                                <button
                                                                    onClick={handleChat}
                                                                    className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all ${isProView ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark text-text-secondary dark:text-gray-400 hover:text-primary hover:border-primary'}`}
                                                                    title={isProView ? "You cannot message yourself" : ""}
                                                                >
                                                                    <span className="material-symbols-outlined">chat_bubble</span>
                                                                </button>
                                                            )}
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
                                            <button
                                                onClick={() => setIsEstimateModalOpen(true)}
                                                disabled={estimateRequested}
                                                className={`flex-1 ${estimateRequested ? 'bg-gray-400 cursor-not-allowed' : 'bg-white text-primary hover:bg-opacity-90'} py-2.5 px-6 rounded-lg transition-all font-medium flex items-center justify-center gap-2 group/btn`}
                                            >
                                                <span className="material-symbols-outlined text-xl group-hover/btn:scale-110 transition-transform">request_quote</span>
                                                {estimateRequested ? 'Estimate Already Requested' : 'Request Free Estimate'}
                                            </button>
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
                                                <span className="material-symbols-outlined text-sm">edit</span> Edit
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
                                                <span className="material-symbols-outlined text-primary">contact_phone</span> Contact Info
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                                    <span className="material-symbols-outlined text-text-secondary">call</span>
                                                        <p className="text-xs text-text-secondary dark:text-gray-500 font-bold uppercase tracking-wider">Phone Number</p>
                                                        <p className="text-text-primary dark:text-white font-bold">{professional.phone ? professional.phone : (isProView ? "Add phone in settings" : "Not shared yet")}</p>
                                                </div>
                                                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                                    <span className="material-symbols-outlined text-text-secondary">location_on</span>
                                                    <div>
                                                        <p className="text-xs text-text-secondary dark:text-gray-500 font-bold uppercase tracking-wider">Base Location</p>
                                                        <p className="text-text-primary dark:text-white font-bold">{professional.location}</p>
                                                    </div>
                                                </div>
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

                                <section className="scroll-mt-28" id="portfolio">
                                    {/* Portfolio Showcase */}
                        <div className="bg-white dark:bg-card-dark rounded-3xl p-8 shadow-soft border border-border-color dark:border-slate-800">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">photo_library</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-text-primary dark:text-white">Portfolio & Certifications</h2>
                                </div>
                                {isProView && (
                                    <label className="cursor-pointer bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">add</span>
                                        Add Work
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            multiple
                                            accept="image/*,.pdf,.doc,.docx"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                // Simplified frontend representation for now
                                                const newItems = files.map(f => ({
                                                    title: f.name,
                                                    type: f.type.includes('image') ? 'image' : 'file',
                                                    url: URL.createObjectURL(f)
                                                }));
                                                setProfilePortfolio([...profilePortfolio, ...newItems]);
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {profilePortfolio.map((item, index) => (
                                    <div key={index} className="group relative rounded-2xl overflow-hidden border border-border-color dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                        {item.type === 'file' || item.img?.endsWith('.pdf') ? (
                                            <div className="aspect-video flex flex-col items-center justify-center p-6 text-center">
                                                <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-2xl mb-3">
                                                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-4xl">description</span>
                                                </div>
                                                <p className="text-sm font-medium text-text-primary dark:text-white line-clamp-1 px-4">{item.title}</p>
                                                <p className="text-xs text-text-secondary dark:text-gray-400 mt-1 uppercase">Document File</p>
                                            </div>
                                        ) : (
                                            <img
                                                src={item.img || item.url}
                                                alt={item.title}
                                                className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                                            <p className="text-white font-medium text-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{item.title}</p>
                                            <button className="mt-3 text-white/80 text-sm hover:text-white flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                                View Full Size <span className="material-symbols-outlined text-sm">open_in_new</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                                </section>





                                <section className="p-8 rounded-2xl shadow-soft bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 scroll-mt-28" id="availability">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold tracking-tight text-text-primary dark:text-white">Availability Calendar</h2>
                                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-tighter">
                                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></div><span className="text-text-secondary dark:text-gray-400">Available</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div><span className="text-text-secondary dark:text-gray-400">Booked</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div><span className="text-text-secondary dark:text-gray-400">Unavailable</span></div>
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        {(() => {
                                            // Calendar Logic
                                            const daysInMonth = new Date(calendarView.year, calendarView.month + 1, 0).getDate();
                                            const firstDayOfMonth = new Date(calendarView.year, calendarView.month, 1).getDay();
                                            
                                            // Previous month filler
                                            const prevMonthLastDay = new Date(calendarView.year, calendarView.month, 0).getDate();
                                            const prevMonthDays = [];
                                            for (let i = firstDayOfMonth - 1; i >= 0; i--) {
                                                prevMonthDays.push(prevMonthLastDay - i);
                                            }

                                            return (
                                                <>
                                                    <div className="flex justify-between items-center mb-6 px-4">
                                                        <button 
                                                            onClick={() => {
                                                                const isCurrentMonth = calendarView.month === now.getMonth() && calendarView.year === now.getFullYear();
                                                                if (isCurrentMonth) return; // Prevent going back from present month
                                                                setCalendarView(prev => prev.month === 0 ? { month: 11, year: prev.year - 1 } : { ...prev, month: prev.month - 1 });
                                                            }}
                                                            disabled={calendarView.month === now.getMonth() && calendarView.year === now.getFullYear()}
                                                            className={`p-2.5 rounded-full transition-colors border shadow-sm ${calendarView.month === now.getMonth() && calendarView.year === now.getFullYear() ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                                                        >
                                                            <span className="material-symbols-outlined text-xl text-text-primary dark:text-white">chevron_left</span>
                                                        </button>
                                                        <h3 className="font-extrabold text-xl text-text-primary dark:text-white">{monthNames[calendarView.month]} {calendarView.year}</h3>
                                                        <button 
                                                            onClick={() => setCalendarView(prev => prev.month === 11 ? { month: 0, year: prev.year + 1 } : { ...prev, month: prev.month + 1 })}
                                                            className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                                                            <span className="material-symbols-outlined text-xl text-text-primary dark:text-white">chevron_right</span>
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                                            <div key={day} className="bg-slate-50 dark:bg-slate-900 py-4 text-center text-xs font-black text-text-secondary dark:text-gray-400">{day}</div>
                                                        ))}

                                                        {/* Previous Month Days Filler (No numbers) */}
                                                        {prevMonthDays.map(d => (
                                                            <div key={`prev-${d}`} className="bg-slate-50/30 dark:bg-slate-900/10 h-28 border-r border-b border-slate-50 dark:border-slate-700/30"></div>
                                                        ))}

                                                        {/* Current Month Days */}
                                                        {[...Array(daysInMonth)].map((_, i: number) => {
                                                            const day = i + 1;
                                                            const dateObj = new Date(calendarView.year, calendarView.month, day);
                                                            const dateString = dateObj.toISOString().split('T')[0];
                                                            
                                                            const isToday = day === now.getDate() && calendarView.month === now.getMonth() && calendarView.year === now.getFullYear();
                                                            const isPast = dateObj < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                                            const isGenerallyAvailable = availableDays.includes(dateObj.getDay());
                                                            const isBookedByJob = jobDates.includes(dateString);
                                                            const isManuallyBlocked = blockedDates.includes(dateString);
                                                            
                                                            // Logic: Available only if in the present/future, generally available, and not booked or blocked
                                                            const isAvailable = !isPast && isGenerallyAvailable && !isBookedByJob && !isManuallyBlocked;
                                                            
                                                            let bgClass = "bg-white dark:bg-slate-800 hover:bg-primary/5 cursor-pointer";
                                                            let textClass = "text-text-primary dark:text-white";

                                                            if (isToday) {
                                                                bgClass = "bg-primary/5 dark:bg-primary/10 border-2 border-primary ring-4 ring-primary/5";
                                                                textClass = "text-primary";
                                                            } else if (isPast) {
                                                                bgClass = "bg-slate-50 dark:bg-slate-900/50 cursor-default grayscale opacity-60";
                                                                textClass = "text-text-secondary dark:text-gray-500";
                                                            } else if (isBookedByJob) {
                                                                bgClass = "bg-rose-50 dark:bg-rose-900/10 cursor-not-allowed";
                                                                textClass = "text-rose-600 font-bold";
                                                            } else if (isManuallyBlocked) {
                                                                bgClass = "bg-slate-50 dark:bg-slate-800/50 cursor-pointer";
                                                                textClass = "text-text-secondary dark:text-gray-500";
                                                            } else if (isAvailable) {
                                                                bgClass = "bg-emerald-50/20 dark:bg-emerald-900/5";
                                                                textClass = "text-emerald-600 font-bold";
                                                            }

                                                            return (
                                                                <div
                                                                    key={day}
                                                                    onClick={() => isEditing && !isPast && handleDayToggle(dateObj.getDay(), dateString)}
                                                                    className={`${bgClass} h-28 p-3 transition-all group relative border-r border-b border-slate-50 dark:border-slate-700/30 overflow-hidden ${isPast ? 'pointer-events-none' : ''}`}
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <span className={`text-sm font-black ${textClass}`}>{day}</span>
                                                                        {isToday && <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">Today</span>}
                                                                    </div>
                                                                    
                                                                    <div className="mt-4 space-y-1">
                                                                        {!isPast && isBookedByJob && (
                                                                            <div className="flex items-center gap-1 text-[9px] text-rose-600 font-black uppercase tracking-tighter bg-rose-100/50 dark:bg-rose-900/20 px-1.5 py-1 rounded-md">
                                                                                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
                                                                                Booked
                                                                            </div>
                                                                        )}
                                                                        {!isPast && isManuallyBlocked && (
                                                                             <div className="flex items-center gap-1 text-[9px] text-slate-500 font-black uppercase tracking-tighter bg-slate-100 dark:bg-slate-700 px-1.5 py-1 rounded-md">
                                                                                <span className="material-symbols-outlined text-[10px]">block</span>
                                                                                Blocked
                                                                            </div>
                                                                        )}
                                                                        {isAvailable && (
                                                                            <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-black uppercase tracking-tighter bg-emerald-100/30 dark:bg-emerald-900/20 px-1.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                                                Available
                                                                            </div>
                                                                        )}
                                                                        {isPast && !isToday && (
                                                                             <div className="mt-2 text-[10px] text-slate-400 font-medium italic opacity-50">Past Date</div>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {isEditing && !isPast && !isBookedByJob && (
                                                                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none flex items-center justify-center">
                                                                            <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all">
                                                                                {isManuallyBlocked ? 'add_circle' : 'do_not_disturb_on'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        
                                                        {/* Next Month Filler (No numbers) */}
                                                        {[...Array(42 - (daysInMonth + firstDayOfMonth))].map((_, i) => (
                                                            <div key={`next-${i}`} className="bg-slate-50/30 dark:bg-slate-900/10 h-28 border-r border-b border-slate-50 dark:border-slate-700/30"></div>
                                                        ))}
                                                    </div>
                                                </>
                                            );
                                        })()}
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
