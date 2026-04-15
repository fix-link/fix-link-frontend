import React, { useState } from "react";
import LocationInput from "../../../components/LocationInput";
import { Wrench, MapPin, Search } from "lucide-react";

const SearchBar: React.FC = () => {
  const [location, setLocation] = useState("");

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel p-2 md:p-3 rounded-2xl md:rounded-full mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">
        
        {/* Service Select */}
        <div className="relative w-full md:w-2/5 md:border-r border-gray-200/50 dark:border-gray-700/50 z-30">
          <Wrench size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <select defaultValue="" className="w-full h-14 pl-12 pr-4 bg-transparent border-none text-text-light dark:text-text-dark font-medium focus:ring-0 cursor-pointer appearance-none">
            <option value="" disabled className="text-gray-400">What do you need help with?</option>
            <option className="text-gray-900">Plumbing</option>
            <option className="text-gray-900">Electrical</option>
            <option className="text-gray-900">Cleaning</option>
            <option className="text-gray-900">Painting</option>
            <option className="text-gray-900">Handyman</option>
          </select>
        </div>

        {/* Location Input */}
        <div className="relative w-full md:w-2/5 px-2">
          <LocationInput
            className="w-full h-14 pl-10 bg-transparent border-none text-text-light dark:text-text-dark font-medium focus:ring-0 placeholder-gray-500"
            value={location}
            onSelect={(loc: string) => setLocation(loc)}
            icon={
              <MapPin size={20} className="text-gray-500" />
            }
          />
        </div>

        {/* Search Button */}
        <div className="w-full md:w-1/5 md:pl-2">
          <button className="w-full h-14 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl md:rounded-full font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2">
            <Search size={20} />
            <span className="md:hidden lg:inline">Search</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default SearchBar;
