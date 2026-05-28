import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import CustomerNavbar from "./components/CustomerNavbar";
import CustomerFooter from "./components/CustomerFooter";
import Sidebar from "../professional/components/Sidebar";
import Header from "../professional/components/Header";
import { getImageUrl, changePassword, deleteUserProfile, getUserDetails } from "../../../api/auth.api";
import LocationInput from "../../../components/LocationInput";
import type { LocationSelection } from "../../../types/location.types";
import { formatLocationDisplay, mergeLocationIntoForm } from "../../../utils/location";
import PhoneInput from "../../../components/PhoneInput";
import { useTranslation } from "react-i18next";
import { 
  User, Shield, Mail, MapPin, Camera, 
  Save, Lock, Trash2, AlertTriangle, CheckCircle2, 
  Loader2, X
} from "lucide-react";

const AccountSettings = () => {
    const { user, updateUser, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Personal Info State
    const [firstName, setFirstName] = useState(user?.first_name || user?.name?.split(' ')[0] || "");
    const [lastName, setLastName] = useState(user?.last_name || user?.name?.split(' ')[1] || "");
    const [email] = useState(user?.email || "");
    const [phone, setPhone] = useState((user as any)?.phonenumber || user?.phone || "");
    const [location, setLocation] = useState(user?.city ? `${user.city}${user.subcity ? ', ' + user.subcity : ''}` : "");
    const [locationData, setLocationData] = useState<LocationSelection | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [basePrice, setBasePrice] = useState(user?.hourly_rate || user?.base_price || 0);
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
                    // Only update localStorage + local form states — do NOT call updateUser()
                    // because that triggers a PATCH back to the backend which can lose fields.
                    const synced = { ...user, ...latest };
                    localStorage.setItem("user", JSON.stringify(synced));
                    
                    // Update local form states
                    setFirstName(latest.first_name || latest.name?.split(' ')[0] || "");
                    setLastName(latest.last_name || latest.name?.split(' ')[1] || "");
                    setPhone(latest.phonenumber || latest.phone || (latest as any).phone_number || "");
                    const loc = latest.city ? `${latest.city}${latest.subcity ? ', ' + latest.subcity : ''}` : "";
                    setLocation(loc);
                    setBasePrice(latest.hourly_rate || latest.base_price || 0);
                } catch (err) {
                    console.error("AccountSettings: Failed to sync user details:", err);
                }
            }
        };
        fetchLatestDetails();
    }, [user?.id]);

    const handleUpdatePersonal = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateUser({
                first_name: firstName,
                last_name: lastName,
                email,
                phonenumber: phone,
                country: locationData?.country || "Ethiopia",
                city: locationData?.city || location.split(',')[0]?.trim() || "Addis Ababa",
                subcity: locationData?.subcity || location.split(',')[1]?.trim() || "",
                ...(locationData?.lat != null && { lat: locationData.lat }),
                ...(locationData?.lng != null && { lng: locationData.lng }),
                hourly_rate: Number(basePrice)
            });
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith('image/')) {
            alert(t('common.upload_image_file_err'));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('profile_picture', file);
            
            await updateUser(formData);
            
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (error: any) {
            console.error("Image upload failed:", error);
            alert(t('common.failed_upload_image', { error: error.message }));
            setProfilePreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        if (newPassword !== confirmPassword) {
            setPasswordError(t('common.passwords_dont_match'));
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError(t('common.password_min_6'));
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
            setPasswordError(error.message || t('common.failed_update_password'));
        }
    };


    const handleDeleteAccount = async () => {
        if (!user) return;
        setIsDeleting(true);
        try {
            await deleteUserProfile(user.id);
            logout();
            navigate("/");
        } catch (error: any) {
            alert(t('common.failed_delete_account', { error: error.message }));
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-display relative">
            {/* Background Decor */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

            {isPro && <Sidebar />}

            <div className={`flex flex-col flex-1 overflow-hidden relative z-10 ${isPro ? 'lg:ml-64' : ''}`}>
                {isPro ? <Header /> : <CustomerNavbar />}

                <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-10 text-center md:text-left space-y-2">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                {t('common.account_settings').split(' ')[0]} <span className="text-gradient">{t('common.account_settings').split(' ').slice(1).join(' ')}</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
                                {t('common.control_visibility_security')}
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-[40px] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl relative bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl">
                            {/* Modern Tabs */}
                            <div className="flex p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setActiveTab("personal")}
                                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-[28px] font-black text-sm transition-all duration-300 ${activeTab === 'personal' ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-y-[-2px]' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
                                >
                                    <User size={18} />
                                    <span>{t('common.personal_profile')}</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("security")}
                                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-[28px] font-black text-sm transition-all duration-300 ${activeTab === 'security' ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-y-[-2px]' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
                                >
                                    <Shield size={18} />
                                    <span>{t('common.security_privacy')}</span>
                                </button>
                            </div>

                            <div className="p-8 md:p-14">
                                {updateSuccess && (
                                    <div className="mb-12 p-5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center gap-4 border border-emerald-500/20 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="size-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <span className="font-black text-sm">{t('common.updated_successfully')}</span>
                                    </div>
                                )}

                                {activeTab === 'personal' ? (
                                    <form onSubmit={handleUpdatePersonal} className="space-y-12">
                                        <div className="flex flex-col md:flex-row items-center gap-8 pb-12 border-b border-slate-100 dark:border-slate-800/50">
                                            <div className="relative group cursor-pointer" onClick={handleImageClick}>
                                                <div className="size-32 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2">
                                                    <img 
                                                        src={profilePreview || getImageUrl(user?.profilePhoto || (user as any)?.profile_picture) || DEFAULT_AVATAR} 
                                                        alt="Profile" 
                                                        className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-30' : 'group-hover:opacity-90'}`} 
                                                    />
                                                    {isUploading && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Loader2 size={32} className="text-primary animate-spin" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Camera size={28} className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300" />
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 size-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-900 group-hover:translate-y-[-2px] transition-transform">
                                                    <Camera size={20} />
                                                </div>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    onChange={handleFileChange} 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                />
                                            </div>
                                            <div className="text-center md:text-left space-y-1">
                                                <h3 className="font-black text-3xl text-slate-900 dark:text-white">{t('common.profile_details')}</h3>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">{t('common.update_photo_persona')}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('common.first_name')}</label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder="e.g. John"
                                                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all font-bold text-slate-800 dark:text-white outline-none"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('common.last_name')}</label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    placeholder="e.g. Doe"
                                                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all font-bold text-slate-800 dark:text-white outline-none"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-3 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('common.official_email')}</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        readOnly
                                                        className="w-full px-6 py-4 pl-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed font-bold text-slate-500 dark:text-slate-400 outline-none opacity-80"
                                                        title="Verified email cannot be modified"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('common.contact_number')}</label>
                                                <PhoneInput
                                                    value={phone}
                                                    onChange={(val) => setPhone(val)}
                                                />
                                            </div>

                                            <div className="space-y-3 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('common.primary_location')}</label>
                                                <div className="relative group">
                                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors z-[5]" size={20} />
                                                    <LocationInput
                                                        value={location}
                                                        onSelect={(sel) => {
                                                            setLocation(formatLocationDisplay(sel));
                                                            setLocationData(sel);
                                                        }}
                                                        placeholder="Subcity in Addis Ababa (e.g. Bole)"
                                                        className="w-full px-6 py-4 pl-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all font-bold text-slate-800 dark:text-white outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {isPro && (
                                                <div className="space-y-3 md:col-span-2">
                                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('common.starting_price_etb')}</label>
                                                    <div className="relative group">
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors font-black">{t('common.etb')}</div>
                                                        <input
                                                            type="number"
                                                            value={basePrice}
                                                            onChange={(e) => setBasePrice(Number(e.target.value))}
                                                            placeholder="e.g. 500"
                                                            className="w-full px-6 py-4 pl-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all font-bold text-slate-800 dark:text-white outline-none"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium ml-1">{t('common.price_shown_starting')}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-6">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 relative overflow-hidden group/btn disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                                {isSaving ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} className="group-hover/btn:rotate-12 transition-transform" />}
                                                {isSaving ? (t('common.saving') || 'Saving...') : t('common.sync_profile_changes')}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleUpdatePassword} className="space-y-12">
                                        <div className="space-y-2 pb-8 border-b border-slate-100 dark:border-slate-800/50">
                                            <h3 className="font-black text-3xl text-slate-900 dark:text-white">{t('common.access_security')}</h3>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('common.protect_workspace_credentials')}</p>
                                        </div>

                                        {passwordError && (
                                            <div className="p-5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-3xl flex items-center gap-4 border border-red-500/20 animate-in shake duration-500">
                                                <div className="size-10 rounded-2xl bg-red-500/20 flex items-center justify-center">
                                                    <AlertTriangle size={20} />
                                                </div>
                                                <span className="font-black text-sm">{passwordError}</span>
                                            </div>
                                        )}

                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('common.current_password')}</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                                    <input
                                                        type="password"
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        className="w-full px-6 py-4 pl-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800 dark:text-white outline-none"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('common.new_password')}</label>
                                                    <input
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800 dark:text-white outline-none"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('common.confirm_changes')}</label>
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-800 dark:text-white outline-none"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6">
                                            <button
                                                type="submit"
                                                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-3xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 group/lock"
                                            >
                                                <Lock size={22} className="group-hover/lock:translate-y-[-2px] transition-transform" />
                                                {t('common.authorize_update')}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Danger Zone */}
                                <div className="mt-16 pt-12 border-t-2 border-dashed border-slate-100 dark:border-slate-800/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <h4 className="text-red-500 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                                <AlertTriangle size={16} />
                                                {t('common.close_account')}
                                            </h4>
                                            <p className="text-slate-500 dark:text-slate-500 text-xs font-medium">{t('common.permanently_dissolve_purge')}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className="px-8 py-4 text-red-500 font-black hover:bg-red-500/10 rounded-2xl transition-all border-2 border-red-500/20 hover:border-red-500/40 flex items-center gap-3 whitespace-nowrap group/del"
                                        >
                                            <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                                            {t('common.terminate_account')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {!isPro && <CustomerFooter />}
                </main>

                {/* Modern Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsDeleteModalOpen(false)}></div>
                        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 max-w-md w-full shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            
                            <div className="size-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-8 ring-8 ring-red-500/5">
                                <AlertTriangle size={40} className="text-red-500" />
                            </div>
                            
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{t('common.final_warning')}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed text-lg">
                                {t('common.delete_irreversible')}
                            </p>
                            
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="w-full py-5 bg-red-500 text-white font-black rounded-3xl shadow-xl shadow-red-500/20 hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 order-2 md:order-1"
                                >
                                    {isDeleting ? (
                                        <Loader2 size={24} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Trash2 size={20} />
                                            {t('common.confirm_termination')}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black rounded-3xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all order-1 md:order-2"
                                >
                                    {t('common.abort_process')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .text-gradient {
                    background: linear-gradient(135deg, #0d93f2 0%, #075985 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .shake { animation: shake 0.4s ease-in-out; }
            `}} />
        </div>
    );
};

export default AccountSettings;

