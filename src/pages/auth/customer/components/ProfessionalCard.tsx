import { useNavigate } from "react-router-dom";
import { Star, MapPin, BadgeCheck, ArrowRight } from "lucide-react";

export type Professional = {
  id?: number | string;
  name: string;
  role: string;
  rating: number;
  reviews?: number;
  price: number;
  image: string;
  location?: string;
  quote?: string;
  verified?: boolean;
};

interface ProfessionalCardProps {
  pro: Professional;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ pro }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/customer/profile/${pro.id || 1}`);
  };

  return (
    <div
      onClick={handleViewProfile}
      className="glass-panel p-7 rounded-[40px] shadow-sm hover:shadow-2xl transition-all duration-500 border border-white/40 dark:border-slate-800/50 flex flex-col items-center text-center group cursor-pointer h-full min-h-[360px] relative overflow-hidden active:scale-[0.98]"
    >
      {/* Dynamic Background Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-700"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-cyan/5 rounded-full blur-3xl pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-700"></div>

      <div className="relative mb-6 group-hover:scale-105 transition-all duration-500 ease-out">
        <div className="size-32 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border-[6px] border-white dark:border-slate-800 shadow-2xl overflow-hidden relative group-hover:rotate-2 transition-transform duration-500">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
          <img
            alt={pro.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            src={pro.image}
          />
        </div>
        {pro.verified && (
          <div className="absolute -bottom-2 -right-2 size-10 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-800 group-hover:translate-x-1 group-hover:translate-y-[-2px] transition-transform">
            <BadgeCheck size={20} strokeWidth={2.5} />
          </div>
        )}
      </div>

      <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight line-clamp-1 mb-1">
        {pro.name}
      </h3>
      <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">{pro.role}</p>
      
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
          <Star size={14} className="fill-amber-500 text-amber-500" />
          <span className="font-black text-amber-600 dark:text-amber-400 text-sm leading-none">{pro.rating?.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
          <MapPin size={14} className="text-primary" />
          <span className="font-black text-primary text-[10px] uppercase tracking-wider line-clamp-1">{pro.location?.split(',')[0]}</span>
        </div>
      </div>

      <div className="mt-auto w-full pt-6 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between relative z-10 transition-all">
        <div className="text-left space-y-0.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60 transition-opacity group-hover:opacity-100">Starting from</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-slate-900 dark:text-white transition-colors group-hover:text-primary">{pro.price}</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">ETB</span>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile();
          }}
          className="size-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300"
        >
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default ProfessionalCard;
