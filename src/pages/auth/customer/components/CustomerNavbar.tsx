import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { getServiceCategories } from "../../../../api/jobs.api";
import { markNotificationAsRead, markAllAsRead, type Notification } from "../../../../api/notifications.api";
import { useData } from "../../../../context/DataContext";
import { getImageUrl } from "../../../../api/auth.api";
import { useTheme } from "../../../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../../../components/LanguageSwitcher";
import {
  ChevronDown, MapPin, Navigation, ArrowRight, SearchX, Search,
  LayoutDashboard, MessageSquare, Calendar, Bell, BellOff, Clock, Settings, LogOut, Sparkles, PlusCircle, Briefcase
} from "lucide-react";

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
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

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
            return t('common.pro_accepted_req');
        case 'job_completed':
            return t('common.pro_marked_done');
        case 'message':
        case 'new_message':
            return t('common.new_msg_from_pro');
        default:
            return t('common.new_update_project');
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
    <nav className="sticky top-0 z-[100] flex items-center justify-between border-b border-white/20 dark:border-slate-800/50 px-4 sm:px-6 lg:px-10 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-4 text-slate-900 dark:text-white">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 cursor-pointer group" onClick={() => navigate('/')}>
          <span className="text-xl font-display font-black tracking-tight hidden xl:block text-slate-900 dark:text-white group-hover:text-primary transition-colors">{t('common.logo')}</span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-4 hidden lg:block relative z-[100]">
        <div className="flex h-[52px] w-full items-center rounded-[26px] bg-white dark:bg-slate-900/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-700/50 hover:shadow-[0_8px_30px_-4px_rgba(var(--primary-rgb),0.2)] focus-within:shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.15)] focus-within:border-primary transition-all duration-500 pr-2 pl-3">
          
          <div className="relative flex-[0.35] hidden sm:block h-full group">
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-[14px] font-black pl-4 pr-10 text-slate-800 dark:text-slate-100 cursor-pointer appearance-none outline-none group-hover:text-primary transition-colors [appearance:none] [&::-ms-expand]:hidden"
            >
              <option className="bg-white dark:bg-slate-900" value="All Services">{t('categories.All Services')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name} className="bg-white dark:bg-slate-900">{t(`categories.${cat.name}`, { defaultValue: cat.name })}</option>
              ))}
            </select>
            <ChevronDown size={14} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors pointer-events-none" />
            <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-slate-200 dark:bg-slate-700/50"></div>
          </div>
          
          <div className="flex flex-1 items-center px-5 relative h-full cursor-text group" onClick={() => {
              const input = document.getElementById('navbar-location-input');
              input?.focus();
          }}>
            <MapPin size={18} strokeWidth={2.5} className="text-slate-400 group-focus-within:text-primary transition-colors mr-3" />
            <div className="relative flex-1 h-full flex items-center" ref={suggestionRef}>
              <input
                id="navbar-location-input"
                className="w-full h-full bg-transparent border-none focus:ring-0 text-[14px] font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none"
                placeholder={t('common.where_need_service')}
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
                <div className="absolute top-[calc(100%+20px)] left-[-50px] right-[-50px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.2)] border border-white/60 dark:border-slate-700/50 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="px-8 py-5 border-b border-slate-100/50 dark:border-slate-700/50 flex items-center justify-between relative z-10">
                    <span className="text-[11px] font-black text-primary dark:text-primary tracking-[0.2em] uppercase flex items-center gap-2">
                       <Sparkles size={14} className="animate-pulse" /> {t('common.popular_recommendations')}
                    </span>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar py-3 relative z-10">
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((loc, idx) => (
                        <button
                          key={loc}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(loc);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-8 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-all duration-300 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                             <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                               <Navigation size={16} strokeWidth={2.5} className="text-slate-400 group-hover:text-primary transition-colors" />
                             </div>
                             <div>
                                 <span className="text-[14px] font-black text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors block">{loc}</span>
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{idx < 3 ? t('common.trending') : t('common.matches_query')}</span>
                             </div>
                          </div>
                          <ArrowRight size={16} strokeWidth={3} className="text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
                        </button>
                      ))
                    ) : (
                      <div className="px-8 py-12 text-center">
                        <div className="size-16 rounded-[24px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                           <SearchX size={28} className="text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500 font-black tracking-tight">{t('common.no_locations_found')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleSearch}
            className="flex h-[40px] px-6 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-light text-white font-black uppercase tracking-widest text-[11px] hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 shrink-0 gap-2 overflow-hidden relative group/searchbtn"
          >
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover/searchbtn:duration-1000 group-hover/searchbtn:[transform:skew(-12deg)_translateX(100%)]">
               <div className="relative h-full w-4 bg-white/30"></div>
            </div>
            <span>{t('common.search')}</span>
            <Search size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex flex-1 justify-end gap-1 sm:gap-2 items-center">
        <Link to="/customer/home" className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 transition-all font-bold px-3 py-2 rounded-xl" title={t('common.dashboard')}>
          <LayoutDashboard size={18} />
          <span className="hidden xl:inline">{t('common.dashboard')}</span>
        </Link>
        <Link to="/customer/jobs" className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 transition-all font-bold px-3 py-2 rounded-xl" title={t('common.jobs')}>
          <Briefcase size={18} />
          <span className="hidden xl:inline">{t('common.jobs')}</span>
        </Link>
        <Link to="/customer/messages" className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 transition-all font-bold px-3 py-2 rounded-xl" title={t('common.messages')}>
          <MessageSquare size={18} />
          <span className="hidden xl:inline">{t('common.messages')}</span>
        </Link>
        <Link to="/customer/bookings" className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 transition-all font-bold px-3 py-2 rounded-xl" title={t('common.bookings')}>
          <Calendar size={18} />
          <span className="hidden xl:inline">{t('common.bookings')}</span>
        </Link>
        <LanguageSwitcher />

        {/* Notifications */}
        <div className="relative ml-2" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex items-center justify-center rounded-2xl h-11 w-11 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors relative"
          >
            <Bell size={20} strokeWidth={2.5} className={(unreadNotifications.length > 0 && !showNotifications) ? "animate-pulse text-primary" : ""} />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 text-[9px] text-white flex items-center justify-center font-black shadow-sm">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/40 dark:border-slate-700/50 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-6 py-4 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{t('common.notifications')}</span>
                <div className="flex items-center gap-2">
                  {unreadNotifications.length > 0 && <span className="text-[9px] bg-primary/10 text-primary px-2 py-1 rounded-full font-black uppercase tracking-widest">{unreadNotifications.length} {t('common.new')}</span>}
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={() => {
                        markAllAsRead().then(() => refreshNotifications()).catch(() => refreshNotifications());
                      }}
                      title="Mark all as read"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">done_all</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="px-8 py-16 text-center">
                    <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                       <BellOff size={28} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm font-bold tracking-tight">{t('common.all_caught_up')}</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}
                      onClick={async () => {
                        setShowNotifications(false);
                        markNotificationAsRead(n.id).then(() => {
                          refreshNotifications();
                        }).catch(() => {
                          refreshNotifications();
                        });

                        const linkTarget = (() => {
                          if (n.conversation_id) return `/customer/messages?conversationId=${n.conversation_id}`;
                          if (n.message_session_id) return `/customer/messages?messageSessionId=${n.message_session_id}`;
                          if (n.job_id) return `/customer/messages?requestId=${n.job_id}`;
                          if (n.message_id) return `/customer/messages?requestId=${n.message_id}`;
                          if (n.link) {
                            try {
                              const parsed = new URL(n.link, window.location.origin);
                              const isMessagePath = parsed.pathname.includes('/messages');
                              const hasChatParam = ['conversationId', 'requestId', 'messageSessionId'].some(p => parsed.searchParams.has(p));
                              if (isMessagePath || hasChatParam) return n.link;
                            } catch (err) {}
                          }
                          return '/customer/messages';
                        })();
                        navigate(linkTarget);
                      }}
                    >
                      <div className="flex gap-4">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm ${!n.is_read ? 'bg-primary shadow-primary/50' : 'bg-transparent'}`}></div>
                        <div className="flex-1">
                           <p className={`text-sm leading-snug whitespace-normal ${!n.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                             {getDescriptiveMessage(n)}
                           </p>
                           <p className="text-[10px] text-slate-400 mt-2 font-bold flex items-center gap-1 uppercase tracking-wider">
                             <Clock size={10} />
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
        <div className="relative ml-2" ref={profileMenuRef}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all shadow-sm"
          >
            <img
              alt="User"
              className="w-full h-full object-cover"
              src={getImageUrl(user?.profilePhoto || (user as any)?.profile_picture) || "https://www.gravatar.com/avatar/0?d=mp&f=y"}
            />
          </div>
          
          {showProfileMenu && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 dark:border-slate-700/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
              <div className="px-6 py-5 border-b border-slate-100/50 dark:border-slate-800/50 bg-primary/5">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name || "Member"}</p>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate mt-1">{user?.email}</p>
              </div>

              <div className="p-2 space-y-1">
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
                    <span>{theme === 'dark' ? t('common.light_mode') : t('common.dark_mode')}</span>
                  </div>
                  <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-1 mx-2"></div>
                <Link
                  to="/account-settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                >
                  <Settings size={16} strokeWidth={2.5} className="text-slate-400 group-hover:text-primary transition-colors" />
                  {t('common.settings')}
                </Link>

                <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-2 mx-2"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors group"
                >
                  <LogOut size={16} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
                  {t('common.logout')}
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
