"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  findLocation,
  getLocationReading,
  type Era,
  type LocationReading,
} from "@/data/locations";

type EchoEarthContextValue = {
  locationId: string;
  setLocationId: (locationId: string) => void;
  era: Era;
  setEra: (era: Era) => void;
  location: LocationReading;
  searchLocation: (query: string) => void;
};

const EchoEarthContext = createContext<EchoEarthContextValue | null>(null);

export function EchoEarthProvider({ children }: { children: ReactNode }) {
  const [locationId, setLocationId] = useState("ganga");
  const [era, setEra] = useState<Era>("Today");

  const location = useMemo(
    () => getLocationReading(locationId, era),
    [locationId, era],
  );

  function searchLocation(query: string) {
    setLocationId(findLocation(query));
    setEra("Today");
  }

  return (
    <EchoEarthContext.Provider
      value={{
        locationId,
        setLocationId,
        era,
        setEra,
        location,
        searchLocation,
      }}
    >
      {children}
    </EchoEarthContext.Provider>
  );
}

export function useEchoEarth() {
  const context = useContext(EchoEarthContext);

  if (!context) {
    throw new Error(
      "useEchoEarth must be used inside EchoEarthProvider",
    );
  }

  return context;
}