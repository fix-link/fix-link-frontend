import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { KeyRound, Timer, RefreshCcw, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { verifyOtp, resendOtp } from "../../api/auth.api";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email;

  if (!email) {
    navigate("/signup/email");
    return null;
  }

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
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
      await verifyOtp(email, code);
      navigate("/login", { replace: true, state: { message: "Email verified successfully. Please login." } });
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await resendOtp(email);
      setTimeLeft(30);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background-light dark:bg-background-dark overflow-hidden font-sans">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.02),transparent_50%)]">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-accent-cyan/5 rounded-full blur-[150px] animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-xl animate-fade-in-up">
        {/* Brand Area */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block group">
            <h1 className="text-4xl font-display font-extrabold text-gradient mb-2 tracking-tight group-hover:scale-105 transition-transform duration-500">Fix-Link</h1>
            <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-primary to-accent-cyan mx-auto transition-all duration-500 rounded-full"></div>
          </Link>
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4">Security Protocol Active</p>
        </div>

        <div className="glass-panel p-10 sm:p-14 rounded-[48px] shadow-2xl border border-white/40 dark:border-white/5 text-center relative overflow-hidden backdrop-blur-3xl">
          {/* Subtle Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
             <div className="w-24 h-24 rounded-[32px] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-10 relative group">
                <div className="absolute inset-0 bg-primary/10 rounded-[32px] group-hover:animate-ping opacity-20"></div>
                <KeyRound size={44} strokeWidth={1.5} className="group-hover:rotate-12 transition-transform duration-500" />
             </div>

             <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Verify Your Email</h2>
             <div className="flex items-center justify-center gap-2 mb-10 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 py-3 px-6 rounded-full w-fit mx-auto border border-slate-100 dark:border-white/5">
                <Mail size={16} className="text-primary" />
                <span className="text-sm font-bold">{email}</span>
             </div>

             <div className="flex justify-center gap-3 sm:gap-4 mb-10">
               {otp.map((digit, index) => (
                 <input
                   key={index}
                   id={`otp-${index}`}
                   value={digit}
                   onChange={(e) => handleChange(e.target.value, index)}
                   onKeyDown={(e) => handleKeyDown(e, index)}
                   maxLength={1}
                   className="w-12 h-16 sm:w-16 sm:h-20 text-center text-3xl font-black rounded-2xl bg-white/50 dark:bg-gray-800/20 border-2 border-slate-100 dark:border-slate-800/50 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-slate-900 dark:text-white shadow-inner"
                 />
               ))}
             </div>

             {error && <div className="mb-8 scale-in"><ErrorMessage message={error} /></div>}

             <div className="space-y-8">
               <button
                 onClick={handleVerify}
                 disabled={loading}
                 className="w-full h-16 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3 group"
               >
                 {loading ? <LoadingSpinner /> : (
                   <>
                     <span>Continue</span>
                     <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform duration-300" />
                   </>
                 )}
               </button>

               <div className="flex items-center justify-center gap-3">
                 {timeLeft > 0 ? (
                   <div className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/5 px-5 py-2 rounded-full border border-slate-100 dark:border-white/5">
                     <Timer size={14} className="animate-pulse text-primary" />
                     <span>Resend code in <span className="text-primary font-black">{timeLeft}s</span></span>
                   </div>
                 ) : (
                   <button 
                     onClick={handleResend}
                     className="flex items-center gap-2 text-sm font-black text-primary hover:text-primary-dark transition-all hover:gap-3"
                   >
                     <RefreshCcw size={16} strokeWidth={2.5} />
                     <span className="uppercase tracking-widest">Resend Code</span>
                   </button>
                 )}
               </div>
             </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Link to="/signup/email" className="text-sm font-black text-slate-400 dark:text-slate-500 hover:text-primary transition-colors flex items-center gap-2 uppercase tracking-widest">
               <ArrowRight size={14} className="rotate-180" />
               <span>Change Email</span>
            </Link>
            
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] opacity-50">
                <ShieldCheck size={14} />
                <span>Encrypted Verification Layer</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
