import { useState, type ChangeEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/* 🔽 ADDED IMPORTS */
import { registerUser } from "../../../api/auth.api";
import ErrorMessage from "../../../components/ErrorMessage";
import LoadingSpinner from "../../../components/LoadingSpinner";
import SuccessMessage from "../../../components/SuccessMessage";
import LocationInput from "../../../components/LocationInput"; // ✅ Step 1: Import LocationInput
import PasswordStrength from "../../../components/PasswordStrength";
import { validatePassword } from "../../../utils/validation";
import PhoneInput from "../../../components/PhoneInput";

const CustomerRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  /* 🔽 REPLACED handleSubmit */
  // registerUser is imported from api/auth.api

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);

    // 1. Validation Logic
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
      setError(errors[0]); // Show the first validation error
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
        email: email, // ✅ Pass email from location state
      });

      // Backend returns technical success, show user-friendly message
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
    <div className="min-h-screen flex items-center justify-center bg-background-light px-4 py-12">
      <div className="bg-white dark:bg-background-dark/50 rounded-xl shadow w-full max-w-lg p-8 space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="flex items-center gap-2 text-2xl font-black">
            <span>Fix-Link</span>
          </div>
          <h1 className="text-3xl font-bold">
            Create Your Customer Account
          </h1>
        </div>

        {/* Profile Photo */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={
                profilePhoto
                  ? URL.createObjectURL(profilePhoto)
                  : "https://lh3.googleusercontent.com/aida-public/AB6AXuCQ-5PPZi9NPtzeY_6E2_hGxx1srFdVTUVOn3xInHv_UQwIaoWcCS8BcEoVOwpzsd9ks5tHfXgr-FXMaCXqPxJqWJ8uNPkqDfEMpqCxfy9AaUizfvcJM4LNI3cXKhTA4ZVlK5QWdX578_eidkAZ0ZFtUNe56GedRk_ZYy5XD7vkCJB3YAIGESoESkifwjM9pNy_qOjChanYupldHMCIYoCgkdYQKi2vrANfiEcWQco6WEQ_2E5M4OA6hUpVYWo8aY50PF6PYve8DA"
              }
              className="h-16 w-16 rounded-full object-cover"
            />
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              className="sr-only"
              onChange={handleChange}
            />
          </div>
          <p className="text-sm text-gray-500">
            Upload a profile photo (optional)
          </p>
        </div>

        {/* Email (read-only) */}
        <label className="flex flex-col w-full">
          <span className="text-base font-medium pb-2">Email</span>
          <input
            value={email}
            disabled
            className="form-input w-full h-12 rounded-lg bg-gray-100 text-gray-500"
          />
        </label>

        {/* First & Last Name */}
        <div className="flex gap-4">
          <label className="flex flex-col w-full">
            <span className="text-base font-medium pb-2">First Name</span>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="form-input w-full h-12 rounded-lg"
            />
          </label>
          <label className="flex flex-col w-full">
            <span className="text-base font-medium pb-2">Last Name</span>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="form-input w-full h-12 rounded-lg"
            />
          </label>
        </div>

        {/* Date of Birth */}
        <label className="flex flex-col w-full">
          <span className="text-base font-medium pb-2">Date of Birth</span>
          <input
            type="date"
            name="dateOfBirth"
            value={form.dateOfBirth}
            onChange={handleChange}
            className="form-input w-full h-12 rounded-lg"
          />
        </label>

        {/* Phone */}
        <label className="flex flex-col w-full">
          <span className="text-base font-medium pb-2">Phone Number</span>
          <PhoneInput
            value={form.phone}
            onChange={(val) => setForm({ ...form, phone: val })}
          />
        </label>

        {/* ✅ LocationInput replaced old input */}
        <label className="flex flex-col w-full">
          <span className="text-base font-medium pb-2">Location</span>

          <LocationInput
            value={form.location}
            onSelect={(loc) => setForm({ ...form, location: loc })}
          />
        </label>

        {/* Password */}
        <label className="flex flex-col w-full relative">
          <span className="text-base font-medium pb-2">Password</span>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            className="form-input w-full h-12 rounded-lg pr-10"
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

        {/* Confirm Password */}
        <label className="flex flex-col w-full relative">
          <span className="text-base font-medium pb-2">Confirm Password</span>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            className="form-input w-full h-12 rounded-lg pr-10"
          />
          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            className="absolute right-2 top-10 text-gray-400"
          >
            <span className="material-symbols-outlined">
              {showConfirmPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </label>

        {/* Terms */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="agree"
            checked={form.agree}
            onChange={handleChange}
          />
          I agree to the Terms & Privacy Policy
        </label>

        {/* 🔽 UI FEEDBACK */}
        {error && <ErrorMessage message={error} />}
        {success && <SuccessMessage message={success} />}

        {/* 🔽 UPDATED SUBMIT BUTTON */}
        <button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full h-12 bg-primary text-white rounded-lg font-bold disabled:opacity-50"
        >
          {loading ? <LoadingSpinner /> : "Create Account"}
        </button>

      </div>
    </div>
  );
};

export default CustomerRegister;
