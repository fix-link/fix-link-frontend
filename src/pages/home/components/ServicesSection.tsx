import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  Sparkles, Wrench, Zap, PaintRoller, Hammer, Monitor,
  Truck, Ruler, Droplets, MoreHorizontal
} from "lucide-react";

// Define the type for each service
interface Service {
  icon: React.ReactNode;
  name: string;
  colorClass: string;
  bgClass: string;
}

// Base services
const services: Service[] = [
  { icon: <Sparkles strokeWidth={1.5} size={32} />, name: "Cleaning", colorClass: "text-blue-500 group-hover:text-blue-600", bgClass: "bg-blue-50" },
  { icon: <Wrench strokeWidth={1.5} size={32} />, name: "Plumbing", colorClass: "text-cyan-500 group-hover:text-cyan-600", bgClass: "bg-cyan-50" },
  { icon: <Zap strokeWidth={1.5} size={32} />, name: "Electrician", colorClass: "text-yellow-500 group-hover:text-yellow-600", bgClass: "bg-yellow-50" },
  { icon: <PaintRoller strokeWidth={1.5} size={32} />, name: "Painter", colorClass: "text-purple-500 group-hover:text-purple-600", bgClass: "bg-purple-50" },
  { icon: <Hammer strokeWidth={1.5} size={32} />, name: "Handyman", colorClass: "text-orange-500 group-hover:text-orange-600", bgClass: "bg-orange-50" },
  { icon: <Monitor strokeWidth={1.5} size={32} />, name: "IT Technician", colorClass: "text-indigo-500 group-hover:text-indigo-600", bgClass: "bg-indigo-50" },
];

// Extra services to show when "More" is clicked
const extraServices: Service[] = [
  { icon: <Truck strokeWidth={1.5} size={32} />, name: "Delivery", colorClass: "text-green-500 group-hover:text-green-600", bgClass: "bg-green-50" },
  { icon: <Ruler strokeWidth={1.5} size={32} />, name: "Carpentry", colorClass: "text-amber-600 group-hover:text-amber-700", bgClass: "bg-amber-50" },
  { icon: <Droplets strokeWidth={1.5} size={32} />, name: "Pool Cleaning", colorClass: "text-sky-500 group-hover:text-sky-600", bgClass: "bg-sky-50" },
];

const ServicesSection = () => {
  const [showMore, setShowMore] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleServiceClick = (serviceName: string) => {
    const categoryParam = encodeURIComponent(serviceName);
    const targetUrl = `/customer/home?category=${categoryParam}`;

    if (isAuthenticated) {
      navigate(targetUrl);
    } else {
      navigate(`/login?returnUrl=${encodeURIComponent(targetUrl)}`);
    }
  };

  return (
    <section
      id="services"
      className="py-24 bg-surface-light dark:bg-background-dark relative overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent opacity-50 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-text-light dark:text-text-dark">
            Explore <span className="text-primary">Services</span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-subtext-light dark:text-subtext-dark">
            Whatever you need done, we’ve got the right pro for you. Select a category to begin.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 text-center">
          {services.map((service, index) => (
            <div
              key={service.name}
              onClick={() => handleServiceClick(service.name)}
              className="group flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`flex items-center justify-center w-20 h-20 rounded-full ${service.bgClass} dark:bg-white/5 transition-colors duration-300 group-hover:scale-110`}>
                <div className={`${service.colorClass} transition-colors duration-300`}>
                  {service.icon}
                </div>
              </div>
              <span className="font-semibold text-text-light dark:text-text-dark text-sm md:text-base">{service.name}</span>
            </div>
          ))}

          {/* "More" Button */}
          <div
            className="group flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fade-in-up"
            style={{ animationDelay: `0.6s` }}
            onClick={() => setShowMore(!showMore)}
          >
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
              <MoreHorizontal strokeWidth={1.5} size={32} />
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm md:text-base">
              {showMore ? "Less" : "More"}
            </span>
          </div>

          {/* Extra Services Grid */}
          {showMore && extraServices.map((service, index) => (
            <div
              key={service.name}
              onClick={() => handleServiceClick(service.name)}
              className="group flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className={`flex items-center justify-center w-20 h-20 rounded-full ${service.bgClass} dark:bg-white/5 transition-colors duration-300 group-hover:scale-110`}>
                <div className={`${service.colorClass} transition-colors duration-300`}>
                  {service.icon}
                </div>
              </div>
              <span className="font-semibold text-text-light dark:text-text-dark text-sm md:text-base">{service.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
