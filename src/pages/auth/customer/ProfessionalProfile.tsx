import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerNavbar from "./components/CustomerNavbar";
import CustomerFooter from "./components/CustomerFooter";
import RequestEstimateModal from "./components/RequestEstimateModal";
import Sidebar from "../professional/components/Sidebar";
import Header from "../professional/components/Header";
import {
  ChevronRight,
  Loader2,
  Plus,
  Star as StarIcon,
  BadgeCheck,
  History,
  MapPin,
  Edit2
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import LocationInput from "../../../components/LocationInput";
import {
  getUserDetails,
  getImageUrl,
  getCalendar,
  blockDate,
  unblockDate,
  addPortfolioItem,
  createReview,
  getReviews,
  getProfessionalProfile,
} from "../../../api/auth.api";
import { getServiceCategories, listJobs } from "../../../api/jobs.api";

const Stars = ({ count, className = "" }: { count: number; className?: string }) => {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className="material-symbols-outlined text-amber-500"
          style={{
            fontVariationSettings: `'FILL' ${star <= count ? 1 : 0}`,
            fontSize: "inherit",
          }}
        >
          star
        </span>
      ))}
    </div>
  );
};

const isUUID = (str: any) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const ProfessionalProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);

  // Check if we are in professional management mode
  const isProView = window.location.pathname.startsWith("/professional");
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Portfolio Modal State
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState("");
  const [newPortfolioFile, setNewPortfolioFile] = useState<File | null>(null);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const handleChat = () => {
    if (activeJobId) {
      navigate(`/customer/messages?id=${activeJobId}`);
    } else {
      navigate("/customer/messages");
    }
  };

  const handleEstimateRequest = () => {
    console.log("Opening estimate modal, isEstimateModalOpen will be true");
    setIsEstimateModalOpen(true);
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
    setIsEditing(false);
  };

  const handleDayToggle = async (day: number, dateString?: string) => {
    if (!isEditing || !user?.id) return;

    if (dateString) {
      // Toggle specific date block
      try {
        if (blockedDates.includes(dateString)) {
          await unblockDate(user.id, dateString);
          setBlockedDates(blockedDates.filter((d) => d !== dateString));
        } else {
          await blockDate(user.id, dateString);
          setBlockedDates([...blockedDates, dateString]);
        }
      } catch (err) {
        console.error("Failed to toggle date block:", err);
        alert("Failed to update availability. Please try again.");
      }
    } else {
      // Toggle weekly availability
      let newDays = [...availableDays];
      if (newDays.includes(day)) {
        newDays = newDays.filter((d) => d !== day);
      } else {
        newDays.push(day);
      }
      setAvailableDays(newDays);
      try {
        await updateUser({ available_days: newDays });
      } catch (err) {
        console.error("Failed to update weekly availability:", err);
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
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [estimateRequested, setEstimateRequested] = useState(false);
  const [availableDays, setAvailableDays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]); // Default: All days available
  const [profileRating, setProfileRating] = useState(0);
  const [profileReviewsCount, setProfileReviewsCount] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [profileServiceId, setProfileServiceId] = useState<string | undefined>(
    undefined,
  );
  const [proDetailId, setProDetailId] = useState<string | number | null>(null);
  const isProfessionalUser = user?.role === "professional" || (user as any)?.user_type === "professional" || !!user?.profession;
  const isOwnProfile = id === user?.id || (isProView && !id);
  const [isFavorited, setIsFavorited] = useState(() => {
    const favorites = JSON.parse(
      localStorage.getItem("user_favorites") || "[]",
    );
    return favorites.includes(id);
  });
  const [profilePhone, setProfilePhone] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profilePrice, setProfilePrice] = useState(0);
  const [hasAcceptedJob, setHasAcceptedJob] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Advanced Calendar States
  const [jobDates, setJobDates] = useState<string[]>([]); // Dates with confirmed bookings
  const [blockedDates, setBlockedDates] = useState<string[]>([]); // Manually blocked dates

  // Dynamic Calendar State
  const now = new Date();
  const [calendarView, setCalendarView] = useState({
    month: now.getMonth(),
    year: now.getFullYear(),
  });
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const isUUID = (str: any) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  const isGeneric = (str: any) => !str || isUUID(str) || str === "Professional Specialist" || str === "Service Professional" || str === "Member";

  const applyData = (userData: any, catList: any[]) => {
    if (!userData) return;
    const userObj = userData.user || userData || {};
    
    // 1. Role & Service ID resolution
    let resolvedRole = userObj.profession_name || "";
    let categoryUUID = "";

    const candidate = userObj.profession || userData.profession;
    const sc = userData.service_categories || userObj.service_categories;
    const primaryId = sc && Array.isArray(sc) && sc.length > 0 ? sc[0] : candidate;

    if (primaryId) {
      if (typeof primaryId === "object" && primaryId !== null) {
        resolvedRole = primaryId.name || resolvedRole;
        categoryUUID = primaryId.id || "";
      } else if (isUUID(primaryId)) {
        categoryUUID = primaryId;
        const matched = catList.find((c: any) => c.id === primaryId);
        if (matched) {
          resolvedRole = matched.name;
        }
      } else if (typeof primaryId === "string") {
        resolvedRole = primaryId;
      }
    }

    // If resolvedRole is still generic/UUID, try to fallback or clean it up
    if (isGeneric(resolvedRole)) {
      if (categoryUUID) {
        const matched = catList.find((c: any) => c.id === categoryUUID);
        if (matched) {
          resolvedRole = matched.name;
        } else {
          resolvedRole = "Service Professional";
        }
      } else {
        resolvedRole = "Service Professional";
      }
    }

    // Now resolve the actual Service instance ID matching the categoryUUID
    let resolvedServiceId = "";
    if (categoryUUID) {
      const servicesList = userData.services || [];
      if (Array.isArray(servicesList) && servicesList.length > 0) {
        const match = servicesList.find((s: any) => {
          const sCatId = s.category && typeof s.category === "object" ? s.category.id : s.category;
          return String(sCatId) === String(categoryUUID);
        });
        if (match) {
          resolvedServiceId = match.id;
        }
      }
    }

    const finalRole = resolvedRole || "Service Professional";
    setProfileRole(finalRole);
    setProfileServiceId(resolvedServiceId);

    // 2. Name resolution - strictly filter out UUIDs from ALL possible name fields
    const rawFirst = userObj.first_name || "";
    const rawLast = userObj.last_name || "";
    const rawDisplayName = userObj.name || "";
    const rawUsername = userObj.username || "";

    const first = isUUID(rawFirst) ? "" : rawFirst;
    const last = isUUID(rawLast) ? "" : rawLast;
    const nameField = isUUID(rawDisplayName) ? "" : rawDisplayName;
    const usernameField = isUUID(rawUsername) ? "" : rawUsername;
    
    const rawName = (first || last) ? `${first} ${last}`.trim() : nameField;
    
    // Fallback logic: Use Name -> Username -> Role/Category -> Generic
    const finalName = rawName || usernameField || (!isGeneric(finalRole) ? finalRole : "Service Professional");
    setProfileName(finalName);

    setProfileAbout(userObj.bio || "");
    const rawSkills = userData.skills || userObj.skills;
    setProfileSkills(Array.isArray(rawSkills) ? rawSkills.join(", ") : (rawSkills ? String(rawSkills) : ""));
    setProfileExperience(userObj.years_of_experience?.toString() || "0");
    
    const city = userData.city || userObj.city || "";
    const area = userData.subcity || userObj.subcity || userData.neighborhood || userObj.neighborhood || "";
    setProfileLocation(city && area ? `${city}, ${area}` : city || area || "Addis Ababa");

    setProfilePhone(userObj.phonenumber || userObj.phone || "");
    setProfileImage(getImageUrl(userData.profile_photo_url || userObj.profile_picture || userObj.profilePhoto));
    const rawLanguages = userObj.languages;
    setProfileLanguages(Array.isArray(rawLanguages) ? rawLanguages : ["Amharic", "English"]);
    
    const rawPortfolio = userData.portfolio_files || userData.portfolio;
    setProfilePortfolio(Array.isArray(rawPortfolio) ? rawPortfolio : []);
    
    setProfileRating(userObj.average_rating || userObj.rating || 0);
    setProfileReviewsCount(userObj.total_jobs_completed || userObj.reviews_count || 0);
    setProfilePrice(userData.hourly_rate || userData.base_price || userObj.hourly_rate || userObj.base_price || 0);

    if (userObj.available_days) {
      setAvailableDays(userObj.available_days);
    }

    const rawReviews = userData.reviews;
    setRealReviews(Array.isArray(rawReviews) ? rawReviews : []);

    // Capture the Professional Detail ID (Integer) for reviews/calendar
    const resolvedProId = userData.id || userData.professional_detail?.id || userData.professional_id || (typeof userObj.id === 'number' ? userObj.id : null);
    setProDetailId(resolvedProId);
  };

  // Use effect to initialize or update data
  useEffect(() => {
    let isMounted = true;

    // 10-second safety net: if something goes wrong, stop the spinner
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn("ProfessionalProfile: fetch timed out after 10s");
        setIsLoading(false);
      }
    }, 10000);

    const fetchProfileData = async () => {
      const targetId = isProView ? ((user as any)?.user?.id || user?.id) : id;
      if (!targetId) {
        if (!isProView) {
          if (isMounted) setIsLoading(false);
          clearTimeout(timeoutId);
        }
        return;
      }

      // 1. Try Cache for instant UI
      const cached = localStorage.getItem(`prof_profile_${targetId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (isMounted) {
            applyData(parsed, []);
            setIsLoading(false);
            setIsSyncing(true);
          }
        } catch (e) {
          console.warn("ProfessionalProfile: Cache parse fail", e);
        }
      }

      try {
        const start = new Date(calendarView.year, calendarView.month, 1).toISOString().split('T')[0];
        const end = new Date(calendarView.year, calendarView.month + 1, 0).toISOString().split('T')[0];

        // 2. Fetch fresh data from API
        const freshUser = isProView ? await getUserDetails(targetId) : await getProfessionalProfile(targetId);

        if (!isMounted) return;

        // 3. Fetch categories
        const categoriesData = await getServiceCategories().catch(() => []);
        const catList = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.results || [];

        if (!isMounted) return;

        setServiceCategories(catList);
        applyData(freshUser, catList);
        localStorage.setItem(`prof_profile_${targetId}`, JSON.stringify(freshUser));
        setIsLoading(false);
        setIsSyncing(false);
        clearTimeout(timeoutId);

        // 4. Fetch calendar in background (non-blocking)
        getCalendar(targetId, start, end)
          .then(calendarData => {
            if (!isMounted) return;
            if (calendarData) {
              setBlockedDates(calendarData.blocked_dates || []);
              setJobDates(calendarData.booked_dates || []);
            }
          })
          .catch(err => console.warn("ProfessionalProfile: Background calendar fetch failed", err));

      } catch (error) {
        console.error("ProfessionalProfile: Failed to fetch:", error);
        if (isMounted) {
          setIsLoading(false);
          setIsSyncing(false);
        }
        clearTimeout(timeoutId);
      }
    };

    fetchProfileData();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isProView, user?.id, id]);

  // Check if there is an accepted job between this customer and this professional
  // AND fetch all jobs for this professional to populate the calendar
  useEffect(() => {
    const fetchJobsData = async () => {
      const targetId = isProView ? user?.id : id;
      if (!targetId) return;

      try {
        const rawJobs = await listJobs();
        const allJobs = Array.isArray(rawJobs) ? rawJobs : [];
        const acceptedStatuses = ["accepted", "assigned", "done", "completed"];

        // 1. Check relationship with current user (if customer)
        if (!isProView && user) {
          const jobBetweenUs = allJobs.find((j: any) => {
            const customerId =
              typeof j.customer === "object" ? j.customer?.id : j.customer;
            const professionalId =
              typeof j.professional === "object"
                ? j.professional?.id
                : j.professional;
            return (
              String(customerId) === String(user.id) &&
              String(professionalId) === String(targetId) &&
              acceptedStatuses.includes(j.status)
            );
          });
          setHasAcceptedJob(!!jobBetweenUs);
          if (jobBetweenUs) {
            setActiveJobId(jobBetweenUs.id);
          }

          // CHECK FOR EXISTING ESTIMATE REQUEST
          const pendingRequest = allJobs.find((j: any) => {
            const customerId =
              typeof j.customer === "object" ? j.customer?.id : j.customer;
            const professionalId =
              typeof j.professional === "object"
                ? j.professional?.id
                : j.professional;
            return (
              String(customerId) === String(user.id) &&
              String(professionalId) === String(targetId) &&
              !acceptedStatuses.includes(j.status)
            );
          });
          if (pendingRequest) setEstimateRequested(true);
        }

        // 2. Extract all "Booked" dates for this professional
        const proJobs = allJobs.filter(
          (j: any) =>
            j.professional === targetId &&
            acceptedStatuses.includes(j.status) &&
            j.scheduled_at,
        );

        const bookedDates = proJobs
          .map((j: any) => {
            try {
              return new Date(j.scheduled_at).toISOString().split("T")[0];
            } catch {
              return null;
            }
          })
          .filter(Boolean) as string[];

        setJobDates(bookedDates);
      } catch (err) {
        console.error(
          "ProfessionalProfile: Error fetching jobs for calendar:",
          err,
        );
      }
    };
    fetchJobsData();
  }, [id, user, isProView]);

  // Fetch real reviews for this professional
  useEffect(() => {
    const targetId = proDetailId || (isProView ? user?.id : id);
    if (!targetId) return;
    
    setRealReviews([]); // Clear previous reviews to prevent "mixing"
    setLoadingReviews(true);
    
    getReviews(String(targetId))
      .then((data) => {
        const rawList = Array.isArray(data) ? data : (data?.results || []);
        
        // Frontend Safety Filter: Ensure reviews actually belong to this professional
        // This prevents the "mixed up" glitch where the backend might return all reviews
        const filteredList = rawList.filter((r: any) => {
            const rPro = String(r.professional || r.professional_id || "");
            const currentId = String(id || "");
            const currentProDetailId = String(proDetailId || "");
            
            return rPro === currentId || rPro === currentProDetailId;
        });

        setRealReviews(filteredList);
      })
      .catch((err) => console.warn('ProfessionalProfile: Reviews fetch failed', err))
      .finally(() => setLoadingReviews(false));
  }, [id, isProView, user?.id, proDetailId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("review") === "true") {
      setIsReviewModalOpen(true);
    }
  }, []);

  const handleSave = async () => {
    if (isProView && user?.id) {
      try {
        // Determine first/last name from profileName
        const nameParts = profileName.trim().split(" ");
        const fName = nameParts[0] || "";
        const lName = nameParts.slice(1).join(" ") || "";

        // Prepare the patch object
        const patch: any = {
          first_name: fName,
          last_name: lName,
          bio: profileAbout,
          years_of_experience: Number(profileExperience),
          city: profileLocation.split(",")[0]?.trim() || "",
          subcity: profileLocation.split(",")[1]?.trim() || "",
          neighborhood: profileLocation.split(",")[1]?.trim() || "", // Alternative field for some backends
          skills: profileSkills,
          phonenumber: profilePhone,
          languages: profileLanguages,
          // Sync portfolio state (Note: Backend must support JSON or separate upload for images)
          portfolio: profilePortfolio.map(item => ({
            title: item.title,
            img: item.img || item.url
          })),
          // Sync blocked dates
          blocked_dates: blockedDates,
          // Sync available days
          available_days: availableDays
        };

        // If we matched a service ID for the role, send it as profession
        if (profileServiceId) {
          patch.profession = profileServiceId;
        }

        // Call the centralized updateUser from AuthContext which handles API + state sync
        const updated = await updateUser(patch);

        if (updated) {
          applyData(updated, serviceCategories);
          localStorage.setItem(`prof_profile_${user.id}`, JSON.stringify(updated));
        }

        setIsEditing(false);
        alert("Profile updated successfully!");
      } catch (err: any) {
        console.error("Save failed:", err);
        const msg = err.message || "Failed to save changes. Please try again.";
        alert(msg);
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!id || !reviewComment.trim() || isSubmittingReview) return;

    setIsSubmittingReview(true);
    try {
      const jobId = new URLSearchParams(window.location.search).get("jobId") || undefined;
      const newReview = await createReview(id, reviewRating, reviewComment, jobId);
      // Optimistically prepend the new review so the user sees it immediately
      const optimisticReview = {
        id: newReview?.id || Date.now().toString(),
        rating: reviewRating,
        comment: reviewComment,
        created_at: new Date().toISOString(),
        customer_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'You',
        customer_profile: { profile_picture: (user as any)?.profile_picture || user?.profilePhoto },
        ...newReview,
      };
      setRealReviews(prev => [optimisticReview, ...prev]);
      setIsReviewModalOpen(false);
      setReviewComment("");
      // Re-fetch in background to get accurate server data
      getReviews(id).then(data => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        setRealReviews(list);
      }).catch(() => {});
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      const backendError = err.response?.data;
      let errorMessage = "Failed to submit review.";
      if (backendError) {
        if (typeof backendError === 'string') errorMessage += ` ${backendError}`;
        else if (backendError.detail) errorMessage += ` ${backendError.detail}`;
        else if (backendError.message) errorMessage += ` ${backendError.message}`;
        else if (typeof backendError === 'object') errorMessage += ` ${JSON.stringify(backendError)}`;
      } else {
        errorMessage += ` ${err.message || "Unknown error"}`;
      }
      alert(errorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const formData = new FormData();
      formData.append(
        type === "profile" ? "profile_picture" : "cover_image",
        file,
      );

      const updated = await updateUser(formData);

      if (updated && type === "profile") {
        setProfileImage(
          getImageUrl(updated.profile_picture || (updated as any).profilePhoto),
        );
      } else {
        alert(`${type === "profile" ? "Profile" : "Cover"} photo updated!`);
        window.location.reload();
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image.");
    }
  };

  const handleAddPortfolio = async () => {
    if (!newPortfolioTitle.trim() && !newPortfolioFile) return;

    if (newPortfolioFile) {
      try {
        const uploadedItem = await addPortfolioItem(newPortfolioFile);

        // Use the returned item from backend
        const newItem = {
          id: uploadedItem.id,
          title: newPortfolioTitle.trim() || newPortfolioFile.name,
          type: newPortfolioFile.type.includes("image") ? "image" : "file",
          url: uploadedItem.file_url || uploadedItem.file,
          img: uploadedItem.file_url || uploadedItem.file,
          file: newPortfolioFile,
        };

        setProfilePortfolio([...profilePortfolio, newItem]);
        setIsPortfolioModalOpen(false);
        setNewPortfolioTitle("");
        setNewPortfolioFile(null);
      } catch (err) {
        console.error("Failed to upload portfolio item:", err);
        alert("Failed to upload portfolio item. Please try again.");
      }
    } else {
      // Just title, no file
      const newItem = {
        title: newPortfolioTitle.trim(),
        type: "file",
        url: null,
        img: null,
        file: null,
      };

      setProfilePortfolio([...profilePortfolio, newItem]);
      setIsPortfolioModalOpen(false);
      setNewPortfolioTitle("");
      setNewPortfolioFile(null);
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
    coverImage:
      "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop",
    profileImage: profileImage || defaultAvatar,
    phone: profilePhone,
    about: profileAbout,
    skills: Array.isArray(profileSkills) 
      ? profileSkills 
      : (typeof profileSkills === "string" ? profileSkills : "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
    languages: profileLanguages,
    portfolio: profilePortfolio,
    reviews: [], // Using realReviews state in the JSX instead of this hardcoded list
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        {!isProView ? <CustomerNavbar /> : <Header />}
        <div className="flex-1 flex flex-col items-center justify-center p-10">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-text-secondary dark:text-gray-400 font-medium">
            Loading professional profile...
          </p>
          <p className="text-xs text-slate-400 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (!isProfessionalUser && !id) {
    return (
      <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        {!isProView ? <CustomerNavbar /> : <Header />}
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-slate-400">
              person_off
            </span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
            {profileName}
          </h2>
          <p className="text-text-secondary dark:text-gray-400 max-w-sm">
            This user is not registered as a service professional. You can only
            request estimates from verified professionals.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-8 px-6 py-2 bg-primary text-white rounded-lg font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }


  return (
    <div
      className={`relative flex w-full bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white overflow-hidden ${isProView ? "h-screen" : "min-h-screen flex-col"}`}
    >
        {/* Background decorative blobs - matching customer dashboard */}
        <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
        <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>
        <div className="fixed top-[30%] left-[20%] w-[30%] h-[30%] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:4s]"></div>

        {isProView && <Sidebar />}
        <div
          className={`flex flex-col flex-1 relative z-10 ${isProView ? "overflow-y-auto overflow-x-visible lg:ml-64" : "w-full"}`}
        >
          {!isProView ? <CustomerNavbar /> : <Header />}
          <main
            className={`flex-1 relative ${isProView ? "overflow-y-auto custom-scrollbar" : "w-full"}`}
          >
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 relative">
              
              {isProView && (
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-fade-in-up">
                  <div className="space-y-3">
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan">Profile</span> & Portfolio
                    </h1>
                    <div className="flex items-center gap-3">
                      <span className="size-2.5 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/20"></span>
                      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                        Manage your public presence and professional ledger
                      </p>
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-8 py-4 bg-white/80 dark:bg-slate-800/60 backdrop-blur-3xl border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        Cancel Changes
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
                      >
                        <span className="material-symbols-outlined text-base group-hover:rotate-12 transition-transform">save</span>
                        Update Info
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={togglePreview}
                      className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group ${isPreviewMode ? "bg-primary text-white shadow-primary/20" : "bg-white/80 dark:bg-slate-800/60 backdrop-blur-3xl text-primary border border-primary shadow-primary/5 hover:bg-primary/5"}`}
                    >
                      <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">
                        {isPreviewMode ? "edit_note" : "visibility"}
                      </span>
                      {isPreviewMode ? "Back to Operations" : "Client Preview Mode"}
                    </button>
                  )}
                </div>
              )}

              <div className="w-full rounded-[2.5rem] shadow-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl mb-12 border border-slate-100 dark:border-slate-800/50 animate-fade-in-up [animation-delay:100ms]">
                <div
                  className="h-60 bg-cover bg-center relative group rounded-t-[2.5rem] overflow-hidden"
                  style={{
                    backgroundImage: `url('${user?.cover_image ? getImageUrl(user.cover_image) : professional.coverImage}')`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                  {isEditing && (
                    <div className="absolute top-8 right-8 z-10">
                      <label className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xl border border-white/20 cursor-pointer flex items-center gap-3 hover:scale-105 transition-all hover:bg-white group">
                        <span className="material-symbols-outlined text-primary font-black group-hover:rotate-12 transition-transform">landscape</span>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                          Switch Cover
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "cover")}
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="p-10 md:p-14 pb-16">
                  <div className="flex flex-col md:flex-row -mt-28 items-end relative z-10 gap-8">
                    <div
                      className="size-40 bg-center bg-no-repeat bg-cover rounded-[2rem] border-[6px] border-white dark:border-slate-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] relative group overflow-hidden transition-transform duration-700 hover:rotate-3"
                      style={{
                        backgroundImage: `url('${professional.profileImage}')`,
                      }}
                    >
                      {isEditing && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                          <label className="cursor-pointer flex flex-col items-center gap-2">
                            <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-3xl font-black">photo_camera</span>
                            </div>
                            <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Update</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, "profile")}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center gap-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={profileName}
                              onChange={(e) => {
                                const checkUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                                if (!checkUUID(e.target.value)) setProfileName(e.target.value);
                              }}
                              className="text-4xl font-black tracking-tight bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-xl border-2 border-primary rounded-2xl px-6 py-3 outline-none text-slate-900 dark:text-white shadow-inner w-full max-w-md"
                            />
                          ) : (
                            <div className="relative">
                                {(isLoading || (isSyncing && !profileName)) ? (
                                    <div className="h-10 w-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                                ) : (
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white animate-fade-in">
                                      {(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileName)) ? "Service Professional" : (profileName || "Service Professional")}
                                    </h1>
                                )}
                            </div>
                          )}
                          {professional.verified && !isEditing && (
                            <div className="size-10 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm" title="Verified Professional">
                              <BadgeCheck size={24} className="text-primary" />
                            </div>
                          )}
                          {isSyncing && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse">
                              <Loader2 size={12} className="animate-spin text-primary" />
                              <span className="text-[10px] font-bold text-slate-400">Syncing</span>
                            </div>
                          )}
                          {isProView && !isEditing && !isPreviewMode && (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="p-3 bg-white/80 dark:bg-slate-800/60 backdrop-blur-3xl hover:bg-primary hover:text-white rounded-2xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 group"
                            >
                              <Edit2 size={20} className="group-hover:rotate-12 transition-transform" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                          {isEditing ? (
                            <select
                              value={profileServiceId || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfileServiceId(val);
                                const matched = serviceCategories.find(c => c.id === val);
                                if (matched) setProfileRole(matched.name);
                              }}
                              className="text-xl font-bold bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-xl border-2 border-primary rounded-2xl px-6 py-3 outline-none text-primary shadow-inner min-w-[280px] cursor-pointer"
                            >
                              <option value="">Select Domain</option>
                              {serviceCategories.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="size-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 animate-pulse"></div>
                              <p className="text-xl font-bold text-slate-500 dark:text-slate-400">
                                {profileRole || "Professional Specialist"}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-10 flex-wrap pt-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Composite Rating</p>
                            <div className="flex items-center gap-3">
                              <Stars count={profileRating} className="text-lg" />
                              <span className="text-2xl font-black text-slate-900 dark:text-white">{profileRating}</span>
                              <span className="text-xs font-bold text-slate-400">({profileReviewsCount})</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Base Service Rate</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-primary tracking-tighter">{profilePrice || 0}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ETB / Cycle</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Service Tenure</p>
                            <div className="flex items-center gap-2">
                              <History size={20} className="text-slate-400" />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={profileExperience}
                                  onChange={(e) => setProfileExperience(e.target.value)}
                                  className="w-16 text-xl font-black bg-slate-50/50 dark:bg-slate-800/30 border-b-2 border-primary outline-none px-2 py-1"
                                />
                              ) : (
                                <span className="text-xl font-black text-slate-700 dark:text-slate-300">{profileExperience}+ <span className="text-xs uppercase tracking-widest text-slate-400 font-bold ml-1">Years</span></span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 flex-1 min-w-[200px]">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Service Area</p>
                            <div className="flex items-center gap-3">
                              <MapPin size={20} className="text-slate-400" />
                              {isEditing ? (
                                <LocationInput
                                  value={profileLocation}
                                  onSelect={(loc) => setProfileLocation(loc)}
                                  className="w-full text-lg font-black bg-slate-50/50 dark:bg-slate-800/30 border-b-2 border-primary outline-none px-4 py-1"
                                />
                              ) : (
                                <span className="text-lg font-black text-slate-700 dark:text-slate-300">{profileLocation}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!isProView && (
                <div className="flex items-center gap-4 mb-12 animate-fade-in-up [animation-delay:200ms]">
                  {hasAcceptedJob ? (
                    <button
                      onClick={handleChat}
                      className="flex-1 sm:flex-none h-16 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 active:scale-95 bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/30 ring-8 ring-primary/5"
                    >
                      <span className="material-symbols-outlined">chat</span>
                      Establish Communications
                    </button>
                  ) : (
                    <button
                      onClick={handleEstimateRequest}
                      disabled={estimateRequested}
                      className={`flex-1 sm:flex-none h-16 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${estimateRequested ? "bg-slate-200 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed shadow-none" : "bg-primary text-white hover:bg-primary/90 hover:shadow-primary/30 hover:scale-[1.02]"}`}
                    >
                      <span className="material-symbols-outlined">{estimateRequested ? "pending" : "rocket_launch"}</span>
                      {estimateRequested ? "Estimate Sent" : "Request an Estimate"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const currentFavorites = JSON.parse(localStorage.getItem("user_favorites") || "[]");
                      let newFavorites;
                      if (!isFavorited) {
                        newFavorites = [...currentFavorites, id];
                      } else {
                        newFavorites = currentFavorites.filter((fid: string) => fid !== id);
                      }
                      localStorage.setItem("user_favorites", JSON.stringify(newFavorites));
                      setIsFavorited(!isFavorited);
                    }}
                    className={`size-16 flex items-center justify-center rounded-2xl border-2 transition-all ${isFavorited ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-500" : "border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl text-slate-400 hover:text-rose-500 hover:border-rose-200"}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}>
                      {isFavorited ? "favorite" : "favorite_border"}
                    </span>
                  </button>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-12 items-start">
                <aside className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-32">
                  <nav className="p-4 rounded-[2.5rem] bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl border border-slate-100 dark:border-slate-800/50 shadow-2xl">
                    <div className="flex flex-col gap-2">
                      {[
                        { id: "about", icon: "person", label: "Operations Bio" },
                        { id: "portfolio", icon: "grid_view", label: "Service Catalog" },
                        { id: "availability", icon: "calendar_today", label: "Work Calendar" },
                        { id: "reviews", icon: "star", label: "Network Feedback", hide: isProView && !isPreviewMode }
                      ].filter(item => !item.hide).map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className="flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-primary hover:text-white transition-all duration-300 font-black text-[10px] uppercase tracking-widest group"
                        >
                          <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">{item.icon}</span>
                          <span>{item.label}</span>
                        </a>
                      ))}
                    </div>
                  </nav>
                </aside>

                <div className="flex-1 space-y-12 w-full">
                  <section id="about" className="p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl shadow-2xl scroll-mt-32">
                    <div className="flex items-center justify-between mb-10">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                          About <span className="text-primary">Me</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skills & Expertise</p>
                      </div>
                      {isProView && !isEditing && !isPreviewMode && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <textarea
                        value={profileAbout}
                        onChange={(e) => setProfileAbout(e.target.value)}
                        rows={6}
                        className="w-full text-slate-600 dark:text-slate-300 leading-relaxed text-lg bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-xl border-2 border-primary rounded-[2rem] p-8 outline-none resize-none focus:ring-4 ring-primary/10 shadow-inner font-medium"
                        placeholder="Describe your professional trajectory..."
                      />
                    ) : (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium">
                        {profileAbout}
                      </p>
                    )}

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined font-black">bolt</span>
                          </div>
                          <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Hard Skills</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {isEditing ? (
                            <textarea
                              value={profileSkills}
                              onChange={(e) => setProfileSkills(e.target.value)}
                              placeholder="Add skills separated by commas..."
                              className="w-full bg-slate-50/50 dark:bg-slate-800/30 border-2 border-primary rounded-2xl p-6 outline-none text-sm font-bold text-slate-700 dark:text-slate-200"
                            />
                          ) : (
                            profileSkills.split(",").map(s => s.trim()).filter(Boolean).map((skill) => (
                              <span key={skill} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors hover:border-primary/30">
                                {skill}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <span className="material-symbols-outlined font-black">contact_emergency</span>
                          </div>
                          <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Secure Contacts</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 group hover:border-primary/30 transition-all">
                            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">call</span>
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Number</p>
                              <p className="text-slate-900 dark:text-white font-black">{profilePhone || (isProView ? "Update in Settings" : "Classified")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 group hover:border-emerald-500/30 transition-all">
                            <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-500 transition-colors">translate</span>
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linguistic Proficiencies</p>
                              <p className="text-slate-900 dark:text-white font-black">{profileLanguages.join(", ") || "Amharic, English"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>


                  {(profilePortfolio.length > 0 || isProView) && (
                    <section id="portfolio" className="p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl shadow-2xl scroll-mt-32">
                      <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            Service <span className="text-primary">Catalog</span>
                          </h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authenticated Portfolio & Works</p>
                        </div>
                        {isProView && (
                          <button
                            onClick={() => setIsPortfolioModalOpen(true)}
                            className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-base">add</span>
                            Add Work
                          </button>
                        )}
                      </div>

                      {profilePortfolio.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          {profilePortfolio.map((item, index) => (
                            <div key={index} className="group relative rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl">
                              {item.type === "file" || item.img?.endsWith(".pdf") ? (
                                <div className="aspect-video flex flex-col items-center justify-center p-10 text-center">
                                  <div className="size-20 bg-rose-500/10 rounded-[2rem] mb-4 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-rose-500 text-4xl font-black">description</span>
                                  </div>
                                  <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1 px-4">{item.title}</p>
                                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Document Fragment</p>
                                </div>
                              ) : (
                                <div className="aspect-video overflow-hidden">
                                  <img src={item.img || item.url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                                <p className="text-white font-black text-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{item.title}</p>
                                <button className="mt-4 text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                                  View Artifact <span className="material-symbols-outlined text-sm">open_in_new</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-slate-50/30 dark:bg-slate-900/10">
                          <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-800 mb-6 font-light">collections</span>
                          <p className="text-slate-400 dark:text-slate-500 text-sm font-black uppercase tracking-widest">No Artifacts Registered</p>
                          {isProView && <p className="text-slate-300 dark:text-slate-600 text-[10px] mt-2 font-bold">Add projects to your portfolio to attract more customers.</p>}
                        </div>
                      )}
                    </section>
                  )}

                  <section id="availability" className="p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl shadow-2xl scroll-mt-32">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                          Work <span className="text-primary">Calendar</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Availability Status</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 px-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-3xl rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        {[
                          { color: "bg-primary shadow-primary/40", label: "Ready" },
                          { color: "bg-rose-500 shadow-rose-500/40", label: "Deployed" },
                          { color: "bg-slate-300 dark:bg-slate-600", label: "Offline" }
                        ].map(status => (
                          <div key={status.label} className="flex items-center gap-2">
                            <div className={`size-2.5 rounded-full ${status.color} shadow-lg`}></div>
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{status.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="w-full">
                      {(() => {
                        const daysInMonth = new Date(calendarView.year, calendarView.month + 1, 0).getDate();
                        const firstDayOfMonth = new Date(calendarView.year, calendarView.month, 1).getDay();
                        const prevMonthLastDay = new Date(calendarView.year, calendarView.month, 0).getDate();
                        const prevMonthDays = [];
                        for (let i = firstDayOfMonth - 1; i >= 0; i--) { prevMonthDays.push(prevMonthLastDay - i); }

                        return (
                          <>
                            <div className="flex justify-between items-center mb-8 px-4">
                              <button
                                onClick={() => {
                                  if (calendarView.month === now.getMonth() && calendarView.year === now.getFullYear()) return;
                                  setCalendarView(prev => prev.month === 0 ? { month: 11, year: prev.year - 1 } : { ...prev, month: prev.month - 1 });
                                }}
                                disabled={calendarView.month === now.getMonth() && calendarView.year === now.getFullYear()}
                                className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-20"
                              >
                                <span className="material-symbols-outlined">chevron_left</span>
                              </button>
                              <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight text-center">
                                {monthNames[calendarView.month]} <span className="text-primary">{calendarView.year}</span>
                              </h3>
                              <button
                                onClick={() => setCalendarView(prev => prev.month === 11 ? { month: 0, year: prev.year + 1 } : { ...prev, month: prev.month + 1 })}
                                className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                              >
                                <span className="material-symbols-outlined">chevron_right</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-7 gap-4">
                              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
                                <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2">{day}</div>
                              ))}
                              {prevMonthDays.map(d => (
                                <div key={`prev-${d}`} className="h-32 rounded-3xl bg-slate-50/30 dark:bg-slate-900/10 border border-transparent opacity-20"></div>
                              ))}
                              {[...Array(daysInMonth)].map((_, i) => {
                                const day = i + 1;
                                const dateObj = new Date(calendarView.year, calendarView.month, day);
                                const dateString = dateObj.toISOString().split("T")[0];
                                const isToday = day === now.getDate() && calendarView.month === now.getMonth() && calendarView.year === now.getFullYear();
                                const isPast = dateObj < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const isGenerallyAvailable = availableDays.includes(dateObj.getDay());
                                const isBookedByJob = jobDates.includes(dateString);
                                const isManuallyBlocked = blockedDates.includes(dateString);
                                const isAvailable = !isPast && isGenerallyAvailable && !isBookedByJob && !isManuallyBlocked;

                                let stateClasses = "bg-white/50 dark:bg-slate-800/40 hover:bg-primary hover:text-white group shadow-sm";
                                if (isToday) stateClasses = "bg-primary text-white shadow-xl shadow-primary/30 ring-8 ring-primary/5";
                                else if (isPast) stateClasses = "bg-slate-100/50 dark:bg-slate-900/50 opacity-40 grayscale pointer-events-none";
                                else if (isBookedByJob) stateClasses = "bg-rose-500 text-white shadow-xl shadow-rose-500/20";
                                else if (isManuallyBlocked) stateClasses = "bg-slate-200 dark:bg-slate-700 text-slate-400";
                                else if (isAvailable) stateClasses = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20";

                                return (
                                  <div
                                    key={day}
                                    onClick={() => isEditing && !isPast && handleDayToggle(dateObj.getDay(), dateString)}
                                    className={`h-32 p-5 rounded-[2rem] transition-all duration-300 relative border border-slate-100 dark:border-slate-800/50 flex flex-col justify-between cursor-pointer ${stateClasses}`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className="text-xl font-black">{day}</span>
                                      {isToday && <span className="text-[8px] bg-white text-primary px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter">Live</span>}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      {isBookedByJob && <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Reserved</span>}
                                      {isAvailable && <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Open</span>}
                                      {isManuallyBlocked && <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Locked</span>}
                                    </div>
                                    {isEditing && !isPast && !isBookedByJob && (
                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-sm">{isManuallyBlocked ? "lock_open" : "lock"}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {[...Array(42 - (daysInMonth + firstDayOfMonth))].map((_, i) => (
                                <div key={`next-${i}`} className="h-32 rounded-3xl bg-slate-50/30 dark:bg-slate-900/10 opacity-20"></div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </section>

                  {(!isProView || isPreviewMode) && (
                    <section id="reviews" className="p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl shadow-2xl scroll-mt-32">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                        <div className="flex items-center gap-4">
                          <div className="size-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                            <span className="material-symbols-outlined text-3xl font-black">star</span>
                          </div>
                          <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                              Client <span className="text-amber-500">Testimonials</span>
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Customer Satisfaction • {realReviews.length} Reviews</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex items-center gap-3 px-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-3xl rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-inner">
                            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{profileRating.toFixed(1)}</span>
                            <div className="flex text-amber-500">
                              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {loadingReviews ? (
                        <div className="py-16 flex flex-col items-center gap-4 text-slate-400">
                          <div className="size-10 border-4 border-slate-200 dark:border-slate-700 border-t-amber-500 rounded-full animate-spin" />
                          <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Loading reviews...</p>
                        </div>
                      ) : realReviews.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-slate-50/20 dark:bg-slate-900/10">
                          <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <span className="material-symbols-outlined text-4xl">star</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">No Reviews Yet</p>
                            <p className="text-slate-400 dark:text-slate-600 text-[10px] font-bold max-w-[200px] mx-auto">Be the first to leave a review after completing a project.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {realReviews.map((review: any, idx: number) => {
                            const customerName = review.customer_name || 
                              review.reviewer_name ||
                              (review.customer_detail?.first_name ? `${review.customer_detail.first_name} ${review.customer_detail.last_name || ''}`.trim() : null) ||
                              (review.reviewer_detail?.first_name ? `${review.reviewer_detail.first_name} ${review.reviewer_detail.last_name || ''}`.trim() : null) ||
                              (review.user_detail?.first_name ? `${review.user_detail.first_name} ${review.user_detail.last_name || ''}`.trim() : null) ||
                              'Verified Customer';
                            const avatarUrl = getImageUrl(review.customer_profile?.profile_picture || review.customer_detail?.profile_picture || review.customer?.profile_picture);
                            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=random&color=fff&bold=true`;
                            const ratingVal = Number(review.rating) || 0;
                            const reviewDate = review.created_at
                              ? new Date(review.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
                              : '';
                            const comment = review.comment || review.content || '';

                            return (
                              <div key={review.id || idx} className="flex gap-5 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                                {/* Avatar */}
                                <div className="shrink-0">
                                  <img
                                    src={avatarUrl || fallbackAvatar}
                                    alt={customerName}
                                    onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                                    className="size-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                    <div>
                                      <h4 className="font-black text-slate-900 dark:text-white tracking-tight text-sm group-hover:text-amber-500 transition-colors">
                                        {customerName}
                                      </h4>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{reviewDate}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {[1,2,3,4,5].map(s => (
                                        <span key={s} className="material-symbols-outlined text-[16px] text-amber-400" style={{ fontVariationSettings: `'FILL' ${s <= ratingVal ? 1 : 0}` }}>star</span>
                                      ))}
                                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 ml-1">{ratingVal.toFixed(1)}</span>
                                    </div>
                                  </div>
                                  {comment ? (
                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                                      "{comment}"
                                    </p>
                                  ) : (
                                    <p className="text-sm text-slate-400 font-medium italic">No written comment.</p>
                                  )}
                                  {review.job_title && (
                                    <div className="mt-3 flex items-center gap-2">
                                      <span className="material-symbols-outlined text-xs text-primary">verified</span>
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service: <span className="text-slate-700 dark:text-slate-300">{review.job_title}</span></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </div>
            </div>
          </main>
          {!isProView && <CustomerFooter />}
        </div>

        <RequestEstimateModal
          isOpen={isEstimateModalOpen}
          onClose={() => setIsEstimateModalOpen(false)}
          professionalName={profileName}
          serviceId={profileServiceId}
          professionalId={id}
        />

        {/* Add Portfolio Modal */}
        {isPortfolioModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 dark:border-slate-800 animate-in zoom-in-95 duration-300">
              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-2xl font-black">collections</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Add Portfolio Artifact</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showcase your expert results</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Work Description</label>
                    <textarea
                      value={newPortfolioTitle}
                      onChange={(e) => setNewPortfolioTitle(e.target.value)}
                      placeholder="Describe the achievement..."
                      rows={3}
                      className="w-full bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-3xl border border-slate-100 dark:border-slate-800 rounded-2xl p-5 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 text-sm font-bold text-slate-800 dark:text-white resize-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Visual Evidence</label>
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group overflow-hidden relative">
                      {newPortfolioFile ? (
                        <div className="flex flex-col items-center gap-3 text-primary animate-in zoom-in duration-300">
                          <span className="material-symbols-outlined text-4xl">draft</span>
                          <span className="text-[11px] font-black uppercase tracking-widest max-w-[200px] text-center truncate px-4">{newPortfolioFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-4xl font-light">cloud_upload</span>
                          <div className="text-center">
                             <span className="text-[11px] font-black uppercase tracking-widest block">Upload Media</span>
                             <span className="text-[9px] font-bold opacity-60">Images or PDF fragments</span>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setNewPortfolioFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  onClick={() => {
                    setIsPortfolioModalOpen(false);
                    setNewPortfolioTitle("");
                    setNewPortfolioFile(null);
                  }}
                  className="flex-1 py-4 text-[10px] font-black text-slate-500 hover:text-slate-700 dark:hover:text-white uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleAddPortfolio}
                  disabled={!newPortfolioTitle.trim() && !newPortfolioFile}
                  className="flex-[2] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  Register Artifact
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Review Modal */}
        {isReviewModalOpen && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsReviewModalOpen(false)}
          >
            <div 
              className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-10 pt-10 pb-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-14 bg-amber-500 text-white rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-amber-500/30">
                      <StarIcon size={28} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Rate & Review</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Share your experience</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsReviewModalOpen(false)}
                    className="size-10 flex items-center justify-center hover:bg-white/50 dark:hover:bg-slate-800 rounded-xl transition-all group"
                  >
                    <span className="material-symbols-outlined text-slate-400 group-hover:rotate-90 transition-transform">close</span>
                  </button>
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div className="text-center space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">How was the service?</p>
                  <div className="flex items-center justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`transition-all duration-500 hover:scale-125 ${reviewRating >= star ? 'text-amber-500' : 'text-slate-200 dark:text-slate-800'}`}
                      >
                        <StarIcon 
                          size={48} 
                          fill={reviewRating >= star ? "currentColor" : "none"} 
                          strokeWidth={2}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="pt-2">
                    <span className="px-6 py-2 bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-[0.2em] rounded-full">
                      {['Poor', 'Fair', 'Good', 'Very Good', 'Exceptional'][reviewRating - 1]}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Write your review</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us what you liked or what could be improved..."
                    className="w-full h-40 px-6 py-5 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-3xl border border-slate-100 dark:border-slate-800 rounded-[2rem] outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all text-sm font-bold resize-none placeholder:text-slate-400 dark:text-white"
                  ></textarea>
                </div>
              </div>

              <div className="p-10 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-4 text-[10px] font-black text-slate-500 hover:text-slate-700 dark:hover:text-white uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewComment.trim() || isSubmittingReview}
                  className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.25em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-900/20 dark:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isSubmittingReview ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Post Review
                      <ChevronRight size={16} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
};

export default ProfessionalProfile;
