import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";

const EmailSignup = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleContinue = async () => {
    setError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      navigate("/signup/role", { state: { email } });
    } catch (err: any) {
      setError(err.message || "Failed to proceed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background-light dark:bg-background-dark overflow-hidden font-sans">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-[20%] left-[10%] w-96 h-96 bg-accent-cyan/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Brand Area */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-display font-extrabold text-gradient mb-2 tracking-tight">Fix-Link</h1>
          </Link>
          <p className="text-subtext-light dark:text-subtext-dark font-medium px-4">Your connection to trusted professionals starts here.</p>
        </div>

        {/* Progress indicator (Subtle) */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-12 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/20"></div>
          <div className="w-12 h-1.5 rounded-full bg-border-light dark:bg-border-dark opacity-50"></div>
          <div className="w-12 h-1.5 rounded-full bg-border-light dark:bg-border-dark opacity-50"></div>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-3xl shadow-xl border border-white/40">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Create Account</h2>
            <p className="text-subtext-light dark:text-subtext-dark mt-2">Enter your email to get started</p>
          </div>

          <div className="space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-light dark:text-text-dark ml-1">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-11 pr-4 rounded-full bg-white/50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-text-light dark:text-white placeholder:text-gray-400"
                />
              </div>
              <p className="text-[11px] text-subtext-light dark:text-subtext-dark ml-4 italic">
                We'll use this to verify your identity.
              </p>
            </div>

            {error && <ErrorMessage message={error} />}

            <button
              onClick={handleContinue}
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 group"
            >
              {loading ? <LoadingSpinner /> : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative pt-4 text-center">
              <p className="text-sm text-subtext-light dark:text-subtext-dark">
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-primary hover:text-primary-dark transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-[12px] text-subtext-light dark:text-subtext-dark opacity-70 px-6">
          By continuing, you agree to Fix-Link's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default EmailSignup;
