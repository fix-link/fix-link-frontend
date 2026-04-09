import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { getServiceCategories } from "../../../../api/jobs.api";
import { markNotificationAsRead, type Notification } from "../../../../api/notifications.api";
import { useData } from "../../../../context/DataContext";
import { getImageUrl } from "../../../../api/auth.api";

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Notification State
  const { notifications, refreshNotifications } = useData();
  const unreadNotifications = notifications.filter(n => !n.is_read);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getServiceCategories();
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

  const getDescriptiveMessage = (n: Notification) => {
    if (n.message && n.message !== "New Notification") return n.message;
    
    switch (n.type?.toLowerCase()) {
        case 'job_accepted':
        case 'request_accepted':
            return "Professional accepted your request";
        case 'job_completed':
            return "A professional marked your job as done";
        case 'message':
        case 'new_message':
            return "New message from professional";
        default:
            return "New update on your project";
    }
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
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-[100] flex items-center justify-between whitespace-nowrap border-b border-solid border-border-color px-4 sm:px-6 lg:px-10 py-3 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm">
      <div className="flex items-center gap-4 text-text-primary dark:text-white">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-lg font-bold tracking-tight hidden xl:block text-text-primary dark:text-white">Fix-Link</span>
        </div>

      </div>

      {/* Search Bar - Keeping the one we added but wrapping it similarly or adjusting if needed. 
           Wait, SearchResults header has the logo on the left and then action buttons on the right. 
           The User's specific HTML requested a center search bar. 
           I will keep the Center Search Bar but update the styling of the nav container and the right-side icons as requested.
        */}

      <div className="flex-1 max-w-xl mx-4 hidden lg:block">
        <div className="flex h-11 w-full items-center self-center overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
          <div className="relative flex-[0.4] hidden sm:block h-full">
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-xs font-bold pl-5 pr-8 text-slate-700 dark:text-slate-300 cursor-pointer appearance-none"
            >
              <option>All Services</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="flex flex-1 items-center px-4 relative h-full">
            <span className="material-symbols-outlined text-slate-400 text-lg mr-2">location_on</span>
            <div className="relative flex-1 h-full flex items-center" ref={suggestionRef}>
              <input
                className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold py-1 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                placeholder="Search location..."
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
                <div className="absolute top-[calc(100%+12px)] left-[-40px] right-[-40px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 dark:border-slate-800/50 overflow-hidden z-[70] animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-6 py-4 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Popular Locations</span>
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-sm">location_city</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar py-2">
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => {
                            setLocation(loc);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-6 py-3.5 hover:bg-primary/5 group transition-all duration-200 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-lg transition-colors">near_me</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">{loc}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Ethiopia</p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-sm">arrow_forward</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-8 py-10 text-center">
                        <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                           <span className="material-symbols-outlined text-slate-300">search_off</span>
                        </div>
                        <p className="text-sm text-slate-400 font-bold italic">No matching locations found</p>
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100/50 dark:border-slate-800/50">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Quickly select a major city in Ethiopia</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="flex h-full items-center justify-center bg-primary px-5 text-white hover:bg-primary/90 transition-colors group h-full"
          >
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">search</span>
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
        <Link to="/customer/bookings" className="hidden sm:flex items-center gap-2 text-text-primary dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-semibold px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-xl">calendar_month</span>
          <span>Bookings</span>
        </Link>
        <div className="relative" ref={notificationRef}>
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
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <span className="font-black text-sm text-text-primary dark:text-white">Notifications</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{unreadNotifications.length} New</span>
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="px-8 py-12 text-center">
                    <span className="material-symbols-outlined text-slate-300 text-4xl mb-3">notifications_off</span>
                    <p className="text-slate-400 text-sm font-medium">Nothing to see here yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`px-5 py-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/-[0.02]' : ''}`}
                      onClick={async () => {
                        setShowNotifications(false);
                        // Mark as read non-blocking and refresh shared notifications
                        markNotificationAsRead(n.id).then(() => {
                          refreshNotifications();
                        }).catch(() => {
                          refreshNotifications();
                        });

                        const linkTarget = (() => {
                          console.log("Customer notification click data:");
                          console.table({
                            id: n.id,
                            conversation_id: n.conversation_id,
                            message_session_id: n.message_session_id,
                            job_id: n.job_id,
                            message_id: n.message_id,
                            link: n.link,
                            title: n.title,
                            body: n.body
                          });

                          if (n.conversation_id) {
                            return `/customer/messages?conversationId=${n.conversation_id}`;
                          }
                          if (n.message_session_id) {
                            return `/customer/messages?messageSessionId=${n.message_session_id}`;
                          }
                          if (n.job_id) {
                            return `/customer/messages?requestId=${n.job_id}`;
                          }
                          if (n.message_id) {
                            return `/customer/messages?requestId=${n.message_id}`;
                          }
                          if (n.link) {
                            try {
                              const parsed = new URL(n.link, window.location.origin);
                              const isMessagePath = parsed.pathname.includes('/messages');
                              const hasChatParam = parsed.searchParams.has('conversationId') || parsed.searchParams.has('requestId') || parsed.searchParams.has('messageSessionId');
                              if (isMessagePath || hasChatParam) return n.link;
                            } catch (err) {
                              // ignore invalid URLs and fall back
                            }
                          }
                          return '/customer/messages';
                        })();

                        console.log("Customer notification navigating to:", linkTarget);
                        navigate(linkTarget);
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-transparent'}`}></div>
                        <div className="flex-1">
                           <p className={`text-sm leading-snug ${!n.is_read ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-gray-400'}`}>
                             {getDescriptiveMessage(n)}
                           </p>
                           <p className="text-[10px] text-slate-400 mt-1.5 font-bold flex items-center gap-1">
                             <span className="material-symbols-outlined text-[12px]">schedule</span>
                             {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                           </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Trigger */}
        <div className="relative" ref={profileMenuRef}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full overflow-hidden border border-border-color cursor-pointer hover:ring-2 hover:ring-primary/30 transition"
          >
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src={getImageUrl(user?.profilePhoto || (user as any)?.profile_picture) || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
            />
          </div>
          {/* Dropdown Content */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/50">
                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name || "Member"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
              </div>

              <div className="py-2">
                <Link
                  to="/account-settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-text-primary dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl text-slate-400">settings</span>
                  Account Setting
                </Link>

                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 transition-colors text-red-500"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  Signout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default CustomerNavbar;
