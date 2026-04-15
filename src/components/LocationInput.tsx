import React, { useState, useEffect, useRef } from "react";

interface Props {
  value: string;
  onSelect: (location: string) => void;
  className?: string; // Custom class for the input
  icon?: React.ReactNode; // Optional icon to render inside
}

const mockLocations = [
  "Addis Ababa, Bole",
  "Addis Ababa, Kazanchis",
  "Adama, Nazret",
  "Bahir Dar",
  "Hawassa",
];

const LocationInput = ({ value, onSelect, className, icon }: Props) => {
  const [query, setQuery] = useState(value);
  const [show, setShow] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = mockLocations.filter((loc) =>
    loc.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        id="location"
        name="location"
        value={query}
        onFocus={() => setShow(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setShow(true);
        }}
        className={className || "form-input h-12 w-full"}
        placeholder="Enter location"
      />

      {show && filtered.length > 0 && (
        <div className="absolute z-[60] left-0 right-0 top-full mt-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {filtered.map((loc, i) => (
            <button
              key={loc}
              type="button"
              className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors hover:bg-primary hover:text-white dark:text-slate-200 dark:hover:text-white ${
                i !== filtered.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/50' : ''
              }`}
              onClick={() => {
                onSelect(loc);
                setQuery(loc);
                setShow(false);
              }}
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
