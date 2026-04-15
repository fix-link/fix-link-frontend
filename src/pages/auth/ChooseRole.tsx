import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { User, Briefcase, ArrowRight, CheckCircle2 } from "lucide-react";

const ChooseRole = () => {
  const [role, setRole] = useState<"customer" | "professional">("customer");

  const navigate = useNavigate();
  const location = useLocation();

  const email = (location.state as { email?: string })?.email;

  if (!email) {
    navigate("/signup/email");
    return null;
  }

  const handleContinue = () => {
    navigate(
      role === "customer"
        ? "/signup/customer"
        : "/signup/professional",
      { state: { email } }
    );
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background-light dark:bg-background-dark overflow-hidden font-sans text-left">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[30%] left-[5%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-[30%] right-[5%] w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-2xl animate-fade-in-up">
        {/* Brand Area */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-display font-extrabold text-gradient mb-2 tracking-tight">Fix-Link</h1>
          </Link>
          <p className="text-subtext-light dark:text-subtext-dark font-medium px-4">One step closer to your goal. Tell us who you are.</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-10">
          <div className="w-12 h-1.5 rounded-full bg-primary/40"></div>
          <div className="w-12 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/20"></div>
          <div className="w-12 h-1.5 rounded-full bg-border-light dark:bg-border-dark opacity-50"></div>
        </div>

        <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-xl border border-white/40">
          <h2 className="text-3xl font-black text-text-light dark:text-text-dark text-center mb-10">Choose Your Account Type</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Customer Option */}
            <div 
              onClick={() => setRole("customer")}
              className={`relative p-8 rounded-2xl border-2 transition-all duration-500 cursor-pointer group flex flex-col items-center text-center
                ${role === "customer" 
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 -translate-y-1" 
                  : "border-border-light dark:border-border-dark bg-white/30 dark:bg-gray-800/20 hover:border-primary/40 hover:-translate-y-1"}
              `}
            >
              {role === "customer" && (
                <div className="absolute top-3 right-3 text-primary animate-scale-in">
                  <CheckCircle2 size={24} fill="currentColor" className="text-white dark:text-gray-900" />
                  <CheckCircle2 size={24} className="absolute inset-0" />
                </div>
              )}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500
                ${role === "customer" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:text-primary"}
              `}>
                <User size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">I want to hire</h3>
              <p className="text-sm text-subtext-light dark:text-subtext-dark leading-relaxed">Find and connect with trusted local professionals.</p>
            </div>

            {/* Professional Option */}
            <div 
              onClick={() => setRole("professional")}
              className={`relative p-8 rounded-2xl border-2 transition-all duration-500 cursor-pointer group flex flex-col items-center text-center
                ${role === "professional" 
                  ? "border-accent-cyan bg-accent-cyan/5 shadow-lg shadow-accent-cyan/10 -translate-y-1" 
                  : "border-border-light dark:border-border-dark bg-white/30 dark:bg-gray-800/20 hover:border-accent-cyan/40 hover:-translate-y-1"}
              `}
            >
              {role === "professional" && (
                <div className="absolute top-3 right-3 text-accent-cyan animate-scale-in">
                  <CheckCircle2 size={24} fill="currentColor" className="text-white dark:text-gray-900" />
                  <CheckCircle2 size={24} className="absolute inset-0" />
                </div>
              )}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500
                ${role === "professional" ? "bg-accent-cyan text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:text-accent-cyan"}
              `}>
                <Briefcase size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">I'm a Professional</h3>
              <p className="text-sm text-subtext-light dark:text-subtext-dark leading-relaxed">Offer your services, manage clients, and grow your business.</p>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className={`w-full h-14 mt-10 rounded-full font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group hover:-translate-y-0.5 active:scale-95
              ${role === "customer" 
                ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-primary/20 hover:shadow-primary/40" 
                : "bg-gradient-to-r from-accent-cyan to-cyan-400 text-white shadow-accent-cyan/20 hover:shadow-accent-cyan/40"}
            `}
          >
            <span>Finish Setup</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-subtext-light dark:text-subtext-dark">
          Changed your mind about the email?{" "}
          <Link to="/signup/email" className="font-bold text-primary hover:text-primary-dark transition-colors">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ChooseRole;
