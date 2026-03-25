import React, { useState, useRef, useEffect } from "react";
import { createJob } from "../../../../api/jobs.api";
import { useAuth } from "../../../../context/AuthContext";

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

interface RequestEstimateModalProps {
    isOpen: boolean;
    onClose: () => void;
    professionalName: string;
    serviceId?: string;
    professionalId?: string | number;
}

const RequestEstimateModal: React.FC<RequestEstimateModalProps> = ({ isOpen, onClose, professionalName, serviceId, professionalId }) => {
    const { user } = useAuth();
    console.log("RequestEstimateModal: Current User Role:", user?.role);
    console.log("RequestEstimateModal: Target Professional ID:", professionalId);

    const [description, setDescription] = useState("");
    const [preferredDate, setPreferredDate] = useState("");
    const [location, setLocation] = useState("");
    const [budget, setBudget] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showLocations, setShowLocations] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowLocations(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleGetCurrentLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    setLocation("Addis Ababa (Current Location)");
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setIsLocating(false);
                    alert("Could not get current location. Please type manually.");
                }
            );
        } else {
            setIsLocating(false);
            alert("Geolocation is not supported by your browser.");
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
            setPhotos(prev => [...prev, ...newPhotos]);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const filteredLocations = LOCATIONS.filter(loc =>
        loc.toLowerCase().includes(location.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Role Check Defense
            const currentRole = user?.role?.toLowerCase();
            if (currentRole !== 'customer') {
                alert(`Current role is ${currentRole}. Only customers can create jobs. Please switch accounts.`);
                return;
            }

            const budgetNum = parseFloat(budget.replace(/[^0-9.]/g, ''));
            
            // Create Job with direct assignment (1-step)
            await createJob({
                title: description.split('\n')[0].substring(0, 50) || "Job Request",
                description: description,
                service: serviceId || undefined, 
                address: location,
                scheduled_at: preferredDate ? new Date(preferredDate).toISOString() : undefined,
                budget: isNaN(budgetNum) ? undefined : budgetNum.toString(),
                assigned_to: professionalId?.toString()
            } as any);

            setIsSubmitted(true);
        } catch (err: any) {
            const msg = err.message || "Failed to submit request. Please try again.";
            // Improved error parsing
            if (msg.toLowerCase().includes("only customers")) {
                alert("The server reports that only customers can create jobs. Your session might be for a professional account.");
            } else {
                alert(msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetAndClose = () => {
        setIsSubmitted(false);
        setDescription("");
        setLocation("");
        setBudget("");
        setPreferredDate("");
        setPhotos([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={handleResetAndClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-xl bg-white dark:bg-card-dark rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

                {isSubmitted ? (
                    /* Success UI */
                    <div className="p-10 flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-500 dark:text-green-400">
                            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'wght' 700" }}>check_circle</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Request Sent Successfully!</h2>
                            <p className="text-text-secondary dark:text-gray-400 max-w-sm mx-auto">
                                Your estimate request has been sent to <strong>{professionalName}</strong>. They will review your project and get back to you soon via Messages.
                            </p>
                        </div>
                        <button
                            onClick={handleResetAndClose}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    /* Request Form UI */
                    <>
                        {/* Header */}
                        <div className="relative h-32 bg-primary p-6 flex items-end">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Request an Estimate</h2>
                                <p className="text-white/80 text-sm font-medium">From {professionalName}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">description</span>
                                    What do you need help with?
                                </label>
                                <textarea
                                    required
                                    className="w-full h-28 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-text-primary dark:text-white placeholder:text-text-secondary/50 dark:placeholder:text-gray-500 focus:border-primary focus:ring-0 transition-all resize-none text-sm"
                                    placeholder="Describe your project, e.g., 'Fixing a leaky kitchen faucet and replacing the bathroom showerhead...'"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Preferred Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
                                    When do you want this done?
                                </label>
                                <input
                                    required
                                    type="date"
                                    className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-text-primary dark:text-white focus:border-primary focus:ring-0 transition-all text-sm"
                                    value={preferredDate}
                                    onChange={(e) => setPreferredDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]} // Encourage future dates
                                />
                            </div>

                            {/* Photos (Optional) */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">image</span>
                                    Add Photos (Optional)
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {photos.map((photo, index) => (
                                        <div key={index} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <img src={photo} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="material-symbols-outlined text-white text-xl">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-text-secondary dark:text-gray-500 hover:border-primary hover:text-primary transition-all"
                                    >
                                        <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={handlePhotoUpload}
                                    />
                                </div>
                            </div>

                            {/* Location & Budget Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Location */}
                                <div className="space-y-2 relative" ref={dropdownRef}>
                                    <label className="text-sm font-bold text-text-primary dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                                        Location
                                    </label>
                                    <div className="relative group">
                                        <input
                                            required
                                            type="text"
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-text-primary dark:text-white placeholder:text-text-secondary/50 focus:border-primary focus:ring-0 transition-all text-sm"
                                            placeholder="Enter location"
                                            value={location}
                                            onChange={(e) => {
                                                setLocation(e.target.value);
                                                setShowLocations(true);
                                            }}
                                            onFocus={() => setShowLocations(true)}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGetCurrentLocation}
                                            disabled={isLocating}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                                            title="Use current location"
                                        >
                                            <span className={`material-symbols-outlined text-xl ${isLocating ? 'animate-spin' : ''}`}>
                                                {isLocating ? 'progress_activity' : 'my_location'}
                                            </span>
                                        </button>

                                        {/* Autocomplete Dropdown */}
                                        {showLocations && location && filteredLocations.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20 py-1 max-h-48 overflow-y-auto">
                                                {filteredLocations.map((loc) => (
                                                    <button
                                                        key={loc}
                                                        type="button"
                                                        onClick={() => {
                                                            setLocation(loc);
                                                            setShowLocations(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 border-b border-slate-100/50 dark:border-slate-700/50 last:border-none"
                                                    >
                                                        <span className="material-symbols-outlined text-slate-400 text-base">location_on</span>
                                                        {loc}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Budget */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-primary dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">payments</span>
                                        Estimated Budget
                                    </label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-text-primary dark:text-white placeholder:text-text-secondary/50 focus:border-primary focus:ring-0 transition-all text-sm"
                                            placeholder="e.g. 1500 Birr"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">ETB</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-text-secondary dark:text-gray-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] bg-primary text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Submit Request</span>
                                            <span className="material-symbols-outlined text-lg">send</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Footer Info */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[11px] text-text-secondary/70 dark:text-gray-500 leading-relaxed text-center">
                                By clicking Submit, you agree to Fix-Link's terms. {professionalName} will receive your project details and contact you via the messaging system.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RequestEstimateModal;
