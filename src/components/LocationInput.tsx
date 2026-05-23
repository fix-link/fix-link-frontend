import React, { useState, useEffect, useRef, useCallback } from "react";
import { searchAddisLocations } from "../api/nominatim.api";
import type { LocationSelection } from "../types/location.types";
import { formatLocationDisplay } from "../utils/location";
import { Loader2, MapPin } from "lucide-react";

interface Props {
  value: string;
  onSelect: (location: LocationSelection) => void;
  onInputChange?: (value: string) => void;
  className?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}

const LocationInput = ({
  value,
  onSelect,
  onInputChange,
  className,
  icon,
  placeholder = "Search subcity (e.g. Bole)",
  disabled = false,
}: Props) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSelection[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const runSearch = useCallback(async (text: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchAddisLocations(text);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
      setError("Could not load locations. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, show, runSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pick = (sel: LocationSelection) => {
    const display = formatLocationDisplay(sel);
    setQuery(display);
    onInputChange?.(display);
    onSelect(sel);
    setShow(false);
    setError(null);
  };

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
        disabled={disabled}
        onFocus={() => {
          setShow(true);
          runSearch(query);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          onInputChange?.(e.target.value);
          setShow(true);
        }}
        className={className || "form-input h-12 w-full"}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && show && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400">
          <Loader2 size={18} className="animate-spin" />
        </div>
      )}

      {show && (suggestions.length > 0 || error) && (
        <div className="absolute z-[60] left-0 right-0 top-full mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/50 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <MapPin size={12} />
            Addis Ababa, Ethiopia
          </div>
          {error && (
            <p className="px-4 py-3 text-xs font-bold text-amber-600 dark:text-amber-400">{error}</p>
          )}
          {suggestions.map((sel, i) => (
            <button
              key={`${sel.subcity}-${sel.lat}-${i}`}
              type="button"
              className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors hover:bg-primary hover:text-white dark:text-slate-200 dark:hover:text-white ${
                i !== suggestions.length - 1
                  ? "border-b border-slate-100 dark:border-slate-800/50"
                  : ""
              }`}
              onClick={() => pick(sel)}
            >
              <span className="block font-bold">{sel.subcity}</span>
              <span className="block text-[10px] opacity-70 font-bold uppercase tracking-wider">
                {sel.city}, {sel.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
