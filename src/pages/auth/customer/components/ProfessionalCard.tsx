import React from 'react';

export type Professional = {
  id?: number | string;
  name: string;
  role: string;
  rating: number;
  reviews?: number;
  price: number;
  image: string;
  quote?: string;
};

interface ProfessionalCardProps {
  pro: Professional;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ pro }) => {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-white dark:bg-background-dark shadow-card transition-shadow hover:shadow-lg h-full">
      {/* Header / Banner */}
      <div className="relative h-24 bg-background-light dark:bg-white/10">
        <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 transform">
          <img
            alt={`Photo of ${pro.name}`}
            className="size-24 rounded-full object-cover border-4 border-white dark:border-background-dark shadow-md"
            src={pro.image}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 pt-16 text-center">
        <h3 className="text-lg font-bold text-text-primary dark:text-white">{pro.name}</h3>
        <p className="text-sm text-text-secondary dark:text-gray-400 mt-0.5">{pro.role}</p>

        <div className="mt-2 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-xl text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span className="text-sm font-semibold text-text-primary dark:text-white">{pro.rating}</span>
          {pro.reviews !== undefined && (
            <span className="text-gray-400 text-xs ml-1">({pro.reviews} reviews)</span>
          )}
        </div>

        {pro.quote && (
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-3 flex-grow line-clamp-2">
            "{pro.quote}"
          </p>
        )}

        <p className="text-base font-bold text-text-primary dark:text-white mt-4">
          <span className="font-normal text-text-secondary">Starting from</span> {pro.price} ETB
        </p>

        {/* Buttons */}
        <div className="mt-5 flex items-center gap-3">
          <button className="flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 bg-primary text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] px-4 transition-colors hover:bg-primary/90">
            Book Now
          </button>
          <button className="flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 bg-background-light dark:bg-white/10 text-text-primary dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] px-4 transition-colors hover:bg-gray-200 dark:hover:bg-white/20">
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCard;
