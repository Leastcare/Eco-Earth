"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dna,
  Map as MapIcon,
  Waves,
  X,
} from "lucide-react";
import { LOCATION_READINGS, type Era } from "@/data/locations";
import { useEchoEarth } from "@/components/EchoEarthShell";
import NavSidebar from "@/components/NavSidebar";

// ── Leaflet dynamically imported — no SSR ────────────────────────────────────
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-card/50">
      <p className="font-ui text-xs text-ink/40">Loading map…</p>
    </div>
  ),
});

// ─── helpers ──────────────────────────────────────────────────────────────────

function healthText(s: string) {
  if (s === "Critical" || s === "Poor") return "text-statusHigh";
  if (s === "Moderate") return "text-statusModerate";
  return "text-statusGood";
}

function healthRingColor(s: string) {
  if (s === "Critical" || s === "Poor") return "#b23b2e";
  if (s === "Moderate") return "#c4872e";
  return "#4c7a3d";
}

function healthBg(s: string) {
  if (s === "Critical" || s === "Poor") return "border-statusHigh/25 bg-statusHigh/8";
  if (s === "Moderate") return "border-statusModerate/25 bg-statusModerate/8";
  return "border-statusGood/25 bg-statusGood/8";
}

// ─── health ring ──────────────────────────────────────────────────────────────

