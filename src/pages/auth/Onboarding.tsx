import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile } from "../../api/auth.api";
import { Phone, Calendar, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import LocationInput from "../../components/LocationInput";
import type { LocationSelection } from "../../types/location.types";
import { formatLocationDisplay } from "../../utils/location";

const Onboarding: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [locationData, setLocationData] = useState<LocationSelection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // If user already has these infos, they shouldn't be here
  useEffect(() => {
    if (user?.phonenumber && user?.date_of_birth && user?.city) {
        // Already complete
        navigate(user.role === 'professional' ? '/professional/home' : '/customer/home');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setError(null);
    setLoading(true);

    try {
      await updateUserProfile(user.id, {
        phonenumber: phone,
        date_of_birth: dob,
        country: locationData?.country || "Ethiopia",
        city: locationData?.city || "Addis Ababa",
        subcity: locationData?.subcity || location.split(',')[0]?.trim() || "",
        ...(locationData?.lat != null && { lat: locationData.lat }),
        ...(locationData?.lng != null && { lng: locationData.lng }),
      } as any);
      
      setStep(2);
      setTimeout(() => {
        navigate(user.role === 'professional' ? '/professional/home' : '/customer/home');
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('common.failed_update_profile'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="size-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('common.you_are_all_set')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">{t('common.profile_complete_redirect')}</p>
          <div className="flex justify-center pt-4">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-xl">
        <div className="glass-panel p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-white/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent-purple to-primary-light"></div>
          
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-bold text-xs uppercase tracking-widest mb-4">
              {t('common.final_details')}
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              {t('common.welcome_name', { name: user?.first_name || '' })}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
              {t('common.onboarding_subtitle')}
            </p>
          </div>

          {error && <div className="mb-8"><ErrorMessage message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Phone Number */}
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Phone size={16} className="text-primary" />
                {t('common.phone_number')}
              </label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                   <span className="text-lg font-bold text-slate-400">🇪🇹 +251</span>
                </div>
                <input
                  type="tel"
                  placeholder="911223344"
                  className="w-full h-16 pl-28 pr-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-lg font-bold text-slate-900 dark:text-white shadow-inner"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength={9}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Date of Birth */}
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  {t('common.date_of_birth')}
                </label>
                <div className="relative group">
                  <input
                    type="date"
                    className="w-full h-16 px-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-lg font-bold text-slate-900 dark:text-white shadow-inner"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  {t('common.city_area')}
                </label>
                <div className="relative group">
                  <LocationInput
                    value={location}
                    onInputChange={setLocation}
                    onSelect={(sel) => {
                      setLocation(formatLocationDisplay(sel));
                      setLocationData(sel);
                    }}
                    placeholder="Subcity in Addis Ababa (e.g. Bole)"
                    className="w-full h-16 px-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-lg font-bold text-slate-900 dark:text-white shadow-inner"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-gradient-to-r from-primary to-primary-light text-white rounded-[1.5rem] font-black text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 active:scale-95 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3 group mt-4"
            >
              {loading ? <LoadingSpinner /> : (
                <>
                  <span>{t('common.complete_my_profile')}</span>
                  <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
