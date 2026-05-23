export const FIXED_COUNTRY = "Ethiopia" as const;
export const FIXED_CITY = "Addis Ababa" as const;

export interface LocationSelection {
  displayName: string;
  country: typeof FIXED_COUNTRY;
  city: typeof FIXED_CITY;
  subcity: string;
  lat: number;
  lng: number;
}

export interface LocationFormFields {
  location?: string;
  country?: string;
  city?: string;
  subcity?: string;
  lat?: number;
  lng?: number;
}
