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
      className="glass-panel p-6 rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-300 border border-white/40 dark:border-slate-800/50 flex flex-col items-center text-center group cursor-pointer h-full min-h-[320px] relative overflow-hidden"
    >
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"></div>

      <div className="relative mb-5 group-hover:scale-105 transition-transform duration-500">
        <div className="w-28 h-28 rounded-[28px] bg-slate-100 dark:bg-slate-800 border-[6px] border-white dark:border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-primary/10 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity z-10 mix-blend-overlay"></div>
          <img
            alt={pro.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            src={pro.image}
          />
        </div>
      </div>

      <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight line-clamp-1">
        {pro.name}
      </h3>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">{pro.role}</p>
      
      {pro.location && (
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <MapPin size={12} strokeWidth={3} className="text-primary" />
          {pro.location}
        </p>
      )}

      <div className="flex items-center gap-1.5 text-amber-500 mb-4 bg-amber-50 dark:bg-amber-900/10 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
        <Star size={14} className="fill-amber-500" />
        <span className="font-black text-amber-700 dark:text-amber-400 text-sm leading-none">{pro.rating?.toFixed(1)}</span>
        {pro.reviews !== undefined && (
          <span className="text-amber-600/60 dark:text-amber-400/60 font-bold text-[10px] ml-1">({pro.reviews} jobs)</span>
        )}
      </div>

      {pro.verified && (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-3 border border-blue-100 dark:border-blue-800/50">
          <BadgeCheck size={14} strokeWidth={2.5} className="mr-1.5" /> Trusted Pro
        </div>
      )}

      <div className="mt-auto w-full pt-5 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between relative z-10">
        <div className="text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate</p>
          <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">
            {pro.price} <span className="text-[10px] text-slate-500 uppercase">ETB/hr</span>
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile();
          }}
          className="relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full bg-slate-900 dark:bg-white px-6 font-medium text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 hover:shadow-primary/40 transition-all duration-300 active:scale-95 group/btn"
        >
          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover/btn:duration-1000 group-hover/btn:[transform:skew(-12deg)_translateX(100%)]">
             <div className="relative h-full w-8 bg-white/20 dark:bg-black/10"></div>
          </div>
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest z-10">
             View <ArrowRight size={14} strokeWidth={3} className="group-hover/btn:translate-x-1.5 transition-transform duration-300" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default ProfessionalCard;
