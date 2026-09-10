"use client";

import {
  createContext,
  useContext,
  useEffect,
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

// ─── types ───────────────────────────────────────────────────────────────────

export type JournalEntry = {
  id: string;
  locationId: string;
  era: Era;
  snapshot: LocationReading;
  savedAt: string; // ISO string
};

export type LetterEntry = {
  id: string;
  locationId: string;
  era: Era;
  locationName: string;
  authorName: string;
  body: string;
  reply: string;
  sentAt: string; // ISO string
};

// ─── context value ───────────────────────────────────────────────────────────

type EchoEarthContextValue = {
  locationId: string;
  setLocationId: (locationId: string) => void;
  era: Era;
  setEra: (era: Era) => void;
  location: LocationReading;
  searchLocation: (query: string) => void;
  // journal
  journalEntries: JournalEntry[];
  addJournalEntry: () => void;
  removeJournalEntry: (id: string) => void;
  // letters
  letters: LetterEntry[];
  addLetter: (entry: Omit<LetterEntry, "id" | "sentAt">) => void;
};

const EchoEarthContext = createContext<EchoEarthContextValue | null>(null);

// ─── helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

// ─── provider ────────────────────────────────────────────────────────────────

export function EchoEarthProvider({ children }: { children: ReactNode }) {
  const [locationId, setLocationId] = useState("ganga");
  const [era, setEra] = useState<Era>("Today");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [letters, setLetters] = useState<LetterEntry[]>([]);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setJournalEntries(readLS<JournalEntry[]>("echoearth:journal", []));
    setLetters(readLS<LetterEntry[]>("echoearth:letters", []));
  }, []);

  const location = useMemo(
    () => getLocationReading(locationId, era),
    [locationId, era],
  );

  function searchLocation(query: string) {
    setLocationId(findLocation(query));
    setEra("Today");
  }

  function addJournalEntry() {
    const entry: JournalEntry = {
      id: uid(),
      locationId,
      era,
      snapshot: location,
      savedAt: new Date().toISOString(),
    };
    setJournalEntries((prev) => {
      // avoid exact duplicate (same location+era saved within same minute)
      const duplicate = prev.some(
        (e) =>
          e.locationId === locationId &&
          e.era === era &&
          e.savedAt.slice(0, 16) === entry.savedAt.slice(0, 16),
      );
      if (duplicate) return prev;
      const next = [entry, ...prev].slice(0, 50); // cap at 50
      writeLS("echoearth:journal", next);
      return next;
    });
  }

  function removeJournalEntry(id: string) {
    setJournalEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeLS("echoearth:journal", next);
      return next;
    });
  }

  function addLetter(entry: Omit<LetterEntry, "id" | "sentAt">) {
    const full: LetterEntry = {
      ...entry,
      id: uid(),
      sentAt: new Date().toISOString(),
    };
    setLetters((prev) => {
      const next = [full, ...prev].slice(0, 100);
      writeLS("echoearth:letters", next);
      return next;
    });
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
        journalEntries,
        addJournalEntry,
        removeJournalEntry,
        letters,
        addLetter,
      }}
    >
      {children}
    </EchoEarthContext.Provider>
  );
}

export function useEchoEarth() {
  const context = useContext(EchoEarthContext);
  if (!context) {
    throw new Error("useEchoEarth must be used inside EchoEarthProvider");
  }
  return context;
}
