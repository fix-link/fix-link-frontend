import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  KeyRound, Mail, Lock, ArrowRight, ArrowLeft, 
  CheckCircle2, Timer, RefreshCcw 
} from "lucide-react";
import { forgotPassword, resetPassword } from "../../../api/auth.api";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorMessage from "../../../components/ErrorMessage";

type Step = 1 | 2 | 3 | 4;

const ForgotPassword = () => {
    const [step, setStep] = useState<Step>(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(600);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (step !== 2) return;
        if (timeLeft === 0) return;
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, step]);

    const handleOtpChange = (value: string, index: number) => {
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await forgotPassword(email);
            setStep(2);
            setTimeLeft(600);
        } catch (err: any) {
            setError(err.message || "Failed to send verification code");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) {
            setError("Please enter the complete 6-digit code");
            return;
        }
        setError(null);
        setStep(3);
    };

    const handleResend = async () => {
        if (!email) return;
        try {
            await forgotPassword(email);
            setTimeLeft(600);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to resend code");
        }
    };

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
        <div className="relative min-h-screen flex items-center justify-center p-6 bg-background-light dark:bg-background-dark overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-[15%] left-[5%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-blob"></div>
                <div className="absolute bottom-[15%] right-[5%] w-96 h-96 bg-accent-purple/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md animate-fade-in-up">
                {/* Brand Area */}
                <div className="text-center mb-10">
                    <Link to="/" className="inline-block">
                        <h1 className="text-4xl font-display font-extrabold text-gradient mb-2 tracking-tight">Fix-Link</h1>
                    </Link>
                </div>

                <div className="glass-panel p-8 sm:p-10 rounded-[40px] shadow-2xl border border-white/40 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-accent-purple"></div>

                    {step === 4 ? (
                        <div className="text-center py-6">
                            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-8 relative">
                                <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl animate-ping opacity-20"></div>
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-text-light dark:text-text-dark mb-4">Password Reset!</h3>
                            <p className="text-subtext-light dark:text-subtext-dark mb-10">
                                Your account security has been updated. You can now login with your new credentials.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex w-full h-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-light text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                            >
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                                    {step === 1 && <KeyRound size={28} />}
                                    {step === 2 && <Mail size={28} className="animate-pulse" />}
                                    {step === 3 && <Lock size={28} />}
                                </div>
                                <h1 className="text-3xl font-black text-text-light dark:text-white mb-2">
                                    {step === 1 && "Reset Password"}
                                    {step === 2 && "Check Email"}
                                    {step === 3 && "Secure Account"}
                                </h1>
                                <p className="text-subtext-light dark:text-subtext-dark">
                                    {step === 1 && "Enter your email to receive a recovery code."}
                                    {step === 2 && "Enter the 6-digit code we sent you."}
                                    {step === 3 && "Choose a strong new password."}
                                </p>
                            </div>

                            {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

                            {step === 1 && (
                                <form onSubmit={handleEmailSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-light dark:text-white ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                className="w-full h-14 pl-11 pr-4 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {loading ? <LoadingSpinner /> : (
                                            <>
                                                <span>Send Code</span>
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {step === 2 && (
                                <div className="space-y-8">
                                    <div className="flex justify-between gap-2">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(e.target.value, index)}
                                                maxLength={1}
                                                className="w-12 h-16 text-center text-2xl font-black rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
                                                type="text"
                                                inputMode="numeric"
                                            />
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2 text-sm text-subtext-light dark:text-subtext-dark">
                                            <Timer size={14} />
                                            <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>
                                        </div>
                                        <button
                                            onClick={handleResend}
                                            disabled={timeLeft > 0}
                                            className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${timeLeft > 0 ? "text-gray-400 cursor-not-allowed" : "text-primary hover:text-primary-dark"}`}
                                        >
                                            <RefreshCcw size={12} className={timeLeft === 0 ? "animate-spin-slow" : ""} />
                                            <span>Resend Code</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleOtpSubmit()}
                                        disabled={loading}
                                        className="w-full h-14 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                                    >
                                        Verify Code
                                    </button>
                                    
                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-full text-center text-xs font-black uppercase tracking-widest text-subtext-light dark:text-subtext-dark hover:text-primary transition-colors"
                                    >
                                        Wrong email? Change it here
                                    </button>
                                </div>
                            )}

                            {step === 3 && (
                                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-light dark:text-white ml-1">New Password</label>
                                        <div className="relative group">
                                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="password"
                                                placeholder="Create a strong password"
                                                className="w-full h-14 pl-11 pr-4 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-light dark:text-white ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="password"
                                                placeholder="Verify your new password"
                                                className="w-full h-14 pl-11 pr-4 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                                    >
                                        Update Password
                                    </button>
                                </form>
                            )}

                            <div className="mt-8 text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-sm font-bold text-subtext-light dark:text-subtext-dark hover:text-primary transition-colors group"
                                >
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    <span>Back to Login</span>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
