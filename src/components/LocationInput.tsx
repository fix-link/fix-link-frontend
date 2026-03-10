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
        <div className="absolute z-10 bg-white border w-full rounded shadow mt-1">
          {filtered.map((loc) => (
            <div
              key={loc}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                onSelect(loc);
                setQuery(loc);
                setShow(false);
              }}
            >
              {loc}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
