import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import CustomerNavbar from "./components/CustomerNavbar";
import CustomerFooter from "./components/CustomerFooter";
import Sidebar from "../professional/components/Sidebar";
import Header from "../professional/components/Header";
import { getImageUrl, changePassword, updateUserProfile, deleteUserProfile, getUserDetails } from "../../../api/auth.api";
import LocationInput from "../../../components/LocationInput";
import PhoneInput from "../../../components/PhoneInput";
import { useRef } from "react";

const AccountSettings = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Personal Info State
    const [firstName, setFirstName] = useState(user?.first_name || user?.name?.split(' ')[0] || "");
    const [lastName, setLastName] = useState(user?.last_name || user?.name?.split(' ')[1] || "");
    const [email] = useState(user?.email || "");
    const [phone, setPhone] = useState((user as any)?.phonenumber || user?.phone || "");
    const [location, setLocation] = useState(user?.city ? `${user.city}${user.subcity ? ', ' + user.subcity : ''}` : "");
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const isPro = user?.role === 'professional';
    const fileInputRef = useRef<HTMLInputElement>(null);

    const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

    // Security State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // Fetch latest user details on mount to ensure we have phone/location
    useEffect(() => {
        const fetchLatestDetails = async () => {
            if (user?.id) {
                try {
                    const latest = await getUserDetails(user.id);
                    // Update context to keep everything in sync
                    await updateUser(latest);
                    
                    // Update local form states
                    setFirstName(latest.first_name || latest.name?.split(' ')[0] || "");
                    setLastName(latest.last_name || latest.name?.split(' ')[1] || "");
                    setPhone(latest.phonenumber || latest.phone || "");
                    const loc = latest.city ? `${latest.city}${latest.subcity ? ', ' + latest.subcity : ''}` : "";
                    setLocation(loc);
                } catch (err) {
                    console.error("AccountSettings: Failed to sync user details:", err);
                }
            }
        };
        fetchLatestDetails();
    }, [user?.id]);

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

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            alert("Please upload an image file");
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('profile_picture', file);
            
            // Optionally add other fields if the backend requires them
            // formData.append('first_name', firstName);

            const updatedData = await updateUserProfile(user.id, formData);
            
            // Update local user context
            await updateUser(updatedData);
            
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (error: any) {
            console.error("Image upload failed:", error);
            alert("Failed to upload image: " + error.message);
            setProfilePreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
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
        
        try {
            await changePassword(currentPassword, newPassword);
            setUpdateSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (error: any) {
            setPasswordError(error.message || "Failed to update password");
        }
    };

    const { logout } = useAuth();
    const navigate = useNavigate();


    const handleDeleteAccount = async () => {
        if (!user) return;
        setIsDeleting(true);
        try {
            await deleteUserProfile(user.id);
            logout();
            navigate("/");
        } catch (error: any) {
            alert("Failed to delete account: " + error.message);
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-background-dark font-display">
            {isPro && <Sidebar />}

            <div className={`flex flex-col flex-1 overflow-hidden ${isPro ? 'lg:ml-64' : ''}`}>
                {isPro ? <Header /> : <CustomerNavbar />}

                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto px-4 py-12">
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
                            <span>Profile Setting</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'security' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <span className="material-symbols-outlined">shield</span>
                            <span>Security & Password</span>
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
                                    <div className="relative group/avatar cursor-pointer" onClick={handleImageClick}>
                                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-xl transition-transform group-hover/avatar:scale-105 relative">
                                            <img 
                                                src={profilePreview || getImageUrl(user?.profilePhoto || (user as any)?.profile_picture) || DEFAULT_AVATAR} 
                                                alt="Profile" 
                                                className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : ''}`} 
                                            />
                                            {isUploading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                        <button type="button" className="absolute bottom-0 right-0 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-card-dark hover:scale-110 transition-all">
                                            <span className="material-symbols-outlined text-xl">photo_camera</span>
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileChange} 
                                            accept="image/*" 
                                            className="hidden" 
                                        />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h3 className="font-black text-2xl text-text-primary dark:text-white">Profile Photo</h3>
                                        <p className="text-text-secondary dark:text-gray-400 text-sm mt-1">Click image to upload. PNG, JPG or GIF.</p>
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
                                                readOnly
                                                className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed font-bold text-base text-text-secondary dark:text-gray-400"
                                                title="Email cannot be changed"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-text-primary dark:text-white uppercase tracking-wider">Phone Number (+251)</label>
                                        <PhoneInput
                                            value={phone}
                                            onChange={(val) => setPhone(val)}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-text-primary dark:text-white uppercase tracking-wider">Location</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
                                            <LocationInput
                                                value={location}
                                                onSelect={(loc) => setLocation(loc)}
                                                className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-base text-text-primary dark:text-white"
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

                        {/* Danger Zone Section */}
                        <div className="mt-12 pt-10 border-t border-red-100 dark:border-red-900/20">
                             <h4 className="text-red-500 font-black text-sm uppercase tracking-wider mb-4">Danger Zone</h4>
                             <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="flex items-center gap-3 px-6 py-4 text-red-500 font-black hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all border-2 border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                            >
                                <span className="material-symbols-outlined">delete_forever</span>
                                <span>Delete My Account Permanently</span>
                            </button>
                            <p className="text-xs text-text-secondary dark:text-gray-500 mt-3 ml-2">This action is irreversible. All your data will be permanently removed.</p>
                        </div>
                    </div>
                </div>
              </div>
            </main>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-card-dark rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
                        </div>
                        <h3 className="text-2xl font-black text-text-primary dark:text-white mb-2">Delete Account?</h3>
                        <p className="text-text-secondary dark:text-gray-400 font-medium mb-8">
                            Are you absolutely sure? This will permanently delete your profile, jobs, and all associated data. This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-text-primary dark:text-white font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                        Confirm Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isPro && <CustomerFooter />}
        </div>
      </div>
    );
};

export default AccountSettings;
