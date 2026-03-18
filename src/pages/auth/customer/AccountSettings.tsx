import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import CustomerNavbar from "./components/CustomerNavbar";
import CustomerFooter from "./components/CustomerFooter";

const AccountSettings = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");

    // Personal Info State
    const [firstName, setFirstName] = useState(user?.first_name || user?.name?.split(' ')[0] || "");
    const [lastName, setLastName] = useState(user?.last_name || user?.name?.split(' ')[1] || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [location, setLocation] = useState(user?.city ? `${user.city}${user.subcity ? ', ' + user.subcity : ''}` : "");

    // Security State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [updateSuccess, setUpdateSuccess] = useState(false);

    const handleUpdatePersonal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateUser({
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                city: location.split(',')[0]?.trim(),
                subcity: location.split(',')[1]?.trim() || ""
            });
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return;
        }
        // Mock update
        console.log("Password updated successfully");
        setUpdateSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setUpdateSuccess(false), 3000);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark">
            <CustomerNavbar />

            <main className="max-w-3xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-text-primary dark:text-white tracking-tight">Account Settings</h1>
                    <p className="text-text-secondary dark:text-gray-400 mt-3 font-medium text-lg">Manage your personal information and security preferences</p>
                </div>

                <div className="bg-white dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    {/* Horizontal Tabs */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800 p-2 gap-2">
                        <button
                            onClick={() => setActiveTab("personal")}
                            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'personal' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <span className="material-symbols-outlined">person</span>
                            <span>Personal Info</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'security' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <span className="material-symbols-outlined">shield</span>
                            <span>Login & Security</span>
                        </button>
                    </div>

                    <div className="p-8 sm:p-12">
                        {updateSuccess && (
                            <div className="mb-10 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center gap-3 border border-green-100 dark:border-green-800/30 animate-in fade-in slide-in-from-top-2">
                                <span className="material-symbols-outlined font-black">check_circle</span>
                                <span className="font-black text-sm">Changes saved successfully!</span>
                            </div>
                        )}

                        {activeTab === 'personal' ? (
                            <form onSubmit={handleUpdatePersonal} className="space-y-10 group">
                                <div className="flex flex-col sm:flex-row items-center gap-6 pb-10 border-b border-slate-100 dark:border-slate-800">
                                    <div className="relative group/avatar">
                                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-xl transition-transform group-hover/avatar:scale-105">
                                            <img src={user?.profilePhoto || "https://i.pravatar.cc/150"} alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                        <button type="button" className="absolute bottom-0 right-0 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-card-dark hover:scale-110 transition-all">
                                            <span className="material-symbols-outlined text-xl">photo_camera</span>
                                        </button>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h3 className="font-black text-2xl text-text-primary dark:text-white">Profile Photo</h3>
                                        <p className="text-text-secondary dark:text-gray-400 text-sm mt-1">PNG, JPG or GIF. Max 5MB.</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-sm font-black text-text-primary dark:text-white uppercase tracking-wider">First Name</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-base text-text-primary dark:text-white placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm font-black text-text-primary dark:text-white uppercase tracking-wider">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-base text-text-primary dark:text-white placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-text-primary dark:text-white uppercase tracking-wider">Email Address</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-base text-text-primary dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-text-primary dark:text-white uppercase tracking-wider">Phone Number</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">call</span>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-base text-text-primary dark:text-white"
                                                placeholder="+251 ..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-text-primary dark:text-white uppercase tracking-wider">Location</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
                                            <input
                                                type="text"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-base text-text-primary dark:text-white"
                                                placeholder="City, Area"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10">
                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl hover:shadow-2xl hover:bg-[#2559a1] active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
                                    >
                                        <span className="material-symbols-outlined">save</span>
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleUpdatePassword} className="space-y-10">
                                <div className="mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="font-black text-3xl text-text-primary dark:text-white">Login & Security</h3>
                                    <p className="text-text-secondary dark:text-gray-400 text-base mt-2 font-medium">Keep your account secure with a strong password</p>
                                </div>

                                {passwordError && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-800/30 font-black text-sm animate-shake">
                                        <span className="material-symbols-outlined">error</span>
                                        {passwordError}
                                    </div>
                                )}

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-text-primary dark:text-white uppercase tracking-wider">Current Password</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-base text-text-primary dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                                        <div className="space-y-3">
                                            <label className="text-sm font-black text-text-primary dark:text-white uppercase tracking-wider">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-base text-text-primary dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm font-black text-text-primary dark:text-white uppercase tracking-wider">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-base text-text-primary dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10">
                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl hover:shadow-2xl hover:bg-[#2559a1] active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
                                    >
                                        <span className="material-symbols-outlined">security</span>
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            <CustomerFooter />
        </div>
    );
};

export default AccountSettings;
