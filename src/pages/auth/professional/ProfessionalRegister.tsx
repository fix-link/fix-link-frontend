import React, { useState, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { registerUser } from "../../../api/auth.api";
import ErrorMessage from "../../../components/ErrorMessage";
import LoadingSpinner from "../../../components/LoadingSpinner";
import SuccessMessage from "../../../components/SuccessMessage";
import LocationInput from "../../../components/LocationInput";
import PasswordStrength from "../../../components/PasswordStrength";
import { validatePassword } from "../../../utils/validation";
import PhoneInput from "../../../components/PhoneInput";
import { getServiceCategories } from "../../../api/jobs.api";

const ProfessionalRegister = () => {
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


  // Get email from router state
  const email = (location.state as { email?: string })?.email;

  // Guard against direct access
  if (!email) {
    navigate("/signup");
    return null;
  }

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    city: "",
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

  // File states
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setError(null);
    const target = e.target;

    if (target instanceof HTMLInputElement) {
      const { name, value, type, files } = target;

      if (type === "file" && files && files.length > 0) {
        const file = files[0];
        
        if (name === "cvFile") {
          setCvFile(file);
        } else if (name === "profilePhoto") {
          setProfilePhoto(file);
        }
      } else {
        setForm({ ...form, [name]: value });
      }
    } else if (target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
      const { name, value } = target;
      setForm({ ...form, [name]: value });
    }
  };

  // Location using GPS or LocationInput
  const handleUseGPS = () => {
    if (!navigator.geolocation) return alert("Geolocation is not supported");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
        setForm({ ...form, location: coords });
      },
      () => alert("Unable to get your location")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    // Required fields (strictly matching the backend schema and form)
    const requiredFields = [
      "firstName",
      "lastName",
      "phone",
      "gender",
      "dateOfBirth",
      "city",
      "serviceCategory",
      "yearsOfExperience",
      "shortBio",
      "password",
      "confirmPassword",
      "location",
    ];

    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) {
        setError(`Please fill all required fields (${field} is missing)`);
        return;
      }
    }

    if (!profilePhoto || !cvFile) {
      setError("Please upload both a profile photo and your CV/Resume");
      return;
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
      setError(errors[0]); // Show the first validation error
      return;
    }

    const bioWordCount = form.shortBio.trim().split(/\s+/).length;
    if (bioWordCount > 150) {
      setError("Short Bio cannot exceed 150 words");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await registerUser("professional", {
        ...form,
        email,
        profilePhoto,  // Pass the File object for profile picture upload
        cvFile,        // Pass the File object for CV upload
      });
      // if (response.status === "ACTIVE") {
      //   login(response.token, response.user); // Auto-login if backend approves immediately
      //   setTimeout(() => navigate("/professional/home"), 1500);
      // } else {
      //   setTimeout(() => navigate("/signup/pending-approval"), 1500);
      // }

      // Standard Flow: Verify Email First
      setTimeout(() => navigate("/signup/verify", { state: { email } }), 1500);
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <header className="h-20 w-full px-4 sm:px-8 md:px-12 flex items-center">
        <a
          href="#"
          className="flex items-center gap-2.5 text-2xl font-black text-[#111518] dark:text-white"
        >
          Fix-Link
        </a>
      </header>

      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-4xl p-6 md:p-12 bg-white dark:bg-background-dark/50 rounded-xl shadow space-y-10"
        >
          {/* Title */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl font-black">Create Your Professional Account</h1>
            <p className="text-[#60798a] dark:text-gray-400">
              Provide accurate details to get verified and start receiving jobs.
            </p>
          </div>

          {/* Personal Info */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold border-b pb-3">A. Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="font-medium pb-1">First Name *</span>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="form-input h-12"
                  required
                />
              </label>
              <label className="flex flex-col">
                <span className="font-medium pb-1">Last Name *</span>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="form-input h-12"
                  required
                />
              </label>

              {/* Email */}
              <label className="flex flex-col">
                <span className="font-medium pb-1">Email</span>
                <input value={email} disabled className="form-input h-12 bg-gray-100 text-gray-500" />
              </label>

              <label className="flex flex-col">
                <span className="font-medium pb-1">Phone Number *</span>
                <PhoneInput
                  value={form.phone}
                  onChange={(val) => setForm({ ...form, phone: val })}
                />
              </label>

              <label className="flex flex-col">
                <span className="font-medium pb-1">Profile Photo *</span>
                <input type="file" name="profilePhoto" onChange={handleChange} className="form-input" accept="image/png, image/jpeg, image/jpg" required />
              </label>

              <label className="flex flex-col relative">
                <span className="font-medium pb-1">Password *</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-input h-12 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-10 text-gray-400"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>

                <PasswordStrength
                  password={form.password}
                  userData={{
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: email
                  }}
                />
              </label>

              <label className="flex flex-col relative">
                <span className="font-medium pb-1">Confirm Password *</span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="form-input h-12 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-10 text-gray-400"
                >
                  <span className="material-symbols-outlined">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </label>

              <label className="flex flex-col">
                <span className="font-medium pb-1">Gender *</span>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="form-select h-12"
                  required
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </label>

              <label className="flex flex-col">
                <span className="font-medium pb-1">Date of Birth *</span>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="form-input h-12"
                  required
                />
              </label>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex flex-col">
                <span className="font-medium pb-1">City *</span>
                <input type="text" name="city" value={form.city} onChange={handleChange} className="form-input h-12" required />
              </label>
              <label className="flex flex-col">
                <span className="font-medium pb-1">Subcity *</span>
                <input type="text" name="subcity" value={form.subcity} onChange={handleChange} className="form-input h-12" required />
              </label>
              <label className="flex flex-col">
                <span className="font-medium pb-1">House Number</span>
                <input type="text" name="houseNumber" value={form.houseNumber} onChange={handleChange} className="form-input h-12" />
              </label>
            </div>

            {/* Location */}
            <label className="flex flex-col w-full">
              <span className="text-base font-medium pb-2">Location *</span>
              <LocationInput
                value={form.location}
                onSelect={(loc) => setForm({ ...form, location: loc })}
              />
            </label>

            <button
              type="button"
              onClick={handleUseGPS}
              className="flex items-center gap-2 px-5 h-12 border rounded-lg bg-white dark:bg-gray-800 border-[#dbe1e6] dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 mt-2"
            >
              <span className="material-symbols-outlined text-lg">my_location</span>
              Use Current GPS Location
            </button>
          </section>

          {/* Professional Details */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold border-b pb-3">B. Professional Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="font-medium pb-1">Service Category *</span>
                <select
                  name="serviceCategory"
                  value={form.serviceCategory}
                  onChange={handleChange}
                  className="form-select h-12"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col">
                <span className="font-medium pb-1">Years of Experience *</span>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={form.yearsOfExperience}
                  onChange={handleChange}
                  className="form-input h-12"
                  required
                />
              </label>
              <label className="flex flex-col md:col-span-2">
                <span className="font-medium pb-1">List of Skills (optional, separate with commas)</span>
                <input type="text" name="skills" value={form.skills} onChange={handleChange} className="form-input h-12" />
              </label>
              <label className="flex flex-col md:col-span-2">
                <span className="font-medium pb-1">Short Bio *</span>
                <textarea
                  name="shortBio"
                  value={form.shortBio}
                  onChange={handleChange}
                  className="form-textarea h-32"
                  placeholder="Maximum 150 words"
                  required
                />
              </label>
            </div>
          </section>

          {/* Verification */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold border-b pb-3">C. Verification Documents *</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="font-medium pb-1">CV / Resume *</span>
                <input type="file" name="cvFile" onChange={handleChange} className="form-input" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required />
              </label>
              <label className="flex flex-col">
                <span className="font-medium pb-1">Professional License Number *</span>
                <input
                  type="text"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  className="form-input h-12"
                  placeholder="Enter your license number"
                  required
                />
              </label>
            </div>
          </section>

          {/* Banking */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold border-b pb-3">D. Banking / Payment *</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="font-medium pb-1">Preferred Payout Method *</span>
                <select
                  name="payoutMethod"
                  value={form.payoutMethod}
                  onChange={handleChange}
                  className="form-select h-12"
                  required
                >
                  <option value="">Select a method</option>
                  <option>Telebirr</option>
                </select>
              </label>
              <label className="flex flex-col">
                <span className="font-medium pb-1">Telebirr Number *</span>
                <input
                  type="text"
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm({ ...form, accountNumber: val });
                  }}
                  placeholder="0911223344"
                  className="form-input h-12"
                  required
                />
              </label>
            </div>
          </section>


          {error && <ErrorMessage message={error} />}
          {success && <SuccessMessage message={success} />}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary text-white rounded-lg font-bold disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : "Submit & Proceed to Verification"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default ProfessionalRegister;
