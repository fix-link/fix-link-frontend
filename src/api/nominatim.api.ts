import { ADDIS_SUBCITIES } from "../constants/addisLocations";
import type { LocationSelection } from "../types/location.types";
import { FIXED_CITY, FIXED_COUNTRY } from "../types/location.types";
import {
  isAddisAbabaArea,
  isBlockedCity,
  isEthiopia,
  selectionFromSubcity,
} from "../utils/location";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "FixLink/1.0 (contact@fixlink.app)";

/** Nominatim usage policy: max 1 request per second. */
let lastRequestAt = 0;

type NominatimAddress = {
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  quarter?: string;
  city?: string;
  town?: string;
  state?: string;
  municipality?: string;
  county?: string;
  country?: string;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

const waitForRateLimit = async () => {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastRequestAt = Date.now();
};

const nominatimFetch = async (path: string, params: Record<string, string>) => {
  await waitForRateLimit();
  const url = new URL(`${NOMINATIM_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error("Location search failed");
  return res.json();
};

const extractSubcity = (addr: NominatimAddress, displayName: string): string => {
  const fromAddr =
    addr.suburb ||
    addr.neighbourhood ||
    addr.city_district ||
    addr.quarter ||
    "";
  if (fromAddr) return fromAddr.trim();

  const firstPart = displayName.split(",")[0]?.trim();
  if (firstPart && !isAddisAbabaArea(firstPart) && !isEthiopia(firstPart)) {
    return firstPart;
  }
  return "";
};

const parseResult = (item: NominatimResult): LocationSelection | null => {
  const addr = item.address || {};
  const country = addr.country || "";
  if (!isEthiopia(country)) return null;

  const cityCandidate =
    addr.city || addr.town || addr.municipality || addr.state || addr.county || "";
  if (isBlockedCity(cityCandidate)) return null;
  if (cityCandidate && !isAddisAbabaArea(cityCandidate)) return null;

  const subcity = extractSubcity(addr, item.display_name);
  if (!subcity) return null;

  const lat = parseFloat(item.lat);
  const lng = parseFloat(item.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return {
    displayName: item.display_name,
    country: FIXED_COUNTRY,
    city: FIXED_CITY,
    subcity,
    lat,
    lng,
  };
};

/**
 * Search subcities / places in Addis Ababa via OpenStreetMap Nominatim (free).
 */
export const searchAddisLocations = async (query: string): Promise<LocationSelection[]> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return ADDIS_SUBCITIES.slice(0, 8).map((s) => selectionFromSubcity(s));
  }

  const localMatches = ADDIS_SUBCITIES.filter((s) =>
    s.toLowerCase().includes(trimmed.toLowerCase())
  ).map((s) => selectionFromSubcity(s));

  try {
    const data = (await nominatimFetch("/search", {
      q: `${trimmed}, ${FIXED_CITY}, ${FIXED_COUNTRY}`,
      format: "json",
      addressdetails: "1",
      limit: "8",
      countrycodes: "et",
      viewbox: "38.68,9.15,39.05,8.85",
      bounded: "0",
    })) as NominatimResult[];

    const remote = (Array.isArray(data) ? data : [])
      .map(parseResult)
      .filter((x): x is LocationSelection => x !== null);

    const seen = new Set<string>();
    const merged: LocationSelection[] = [];
    for (const item of [...localMatches, ...remote]) {
      const key = item.subcity.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
    return merged.slice(0, 10);
  } catch {
    return localMatches.slice(0, 10);
  }
};

/**
 * Reverse geocode GPS coordinates; only returns valid Addis Ababa selections.
 */
export const reverseGeocodeAddis = async (
  lat: number,
  lng: number
): Promise<LocationSelection | null> => {
  try {
    const data = (await nominatimFetch("/reverse", {
      lat: String(lat),
      lon: String(lng),
      format: "json",
      addressdetails: "1",
    })) as NominatimResult;

    return parseResult(data);
  } catch {
    return null;
  }
};
