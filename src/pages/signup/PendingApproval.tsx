import { Link } from "react-router-dom";
import { Clock, ShieldCheck, Home, LogIn, Sparkles, Activity } from "lucide-react";

const PendingApproval = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background-light dark:bg-background-dark overflow-hidden font-sans">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(var(--primary-rgb),0.03),transparent_60%)]">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-accent-cyan/5 rounded-full blur-[150px] animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-xl animate-fade-in-up">
        {/* Brand Area */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block group">
            <h1 className="text-4xl font-display font-extrabold text-gradient mb-2 tracking-tight group-hover:scale-105 transition-transform duration-500">Fix-Link</h1>
            <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-primary to-accent-cyan mx-auto transition-all duration-500 rounded-full"></div>
          </Link>
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-4">Professional Onboarding</p>
        </div>

        <div className="glass-panel p-10 sm:p-14 rounded-[48px] shadow-2xl border border-white/40 dark:border-white/5 text-center relative overflow-hidden backdrop-blur-3xl">
          {/* Subtle accent line */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent-cyan to-primary animate-gradient-x"></div>

          <div className="w-28 h-28 rounded-[40px] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-10 relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-[40px] animate-ping opacity-20 group-hover:duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Clock size={56} strokeWidth={1.2} className="relative z-10 animate-pulse" />
          </div>

          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Application Under Review</h2>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-10 leading-relaxed max-w-md mx-auto">
            Our team is currently verifying your professional credentials to ensure the highest service standards.
          </p>

          <div className="bg-slate-50 dark:bg-white/5 rounded-[32px] p-8 mb-12 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-left border border-slate-100 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity size={80} />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-primary" size={24} />
            </div>
            <div className="space-y-2 relative z-10">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Security Check Active</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                You will receive an email confirmation once your account is fully approved. This usually takes <span className="text-primary font-black">less than 48 hours</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/login"
              className="w-full h-16 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group text-lg"
            >
              <span>Go to Login</span>
              <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/"
              className="w-full h-16 bg-white/50 dark:bg-slate-800/20 text-slate-600 dark:text-white rounded-full font-bold border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <Home size={20} className="group-hover:-translate-y-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-white/5">
                <Sparkles size={14} className="text-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Empowering the Local Community</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
