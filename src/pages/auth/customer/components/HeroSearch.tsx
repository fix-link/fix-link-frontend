import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LocationInput from "../../../../components/LocationInput";
import heroBg from "../../../../assets/hero-bg.jpg";

const HeroSearch: React.FC = () => {
  const [category, setCategory] = useState<string>("Plumbing");
  const [location, setLocation] = useState<string>("");

  const navigate = useNavigate();

  useEffect(() => {
    // Check for category in URL params
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get("category");
    if (categoryParam) {
      setCategory(categoryParam);
    }
  }, []);

  const handleSearch = () => {
    navigate(`/customer/search?category=${encodeURIComponent(category)}&location=${encodeURIComponent(location)}`);
  };

  return (
    <section
      className="min-h-screen bg-cover bg-center flex items-center justify-center text-center"
      style={{
        backgroundImage:
          `linear-gradient(rgba(94, 100, 190, 0.4), rgba(131, 147, 165, 0.6)), url(${heroBg})`,
      }}
    >
      <div className="mt-20 flex flex-col gap-6 w-full px-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-white/90 font-medium text-2xl tracking-wide">
            Welcome, <span className="font-bold text-white">Nuniyat</span>
          </h2>
          <h1 className="text-white text-4xl md:text-6xl font-black tracking-tight">
            Your Link to Trusted Local Pros.
          </h1>
        </div>

        <div className="w-full max-w-3xl mx-auto bg-white/10 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 w-full">
            <div className="relative w-full md:col-span-5">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                category
              </span>
              <select
                className="form-select w-full h-14 pl-10 pr-8 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#111518] dark:text-white focus:ring-primary focus:border-primary"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>Cleaning</option>
                <option>Painting</option>
                <option>Handyman</option>
              </select>
            </div>

            <div className="relative w-full md:col-span-5">
              <LocationInput
                className="form-input w-full h-14 pl-10 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#111518] dark:text-white focus:ring-primary focus:border-primary"
                value={location}
                onSelect={(loc: string) => setLocation(loc)}
                icon={
                  <span className="material-symbols-outlined text-gray-500">
                    location_on
                  </span>
                }
              />
            </div>

            <button
              onClick={handleSearch}
              className="flex md:col-span-2 w-full h-14 items-center justify-center rounded-lg bg-primary text-white text-base font-bold hover:bg-primary/90"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
