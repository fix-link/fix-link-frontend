import { useState, type ChangeEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  registerUser 
} from "../../../api/auth.api";
import { 
  Camera, User, Mail, MapPin, Calendar, Lock, Eye, EyeOff, 
  ArrowRight, CheckSquare, Square
} from "lucide-react";
import ErrorMessage from "../../../components/ErrorMessage";
import LoadingSpinner from "../../../components/LoadingSpinner";
import SuccessMessage from "../../../components/SuccessMessage";
import LocationInput from "../../../components/LocationInput";
import PasswordStrength from "../../../components/PasswordStrength";
import { validatePassword } from "../../../utils/validation";
import PhoneInput from "../../../components/PhoneInput";

const CustomerRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = (location.state as { email?: string })?.email;

  if (!email) {
    navigate("/signup/email");
    return null;
  }

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked, files } = e.target;
    setError(null);

    if (type === "file" && files) {
      const file = files[0];
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        setError("Please upload a valid image (PNG or JPG)");
        return;
      }
      setProfilePhoto(file);
    } else if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);

    const requiredFields = ["firstName", "lastName", "phone", "dateOfBirth", "password", "confirmPassword"];
    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) {
        setError("Please fill all required fields");
        return;
      }
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
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

    if (!form.agree) {
      setError("You must agree to the Terms & Privacy Policy");
      return;
    }

    setLoading(true);
    try {
      await registerUser("customer", {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        location: form.location,
        dateOfBirth: form.dateOfBirth,
        password: form.password,
        email: email,
        profilePhoto: profilePhoto,
      });

      setSuccess("Account created! Directing to email verification...");
      setTimeout(() => {
        navigate("/signup/verify", { state: { email } });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background-light dark:bg-background-dark overflow-hidden font-sans text-left">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-accent-purple/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-xl animate-fade-in-up">
        {/* Brand Area */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-display font-extrabold text-gradient mb-2 tracking-tight">Fix-Link</h1>
          </Link>
          <p className="text-subtext-light dark:text-subtext-dark font-medium">Create your customer account to start hiring.</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-xl border border-white/40">
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {profilePhoto ? (
                  <img
                    src={URL.createObjectURL(profilePhoto)}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    alt="Profile Preview"
                  />
                ) : (
                  <User size={40} className="text-gray-400" />
                )}
                <label
                  htmlFor="photo-upload"
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera size={24} className="text-white" />
                </label>
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="sr-only"
                onChange={handleChange}
              />
            </div>
            <p className="text-xs font-bold text-subtext-light dark:text-subtext-dark mt-4 uppercase tracking-widest">Profile Photo (Optional)</p>
          </div>

          <div className="space-y-6">
            {/* Read-only Email */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">Verified Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={email}
                  disabled
                  className="w-full h-12 pl-11 pr-4 rounded-full bg-gray-100/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">First Name</label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-4 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-text-light dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">Last Name</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-text-light dark:text-white"
                />
              </div>
            </div>

            {/* DOB & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">Date of Birth</label>
                <div className="relative group">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-transparent" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className="w-full h-12 px-4 sm:pl-11 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-text-light dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">Phone Number</label>
                <PhoneInput
                  value={form.phone}
                  onChange={(val) => setForm({ ...form, phone: val })}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">Current Location</label>
              <div className="relative group">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                <LocationInput
                  value={form.location}
                  onSelect={(loc) => setForm({ ...form, location: loc })}
                  className="w-full h-12 pl-11 pr-4 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-text-light dark:text-white"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">Security Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-12 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-text-light dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-light dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordStrength
                  password={form.password}
                  userData={{
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: email
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Verify your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-12 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-text-light dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-light dark:hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div 
              className="flex items-center gap-3 cursor-pointer select-none py-2"
              onClick={() => setForm({ ...form, agree: !form.agree })}
            >
              <div className={`transition-colors duration-300 ${form.agree ? "text-primary" : "text-gray-400"}`}>
                {form.agree ? <CheckSquare size={20} /> : <Square size={20} />}
              </div>
              <p className="text-sm text-subtext-light dark:text-subtext-dark">
                I agree to the <span className="text-primary font-bold hover:underline cursor-pointer">Terms & Privacy Policy</span>
              </p>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message={success} />}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 group"
            >
              {loading ? <LoadingSpinner /> : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-subtext-light dark:text-subtext-dark">
           Back to role selection?{" "}
          <Link to="/signup/role" className="font-bold text-primary hover:text-primary-dark transition-colors">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerRegister;
