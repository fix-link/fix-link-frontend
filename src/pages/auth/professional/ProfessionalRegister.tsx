import React, { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  registerUser 
} from "../../../api/auth.api";
import { 
  User, Mail, Phone, MapPin, Lock, Eye, EyeOff, 
  FileText, ArrowRight, Camera, GraduationCap, Award, Landmark,
  Info, LocateFixed, ShieldCheck
} from "lucide-react";
import ErrorMessage from "../../../components/ErrorMessage";
import LoadingSpinner from "../../../components/LoadingSpinner";
import SuccessMessage from "../../../components/SuccessMessage";
import LocationInput from "../../../components/LocationInput";
import { useGpsLocation } from "../../../hooks/useGpsLocation";
import { FIXED_CITY, mergeLocationIntoForm } from "../../../utils/location";
import PasswordStrength from "../../../components/PasswordStrength";
import { validatePassword } from "../../../utils/validation";
import PhoneInput from "../../../components/PhoneInput";
import { getServiceCategories } from "../../../api/jobs.api";

const ProfessionalRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = React.useState<{ id: string, name: string }[]>([]);

  React.useEffect(() => {
    getServiceCategories().then(data => {
      let fetched = [];
      if (Array.isArray(data)) fetched = data;
      else if (data && Array.isArray(data.results)) fetched = data.results;
      if (fetched.length > 0) {
        setCategories(fetched);
      }
    }).catch(err => {
      console.error("Failed to fetch categories", err);
    });
  }, []);

  const email = (location.state as { email?: string })?.email;

  if (!email) {
    navigate("/signup/email");
    return null;
  }

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    city: FIXED_CITY,
    subcity: "",
    houseNumber: "",
    serviceCategory: "",
    yearsOfExperience: "",
    skills: "",
    shortBio: "",
    payoutMethod: "",
    accountNumber: "",
    password: "",
    confirmPassword: "",
    location: "",
    licenseNumber: "",
  });

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setError(null);
    const target = e.target;
    if (target instanceof HTMLInputElement) {
      const { name, value, type, files } = target;
      if (type === "file" && files && files.length > 0) {
        const file = files[0];
        if (name === "cvFile") setCvFile(file);
        else if (name === "profilePhoto") setProfilePhoto(file);
      } else {
        setForm({ ...form, [name]: value });
      }
    } else {
      const { name, value } = target;
      setForm({ ...form, [name]: value });
    }
  };

  const { isLocating, getCurrentLocation } = useGpsLocation((sel) => {
    setForm((prev) => mergeLocationIntoForm(prev, sel));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const requiredFields = [
      "firstName", "lastName", "phone", "gender", "dateOfBirth", "city",
      "serviceCategory", "yearsOfExperience", "shortBio", "password",
      "confirmPassword", "location"
    ];

    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) {
        setError(t('common.fill_all_fields_err', { field }));
        return;
      }
    }

    if (!profilePhoto || !cvFile) {
      setError(t('common.upload_both_err'));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t('common.passwords_mismatch_err'));
      return;
    }

    const { isValid, errors } = validatePassword(form.password, {
      firstName: form.firstName,
      lastName: form.lastName,
      email: email
    });

    if (!isValid) {
      setError(errors[0]);
      return;
    }

    setLoading(true);
    try {
      await registerUser("professional", {
        ...form,
        email,
        profilePhoto,
        cvFile,
      });
      setSuccess(t('common.submission_success'));
      setTimeout(() => navigate("/signup/verify", { state: { email } }), 1500);
    } catch (err: any) {
      setError(err.message || t('common.failed_update_profile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background-light dark:bg-background-dark overflow-x-hidden font-sans text-left">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[5%] right-[5%] w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[20%] left-[5%] w-[500px] h-[500px] bg-accent-purple/10 rounded-full blur-[150px] animate-blob" style={{ animationDelay: '3s' }}></div>
      </div>

      <header className="h-20 w-full px-6 lg:px-12 flex items-center justify-between relative z-10">
        <Link to="/" className="text-3xl font-display font-extrabold text-gradient tracking-tight">Fix-Link</Link>
        <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-subtext-light dark:text-subtext-dark opacity-60">
          <ShieldCheck size={16} />
          <span>{t('common.secure_pro_reg')}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6 relative z-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-text-light dark:text-text-dark mb-4 tracking-tight leading-tight">
            {t('common.create_pro_profile')}
          </h1>
          <p className="text-lg text-subtext-light dark:text-subtext-dark max-w-2xl mx-auto leading-relaxed">
            {t('common.join_elite_network')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section A: Personal */}
          <section className="glass-panel p-8 rounded-[32px] shadow-xl border border-white/40 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">{t('common.personal_info')}</h2>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">{t('common.basic_details_appearance')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {profilePhoto ? (
                        <img src={URL.createObjectURL(profilePhoto)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User size={40} />
                        </div>
                      )}
                    </div>
                    <label htmlFor="pfp" className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                      <Camera size={14} />
                    </label>
                    <input type="file" id="pfp" name="profilePhoto" onChange={handleChange} className="sr-only" accept="image/*" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-light dark:text-text-dark">{t('common.profile_picture')}</h4>
                    <p className="text-xs text-subtext-light dark:text-subtext-dark">{t('common.jpeg_png_max5mb')}</p>
                  </div>
                </div>
              </div>

               <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.first_name_req')}</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange} className="w-full h-12 px-5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.last_name_req')}</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange} className="w-full h-12 px-5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.verified_email')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={email} disabled className="w-full h-12 pl-11 pr-4 rounded-full bg-gray-200/50 dark:bg-gray-900/50 border border-border-light dark:border-border-dark text-gray-500 cursor-not-allowed" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.phone_number_req')}</label>
                <PhoneInput value={form.phone} onChange={(val) => setForm({ ...form, phone: val })} />
              </div>

               <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.gender_req')}</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="w-full h-12 px-5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer" required>
                  <option value="">{t('common.select_gender')}</option>
                  <option value="Male">{t('common.male')}</option>
                  <option value="Female">{t('common.female')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.dob_req')}</label>
                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className="w-full h-12 px-5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required />
              </div>

               <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.security_password_req')}</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} className="w-full h-12 pl-11 pr-12 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} userData={{ firstName: form.firstName, lastName: form.lastName, email: email }} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.confirm_password_req')}</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="w-full h-12 pl-11 pr-12 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section B: Address & Location */}
          <section className="glass-panel p-8 rounded-[32px] shadow-xl border border-white/40 animate-fade-in-up relative z-20" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">{t('common.service_area')}</h2>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">{t('common.where_operating')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.city_req')}</label>
                <input type="text" name="city" value={form.city || FIXED_CITY} readOnly className="w-full h-12 px-5 rounded-full bg-slate-100/80 dark:bg-gray-800/80 border border-border-light dark:border-border-dark text-slate-500 cursor-not-allowed outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.subcity_req')}</label>
                <input type="text" name="subcity" value={form.subcity} onChange={handleChange} className="w-full h-12 px-5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.house_number')}</label>
                <input type="text" name="houseNumber" value={form.houseNumber} onChange={handleChange} className="w-full h-12 px-5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
              </div>

              <div className="sm:col-span-3 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.precise_location_req')}</label>
                  <LocationInput
                    value={form.location}
                    onSelect={(sel) => setForm((prev) => mergeLocationIntoForm(prev, sel))}
                    placeholder="Subcity in Addis Ababa (e.g. Bole)"
                  />
                </div>
                <button type="button" onClick={getCurrentLocation} disabled={isLocating} className="flex items-center gap-2 px-6 h-12 rounded-full bg-accent-cyan/10 text-accent-cyan font-bold hover:bg-accent-cyan/20 transition-all active:scale-95 disabled:opacity-60">
                  <LocateFixed size={18} className={isLocating ? "animate-pulse" : ""} />
                  <span>{isLocating ? "..." : t('common.use_gps')}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Section C: Expertise */}
          <section className="glass-panel p-8 rounded-[32px] shadow-xl border border-white/40 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">{t('common.pro_expertise')}</h2>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">{t('common.showcase_skills')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.service_category_req')}</label>
                <select name="serviceCategory" value={form.serviceCategory} onChange={handleChange} className="w-full h-12 px-5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer" required>
                  <option value="">{t('common.select_category')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.years_exp_req')}</label>
                <input type="number" name="yearsOfExperience" value={form.yearsOfExperience} onChange={handleChange} className="w-full h-12 px-5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.specific_skills_comma')}</label>
                <input type="text" name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. Electrical, Plumbing, Tech Repair" className="w-full h-12 px-5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <div className="flex justify-between ml-1">
                  <label className="text-sm font-bold text-text-light dark:text-text-dark">{t('common.short_bio_req')}</label>
                  <span className="text-[10px] uppercase font-black text-gray-400">{t('common.max_150_words')}</span>
                </div>
                <textarea name="shortBio" value={form.shortBio} onChange={handleChange} className="w-full h-40 p-6 rounded-[24px] bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none leading-relaxed" placeholder={t('common.bio_placeholder')} required />
              </div>
            </div>
          </section>

          {/* Section D: Verification */}
          <section className="glass-panel p-8 rounded-[32px] shadow-xl border border-white/40 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">{t('common.verification_docs')}</h2>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">{t('common.verify_qualifications')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.cv_resume_pdf_req')}</label>
                <div className="relative group">
                  <div className={`w-full h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer
                    ${cvFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-primary/5"}
                  `}>
                    <FileText size={24} className={cvFile ? "text-emerald-500" : "text-gray-400"} />
                    <span className="text-xs font-bold">{cvFile ? cvFile.name : t('common.click_upload_cv')}</span>
                  </div>
                  <input type="file" name="cvFile" onChange={handleChange} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf" required />
                </div>
              </div>
              <div className="space-y-2 self-center">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.pro_license_req')}</label>
                <div className="relative">
                  <Award size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} className="w-full h-12 pl-11 pr-4 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required />
                </div>
              </div>
            </div>
          </section>

          {/* Section E: Payout */}
          <section className="glass-panel p-8 rounded-[32px] shadow-xl border border-white/40 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-accent-purple/10 text-accent-purple flex items-center justify-center">
                <Landmark size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">{t('common.banking_payout')}</h2>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">{t('common.receive_earnings')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.preferred_method_req')}</label>
                <select name="payoutMethod" value={form.payoutMethod} onChange={handleChange} className="w-full h-12 px-5 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer" required>
                  <option value="">{t('common.select_method')}</option>
                  <option>Telebirr</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">{t('common.telebirr_number_req')}</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="accountNumber" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="0912345678" className="w-full h-12 pl-11 pr-4 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required />
                </div>
              </div>
            </div>
          </section>

          <footer className="pt-8 pb-20 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="max-w-md mx-auto space-y-4">
              {error && <ErrorMessage message={error} />}
              {success && <SuccessMessage message={success} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3 group text-lg"
              >
                {loading ? <LoadingSpinner /> : (
                  <>
                    <span>{t('common.submit_application')}</span>
                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-subtext-light dark:text-subtext-dark opacity-50 uppercase tracking-widest">
                <Info size={14} />
                <span>{t('common.review_48h')}</span>
              </div>
            </div>
          </footer>
        </form>
      </main>
    </div>
  );
};

export default ProfessionalRegister;
