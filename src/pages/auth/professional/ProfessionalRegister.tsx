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

const ProfessionalRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
    paymentType: "perHour",
    hourlyRate: "",
    packages: [] as { title: string; price: string }[],
  });

  // File states
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [nationalIdFront, setNationalIdFront] = useState<File | null>(null);
  const [nationalIdBack, setNationalIdBack] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [selfPicture, setSelfPicture] = useState<File | null>(null);
  const [finNumber, setFinNumber] = useState("");

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
        const validDocTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        // Handle CV separately
        if (name === "cvFile") {
          if (!validDocTypes.includes(file.type) && !file.name.endsWith(".docx")) {
            setError("CV must be a PDF or DOCX file");
            return;
          }
          setCvFile(file);
        } else {
          // All other files are images
          if (!validImageTypes.includes(file.type)) {
            setError(`Please upload a valid image (PNG or JPG) for ${name}`);
            return;
          }

          switch (name) {
            case "profilePhoto": setProfilePhoto(file); break;
            case "nationalIdFront": setNationalIdFront(file); break;
            case "nationalIdBack": setNationalIdBack(file); break;
            case "selfPicture": setSelfPicture(file); break;
          }
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

  // Package helpers
  const addPackage = () => {
    setForm({ ...form, packages: [...form.packages, { title: "", price: "" }] });
  };

  const removePackage = (index: number) => {
    const updated = form.packages.filter((_, i) => i !== index);
    setForm({ ...form, packages: updated });
  };

  const updatePackage = (index: number, field: "title" | "price", value: string) => {
    const updated = form.packages.map((pkg, i) =>
      i === index ? { ...pkg, [field]: value } : pkg
    );
    setForm({ ...form, packages: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "phone",
      "gender",
      "dateOfBirth",
      "city",
      "subcity",
      "serviceCategory",
      "yearsOfExperience",
      "shortBio",
      "password",
      "confirmPassword",
      "location",
      "payoutMethod",
      "accountNumber",
    ];

    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) {
        setError("Please fill all required fields");
        return;
      }
    }

    // Payment validation
    if (form.paymentType === "perHour") {
      if (!form.hourlyRate) {
        setError("Please enter your hourly rate");
        return;
      }
    } else {
      if (form.packages.length === 0) {
        setError("Please add at least one package");
        return;
      }
      for (const pkg of form.packages) {
        if (!pkg.title || !pkg.price) {
          setError("All package descriptions and prices are required");
          return;
        }
      }
    }

    if (!profilePhoto || !nationalIdFront || !nationalIdBack || !cvFile || !selfPicture || !finNumber) {
      setError("All verification documents are required");
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
      const response = await registerUser("professional", {
        ...form,
        email,
        finNumber,
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
          <span
            className="material-symbols-outlined text-primary text-4xl"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}
          >
            link
          </span>
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
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Carpentry</option>
                  <option>Painting</option>
                  <option>Cleaning</option>
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

          {/* Payment */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-3">E. Payment *</h2>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentType"
                  value="perHour"
                  checked={form.paymentType === "perHour"}
                  onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                />
                Per Hour
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentType"
                  value="package"
                  checked={form.paymentType === "package"}
                  onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                />
                Package
              </label>
            </div>

            {/* Per Hour */}
            {form.paymentType === "perHour" && (
              <input
                type="number"
                placeholder="Hourly Rate ETB"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                className="form-input h-12 w-64"
                required
              />
            )}

            {/* Package */}
            {form.paymentType === "package" && (
              <div className="space-y-4">
                {form.packages.map((pkg, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 flex flex-col md:flex-row gap-4 items-start">
                    <textarea
                      placeholder="Package description (e.g., 'Clean whole house')"
                      value={pkg.title}
                      onChange={(e) => updatePackage(index, "title", e.target.value)}
                      className="form-textarea flex-1 h-24 resize-none p-2 rounded-lg border border-gray-300 dark:border-gray-600"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price ETB"
                      value={pkg.price}
                      onChange={(e) => updatePackage(index, "price", e.target.value)}
                      className="form-input w-32 h-12 rounded-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removePackage(index)}
                      className="text-red-500 font-bold text-2xl self-start md:self-center mt-2 md:mt-0"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPackage}
                  className="flex items-center gap-2 text-primary font-medium mt-2"
                >
                  <span className="text-xl">+</span> Add Package
                </button>

                {/* Live Preview */}
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-lg">Preview:</h3>
                  <div className="space-y-2">
                    {form.packages.map((pkg, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-white dark:bg-gray-800 flex justify-between items-start shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{pkg.title || "Package description"}</p>
                          <p className="text-gray-500 dark:text-gray-300">Price: {pkg.price ? `${pkg.price} ETB` : "0 ETB"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Verification */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold border-b pb-3">C. Verification Documents *</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col md:col-span-2">
                <span className="font-medium pb-1">FIN Number *</span>
                <input type="text" value={finNumber} onChange={(e) => setFinNumber(e.target.value)} className="form-input h-12" required />
              </label>
              <label className="flex flex-col">
                <span className="font-medium pb-1">National ID (Front) *</span>
                <input type="file" name="nationalIdFront" onChange={handleChange} className="form-input" accept="image/png, image/jpeg, image/jpg" required />
              </label>
              <label className="flex flex-col">
                <span className="font-medium pb-1">National ID (Back) *</span>
                <input type="file" name="nationalIdBack" onChange={handleChange} className="form-input" accept="image/png, image/jpeg, image/jpg" required />
              </label>
              <label className="flex flex-col">
                <span className="font-medium pb-1">CV / Resume *</span>
                <input type="file" name="cvFile" onChange={handleChange} className="form-input" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required />
              </label>
              <label className="flex flex-col md:col-span-2">
                <span className="font-medium pb-1">Picture of Yourself *</span>
                <input type="file" name="selfPicture" onChange={handleChange} className="form-input" accept="image/png, image/jpeg, image/jpg" required />
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
                  <option>CBE Birr</option>
                  <option>Bank Account</option>
                </select>
              </label>
              <label className="flex flex-col">
                <span className="font-medium pb-1">Account / Phone Number *</span>
                <input
                  type="text"
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
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
