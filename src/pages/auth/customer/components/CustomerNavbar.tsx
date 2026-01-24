import { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const CustomerNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300 ${scrolled
        ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md py-3 border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white"
        : "bg-transparent text-white"
        }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white">
          F
        </div>
        <span className="text-xl font-bold">Fix-Link</span>
      </div>

      <div className="flex items-center gap-6 text-sm font-medium">
        <a className="hidden md:flex items-center gap-2 hover:text-primary cursor-pointer transition-colors">
          <span className="material-symbols-outlined text-xl">grid_view</span>
          <span>Dashboard</span>
        </a>
        <a className="hidden md:flex items-center gap-2 hover:text-primary cursor-pointer transition-colors">
          <span className="material-symbols-outlined text-xl">calendar_month</span>
          <span>Bookings</span>
        </a>

        <button>
          <span className="material-symbols-outlined text-2xl">
            chat_bubble
          </span>
        </button>

        <button className="relative">
          <span className="material-symbols-outlined text-2xl">
            notifications
          </span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative group">
          <button className="flex items-center">
            <img
              className="w-9 h-9 rounded-full object-cover border-2 border-white/30 hover:border-primary transition-colors"
              src={user?.profilePhoto || "https://randomuser.me/api/portraits/men/1.jpg"}
              alt="Profile"
            />
          </button>

          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hidden group-hover:block">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
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
    </nav>
  );
};

export default CustomerNavbar;
