import { useRef, useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { markNotificationAsRead, markAllAsRead, type Notification } from "../../../../api/notifications.api";
import { useData } from "../../../../context/DataContext";
import { getImageUrl } from "../../../../api/auth.api";
import { useTheme } from "../../../../context/ThemeContext";
import { 
    Bell, 
    BellOff, 
    Clock, 
    Menu, 
    ChevronDown, 
    Sun, 
    Moon, 
    Settings, 
    LogOut
} from 'lucide-react';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { notifications, refreshNotifications } = useData();
    const { theme, toggleTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const unreadNotifications = notifications.filter(n => !n.is_read);

    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const getDescriptiveMessage = (n: Notification) => {
        // Build the best possible human-readable message from type + sender
        const who = n.sender_name && n.sender_name.trim() ? n.sender_name.trim() : null;
        const type = (n.type || '').toLowerCase();

        if (type.includes('job_request') || type.includes('new_job') || type.includes('new_request')) {
            return who ? `New job request from ${who}` : 'You received a new job request';
        }
        if (type.includes('accepted')) {
            return who ? `${who} accepted your services` : 'Your services were accepted';
        }
        if (type.includes('completed') || type.includes('done')) {
            return who ? `${who} confirmed job completion` : 'A job was marked as complete';
        }
        if (type.includes('message') || type.includes('msg') || type.includes('chat')) {
            return who ? `New message from ${who}` : 'You have a new message';
        }
        if (type.includes('cancelled') || type.includes('declined')) {
            return who ? `${who} declined the request` : 'A request was declined';
        }

        // If backend message is useful (not generic), show it
        const raw = (n.message || '').trim();
        const isGeneric = !raw || raw === 'New Notification' || raw === 'you have update' || raw.length < 5;
        if (!isGeneric) return raw;

        return 'You have a new update';
    };


    return (
        <header className="sticky top-0 z-[100] flex items-center justify-between bg-white/70 dark:bg-slate-900/70 px-6 py-4 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">

            {/* LEFT */}
            <div className="flex items-center gap-3">
                <button className="lg:hidden">
                    <Menu size={24} />
                </button>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight hidden sm:block">Dashboard</h2>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-4">

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Bell size={20} />
                        {unreadNotifications.length > 0 && (
                            <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                                {unreadNotifications.length}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                             <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                                <span className="font-black text-sm text-gray-900 dark:text-white">Recent Alerts</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{unreadNotifications.length} New</span>
                                    {unreadNotifications.length > 0 && (
                                        <button
                                            onClick={() => {
                                                markAllAsRead().then(() => refreshNotifications()).catch(() => refreshNotifications());
                                            }}
                                            title="Mark all as read"
                                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">done_all</span>
                                        </button>
                                    )}
                                </div>
                             </div>
                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="px-8 py-12 text-center">
                                        <BellOff size={40} className="text-slate-300 mb-3" />
                                        <p className="text-slate-400 text-sm font-medium">No alerts yet</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div 
                                            key={n.id}
                                            className={`px-5 py-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/-[0.02]' : ''}`}
                                            onClick={async () => {
                                                setShowNotifications(false);
                                                // Mark as read first (don't block navigation on failure)
                                                markNotificationAsRead(n.id).then(() => {
                                                    refreshNotifications();
                                                }).catch(err => {
                                                    refreshNotifications();
                                                    console.warn("Mark-as-read failed, refreshing notifications:", err);
                                                });
                                                // Navigate — prioritise conversation_id for reliable deep linking
                                                const linkTarget = (() => {
                                                  console.log("Professional notification click data:");
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
                                                    return `/professional/messages?conversationId=${n.conversation_id}`;
                                                  }
                                                  if (n.message_session_id) {
                                                    return `/professional/messages?messageSessionId=${n.message_session_id}`;
                                                  }
                                                  if (n.job_id) {
                                                    return `/professional/messages?requestId=${n.job_id}`;
                                                  }
                                                  if (n.message_id) {
                                                    return `/professional/messages?requestId=${n.message_id}`;
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
                                                  return '/professional/messages';
                                                })();

                                                console.log("Professional notification navigating to:", linkTarget);
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
                                                        <Clock size={12} />
                                                        {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
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

                {/* PROFILE */}
                <div className="relative" ref={profileMenuRef}>
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                            <img
                                src={getImageUrl(user?.profilePhoto || (user as any)?.profile_picture) || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="hidden sm:flex flex-col items-start pr-2">
                            <span className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">
                                {(() => {
                                    const name = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name || "Member";
                                    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                                    return isUUID(name) ? "Member" : name;
                                })()}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded italic">Professional</span>
                        </div>
                        <ChevronDown 
                            size={18} 
                            className={`hidden sm:block text-slate-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} 
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                        <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                             <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/50 block sm:hidden">
                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                                    {(() => {
                                        const name = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name || "Member";
                                        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                                        return isUUID(name) ? "Member" : name;
                                    })()}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{user?.email}</p>
                            </div>

                            <div className="py-2">
                                {/* Dark Mode Toggle */}
                                <button
                                    onClick={toggleTheme}
                                    className="w-full flex items-center justify-between px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {theme === 'dark' ? <Sun size={18} className="text-slate-400" /> : <Moon size={18} className="text-slate-400" />}
                                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                    </div>
                                    <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>

                                <Link
                                    to="/account-settings"
                                    onClick={() => setShowProfileMenu(false)}
                                    className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-text-primary dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Settings size={18} className="text-slate-400" />
                                    Account Setting
                                </Link>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 transition-colors text-red-500"
                                >
                                    <LogOut size={18} />
                                    Signout
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};

export default Header;
