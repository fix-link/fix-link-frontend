import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    // TODO: Implement real backend notifications
    const unreadNotifications: any[] = [];

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 px-6 py-4 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">

            {/* LEFT */}
            <div className="flex items-center gap-3">
                <button className="lg:hidden">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h2 className="text-2xl font-bold">Dashboard</h2>
                {/* DEV ONLY ROLE SWITCHER */}
                <button
                    onClick={() => navigate('/customer/home')}
                    className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded border border-amber-200 hover:bg-amber-200 transition-colors ml-4"
                >
                    SWITCH TO CUSTOMER (DEV)
                </button>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-4">

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <span className="material-symbols-outlined">notifications</span>
                        {unreadNotifications.length > 0 && (
                            <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                                {unreadNotifications.length}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <span className="font-bold text-sm">Notifications</span>
                                <span className="text-xs text-primary font-medium">{unreadNotifications.length} New</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications yet</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* PROFILE */}
                <div className="relative group">
                    <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img
                            src={user?.profilePhoto || "https://randomuser.me/api/portraits/women/44.jpg"}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="hidden sm:flex flex-col items-start">
                            <span className="text-sm font-semibold">{user?.name || "Professional"}</span>
                            <span className="text-xs text-gray-500">Professional</span>
                        </div>
                        <span className="material-symbols-outlined hidden sm:block">
                            expand_more
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hidden group-hover:block">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 block sm:hidden">
                            <p className="text-sm font-bold truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            <span className="material-icons-round text-lg">logout</span>
                            Sign Out
                        </button>
                    </div>
                </div>

            </div>
        </header>
    );
};

export default Header;
