import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
                <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500"></span>
                </button>

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
