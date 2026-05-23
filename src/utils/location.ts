import { ADDIS_SUBCITIES } from "../constants/addisLocations";
import type { LocationFormFields, LocationSelection } from "../types/location.types";
import { FIXED_CITY, FIXED_COUNTRY } from "../types/location.types";

export { FIXED_CITY, FIXED_COUNTRY };

export const formatLocationDisplay = (sel: LocationSelection): string =>
  sel.subcity ? `${sel.subcity}, ${FIXED_CITY}` : FIXED_CITY;

export const isAddisAbabaArea = (value: string): boolean => {
  const v = value.toLowerCase();
  return v.includes("addis") || v.includes("አዲስ");
};

export const isEthiopia = (value: string): boolean => {
  const v = value.toLowerCase();
  return v.includes("ethiopia") || v.includes("ኢትዮጵያ");
};

/** Reject cities outside Addis Ababa (backend will enforce too). */
export const isBlockedCity = (cityOrRegion: string): boolean => {
  const v = cityOrRegion.toLowerCase().trim();
  if (!v || isAddisAbabaArea(v)) return false;
  const blocked = [
    "hawassa",
    "bahir dar",
    "mekelle",
    "dire dawa",
    "adama",
    "gondar",
    "jimma",
    "dessie",
    "bishoftu",
    "nazret",
  ];
  return blocked.some((b) => v.includes(b));
};

export const mergeLocationIntoForm = <T extends LocationFormFields>(
  prev: T,
  sel: LocationSelection
): T => ({
  ...prev,
  location: formatLocationDisplay(sel),
  country: sel.country,
  city: sel.city,
  subcity: sel.subcity,
  lat: sel.lat,
  lng: sel.lng,
});

export const filterSubcitySuggestions = (query: string): string[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [...ADDIS_SUBCITIES];
  return ADDIS_SUBCITIES.filter((s) => s.toLowerCase().includes(q));
};

export const selectionFromSubcity = (
  subcity: string,
  lat = 9.03,
  lng = 38.74
): LocationSelection => ({
  displayName: `${subcity}, ${FIXED_CITY}, ${FIXED_COUNTRY}`,
  country: FIXED_COUNTRY,
  city: FIXED_CITY,
  subcity,
  lat,
  lng,
});
