import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../../api/auth.api";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorMessage from "../../../components/ErrorMessage";

type Step = 1 | 2 | 3 | 4;

const ForgotPassword = () => {
    // const navigate = useNavigate(); // Removed unused
    const [step, setStep] = useState<Step>(1);
    const [email, setEmail] = useState("");

    // OTP State (Array of 6 strings)
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Countdown state
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Countdown effect
    useEffect(() => {
        if (step !== 2) return; // Only run in step 2
        if (timeLeft === 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, step]);

    // Handle OTP Input Change
    const handleOtpChange = (value: string, index: number) => {
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

    // Step 1: Send OTP
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await forgotPassword(email);
            setStep(2);
            setTimeLeft(600); // Reset timer on success
        } catch (err: any) {
            setError(err.message || "Failed to send verification code");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Proceed to step 3
    const handleOtpSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const code = otp.join("");
        if (code.length !== 6) {
            setError("Please enter the complete 6-digit code");
            return;
        }

        setError(null);
        // In our current API, verification happens when resetting
        setStep(3);
    };

    // Handle Resend (Mock for now, re-calls forgotPassword)
    const handleResend = async () => {
        if (!email) return;
        try {
            await forgotPassword(email); // Re-send email
            setTimeLeft(600);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to resend code");
        }
    };

    // Step 3: Reset Password
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const code = otp.join("");
            await resetPassword(email, code, newPassword);
            setStep(4);
        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark p-4 sm:p-6 font-display">
            <div className="w-full max-w-md rounded-xl bg-white dark:bg-background-dark p-6 shadow-lg sm:p-8">

                {step === 4 ? (
                    // Step 4: Success
                    <div className="text-center animate-fade-in">
                        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500">
                            <span className="material-symbols-outlined text-3xl">check_circle</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Password Reset!</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Your password has been successfully updated. You can now login with your new credentials.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block w-full rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                        >
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">
                                {step === 1 && "Forgot Password?"}
                                {step === 2 && "Verification Code"}
                                {step === 3 && "New Password"}
                            </h1>
                            <p className="text-text-secondary dark:text-gray-400">
                                {step === 1 && "Enter your email and we'll send you a reset code."}
                                {step === 2 && "Enter the 6-digit code sent to your email"}
                                {step === 3 && "Create a new password for your account."}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4">
                                <ErrorMessage message={error} />
                            </div>
                        )}

                        {/* Step 1 Form: Email */}
                        {step === 1 && (
                            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4 animate-fade-in">
                                <div className="space-y-1">
                                    <label htmlFor="email" className="text-sm font-medium text-text-primary dark:text-white">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        className="form-input w-full rounded-lg border border-border-color bg-white dark:bg-gray-800 px-4 py-3 text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 mt-2"
                                >
                                    {loading ? <LoadingSpinner /> : "Send Reset Code"}
                                </button>
                            </form>
                        )}

                        {/* Step 2 Form: OTP (Segmented) */}
                        {step === 2 && (
                            <div className="animate-fade-in">
                                <div className="flex justify-center gap-2 mb-6">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(e.target.value, index)}
                                            maxLength={1}
                                            className="w-12 h-14 text-center text-xl font-bold border rounded-lg bg-white dark:bg-gray-800 text-text-primary dark:text-white border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            type="text"
                                            inputMode="numeric"
                                        />
                                    ))}
                                </div>

                                <div className="text-center mb-6">
                                    <p className="text-sm text-gray-500 mb-2">
                                        Resend code in{" "}
                                        <span className="font-semibold">{formatTime(timeLeft)}</span>
                                    </p>
                                    <button
                                        onClick={handleResend}
                                        disabled={timeLeft > 0}
                                        className={`text-sm font-semibold ${timeLeft > 0
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-primary hover:underline"
                                            }`}
                                    >
                                        Resend OTP
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleOtpSubmit()}
                                    disabled={loading}
                                    className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-70"
                                >
                                    {loading ? <LoadingSpinner /> : "Verify & Continue"}
                                </button>

                                <div className="mt-4 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Change Email
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3 Form: New Password */}
                        {step === 3 && (
                            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 animate-fade-in">
                                <div className="space-y-1">
                                    <label htmlFor="newPassword" className="text-sm font-medium text-text-primary dark:text-white">
                                        New Password
                                    </label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        placeholder="Enter new password"
                                        className="form-input w-full rounded-lg border border-border-color bg-white dark:bg-gray-800 px-4 py-3 text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="confirmPassword" className="text-sm font-medium text-text-primary dark:text-white">
                                        Confirm Password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm new password"
                                        className="form-input w-full rounded-lg border border-border-color bg-white dark:bg-gray-800 px-4 py-3 text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 mt-2"
                                >
                                    {loading ? <LoadingSpinner /> : "Update Password"}
                                </button>
                            </form>
                        )}

                        {step !== 2 && (
                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="text-sm font-bold text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-white inline-flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                                    Back to Login
                                </Link>
                            </div>
                        )}
                        {/* Step 2 has its own specific back navigation */}
                        {step === 2 && (
                            <div className="mt-4 text-center">
                                <Link
                                    to="/login"
                                    className="text-sm font-bold text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-white inline-flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                                    Back to Login
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
