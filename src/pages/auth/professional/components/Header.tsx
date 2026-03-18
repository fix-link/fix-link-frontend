import React, { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { getNotifications, type Notification } from "../../../../api/notifications.api";
import { getImageUrl } from "../../../../api/auth.api";
import { useRef, useEffect } from "react";

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const unreadNotifications = notifications.filter(n => !n.is_read);

    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getNotifications();
                setNotifications(data);
            } catch (err) {
                console.error("Header: Failed to fetch notifications:", err);
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);

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
            clearInterval(interval);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 px-6 py-4 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">

            {/* LEFT */}
            <div className="flex items-center gap-3">
                <button className="lg:hidden">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h2 className="text-2xl font-bold">Dashboard</h2>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-4">

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <span className="material-symbols-outlined">notifications</span>
                        {unreadNotifications.length > 0 && (
                            <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                                {unreadNotifications.length}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                             <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                                <span className="font-black text-sm text-gray-900 dark:text-white">Recent Alerts</span>
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{unreadNotifications.length} New</span>
                            </div>
                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="px-8 py-12 text-center">
                                        <span className="material-symbols-outlined text-slate-300 text-4xl mb-3">notifications_off</span>
                                        <p className="text-slate-400 text-sm font-medium">No alerts yet</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div 
                                            key={n.id}
                                            className={`px-5 py-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/-[0.02]' : ''}`}
                                            onClick={() => {
                                                setShowNotifications(false);
                                                if (n.link) navigate(n.link);
                                            }}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-transparent'}`}></div>
                                                <div className="flex-1">
                                                    <p className={`text-sm leading-snug ${!n.is_read ? 'font-black text-text-primary dark:text-white' : 'font-medium text-text-secondary dark:text-gray-400'}`}>{n.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 font-bold">{n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</p>
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
                            <span className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name || "Member"}</span>
                            <span className="text-[10px] uppercase tracking-widest font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded italic">Professional</span>
                        </div>
                        <span className="material-symbols-outlined hidden sm:block text-slate-400 text-lg transition-transform" style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'none' }}>
                            expand_more
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                        <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                             <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/50 block sm:hidden">
                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name || "Member"}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{user?.email}</p>
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
                                <button
                                    onClick={() => { setShowProfileMenu(false); navigate('/professional/home'); }}
                                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-text-primary dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl text-slate-400">dashboard</span>
                                    Dashboard
                                </button>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 py-2">
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
        </header>
    );
};

export default Header;
