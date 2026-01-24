import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp, resendOtp } from "../../api/auth.api";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // get email from previous page
  const email = (location.state as { email?: string })?.email;

  // guard against direct access
  if (!email) {
    navigate("/signup");
    return null;
  }

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(30);

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // countdown
  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyOtp(email, code); // ✅ NOW PASSING EMAIL

      // Success! Go to Login
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await resendOtp(email);
      setTimeLeft(30);
      setError(null); // Clear previous errors
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light font-display">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
        <p className="text-gray-500 mb-6">
          Enter the 6-digit code sent to your email
        </p>

        <div className="flex justify-center gap-2 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              maxLength={1}
              className="w-12 h-14 text-center text-xl font-bold border rounded-lg"
            />
          ))}
        </div>

        {/* Error message */}
        {error && <ErrorMessage message={error} />}

        <p className="text-sm text-gray-500 mb-2">
          Resend code in{" "}
          <span className="font-semibold">{timeLeft}s</span>
        </p>

        <button
          onClick={handleResend}
          disabled={timeLeft > 0}
          className={`text-sm font-semibold mb-4 ${timeLeft > 0
            ? "text-gray-400 cursor-not-allowed"
            : "text-primary"
            }`}
        >
          Resend OTP
        </button>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full h-12 bg-primary text-white rounded-lg font-bold"
        >
          {loading ? <LoadingSpinner /> : "Verify & Continue"}
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
