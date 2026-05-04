import * as Location from "expo-location";
import { useEffect, useState } from "react";

export type Coords = { latitude: number; longitude: number };

export type LocationState = {
  coords: Coords | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
};

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    coords: null,
    loading: true,
    error: null,
    permissionDenied: false
  });

  useEffect(() => {
    let active = true;
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (active) setState({ coords: null, loading: false, error: null, permissionDenied: true });
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (active) setState({
          coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
          loading: false,
          error: null,
          permissionDenied: false
        });
      } catch (err: unknown) {
        const e = err as { message?: string };
        if (active) setState({ coords: null, loading: false, error: e.message ?? "Location unavailable", permissionDenied: false });
      }
    })();
    return () => { active = false; };
  }, []);

  return state;
}

/** Haversine distance in km between two coordinates */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const chord =
    sinLat * sinLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}
