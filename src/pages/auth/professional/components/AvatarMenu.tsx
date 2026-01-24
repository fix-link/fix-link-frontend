import { useState } from "react";

const AvatarMenu: React.FC = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2"
            >
                <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                />
                <span className="material-symbols-outlined hidden sm:block">
                    expand_more
                </span>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-surface-light shadow-card dark:bg-surface-dark">
                    <button className="w-full px-4 py-2 text-left hover:bg-primary/10">
                        Profile
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-primary/10">
                        Settings
                    </button>
                    <button className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50">
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default AvatarMenu;

