import { useState, useCallback } from "react";
import { reverseGeocodeAddis } from "../api/nominatim.api";
import type { LocationSelection } from "../types/location.types";

export const useGpsLocation = (onResolved: (location: LocationSelection) => void) => {
  const [isLocating, setIsLocating] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const sel = await reverseGeocodeAddis(
            position.coords.latitude,
            position.coords.longitude
          );
          if (sel) {
            onResolved(sel);
          } else {
            alert(
              "Your location must be in Addis Ababa, Ethiopia. Please pick a subcity from the list."
            );
          }
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        alert("Could not get GPS location. Please search for your subcity manually.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, [onResolved]);

  return { isLocating, getCurrentLocation };
};
