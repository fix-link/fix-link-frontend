import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerNavbar from "./components/CustomerNavbar";
import CustomerFooter from "./components/CustomerFooter";
import RequestEstimateModal from "./components/RequestEstimateModal";
import Sidebar from "../professional/components/Sidebar";
import Header from "../professional/components/Header";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  Heart,
  Share2,
  Award,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Plus,
  Languages,
  Briefcase,
  Layout,
  ArrowLeft,
  Loader2,
  ImageIcon,
  UserCheck,
  StarHalf,
  Quote,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Edit3,
  Verified,
  Info,
  Settings,
  FileText,
  Grid,
  Star as StarIcon,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import LocationInput from "../../../components/LocationInput";
import {
  getUserDetails,
  updateUserProfile,
  getImageUrl,
  getCalendar,
  blockDate,
  createReview,
  getReviews,
} from "../../../api/auth.api";
import { getServiceCategories, listJobs } from "../../../api/jobs.api";

const ProfessionalProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(
    !window.location.pathname.startsWith("/professional"),
  );
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
        await blockDate(user.id, dateString);
        if (blockedDates.includes(dateString)) {
          setBlockedDates(blockedDates.filter((d) => d !== dateString));
        } else {
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
  const [isProfessional, setIsProfessional] = useState(true);
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

  // Use effect to initialize or update data
  useEffect(() => {
    const fetchProfileData = async () => {
      const targetId = isProView ? user?.id : id;
      if (!targetId) return;

      setIsLoading(true);
      try {
        const freshUser = await getUserDetails(targetId);
        
        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        
        // Name resolution
        const rawName = freshUser.first_name ? `${freshUser.first_name} ${freshUser.last_name || ""}`.trim() : isUUID(freshUser.name || "") ? "" : freshUser.name || "";
        setProfileName(isUUID(rawName) ? "Professional Specialist" : (rawName || "User"));

        // Role resolution
        let resolvedRole = freshUser.profession_name || "";
        const isGeneric = (str: string) => !str || isUUID(str) || str === "Professional Specialist" || str === "Member";

        if (isGeneric(resolvedRole)) {
          const candidate = freshUser.profession;
          const sc = freshUser.service_categories;
          const primaryId = sc && Array.isArray(sc) && sc.length > 0 ? sc[0] : candidate;

          if (primaryId && !isUUID(primaryId)) {
            resolvedRole = primaryId;
          } else if (primaryId && isUUID(primaryId)) {
            try {
              const categories = await getServiceCategories();
              const catList = Array.isArray(categories) ? categories : categories?.results || [];
              const matched = catList.find((c: any) => c.id === primaryId);
              if (matched) resolvedRole = matched.name;
            } catch (e) {
              console.error("Failed to resolve profession name:", e);
            }
          }
        }
        setProfileRole(resolvedRole || "Professional Specialist");

        setProfileAbout(freshUser.bio || `With extensive experience in ${resolvedRole || "their field"}, ${profileName.split(" ")[0]} provides high-quality service.`);
        setProfileSkills(freshUser.skills || "");
        setProfileExperience(freshUser.years_of_experience?.toString() || "0");
        
        const city = freshUser.city || "";
        const area = freshUser.subcity || freshUser.neighborhood || "";
        setProfileLocation(city && area ? `${city}, ${area}` : city || area || "Addis Ababa");

        setProfilePhone(freshUser.phonenumber || freshUser.phone || "");
        setProfileImage(getImageUrl(freshUser.profile_picture || freshUser.profilePhoto));
        setProfileLanguages(freshUser.languages || ["Amharic", "English"]);
        setProfilePortfolio(freshUser.portfolio || []);
        setProfileRating(freshUser.average_rating || freshUser.rating || 0);
        setProfileReviewsCount(freshUser.total_jobs_completed || freshUser.reviews_count || 0);
        setProfilePrice(freshUser.hourly_rate || freshUser.base_price || 0);

        if (freshUser.available_days) {
          setAvailableDays(freshUser.available_days);
        }

        // Fetch Calendar for current month
        const start = new Date(calendarView.year, calendarView.month, 1).toISOString().split('T')[0];
        const end = new Date(calendarView.year, calendarView.month + 1, 0).toISOString().split('T')[0];
        try {
          const calendarData = await getCalendar(targetId, start, end);
          if (calendarData) {
            setBlockedDates(calendarData.blocked_dates || []);
            setJobDates(calendarData.booked_dates || []);
          }
        } catch (calErr) {
          console.warn("Failed to fetch calendar data:", calErr);
        }

        // Resolve service ID for estimate modal
        try {
          const categoriesData = await getServiceCategories();
          const catList = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || [];
          setServiceCategories(catList);
          
          const profName = (resolvedRole || "").toLowerCase().trim();
          const matched = catList.find((cat: any) => cat.name?.toLowerCase().trim() === profName);
          setProfileServiceId(matched?.id || undefined);
        } catch (catErr) {
          console.error("ProfessionalProfile: Error fetching categories:", catErr);
        }

      } catch (error) {
        console.error("Failed to fetch professional details:", error);
      } finally {
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
        await updateUser(patch);
        
        setIsEditing(false);
        alert("Profile updated successfully!");
        
        // Refresh local data to be sure everything is in sync
        window.location.reload(); 
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
      await createReview(id, reviewRating, reviewComment, jobId);
      alert("Thank you! Your review has been submitted.");
      setIsReviewModalOpen(false);
      setReviewComment("");
      
      // Refresh reviews on page
      const data = await getReviews(id);
      const list = Array.isArray(data) ? data : (data.results || []);
      setProfilePortfolio(list); // Wait, I should have a reviews state? 
      // Actually, professional profile uses 'professional.reviews' which is derived from state in some places.
      // I'll just reload to be safe and sync everything.
      window.location.reload();
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

  const handleAddPortfolio = () => {
    if (!newPortfolioTitle.trim() && !newPortfolioFile) return;

    const newItem = {
      title:
        newPortfolioTitle.trim() ||
        (newPortfolioFile ? newPortfolioFile.name : "Untitled Work"),
      type:
        newPortfolioFile && newPortfolioFile.type.includes("image")
          ? "image"
          : "file",
      url: newPortfolioFile ? URL.createObjectURL(newPortfolioFile) : null,
      img: newPortfolioFile ? URL.createObjectURL(newPortfolioFile) : null,
      file: newPortfolioFile, // to send to backend later
    };

    setProfilePortfolio([...profilePortfolio, newItem]);
    setIsPortfolioModalOpen(false);
    setNewPortfolioTitle("");
    setNewPortfolioFile(null);
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCVqLxahM8mBBENqzv_93ZaZeNL1f0E4OzaxyeOFzKw3OmNbp_zAyVx3JtjzUkCcPITJYiDapRmZtn_EutJF9SyzhnQ47oEkrtpf_jkjYABsBbV2tyj8e9WaqpeNQBOKuU9gk8fPtFDxKzEmVI1H1HYd1VtpX_XZnxZV8jzd8tGafsAt9maXvNzTDR8sbsW1KfEJQ-3aQeOKZar1jTjMwaVQsT8m4MKp1md-ihGBr36VqI7SnxPjsrNrGTqY0ua9N7_QRGDkEMx3Q",
    profileImage: profileImage || defaultAvatar,
    phone: profilePhone,
    about: profileAbout,
    skills: profileSkills
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean),
    languages: profileLanguages,
    portfolio: profilePortfolio,
    reviews: [
      {
        name: "Elias Tesfaye",
        date: "Oct 12, 2024",
        rating: 5,
        content: `${profileName.split(" ")[0]} was exceptionally professional. They finished the work ahead of schedule. Highly recommend!`,
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDDKa3eBgX2EeYh5Q75Q2Hbj0WjYe9IsF6t8KEV_eon4ge-xUBSkfEBHSsNHawHOdb8_fds3jx3ExL153TixBekkr3Gz2QpCq4RQ9-FSEUOcNrjf8HbC1zxP0hZNWNoyhndiVgLFPSTUw7O7Lvnru6ec_4UfiadbcECznu62_dPvFQqcAtec45a__4aGi6kJseaX_iFqECznu62_dPvFQqcAtec45a__4aGi6kJseaX_iFqEC9P2RU8uQ68dB10a1V-aUMlf9-9imF_FaN_zP4LbJDc7icuIUD_qu_ZaTI-EqxsJh-FQ",
      },
      {
        name: "Aster Bekele",
        date: "Sep 28, 2024",
        rating: 5,
        content:
          "Excellent service. Explained everything clearly before starting. Best in Addis.",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuACoZiPLzz95MnWiTcKwFSDZIsMZdrgjDIRDAIOqrKhbRCGL6qFqAjxRvHPLMkhHDRLtHgIqSwAlAcabY3HJ6Tp2uLQjyed__myy7gGZM4soPbPodDahgHZhXsAx1txGP4Tjv0jV1sdrDTgHkD5r71EUwRTOEkT6lmny6hAzI9b9hHyZ-rm0aXh8W24KqJFLflvC-MXinoXnPwcOPz2JG3stMIbPBiAaSKMMcd0dN8qbqLqsmG7JxoYHmckq-0oVZEa7fj9ew0Jcg",
      },
    ],
  };

  if (!isProfessional) {
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
    <div
      className={`relative flex w-full bg-background-light dark:bg-background-dark font-display text-text-primary dark:text-white ${isProView ? "h-screen overflow-hidden" : "min-h-screen flex-col"}`}
    >
      {isProView && <Sidebar />}
      <div
        className={`flex flex-col flex-1 ${isProView ? "overflow-hidden lg:ml-64" : "w-full"}`}
      >
        {!isProView ? <CustomerNavbar /> : <Header />}
        <main
          className={`flex-1 ${isProView ? "overflow-y-auto custom-scrollbar" : "w-full"}`}
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 py-8">
            <div className="w-full rounded-2xl shadow-soft bg-white dark:bg-card-dark mb-8 border border-border-color dark:border-slate-800">
              <div
                className="h-56 bg-cover bg-center rounded-t-2xl relative group"
                style={{
                  backgroundImage: `url('${user?.cover_image ? getImageUrl(user.cover_image) : professional.coverImage}')`,
                }}
              >
                {isEditing && (
                  <div className="absolute top-4 right-4 z-10">
                    <label className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/20 cursor-pointer flex items-center gap-2 hover:scale-105 transition-all hover:bg-white dark:hover:bg-slate-700">
                      <span className="material-symbols-outlined text-primary">
                        landscape
                      </span>
                      <span className="text-sm font-black text-text-primary dark:text-white">
                        Change Cover
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
              <div className="p-8 pb-12">
                <div className="flex flex-col md:flex-row -mt-32 items-end relative z-10">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-2xl size-40 border-4 border-white dark:border-card-dark shadow-lg relative group overflow-hidden"
                    style={{
                      backgroundImage: `url('${professional.profileImage}')`,
                    }}
                  >
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <label className="cursor-pointer flex flex-col items-center">
                          <span className="material-symbols-outlined text-white text-3xl">
                            photo_camera
                          </span>
                          <span className="text-[10px] text-white font-bold uppercase tracking-widest mt-1">
                            Change
                          </span>
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
                  <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full mt-6 md:mt-0 md:ml-8">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 group/edit">
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => {
                              const isUUID = (str: string) =>
                                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                                  str,
                                );
                              if (!isUUID(e.target.value))
                                setProfileName(e.target.value);
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
                          <span
                            className="material-symbols-outlined text-primary text-2xl"
                            title="Verified Professional"
                          >
                            verified
                          </span>
                        )}
                        {isProView && !isEditing && !isPreviewMode && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900"
                          >
                            <span className="material-symbols-outlined text-sm text-primary">
                              edit
                            </span>
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <select
                          value={profileServiceId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProfileServiceId(val);
                            const matched = serviceCategories.find(c => c.id === val);
                            if (matched) setProfileRole(matched.name);
                          }}
                          className="text-xl font-medium bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-xl px-3 py-1 outline-none mt-3 text-text-secondary dark:text-gray-400 shadow-sm w-full cursor-pointer"
                        >
                          <option value="">Select Category</option>
                          {serviceCategories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xl font-medium text-text-secondary dark:text-gray-400 mt-1">
                          {profileRole || "Professional Specialist"}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-gray-400 mt-3 flex-wrap">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Rating
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className="material-symbols-outlined text-amber-500"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            <span className="text-xl font-black text-slate-900 dark:text-white">
                              {profileRating}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              ({profileReviewsCount})
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Starting Price
                          </p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-primary">
                              {profilePrice || 0}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              ETB
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">
                            work_history
                          </span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={profileExperience}
                              onChange={(e) =>
                                setProfileExperience(e.target.value)
                              }
                              className="w-12 bg-slate-50 dark:bg-slate-800 border-b border-primary outline-none"
                            />
                          ) : (
                            <span>{profileExperience}+ years experience</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-1 max-w-md">
                          <span className="material-symbols-outlined text-base">
                            location_on
                          </span>
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
                      {isProView && isEditing && (
                        <>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="flex h-10 items-center justify-center rounded-full px-6 text-sm font-black transition-all border-2 border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
                          >
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={handleSave}
                            className="flex h-10 items-center justify-center rounded-full px-6 text-sm font-black transition-all bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30"
                          >
                            <span className="material-symbols-outlined mr-2 text-base">
                              save
                            </span>
                            <span>Save Changes</span>
                          </button>
                        </>
                      )}
                      {isProView && !isEditing && (
                        <button
                          onClick={togglePreview}
                          className={`flex h-10 items-center justify-center rounded-full px-6 text-sm font-black transition-all border-2 shadow-md ${isPreviewMode ? "bg-primary text-white border-primary ring-4 ring-primary/20" : "bg-white text-primary border-primary hover:bg-primary/5"}`}
                        >
                          <span className="material-symbols-outlined mr-2 text-base">
                            {isPreviewMode ? "edit_note" : "visibility"}
                          </span>
                          <span>
                            {isPreviewMode
                              ? "Back to Editor"
                              : "See Customer View"}
                          </span>
                        </button>
                      )}
                      {!isProView && (
                        <>
                          {hasAcceptedJob ? (
                            <button
                              onClick={handleChat}
                              className="flex-1 sm:flex-none h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 active:scale-95 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30 ring-4 ring-primary/20 animate-pulse-soft"
                            >
                              <span className="material-symbols-outlined">
                                chat
                              </span>
                              Message Pro
                            </button>
                          ) : (
                            <button
                              onClick={handleEstimateRequest}
                              disabled={estimateRequested}
                              className={`flex-1 sm:flex-none h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${estimateRequested ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-primary text-white hover:bg-primary/90 hover:shadow-primary/30"}`}
                            >
                              <span className="material-symbols-outlined">
                                add
                              </span>
                              {estimateRequested
                                ? "Inquiry Sent"
                                : "Request Estimate"}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const currentFavorites = JSON.parse(
                                localStorage.getItem("user_favorites") || "[]",
                              );
                              let newFavorites;
                              if (!isFavorited) {
                                newFavorites = [...currentFavorites, id];
                              } else {
                                newFavorites = currentFavorites.filter(
                                  (fid: string) => fid !== id,
                                );
                              }
                              localStorage.setItem(
                                "user_favorites",
                                JSON.stringify(newFavorites),
                              );
                              setIsFavorited(!isFavorited);
                            }}
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all ${isFavorited ? "border-red-500 bg-red-50 text-red-500" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark text-text-secondary dark:text-gray-400 hover:text-red-500 hover:border-red-200"}`}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontVariationSettings: isFavorited
                                  ? "'FILL' 1"
                                  : "'FILL' 0",
                              }}
                            >
                              {isFavorited ? "favorite" : "favorite_border"}
                            </span>
                          </button>
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
                      <a
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold text-sm transition-all"
                        href="#about"
                      >
                        <span className="material-symbols-outlined">
                          person
                        </span>
                        <span>About</span>
                      </a>
                      <a
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all font-semibold text-sm"
                        href="#portfolio"
                      >
                        <span className="material-symbols-outlined">
                          grid_view
                        </span>
                        <span>Portfolio</span>
                      </a>

                      <a
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all font-semibold text-sm"
                        href="#availability"
                      >
                        <span className="material-symbols-outlined">
                          calendar_today
                        </span>
                        <span>Availability</span>
                      </a>
                      {(!isProView || isPreviewMode) && (
                        <a
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all font-semibold text-sm"
                          href="#reviews"
                        >
                          <span className="material-symbols-outlined">
                            star
                          </span>
                          <span>Reviews</span>
                        </a>
                      )}
                    </div>
                  </nav>
                </div>
              </aside>

              <div className="flex-1 flex flex-col gap-8">
                <section
                  className="p-8 rounded-2xl shadow-soft bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 scroll-mt-28"
                  id="about"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-text-primary dark:text-white">
                      About {profileName.split(" ")[0]}
                    </h2>
                    {isProView && !isEditing && !isPreviewMode && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>{" "}
                        Edit
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
                        <span className="material-symbols-outlined text-primary">
                          bolt
                        </span>{" "}
                        Skills
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
                          profileSkills
                            .split(",")
                            .map((skill: string) => skill.trim())
                            .filter(Boolean)
                            .map((skill: string) => (
                              <span
                                key={skill}
                                className="px-4 py-1.5 text-sm rounded-full bg-primary/5 text-primary font-semibold border border-primary/10"
                              >
                                {skill}
                              </span>
                            ))
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-text-primary dark:text-white">
                        <span className="material-symbols-outlined text-primary">
                          contact_phone
                        </span>{" "}
                        Contact Info
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <span className="material-symbols-outlined text-text-secondary">
                            call
                          </span>
                          <p className="text-xs text-text-secondary dark:text-gray-500 font-bold uppercase tracking-wider">
                            Phone Number
                          </p>
                          <p className="text-text-primary dark:text-white font-bold">
                            {profilePhone
                              ? profilePhone
                              : isProView
                                ? "Add phone in settings"
                                : "Not shared yet"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <span className="material-symbols-outlined text-text-secondary">
                            location_on
                          </span>
                          <div>
                            <p className="text-xs text-text-secondary dark:text-gray-500 font-bold uppercase tracking-wider">
                              Base Location
                            </p>
                            <p className="text-text-primary dark:text-white font-bold">
                              {profileLocation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-text-primary dark:text-white">
                        <span className="material-symbols-outlined text-primary">
                          translate
                        </span>{" "}
                        Languages
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <textarea
                            value={profileLanguages.join(", ")}
                            onChange={(e) =>
                              setProfileLanguages(
                                e.target.value.split(",").map((l) => l.trim()),
                              )
                            }
                            placeholder="English (Fluent), Amharic (Native)..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-xl p-3 outline-none text-sm text-text-secondary"
                          />
                        ) : (
                          profileLanguages.map((lang: string) => (
                            <span
                              key={lang}
                              className="px-4 py-1.5 text-sm rounded-full bg-slate-100 dark:bg-slate-800 text-text-primary dark:text-white font-semibold border border-slate-200 dark:border-slate-700"
                            >
                              {lang}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {(profilePortfolio.length > 0 || isProView) && (
                  <section
                    className="p-8 rounded-2xl shadow-soft bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 scroll-mt-28"
                    id="portfolio"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                            photo_library
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary dark:text-white">
                          Portfolio & Certifications
                        </h2>
                      </div>
                      {isProView && (
                        <button
                          onClick={() => setIsPortfolioModalOpen(true)}
                          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-base">
                            add
                          </span>
                          Add Work
                        </button>
                      )}
                    </div>

                    {profilePortfolio.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {profilePortfolio.map((item, index) => (
                          <div
                            key={index}
                            className="group relative rounded-2xl overflow-hidden border border-border-color dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                          >
                            {item.type === "file" ||
                            item.img?.endsWith(".pdf") ? (
                              <div className="aspect-video flex flex-col items-center justify-center p-6 text-center">
                                <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-2xl mb-3">
                                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-4xl">
                                    description
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-text-primary dark:text-white line-clamp-1 px-4">
                                  {item.title}
                                </p>
                                <p className="text-xs text-text-secondary dark:text-gray-400 mt-1 uppercase">
                                  Document File
                                </p>
                              </div>
                            ) : (
                              <img
                                src={item.img || item.url}
                                alt={item.title}
                                className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                              <p className="text-white font-medium text-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                {item.title}
                              </p>
                              <button className="mt-3 text-white/80 text-sm hover:text-white flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                View Full Size{" "}
                                <span className="material-symbols-outlined text-sm">
                                  open_in_new
                                </span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                        <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 mb-4 font-light">
                          collections
                        </span>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                          No portfolio items added yet.
                        </p>
                        {isProView && (
                          <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">
                            Upload photos of your past work to attract more
                            clients.
                          </p>
                        )}
                      </div>
                    )}
                  </section>
                )}

                <section
                  className="p-8 rounded-2xl shadow-soft bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 scroll-mt-28"
                  id="availability"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-text-primary dark:text-white">
                      Availability Calendar
                    </h2>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-tighter">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></div>
                        <span className="text-text-secondary dark:text-gray-400">
                          Available
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                        <span className="text-text-secondary dark:text-gray-400">
                          Booked
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        <span className="text-text-secondary dark:text-gray-400">
                          Unavailable
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full">
                    {(() => {
                      // Calendar Logic
                      const daysInMonth = new Date(
                        calendarView.year,
                        calendarView.month + 1,
                        0,
                      ).getDate();
                      const firstDayOfMonth = new Date(
                        calendarView.year,
                        calendarView.month,
                        1,
                      ).getDay();

                      // Previous month filler
                      const prevMonthLastDay = new Date(
                        calendarView.year,
                        calendarView.month,
                        0,
                      ).getDate();
                      const prevMonthDays = [];
                      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
                        prevMonthDays.push(prevMonthLastDay - i);
                      }

                      return (
                        <>
                          <div className="flex justify-between items-center mb-6 px-4">
                            <button
                              onClick={() => {
                                const isCurrentMonth =
                                  calendarView.month === now.getMonth() &&
                                  calendarView.year === now.getFullYear();
                                if (isCurrentMonth) return; // Prevent going back from present month
                                setCalendarView((prev) =>
                                  prev.month === 0
                                    ? { month: 11, year: prev.year - 1 }
                                    : { ...prev, month: prev.month - 1 },
                                );
                              }}
                              disabled={
                                calendarView.month === now.getMonth() &&
                                calendarView.year === now.getFullYear()
                              }
                              className={`p-2.5 rounded-full transition-colors border shadow-sm ${calendarView.month === now.getMonth() && calendarView.year === now.getFullYear() ? "opacity-20 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
                            >
                              <span className="material-symbols-outlined text-xl text-text-primary dark:text-white">
                                chevron_left
                              </span>
                            </button>
                            <h3 className="font-extrabold text-xl text-text-primary dark:text-white">
                              {monthNames[calendarView.month]}{" "}
                              {calendarView.year}
                            </h3>
                            <button
                              onClick={() =>
                                setCalendarView((prev) =>
                                  prev.month === 11
                                    ? { month: 0, year: prev.year + 1 }
                                    : { ...prev, month: prev.month + 1 },
                                )
                              }
                              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-xl text-text-primary dark:text-white">
                                chevron_right
                              </span>
                            </button>
                          </div>

                          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            {[
                              "SUN",
                              "MON",
                              "TUE",
                              "WED",
                              "THU",
                              "FRI",
                              "SAT",
                            ].map((day) => (
                              <div
                                key={day}
                                className="bg-slate-50 dark:bg-slate-900 py-4 text-center text-xs font-black text-text-secondary dark:text-gray-400"
                              >
                                {day}
                              </div>
                            ))}

                            {/* Previous Month Days Filler (No numbers) */}
                            {prevMonthDays.map((d) => (
                              <div
                                key={`prev-${d}`}
                                className="bg-slate-50/30 dark:bg-slate-900/10 h-28 border-r border-b border-slate-50 dark:border-slate-700/30"
                              ></div>
                            ))}

                            {/* Current Month Days */}
                            {[...Array(daysInMonth)].map((_, i: number) => {
                              const day = i + 1;
                              const dateObj = new Date(
                                calendarView.year,
                                calendarView.month,
                                day,
                              );
                              const dateString = dateObj
                                .toISOString()
                                .split("T")[0];

                              const isToday =
                                day === now.getDate() &&
                                calendarView.month === now.getMonth() &&
                                calendarView.year === now.getFullYear();
                              const isPast =
                                dateObj <
                                new Date(
                                  now.getFullYear(),
                                  now.getMonth(),
                                  now.getDate(),
                                );
                              const isGenerallyAvailable =
                                availableDays.includes(dateObj.getDay());
                              const isBookedByJob =
                                jobDates.includes(dateString);
                              const isManuallyBlocked =
                                blockedDates.includes(dateString);

                              // Logic: Available only if in the present/future, generally available, and not booked or blocked
                              const isAvailable =
                                !isPast &&
                                isGenerallyAvailable &&
                                !isBookedByJob &&
                                !isManuallyBlocked;

                              let bgClass =
                                "bg-white dark:bg-slate-800 hover:bg-primary/5 cursor-pointer";
                              let textClass =
                                "text-text-primary dark:text-white";

                              if (isToday) {
                                bgClass =
                                  "bg-primary/5 dark:bg-primary/10 border-2 border-primary ring-4 ring-primary/5";
                                textClass = "text-primary";
                              } else if (isPast) {
                                bgClass =
                                  "bg-slate-50 dark:bg-slate-900/50 cursor-default grayscale opacity-60";
                                textClass =
                                  "text-text-secondary dark:text-gray-500";
                              } else if (isBookedByJob) {
                                bgClass =
                                  "bg-rose-50 dark:bg-rose-900/10 cursor-not-allowed";
                                textClass = "text-rose-600 font-bold";
                              } else if (isManuallyBlocked) {
                                bgClass =
                                  "bg-slate-50 dark:bg-slate-800/50 cursor-pointer";
                                textClass =
                                  "text-text-secondary dark:text-gray-500";
                              } else if (isAvailable) {
                                bgClass =
                                  "bg-emerald-50/20 dark:bg-emerald-900/5";
                                textClass = "text-emerald-600 font-bold";
                              }

                              return (
                                <div
                                  key={day}
                                  onClick={() =>
                                    isEditing &&
                                    !isPast &&
                                    handleDayToggle(
                                      dateObj.getDay(),
                                      dateString,
                                    )
                                  }
                                  className={`${bgClass} h-28 p-3 transition-all group relative border-r border-b border-slate-50 dark:border-slate-700/30 overflow-hidden ${isPast ? "pointer-events-none" : ""}`}
                                >
                                  <div className="flex justify-between items-start">
                                    <span
                                      className={`text-sm font-black ${textClass}`}
                                    >
                                      {day}
                                    </span>
                                    {isToday && (
                                      <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">
                                        Today
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-4 space-y-1">
                                    {!isPast && isBookedByJob && (
                                      <div className="flex items-center gap-1 text-[9px] text-rose-600 font-black uppercase tracking-tighter bg-rose-100/50 dark:bg-rose-900/20 px-1.5 py-1 rounded-md">
                                        <span
                                          className="material-symbols-outlined text-[10px]"
                                          style={{
                                            fontVariationSettings: "'FILL' 1",
                                          }}
                                        >
                                          event_busy
                                        </span>
                                        Booked
                                      </div>
                                    )}
                                    {!isPast && isManuallyBlocked && (
                                      <div className="flex items-center gap-1 text-[9px] text-slate-500 font-black uppercase tracking-tighter bg-slate-100 dark:bg-slate-700 px-1.5 py-1 rounded-md">
                                        <span className="material-symbols-outlined text-[10px]">
                                          block
                                        </span>
                                        Blocked
                                      </div>
                                    )}
                                    {isAvailable && (
                                      <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-black uppercase tracking-tighter bg-emerald-100/30 dark:bg-emerald-900/20 px-1.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span
                                          className="material-symbols-outlined text-[10px]"
                                          style={{
                                            fontVariationSettings: "'FILL' 1",
                                          }}
                                        >
                                          check_circle
                                        </span>
                                        Available
                                      </div>
                                    )}
                                    {isPast && !isToday && (
                                      <div className="mt-2 text-[10px] text-slate-400 font-medium italic opacity-50">
                                        Past Date
                                      </div>
                                    )}
                                  </div>

                                  {isEditing && !isPast && !isBookedByJob && (
                                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none flex items-center justify-center">
                                      <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all">
                                        {isManuallyBlocked
                                          ? "add_circle"
                                          : "do_not_disturb_on"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Next Month Filler (No numbers) */}
                            {[
                              ...Array(42 - (daysInMonth + firstDayOfMonth)),
                            ].map((_, i) => (
                              <div
                                key={`next-${i}`}
                                className="bg-slate-50/30 dark:bg-slate-900/10 h-28 border-r border-b border-slate-50 dark:border-slate-700/30"
                              ></div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </section>

                {(!isProView || isPreviewMode) && (
                  <section
                    className="p-8 rounded-2xl shadow-soft bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 scroll-mt-28"
                    id="reviews"
                  >
                    <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-4">
                        <div className="size-14 bg-amber-500/10 text-amber-500 rounded-[1.5rem] flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl">
                            star
                          </span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                          Client Testimonials
                        </h2>
                      </div>
                      <div className="flex items-center gap-4">
                        {(!isProView || isPreviewMode) && (
                          <button
                            onClick={() => setIsReviewModalOpen(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                          >
                            <Plus size={18} />
                            Write a Review
                          </button>
                        )}
                        <div className="hidden sm:flex items-center gap-3 px-6 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {profileRating}
                          </span>
                          <div className="flex text-amber-500">
                            <span
                              className="material-symbols-outlined text-xl"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {profileReviewsCount > 0 ? (
                        <div className="glass-panel p-8 rounded-[3rem] border border-white/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 shadow-xl group hover:-translate-y-2 transition-transform duration-500">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-primary text-lg">
                              C
                            </div>
                            <div>
                              <h4 className="font-black text-slate-800 dark:text-white">
                                Recent Customer
                              </h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Completed via Fix-Link
                              </p>
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-gray-400 text-base leading-relaxed mb-6 font-medium italic">
                            "Exceptional quality of work and very professional
                            communication throughout the project."
                          </p>
                          <div className="flex text-amber-500 gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className="material-symbols-outlined text-sm"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="col-span-full py-20 text-center space-y-4 bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                          <span className="material-symbols-outlined text-5xl text-slate-300">
                            star
                          </span>
                          <p className="text-slate-400 font-medium">
                            No testimonials authenticated yet.
                          </p>
                        </div>
                      )}
                    </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                Add Work to Portfolio
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Showcase your past projects to customers.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">
                    Description / Title
                  </label>
                  <textarea
                    value={newPortfolioTitle}
                    onChange={(e) => setNewPortfolioTitle(e.target.value)}
                    placeholder="e.g. Installed a new electrical panel..."
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-slate-800 dark:text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">
                    Attachment (Optional)
                  </label>
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <span className="material-symbols-outlined text-2xl">
                        {newPortfolioFile ? "draft" : "upload_file"}
                      </span>
                      <span className="text-sm font-bold">
                        {newPortfolioFile
                          ? newPortfolioFile.name
                          : "Click to upload image or PDF"}
                      </span>
                    </div>
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

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsPortfolioModalOpen(false);
                  setNewPortfolioTitle("");
                  setNewPortfolioFile(null);
                }}
                className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPortfolio}
                disabled={!newPortfolioTitle.trim() && !newPortfolioFile}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Review Modal */}
      {isReviewModalOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsReviewModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-card-dark rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <StarIcon size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Rate & Review</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Share your experience</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReviewModalOpen(false)}
                  className="p-2 hover:bg-white/50 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="text-center space-y-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">How was the service?</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`transition-all duration-300 hover:scale-125 ${reviewRating >= star ? 'text-amber-500' : 'text-slate-200 dark:text-slate-700'}`}
                    >
                      <StarIcon 
                        size={40} 
                        fill={reviewRating >= star ? "currentColor" : "none"} 
                        strokeWidth={2.5}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-lg font-black text-slate-800 dark:text-white">
                  {['Poor', 'Fair', 'Good', 'Very Good', 'Exceptional'][reviewRating - 1]}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Write your review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us what you liked or what could be improved..."
                  className="w-full h-32 px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-amber-500/50 transition-colors text-sm font-medium resize-none placeholder:text-slate-400"
                ></textarea>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="flex-1 py-4 text-sm font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!reviewComment.trim() || isSubmittingReview}
                className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Post Review
                    <ChevronRight size={18} />
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
