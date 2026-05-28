import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationInput from "../../../components/LocationInput";
import { formatLocationDisplay } from "../../../utils/location";
import { Wrench, MapPin, Search } from "lucide-react";

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [locationSubcity, setLocationSubcity] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (service) params.append("service", service);
    if (locationSubcity) params.append("location", locationSubcity);
    else if (location) params.append("location", location);
    if (locationLat !== null && locationLat !== undefined) params.append("lat", String(locationLat));
    if (locationLng !== null && locationLng !== undefined) params.append("lng", String(locationLng));
    navigate(`/customer/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel p-2 md:p-3 rounded-2xl md:rounded-full mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">
        
        {/* Service Select */}
        <div className="relative w-full md:w-2/5 md:border-r border-gray-200/50 dark:border-gray-700/50 z-30">
          <Wrench size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <select 
            value={service} 
            onChange={(e) => setService(e.target.value)} 
            className="w-full h-14 pl-12 pr-4 bg-transparent border-none text-text-light dark:text-text-dark font-medium focus:ring-0 cursor-pointer appearance-none outline-none"
          >
            <option value="" className="text-gray-400">What do you need help with?</option>
            <option className="text-gray-900" value="Plumbing">Plumbing</option>
            <option className="text-gray-900" value="Electrical">Electrical</option>
            <option className="text-gray-900" value="Cleaning">Cleaning</option>
            <option className="text-gray-900" value="Painting">Painting</option>
            <option className="text-gray-900" value="Handyman">Handyman</option>
          </select>
        </div>

        {/* Location Input */}
        <div className="relative w-full md:w-2/5 px-2">
          <LocationInput
            className="w-full h-14 pl-10 bg-transparent border-none text-text-light dark:text-text-dark font-medium focus:ring-0 placeholder-gray-500"
            value={location}
            onInputChange={(val) => {
              setLocation(val);
              if (!val) {
                setLocationSubcity("");
                setLocationLat(null);
                setLocationLng(null);
              }
            }}
            onSelect={(sel) => {
              setLocation(formatLocationDisplay(sel));
              setLocationSubcity(sel.subcity);
              setLocationLat(sel.lat);
              setLocationLng(sel.lng);
            }}
            placeholder="Subcity in Addis Ababa (e.g. Bole)"
            icon={
              <MapPin size={20} className="text-gray-500" />
            }
          />
        </div>

        {/* Search Button */}
        <div className="w-full md:w-1/5 md:pl-2">
          <button 
            onClick={handleSearch} 
            className="w-full h-14 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl md:rounded-full font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Search size={20} />
            <span className="md:hidden lg:inline">Search</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default SearchBar;