function HealthRing({ index, status, size = 56 }: { index: number; status: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (index / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(44,42,36,.08)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={healthRingColor(status)} strokeWidth={4}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

// ─── location card ─────────────────────────────────────────────────────────────

function LocationCard({ locationId, era, active, onSelect }: {
  locationId: string; era: Era; active: boolean; onSelect: () => void;
}) {
  const r = LOCATION_READINGS[locationId]?.[era];
  if (!r) return null;
  const preview = r.metrics.slice(0, 3);

  return (
    <button onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition hover:shadow-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 ${
        active ? "border-forest/35 bg-card shadow-paper" : "border-forest/12 bg-card/70 hover:border-forest/22"
      }`}>
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-ui text-[9px] font-semibold uppercase tracking-[.15em] text-ink/40">{r.type}</p>
          <h3 className="mt-0.5 font-display text-base font-bold leading-tight text-ink">{r.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 font-ui text-[11px] text-ink/45">
            <span>📍</span>{r.subtitle}
          </p>
        </div>
        <div className="relative shrink-0">
          <HealthRing index={r.healthIndex} status={r.healthStatus} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display text-sm font-bold leading-none ${healthText(r.healthStatus)}`}>{r.healthIndex}</span>
            <span className="font-ui text-[8px] text-ink/35">/100</span>
          </div>
        </div>
      </div>
      {/* status badge */}
      <div className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${healthBg(r.healthStatus)}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${
          r.healthStatus === "Good" ? "bg-statusGood" :
          r.healthStatus === "Moderate" ? "bg-statusModerate" : "bg-statusHigh"
        }`} />
        <span className={`font-ui text-[9px] font-bold uppercase tracking-[.1em] ${healthText(r.healthStatus)}`}>
          {r.healthStatus}
        </span>
      </div>
      {/* metrics */}
      <div className="mt-3 space-y-1.5">
        {preview.map((m) => (
          <div key={m.label} className="flex items-center justify-between gap-2">
            <span className="truncate font-ui text-[10px] text-ink/50">{m.label}</span>
            <span className={`shrink-0 font-ui text-[10px] font-semibold ${
              m.statusColor === "good" ? "text-statusGood" :
              m.statusColor === "moderate" ? "text-statusModerate" : "text-statusHigh"
            }`}>{m.value}</span>
          </div>
        ))}
      </div>
      {/* footer */}
      <div className="mt-3 flex items-center justify-between border-t border-forest/8 pt-2.5">
        <p className="font-ui text-[9px] text-ink/30">{r.coordinates}</p>
        <span className={`font-ui text-[10px] font-medium ${active ? "text-forest" : "text-ink/40"}`}>
          {active ? "Selected ✓" : "Select →"}
        </span>
      </div>
    </button>
  );
}

// ─── geo coords for map pins ──────────────────────────────────────────────────

const PIN_GEO: Record<string, { lat: number; lng: number }> = {
  ganga:        { lat: 25.3,   lng: 83.2   },
  yamuna:       { lat: 28.6,   lng: 77.2   },
  dal:          { lat: 34.1,   lng: 74.8   },
  chilika:      { lat: 19.7,   lng: 85.3   },
  brahmaputra:  { lat: 26.1,   lng: 91.7   },
  periyar:      { lat: 10.0,   lng: 76.3   },
  lonar:        { lat: 19.98,  lng: 76.5   },
  wular:        { lat: 34.4,   lng: 74.5   },
  amazon:       { lat: -3.5,   lng: -62.2  },
  nile:         { lat: 15.5,   lng: 32.6   },
  thames:       { lat: 51.5,   lng: -0.1   },
  yangtze:      { lat: 30.6,   lng: 114.3  },
  colorado:     { lat: 36.1,   lng: -112.1 },
  mekong:       { lat: 18.0,   lng: 102.6  },
  danube:       { lat: 48.2,   lng: 16.4   },
};

// ─── pin type ─────────────────────────────────────────────────────────────────

type PinDef = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  status: string;
  index: number;
};

// ─── mobile map sheet ─────────────────────────────────────────────────────────

function MobileMapSheet({ pins, activeId, onPin, onClose }: {
  pins: PinDef[];
  activeId: string | null;
  onPin: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper xl:hidden">
      {/* header */}
      <div className="flex shrink-0 items-center justify-between border-b border-forest/10 bg-card/90 px-4 py-3 backdrop-blur-sm">
        <p className="font-ui text-sm font-semibold text-forest">Interactive Map</p>
        <button onClick={onClose} className="rounded-full p-1.5 text-ink/50 transition hover:bg-forest/8 hover:text-forest" aria-label="Close map">
          <X size={18} />
        </button>
      </div>
      {/* map fills remaining space */}
      <div className="min-h-0 flex-1">
        <LeafletMap pins={pins} activeId={activeId} onPin={(id) => { onPin(id); onClose(); }} />
      </div>
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const router = useRouter();
  const { locationId, era, setEra, setLocationId } = useEchoEarth();
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const locationIds = Object.keys(LOCATION_READINGS);

  const indian = ["ganga", "yamuna", "dal", "chilika", "brahmaputra", "periyar", "lonar", "wular"];
  const world  = ["amazon", "nile", "thames", "yangtze", "colorado", "mekong", "danube"];

  const pins = locationIds
    .filter((id) => id in PIN_GEO)
    .map((id) => {
      const r = LOCATION_READINGS[id]?.[era];
      const g = PIN_GEO[id];
      return {
        id,
        label: r?.name ?? id,
        lat: g.lat,
        lng: g.lng,
        status: r?.healthStatus ?? "Good",
        index: r?.healthIndex ?? 0,
      };
    });

  const eras: { value: Era; label: string }[] = [
    { value: "1976", label: "1976" },
    { value: "Today", label: "Today" },
    { value: "2050", label: "2050" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      <NavSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-forest/10 bg-card/80 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Mobile map toggle button */}
            <button
              onClick={() => setMobileMapOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-forest/15 bg-card px-3 py-1.5 font-ui text-xs text-forest transition hover:border-forest/30 xl:hidden"
              aria-label="Open interactive map"
            >
              <MapIcon size={13} />
              <span>Map</span>
            </button>
            <div>
              <h1 className="font-display text-base font-semibold text-forest">Environmental Map</h1>
              <p className="font-ui text-[11px] text-ink/50">
                {locationIds.length} locations monitored worldwide
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 rounded-full border border-forest/15 bg-paper p-0.5">
            {eras.map(({ value, label }) => (
              <button key={value} onClick={() => setEra(value)}
                className={`rounded-full px-3 py-1 font-ui text-[11px] font-medium transition ${
                  era === value ? "bg-forest text-card shadow-sm" : "text-ink/55 hover:text-forest"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* ── Left: real Leaflet map — desktop only ── */}
          <div className="hidden w-[480px] shrink-0 flex-col gap-3 border-r border-forest/10 p-4 xl:flex">
            <div className="flex items-center justify-between">
              <p className="font-ui text-[10px] font-semibold uppercase tracking-[.18em] text-ink/40">
                Interactive map
              </p>
              <div className="flex flex-wrap gap-2.5">
                {(["bg-statusGood", "bg-statusModerate", "bg-statusHigh"] as const).map((c, i) => (
                  <span key={i} className="flex items-center gap-1 font-ui text-[9px] text-ink/45">
                    <span className={`h-2 w-2 rounded-full ${c}`} />
                    {["Good", "Moderate", "Poor / Critical"][i]}
                  </span>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-forest/12 shadow-sm">
              <LeafletMap pins={pins} activeId={locationId} onPin={setLocationId} />
            </div>
            <p className="font-ui text-[10px] text-ink/35">
              Click any pin to select · era: <strong className="text-forest">{era}</strong>
            </p>
          </div>

          {/* ── Right: location cards ── */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">

            {/* Mobile map hint */}
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-forest/12 bg-card/60 px-4 py-3 xl:hidden">
              <MapIcon size={14} className="shrink-0 text-forest/60" />
              <p className="font-ui text-xs text-ink/55">
                Tap <strong className="text-forest">Map</strong> above to view the interactive map
              </p>
              <button
                onClick={() => setMobileMapOpen(true)}
                className="ml-auto shrink-0 rounded-md bg-forest px-3 py-1.5 font-ui text-[11px] font-medium text-card transition hover:bg-sage"
              >
                Open map
              </button>
            </div>

            {/* Indian subcontinent */}
            <div className="mb-3 flex items-center gap-3">
              <p className="font-ui text-[10px] font-semibold uppercase tracking-[.18em] text-ink/40">Indian subcontinent</p>
              <div className="h-px flex-1 bg-forest/8" />
            </div>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              {indian.map((id) => (
                <LocationCard key={id} locationId={id} era={era}
                  active={id === locationId} onSelect={() => setLocationId(id)} />
              ))}
            </div>

            {/* World rivers */}
            <div className="mb-3 flex items-center gap-3">
              <p className="font-ui text-[10px] font-semibold uppercase tracking-[.18em] text-ink/40">World rivers</p>
              <div className="h-px flex-1 bg-forest/8" />
            </div>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              {world.map((id) => (
                <LocationCard key={id} locationId={id} era={era}
                  active={id === locationId} onSelect={() => setLocationId(id)} />
              ))}
            </div>

            {/* CTA */}
            {locationId && LOCATION_READINGS[locationId]?.[era] && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-forest/15 bg-card px-5 py-4 shadow-sm">
                <div>
                  <p className="font-display text-sm font-semibold text-ink">
                    {LOCATION_READINGS[locationId][era].name}
                  </p>
                  <p className="font-ui text-xs text-ink/50">
                    {LOCATION_READINGS[locationId][era].healthStatus}
                    {" · Health "}
                    <span className={`font-semibold ${healthText(LOCATION_READINGS[locationId][era].healthStatus)}`}>
                      {LOCATION_READINGS[locationId][era].healthIndex}/100
                    </span>
                  </p>
                </div>
                <button onClick={() => router.push("/narration")}
                  className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 font-ui text-xs font-medium text-card transition hover:bg-sage">
                  <Waves size={14} />
                  Hear this place
                </button>
              </div>
            )}

            {/* Summary stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 pb-4 sm:grid-cols-5">
              {locationIds.slice(0, 5).map((id) => {
                const r = LOCATION_READINGS[id]?.[era];
                if (!r) return null;
                return (
                  <button key={id} onClick={() => setLocationId(id)}
                    className={`rounded-lg border px-3 py-2.5 text-center transition hover:shadow-sm ${
                      id === locationId ? "border-forest/30 bg-card" : "border-forest/10 bg-card/60"
                    }`}>
                    <p className={`font-display text-xl font-bold ${healthText(r.healthStatus)}`}>
                      {r.healthIndex}
                    </p>
                    <p className="mt-0.5 font-ui text-[9px] leading-tight text-ink/45">
                      {r.name.split(" ")[0]}
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      <Dna size={9} className="text-ink/25" />
                      <span className="font-ui text-[9px] text-ink/30">
                        {r.metrics.find((m) => m.label.includes("Diversity"))?.status ?? "—"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile full-screen map sheet */}
      {mobileMapOpen && (
        <MobileMapSheet
          pins={pins}
          activeId={locationId}
          onPin={setLocationId}
          onClose={() => setMobileMapOpen(false)}
        />
      )}
    </div>
  );
}
