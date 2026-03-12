import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { getServiceCategories } from "../../../../api/jobs.api";

const LOCATIONS = [
  "Addis Ababa",
  "Adama",
  "Bahir Dar",
  "Hawassa",
  "Gondar",
  "Mekelle",
  "Dire Dawa",
  "Jimma",
  "Bishoftu",
  "Dessie"
];

const CustomerNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Search State
  const [location, setLocation] = useState("Addis Ababa");
  const [service, setService] = useState("All Services");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // TODO: Implement backend notifications
  const notifications: any[] = [];
  const unreadNotifications: any[] = [];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getServiceCategories();
        console.log("CustomerNavbar: Fetched categories:", data);
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = () => {
    // Navigate to search page with query params
    const params = new URLSearchParams();
    if (service && service !== "All Services") params.append("service", service);
    if (location) params.append("location", location);
    navigate(`/customer/search?${params.toString()}`);
  };

  const filteredLocations = LOCATIONS.filter(loc =>
    loc.toLowerCase().includes(location.toLowerCase())
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-color px-4 sm:px-6 lg:px-10 py-3 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm">
      <div className="flex items-center gap-4 text-text-primary dark:text-white">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-lg font-bold tracking-tight hidden xl:block text-text-primary dark:text-white">Fix-Link</span>
        </div>

        {/* DEV ONLY ROLE SWITCHER */}
        <button
          onClick={() => navigate('/professional/home')}
          className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded border border-amber-200 hover:bg-amber-200 transition-colors hidden md:block"
        >
          SWITCH TO PRO (DEV)
        </button>
      </div>

      {/* Search Bar - Keeping the one we added but wrapping it similarly or adjusting if needed. 
           Wait, SearchResults header has the logo on the left and then action buttons on the right. 
           The User's specific HTML requested a center search bar. 
           I will keep the Center Search Bar but update the styling of the nav container and the right-side icons as requested.
        */}

      <div className="flex-1 max-w-2xl mx-4">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 p-1 shadow-sm relative z-50">
          <div className="relative flex-[0.8] hidden sm:block">
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-xs font-semibold py-1 pl-4 pr-8 text-slate-700 dark:text-slate-300 cursor-pointer appearance-none"
            >
              <option>All Services</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
          </div>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 hidden sm:block mx-1"></div>
          <div className="relative flex-1 flex items-center" ref={suggestionRef}>
            <span className="material-symbols-outlined absolute left-3 text-slate-400 text-base">location_on</span>
            <input
              className="w-full bg-transparent border-none focus:ring-0 text-xs py-1 pl-9 pr-4 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
              placeholder="Addis Ababa, Ethiopia"
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />

            {/* Location Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-border-color dark:border-slate-700 overflow-hidden py-1 max-h-60 overflow-y-auto w-full min-w-[200px] z-[60]">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocation(loc);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-slate-400 text-sm">location_on</span>
                      {loc}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-text-secondary dark:text-gray-400">No locations found</div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="bg-primary hover:bg-[#2559a1] text-white w-8 h-8 rounded-full transition-all flex items-center justify-center shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">search</span>
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex flex-1 justify-end gap-2 sm:gap-4 items-center">
        <Link to="/customer/home" className="hidden sm:flex items-center gap-2 text-text-primary dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-semibold px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-xl">grid_view</span>
          <span>Dashboard</span>
        </Link>
        <Link to="/customer/messages/1" className="hidden sm:flex items-center gap-2 text-text-primary dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-semibold px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-xl">chat_bubble</span>
          <span>Messages</span>
        </Link>
        <a href="#" className="hidden sm:flex items-center gap-2 text-text-primary dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-semibold px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-xl">calendar_month</span>
          <span>Bookings</span>
        </a>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-transparent text-text-primary dark:text-white hover:bg-background-light dark:hover:bg-white/10 transition-colors relative"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {unreadNotifications.length > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 text-[10px] text-white flex items-center justify-center font-bold">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[60]">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="font-bold text-sm text-text-primary dark:text-white">Notifications</span>
                <span className="text-xs text-primary font-medium">{unreadNotifications.length} New</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.filter(n => n.userId === user?.id || n.userId === user?.name).length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications yet</div>
                ) : (
                  notifications.filter(n => n.userId === user?.id || n.userId === user?.name).map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${!n.isRead ? 'bg-primary/5' : ''}`}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(`/customer/messages/1`);
                      }}
                    >
                      <p className={`text-sm ${!n.isRead ? 'font-bold text-text-primary dark:text-white' : 'font-medium text-text-secondary dark:text-gray-400'}`}>{n.message}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[10px] text-primary font-bold">View →</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Trigger */}
        <div className="relative group">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-border-color cursor-pointer hover:ring-2 hover:ring-primary/30 transition">
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src={user?.profilePhoto || "https://i.pravatar.cc/150?img=12"}
            />
          </div>
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hidden group-hover:block">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>

            <div className="py-1">
              <Link
                to={`/customer/profile/${user?.id || 'me'}`}
                className="flex items-center gap-2 px-4 py-3 text-sm text-text-primary dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">person</span>
                View Profile
              </Link>
              <Link
                to="/account-settings"
                className="flex items-center gap-2 px-4 py-3 text-sm text-text-primary dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">settings</span>
                Account Settings
              </Link>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 py-1">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CustomerNavbar;
