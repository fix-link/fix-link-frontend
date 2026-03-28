import { useNavigate } from "react-router-dom";

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
      className="bg-white dark:bg-card-dark rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group cursor-pointer h-full"
    >
      <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
        <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-md overflow-hidden">
          <img
            alt={pro.name}
            className="w-full h-full object-cover"
            src={pro.image}
          />
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
        {pro.name}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{pro.role}</p>
      
      {pro.location && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-xs">location_on</span>
          {pro.location}
        </p>
      )}

      <div className="flex items-center gap-1 text-amber-500 text-xs mb-2">
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          star
        </span>
        <span className="font-bold text-slate-900 dark:text-white">{pro.rating}</span>
        {pro.reviews !== undefined && (
          <span className="text-slate-400 font-normal">({pro.reviews})</span>
        )}
      </div>

      {pro.verified && (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-primary dark:bg-blue-900/30 dark:text-blue-300 mb-2 border border-blue-100 dark:border-blue-800">
          <span className="material-symbols-outlined text-[14px] mr-1">verified</span> Trusted
        </div>
      )}

      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-4 italic">
        From <span className="text-primary font-bold not-italic">{pro.price} ETB</span>
      </p>

      <div className="mt-auto w-full pt-4 border-t border-slate-50 dark:border-slate-800/50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile();
          }}
          className="w-full py-2.5 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all">
          View Profile
        </button>
      </div>
    </div>
  );
};

export default ProfessionalCard;
