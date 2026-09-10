"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  BookmarkPlus,
  Dna,
  Droplets,
  FlaskConical,
  Info,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Pause,
  PencilLine,
  Play,
  Send,
  Share2,
  Thermometer,
  Trash2,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
} from "lucide-react";
import {
  LOCATION_READINGS,
  getLocationReading,
  type Era,
  type LocationReading,
  type Metric,
} from "@/data/locations";
import { useEchoEarth } from "@/components/EchoEarthShell";

type AppRoute = "/narration" | "/map" | "/journal" | "/letters" | "/about";

// ─── helpers ────────────────────────────────────────────────────────────────

function statusDotClass(c: Metric["statusColor"]) {
  if (c === "moderate") return "dot-moderate";
  if (c === "high") return "dot-high";
  return "dot-good";
}

function statusTextClass(c: Metric["statusColor"]) {
  if (c === "moderate") return "text-statusModerate";
  if (c === "high") return "text-statusHigh";
  return "text-statusGood";
}

function healthColor(s: LocationReading["healthStatus"]) {
  if (s === "Critical" || s === "Poor") return "text-statusHigh";
  if (s === "Moderate") return "text-statusModerate";
  return "text-statusGood";
}

function MetricIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (l.includes("temperature")) return <Thermometer size={15} strokeWidth={1.4} />;
  if (l.includes("oxygen"))      return <Droplets    size={15} strokeWidth={1.4} />;
  if (l.includes("plastic"))     return <Trash2      size={15} strokeWidth={1.4} />;
  if (l.includes("ph"))          return <FlaskConical size={15} strokeWidth={1.4} />;
  if (l.includes("flow"))        return <Waves       size={15} strokeWidth={1.4} />;
  if (l.includes("diversity"))   return <Dna         size={15} strokeWidth={1.4} />;
  if (l.includes("wind") || l.includes("air")) return <Wind size={15} strokeWidth={1.4} />;
  return <Droplets size={15} strokeWidth={1.4} />;
}

// ─── botanical SVG decorations ───────────────────────────────────────────────

function Botanical({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 210 250" aria-hidden="true" className={className}
      fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M104 243C106 167 105 83 111 4" />
      <path d="M108 178C71 158 42 125 23 82M108 148C145 125 169 91 182 46M106 117C72 101 48 72 39 42M109 91C137 75 153 52 159 28" />
      <path d="M75 157c-27-2-46-16-52-37 24 2 42 14 52 37ZM146 126c27-4 44-20 49-42-25 4-40 18-49 42ZM73 100C48 98 31 84 25 63c22 3 38 14 48 37ZM140 76c21-4 35-16 39-35-20 4-33 14-39 35Z" />
      <path d="M102 207c-29-5-54-24-65-55 31 8 53 26 65 55ZM110 202c28-8 50-29 58-58-29 10-48 30-58 58Z" />
    </svg>
  );
}

function Landscape({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 450 180" aria-hidden="true"
      className={className} fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M0 123 64 68l44 38 52-75 55 69 38-38 38 41 53-75 106 96" />
      <path d="M0 143c58-18 101 18 157 5 55-13 86-7 126 8 57 21 114-6 167-9" />
      <path d="M0 158c54-12 107 4 157-4 66-10 97 25 160 7 59-17 94-5 133 5" />
    </svg>
  );
}

// ─── waveform ────────────────────────────────────────────────────────────────

function Waveform({ playing, large = false }: { playing: boolean; large?: boolean }) {
  const bars = [8,14,9,20,34,56,28,16,44,72,38,17,29,61,22,13,36,48,25,15,10,7,12,18,8];
  const h = large ? 0.55 : 0.28;
  const w = large ? "w-[3px]" : "w-[2px]";
  const gap = large ? "gap-[3px]" : "gap-[2px]";
  const height = large ? "h-10" : "h-5";
  return (
    <div className={`flex ${height} items-center ${gap}`} aria-hidden="true">
      {bars.map((val, i) => (
        <span key={i}
          className={`wave-bar inline-block ${w} rounded-full bg-current ${playing ? "animate-wave" : ""}`}
          style={{ height: `${Math.max(val * h, large ? 6 : 3)}px`, animationDelay: `${i * 45}ms` }}
        />
      ))}
    </div>
  );
}

// ─── ElevenLabs audio hook ────────────────────────────────────────────────────

function useElevenLabsAudio(
  narration: string,
  locationId: string,
  playing: boolean,
  onStop: () => void,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);

  function stopAudio() {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!playing) { stopAudio(); return; }
    if (!narration.trim()) return;

    const abort = new AbortController();
    abortRef.current = abort;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: narration, locationId }),
          signal: abort.signal,
        });
        if (!res.ok || !res.body || abort.signal.aborted) { setLoading(false); onStop(); return; }
        const blob = await res.blob();
        if (abort.signal.aborted) { setLoading(false); return; }
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; onStop(); };
        audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; onStop(); };
        setLoading(false);
        await audio.play();
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== "AbortError") { console.error("[TTS]", err); onStop(); }
        setLoading(false);
      }
    })();

    return () => { abort.abort(); stopAudio(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, narration, locationId]);

  return { loading };
}

// ─── Ambient river sound hook ─────────────────────────────────────────────────
// Plays a subtle river/water ambient loop while on the narration page.
// Uses a royalty-free rain + river sound from a public CDN.

const AMBIENT_URL = "https://www.soundjay.com/nature/sounds/river-1.mp3";
// Fallback CDN in case the above is unavailable
const AMBIENT_FALLBACK = "https://freesound.org/data/previews/531/531947_4921277-lq.mp3";

function useAmbientSound(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      const audio = new Audio(AMBIENT_URL);
      audio.loop = true;
      audio.volume = 0.07; // very subtle — barely perceptible
      audio.preload = "none";
      // try fallback if primary fails
      audio.onerror = () => {
        audio.src = AMBIENT_FALLBACK;
        audio.load();
        if (enabled) audio.play().catch(() => {});
      };
      audioRef.current = audio;
    }

    if (enabled) {
      audioRef.current.play().catch(() => {
        // Browsers block autoplay — that's fine, user interaction will trigger it
      });
    } else {
      audioRef.current.pause();
    }

    return () => {};
  }, [enabled]);

  // Start on first user interaction if not already playing
  useEffect(() => {
    if (!enabled) return;
    const tryPlay = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("click", tryPlay, { once: true });
    document.addEventListener("keydown", tryPlay, { once: true });
    return () => {
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("keydown", tryPlay);
    };
  }, [enabled]);
}

// ─── era toggle ──────────────────────────────────────────────────────────────

function EraToggle({ era, setEra }: { era: Era; setEra: (e: Era) => void }) {
  const eras: { value: Era; label: string }[] = [
    { value: "1976", label: "1976" },
    { value: "Today", label: "Today" },
    { value: "2050", label: "2050" },
  ];
  return (
    <div className="inline-flex items-center rounded-full border border-forest/20 bg-paper p-0.5">
      {eras.map(({ value, label }) => (
        <button key={value} onClick={() => setEra(value)}
          className={`rounded-full px-3.5 py-1 font-ui text-[11px] font-medium transition ${
            era === value ? "bg-forest text-card shadow-sm" : "text-ink/50 hover:text-forest"
          }`}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── search overlay ───────────────────────────────────────────────────────────

function SearchOverlay({ open, onClose, onSelect }: {
  open: boolean; onClose: () => void; onSelect: (q: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    onSelect(query); onClose();
  }

  if (!open) return null;

  const allLocations = Object.values(LOCATION_READINGS).map((eras) => eras["Today"]);
  const filtered = query.trim()
    ? allLocations.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.subtitle.toLowerCase().includes(query.toLowerCase()))
    : allLocations;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 pt-20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-forest/15 bg-card shadow-paper">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-forest/10 px-4 py-3">
          <MapPin size={16} className="shrink-0 text-forest" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-ui text-sm text-ink outline-none placeholder:text-ink/40"
            placeholder="Search a river, lake, forest, or city…" />
          <button type="button" onClick={onClose} className="text-ink/35 hover:text-rust" aria-label="Close">
            <X size={16} />
          </button>
        </form>
        <div className="max-h-64 overflow-y-auto">
          <p className="px-4 pb-1 pt-3 font-ui text-[10px] uppercase tracking-[.15em] text-ink/35">
            {query.trim() ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : "All locations"}
          </p>
          {filtered.map((r) => (
            <button key={r.id} type="button"
              onClick={() => { onSelect(r.name); onClose(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-forest/5">
              <MapPin size={12} className="shrink-0 text-sage" />
              <div className="min-w-0 flex-1">
                <p className="font-ui text-sm font-medium text-ink">{r.name}</p>
                <p className="font-ui text-[11px] text-ink/45">{r.subtitle}</p>
              </div>
              <span className={`font-ui text-[11px] font-semibold ${
                r.healthStatus === "Good" ? "text-statusGood" :
                r.healthStatus === "Moderate" ? "text-statusModerate" : "text-statusHigh"
              }`}>{r.healthIndex}/100</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-4 font-ui text-sm text-ink/40">No locations found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── nav sidebar ─────────────────────────────────────────────────────────────

function NavSidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const items: { route: AppRoute; label: string; Icon: typeof Leaf }[] = [
    { route: "/narration", label: "Narration",  Icon: Leaf     },
    { route: "/map",       label: "Map",        Icon: MapPin   },
    { route: "/journal",   label: "Journal",    Icon: BookOpen },
    { route: "/letters",   label: "Letters",    Icon: Mail     },
    { route: "/about",     label: "About",      Icon: Info     },
  ];

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="mb-2 border-b border-forest/15 pb-6">
        <div className="font-display text-3xl font-semibold tracking-tight text-forest">EchoEarth</div>
        <p className="mt-2 font-display text-sm leading-5 text-ink/60">
          Places speak.<br />We listen.
        </p>
      </div>

      {/* Nav */}
      <nav className="mt-5 space-y-0.5">
        {items.map(({ route, label, Icon }) => (
          <Link key={route} href={route}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-2 py-2.5 font-ui text-sm text-ink/65 transition hover:bg-forest/6 hover:text-forest">
            <Icon size={16} strokeWidth={1.4} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Botanical + tagline at bottom */}
      <div className="relative mt-auto pt-8 text-sage">
        <Botanical className="absolute -left-8 bottom-14 w-36 rotate-[-6deg] opacity-60" />
        <p className="relative ml-2 font-hand text-xl leading-6 text-ink/55">
          The Earth<br />remembers,<br />and now,<br />it speaks.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop in-flow */}
      <nav className="hidden w-44 shrink-0 flex-col border-r border-forest/12 bg-sidebar px-6 py-8 lg:flex">
        <NavContent />
      </nav>

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-52 flex-col border-r border-forest/12 bg-sidebar px-6 py-8 transition-transform lg:hidden ${
        open ? "translate-x-0 shadow-paper" : "-translate-x-full"
      }`}>
        <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-forest" aria-label="Close">
          <X size={18} />
        </button>
        <NavContent />
      </aside>
    </>
  );
}

// ─── top bar ─────────────────────────────────────────────────────────────────

function TopBar({ location, onMenuOpen, onSearch, onSave, onShare, ambientOn, onAmbientToggle }: {
  location: LocationReading; onMenuOpen: () => void; onSearch: () => void;
  onSave: () => void; onShare: () => void;
  ambientOn: boolean; onAmbientToggle: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-forest/10 bg-paper/90 px-5 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenuOpen} className="text-forest lg:hidden" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <button onClick={onSearch}
          className="flex max-w-[180px] items-center gap-2 truncate rounded-full border border-forest/15 bg-card px-3 py-1.5 font-ui text-xs text-ink/60 shadow-sm transition hover:border-forest/30 hover:text-forest sm:max-w-none sm:px-3.5">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{location.subtitle}</span>
          <span className="shrink-0 text-ink/30">↓</span>
        </button>
      </div>
      <div className="flex items-center gap-3 font-ui text-xs">
        <button onClick={onAmbientToggle}
          title={ambientOn ? "Mute river sounds" : "Play river sounds"}
          className={`hidden items-center gap-1.5 transition sm:flex ${ambientOn ? "text-forest" : "text-ink/40 hover:text-forest"}`}>
          {ambientOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span className="hidden sm:inline">{ambientOn ? "Ambient on" : "Ambient"}</span>
        </button>
        <button onClick={() => { onSave(); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className={`hidden items-center gap-1.5 transition sm:flex ${saved ? "text-forest" : "text-ink/45 hover:text-forest"}`}>
          <BookmarkPlus size={14} />
          {saved ? "Saved!" : "Save"}
        </button>
        <button onClick={() => { onShare(); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className={`flex items-center gap-1.5 transition ${copied ? "text-forest" : "text-ink/45 hover:text-forest"}`}>
          <Share2 size={13} />
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </header>
  );
}

// ─── mini trend chart ─────────────────────────────────────────────────────────

function TrendChart({ location }: { location: LocationReading }) {
  const values = location.trend;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 280, H = 80, pad = 8;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return [x, y] as [number, number];
  });

  const pathD = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");

  const isProjection = location.updatedAt.toLowerCase().includes("projected");

  return (
    <div className="paper-card relative mt-4 rotate-[0.5deg] p-4">
      <span className="washi-tape" />
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-sm font-semibold text-ink">Water Quality (BOD)</p>
          <p className="font-hand text-base text-ink/60">
            {isProjection ? "Projected trend" : "Last 12 months"}
          </p>
        </div>
        <span className="font-ui text-[9px] uppercase tracking-[.15em] text-sage">mg/L</span>
      </div>

      <svg className="mt-3 w-full overflow-visible" viewBox={`0 0 ${W} ${H}`}
        role="img" aria-label="Water quality trend">
        {/* grid */}
        <path d={`M${pad} ${pad} V${H - pad} H${W - pad}`} fill="none" stroke="rgba(44,42,36,.15)" strokeWidth="1" />
        <line x1={pad} y1={H/2} x2={W - pad} y2={H/2} stroke="rgba(44,42,36,.08)" strokeDasharray="3 4" />
        {/* line */}
        <path d={pathD} fill="none" stroke="#43533a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* dots */}
        {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#43533a" />)}
        {/* labels */}
        <text x={pad} y={H + 2} fontSize="9" fill="rgba(44,42,36,.45)" fontFamily="var(--font-inter)">Start</text>
        <text x={W - pad - 16} y={H + 2} fontSize="9" fill="rgba(44,42,36,.45)" fontFamily="var(--font-inter)">Now</text>
      </svg>

      <p className="mt-2 text-center font-hand text-sm text-ink/50">Lower is better</p>

      {/* annotation */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-[-3deg]">
        <p className="font-hand text-sm text-ink/55">
          {location.healthStatus === "Good" ? "Improving ↗" :
           location.healthStatus === "Moderate" ? "Holding steady →" : "Needs care ↘"}
        </p>
      </div>
    </div>
  );
}

// ─── right panel: metrics + chart ────────────────────────────────────────────

function ConditionPanel({ location }: { location: LocationReading }) {
  const isProjection = location.updatedAt.toLowerCase().includes("projected");

  // SVG health ring
  const r = 28, circ = 2 * Math.PI * r;
  const fill = (location.healthIndex / 100) * circ;
  const ringColor =
    location.healthStatus === "Good" ? "#4c7a3d" :
    location.healthStatus === "Moderate" ? "#c4872e" : "#b23b2e";

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-6">
      {/* Health score ring */}
      <div className="mb-5 flex items-center gap-4 rounded-lg border border-forest/10 bg-card/60 p-4">
        <svg width="68" height="68" className="-rotate-90 shrink-0">
          <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(44,42,36,.08)" strokeWidth="5" />
          <circle cx="34" cy="34" r={r} fill="none" stroke={ringColor} strokeWidth="5"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
        </svg>
        <div>
          <p className="font-ui text-[9px] font-semibold uppercase tracking-[.18em] text-ink/40">Health Index</p>
          <p className={`font-display text-3xl font-bold leading-none ${healthColor(location.healthStatus)}`}>
            {location.healthIndex}<span className="font-display text-base text-ink/25">/100</span>
          </p>
          <p className={`mt-1 font-ui text-[11px] font-bold uppercase tracking-[.1em] ${healthColor(location.healthStatus)}`}>
            {location.healthStatus}
          </p>
        </div>
      </div>

      {/* header */}
      <div className="mb-3">
        <h2 className="font-display text-base font-semibold text-ink">My Current Condition</h2>
        <p className="font-ui text-[10px] italic text-ink/40">
          {isProjection ? "Projected scenario" : "Live data snapshot"}
        </p>
      </div>

      {/* metrics */}
      <div>
        {location.metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2.5 border-b border-forest/8 py-2.5 last:border-b-0">
            <span className="shrink-0 text-ink/35"><MetricIcon label={m.label} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-ui text-[10px] font-semibold uppercase tracking-[.08em] text-ink/45">{m.label}</p>
              <p className="font-display text-sm font-semibold text-ink">{m.value}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${statusDotClass(m.statusColor)}`} />
              <span className={`font-ui text-[10px] font-semibold ${statusTextClass(m.statusColor)}`}>{m.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* source */}
      <p className="mt-3 font-ui text-[10px] leading-5 text-ink/35">
        Source: {location.source}<br />
        Updated: {isProjection ? "Projected scenario" : location.updatedAt}
      </p>

      {/* trend chart */}
      <TrendChart location={location} />

      {/* "what this means" sticky note */}
      <div className="sticky-note relative mt-5 overflow-hidden rounded-sm p-4">
        <h3 className="font-display text-sm font-semibold text-ink">What this means</h3>
        <p className="mt-1.5 font-hand text-base leading-6 text-ink/80">
          BOD indicates organic pollution. Lower levels mean cleaner water with more oxygen for aquatic life.
        </p>
        <Botanical className="absolute -bottom-5 right-0 w-14 text-sage/40" />
      </div>

      {/* landscape */}
      <div className="mt-6 text-sage/35">
        <Landscape className="w-full" />
      </div>
    </div>
  );
}

// ─── health badge ─────────────────────────────────────────────────────────────

function HealthBadge({ location }: { location: LocationReading }) {
  const dotColor =
    location.healthStatus === "Good" ? "dot-good" :
    location.healthStatus === "Moderate" ? "dot-moderate" : "dot-high";
  const textColor = healthColor(location.healthStatus);
  const borderBg =
    location.healthStatus === "Good"
      ? "border-statusGood/25 bg-statusGood/8"
      : location.healthStatus === "Moderate"
      ? "border-statusModerate/25 bg-statusModerate/8"
      : "border-statusHigh/25 bg-statusHigh/8";

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 font-ui text-xs font-semibold ${borderBg} ${textColor}`}>
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      Health: {location.healthIndex}/100 · {location.healthStatus}
    </div>
  );
}

// ─── center: hero + narration ─────────────────────────────────────────────────

function NarrationHero({ location, era, setEra, playing, ttsLoading, onTogglePlay, liveNarration, narrationLoading }: {
  location: LocationReading; era: Era; setEra: (e: Era) => void;
  playing: boolean; ttsLoading: boolean; onTogglePlay: () => void;
  liveNarration: string; narrationLoading: boolean;
}) {
  const text = liveNarration || location.narration;
  const paragraphs = text.split("\n\n").map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
  const headlineLines = location.headline.split("\n");

  return (
    <div>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
        {/* "You are listening" handwritten label */}
        <div className="relative mb-4">
          <span className="font-hand text-lg text-rust">You are listening</span>
          <svg className="absolute left-28 -top-1 h-8 w-9 text-ink/50" viewBox="0 0 50 40"
            fill="none" stroke="currentColor">
            <path d="M4 3c-2 18 8 27 24 28" />
            <path d="m24 25 5 6-7 2" />
          </svg>
        </div>

        {/* River name */}
        <h1 className="font-display text-4xl font-semibold leading-none tracking-tight text-ink sm:text-5xl lg:text-7xl">
          {location.name}
        </h1>

        {/* Subtitle caps */}
        <p className="mt-3 font-ui text-xs font-semibold uppercase tracking-[.18em] text-ink/60">
          {location.subtitle.toUpperCase()}
        </p>

        {/* Meta chips */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-ui text-xs text-ink/55">
          <span className="flex items-center gap-1.5"><Waves size={12} /> {location.type}</span>
          <span className="flex items-center gap-1.5"><Leaf size={12} /> {location.origin}</span>
          <span className="flex items-center gap-1.5"><MapPin size={12} /> {location.coordinates}</span>
        </div>

        {/* Health badge + era toggle row */}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <EraToggle era={era} setEra={setEra} />
          <HealthBadge location={location} />
        </div>

        {/* Play button + waveform */}
        <div className="mt-6 flex items-center gap-4">
          <button onClick={onTogglePlay} disabled={ttsLoading}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[6px] border-forest/15 bg-sage text-card shadow-[0_0_0_1px_rgba(67,83,58,.2)] transition hover:scale-105 disabled:opacity-60"
            aria-label={ttsLoading ? "Loading…" : playing ? "Pause" : "Play narration"}>
            {ttsLoading
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-card border-t-transparent" />
              : playing
              ? <Pause fill="currentColor" size={20} />
              : <Play  fill="currentColor" size={20} className="ml-0.5" />}
          </button>
          <div className="min-w-0 flex-1 text-sage">
            <Waveform playing={playing && !ttsLoading} large />
          </div>
        </div>

        {/* Divider */}
        <div className="my-7 h-px bg-forest/12" />

        {/* Opening quote mark */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${location.id}-${era}-${liveNarration ? "live" : "static"}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
        <span className="font-display text-5xl leading-none text-rust/70">"</span>

        {/* Loading state */}
        {narrationLoading && !liveNarration && (
          <div className="mb-4 flex items-center gap-2 text-ink/40">
            {[0,1,2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-forest/40"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
            <span className="font-ui text-xs">The river is speaking…</span>
          </div>
        )}

        {/* Narration text */}
        <div className="max-w-[60ch] space-y-4">
          {paragraphs.map((para, i) => {
            const isFirst = i === 0;
            const isLast  = i === paragraphs.length - 1 && !narrationLoading;
            return (
              <p key={i} className={
                isFirst
                  ? "font-display text-xl font-medium leading-8 text-ink"
                  : isLast
                  ? "font-display text-base font-semibold leading-7 text-forest"
                  : "font-display text-base leading-7 text-ink/75"
              }>
                {para}
                {narrationLoading && i === paragraphs.length - 1 && (
                  <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-forest/50 align-middle" />
                )}
              </p>
            );
          })}
        </div>

        {/* Closing quote + signature */}
        <div className="mt-4 flex items-end justify-between">
          <span className="font-display text-5xl leading-none text-rust/70">"</span>
          <p className="font-ui text-xs text-ink/35">— {location.name}</p>
        </div>

        {/* Data badge */}
        {(liveNarration && !narrationLoading) && (
          <p className="mt-4 flex items-center gap-1.5 font-ui text-[10px] text-ink/35">
            <span className="h-1.5 w-1.5 rounded-full bg-statusGood" />
            Generated from today's real environmental data
          </p>
        )}
        {(!liveNarration && !narrationLoading) && (
          <p className="mt-4 font-ui text-[10px] italic text-ink/30">Generated from real environmental data</p>
        )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── letter composer ──────────────────────────────────────────────────────────

function LetterComposer({ location, addLetter }: {
  location: LocationReading;
  addLetter?: (entry: Omit<import("@/components/EchoEarthShell").LetterEntry, "id" | "sentAt">) => void;
}) {
  const [letter,       setLetter]       = useState(`Dear ${location.name},\n`);
  const [name,         setName]         = useState("");
  const [response,     setResponse]     = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setLetter(`Dear ${location.name},\n`);
    setName(""); setResponse("");
  }, [location.id]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!letter.trim() || replyLoading) return;
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setResponse(""); setReplyLoading(true);

    try {
      const res = await fetch("/api/letter-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationName: location.name, locationId: location.id,
          era: "Today", metrics: location.metrics,
          liveMetrics: null, letterBody: letter, authorName: name,
        }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        setResponse("The river is quiet right now. Try again in a moment.");
        setReplyLoading(false); return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done || abort.signal.aborted) break;
        acc += decoder.decode(value, { stream: true });
        setResponse(acc);
      }
      addLetter?.({
        locationId: location.id, era: "Today" as import("@/data/locations").Era,
        locationName: location.name, authorName: name.trim(), body: letter, reply: acc,
      });
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "AbortError")
        setResponse("The river is quiet right now. Try again in a moment.");
    } finally { setReplyLoading(false); }
  }

  return (
    <div className="border-t border-forest/10 bg-[#f6eedb]">
      <div className="px-8 py-7 lg:px-12">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-rust">
              <PencilLine size={20} strokeWidth={1.5} />
              Write a letter back
            </h2>
            <p className="mt-0.5 font-ui text-xs text-ink/55">
              Your words matter. The places you love are listening.
            </p>
          </div>
        </div>

        {/* form */}
        <form onSubmit={handleSend} className="mt-5">
          {/* Letter paper */}
          <div className="relative rounded-sm border border-forest/15 bg-card shadow-[0_2px_8px_rgba(60,48,28,.08)]">
            {/* stamp decoration */}
            <div className="absolute right-3 top-3 grid h-14 w-12 place-items-center rounded-sm border border-dashed border-forest/30 bg-[#f6eedb]">
              <Leaf size={20} strokeWidth={1.1} className="text-sage/60" />
            </div>
            <textarea value={letter} onChange={(e) => setLetter(e.target.value)} rows={5}
              className="lined-paper w-full resize-none rounded-sm bg-transparent px-5 py-4 pr-16 font-hand text-xl leading-8 text-ink outline-none"
              aria-label={`Letter to ${location.name}`} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <label className="flex min-w-0 flex-1 items-center gap-2 font-ui text-xs text-ink/45">
              <span className="shrink-0">Your name</span>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="min-w-0 flex-1 border-b border-forest/20 bg-transparent pb-0.5 text-ink/70 outline-none placeholder:text-ink/30"
                placeholder="(optional)" />
            </label>
            <button type="submit" disabled={replyLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-2.5 font-ui text-sm font-medium text-card shadow-sm transition hover:bg-sage disabled:opacity-60">
              {replyLoading ? "Sending…" : <><Send size={14} /> Send Letter</>}
            </button>
          </div>
        </form>

        {/* reply — scrollable if long */}
        {response && (
          <div className="relative mt-6 max-h-72 overflow-y-auto rounded-sm border border-rust/20 bg-[#fdf4e3] p-5 shadow-[0_2px_8px_rgba(60,48,28,.08)]">
            {/* washi tape */}
            <div className="absolute -top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rotate-[-2deg] rounded-sm bg-[#d8c99f]/70" />
            <p className="font-hand text-xl text-rust">A reply from {location.name}</p>
            <p className="mt-2 whitespace-pre-wrap font-display text-base leading-7 text-ink">
              {response}
              {replyLoading && (
                <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-rust/50 align-middle" />
              )}
            </p>
            {!replyLoading && (
              <p className="mt-4 font-ui text-[10px] uppercase tracking-[.1em] text-ink/35">
                AI reply · grounded in live environmental data
              </p>
            )}
          </div>
        )}

        {/* bottom padding for comfortable scroll */}
        <div className="h-8" />
      </div>
    </div>
  );
}

// ─── root ─────────────────────────────────────────────────────────────────────

export default function NarrationExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locationId, era, setEra, setLocationId, searchLocation, addJournalEntry, addLetter } = useEchoEarth();

  const [liveReading,      setLiveReading]      = useState<LocationReading | null>(null);
  const [liveNarration,    setLiveNarration]     = useState("");
  const [narrationLoading, setNarrationLoading]  = useState(false);
  const [playing,          setPlaying]           = useState(false);
  const [menuOpen,         setMenuOpen]          = useState(false);
  const [searchOpen,       setSearchOpen]        = useState(false);
  const [ambientOn,        setAmbientOn]         = useState(false);
  // Mobile: which tab is active — "story" | "data" | "letter"
  const [mobileTab,        setMobileTab]         = useState<"story" | "data" | "letter">("story");
  const appliedRef = useRef(false);
  const abortRef   = useRef<AbortController | null>(null);

  const staticReading  = getLocationReading(locationId, era);
  const currentReading = liveReading ?? staticReading;

  // Apply URL params on first mount
  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;
    const paramLoc = searchParams.get("location");
    const paramEra = searchParams.get("era") as Era | null;
    const validEras: Era[] = ["1976", "Today", "2050"];
    if (paramLoc && paramLoc in LOCATION_READINGS) setLocationId(paramLoc);
    if (paramEra && validEras.includes(paramEra))   setEra(paramEra);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams({ location: locationId, era });
    router.replace(`/narration?${params.toString()}`, { scroll: false });
  }, [locationId, era, router]);

  // Fetch live data + stream narration
  useEffect(() => {
    setPlaying(false);
    setLiveReading(null);
    setLiveNarration("");
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    async function loadLiveData() {
      try {
        const locRes = await fetch(`/api/location?id=${locationId}&era=${era}`, { signal: abort.signal });
        if (!locRes.ok || abort.signal.aborted) return;
        const enriched: LocationReading & { liveMetrics: unknown } = await locRes.json();
        setLiveReading(enriched);

        if (era !== "Today") return;

        setNarrationLoading(true);
        const narRes = await fetch("/api/narration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationId, era,
            locationName: enriched.name, subtitle: enriched.subtitle,
            headline: enriched.headline, metrics: enriched.metrics,
            liveMetrics: (enriched as { liveMetrics: unknown }).liveMetrics ?? null,
            summary: enriched.summary,
          }),
          signal: abort.signal,
        });

        if (!narRes.ok || !narRes.body || abort.signal.aborted) { setNarrationLoading(false); return; }

        const reader  = narRes.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done || abort.signal.aborted) break;
          acc += decoder.decode(value, { stream: true });
          setLiveNarration(acc);
        }
        setNarrationLoading(false);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("[NarrationExperience]", err);
        setNarrationLoading(false);
      }
    }

    loadLiveData();
    return () => { abort.abort(); };
  }, [locationId, era]);

  const togglePlay = () => setPlaying((v) => !v);

  function handleSelect(query: string) { searchLocation(query); setPlaying(false); }
  function handleShare() {
    const url = `${window.location.origin}/narration?location=${locationId}&era=${era}`;
    const ogUrl = `${window.location.origin}/api/og?location=${locationId}&era=${era}`;
    // Copy the narration URL — the OG meta will auto-attach the preview card
    navigator.clipboard.writeText(url).catch(() => {
      if (navigator.share) navigator.share({
        title: `${currentReading.name} — EchoEarth`,
        text: currentReading.narration.split(/[.!?]/)[0].trim() + ".",
        url,
      });
    });
    // Pre-fetch the OG image so it's cached for when shared
    fetch(ogUrl, { method: "HEAD" }).catch(() => {});
  }

  const ttsText = (era === "Today" && liveNarration) ? liveNarration : currentReading.narration;
  const { loading: ttsLoading } = useElevenLabsAudio(ttsText, locationId, playing, () => setPlaying(false));

  // Ambient river sound
  useAmbientSound(ambientOn);

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      {/* Paper texture overlay */}
      <div className="paper-texture pointer-events-none fixed inset-0 z-50" aria-hidden="true" />

      <NavSidebar open={menuOpen} setOpen={setMenuOpen} />

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-ink/20 lg:hidden"
          onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar location={currentReading}
          onMenuOpen={() => setMenuOpen(true)}
          onSearch={() => setSearchOpen(true)}
          onSave={addJournalEntry}
          onShare={handleShare}
          ambientOn={ambientOn}
          onAmbientToggle={() => setAmbientOn((v) => !v)} />

        {/* Three-panel layout */}
        <div className="flex min-h-0 flex-1">

          {/* Center: narration + letter — single scrollable column */}
          <div className="min-w-0 flex-1 overflow-y-auto pb-16 lg:pb-0">
            {/* ── Desktop: always show story + letter ── */}
            <div className="hidden lg:block">
              <NarrationHero
                location={currentReading} era={era} setEra={setEra}
                playing={playing} ttsLoading={ttsLoading} onTogglePlay={togglePlay}
                liveNarration={liveNarration} narrationLoading={narrationLoading} />
              <LetterComposer location={currentReading} addLetter={addLetter} />
            </div>

            {/* ── Mobile: tab-controlled ── */}
            <div className="lg:hidden">
              <AnimatePresence mode="wait">
                {mobileTab === "story" && (
                  <motion.div key="story"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <NarrationHero
                      location={currentReading} era={era} setEra={setEra}
                      playing={playing} ttsLoading={ttsLoading} onTogglePlay={togglePlay}
                      liveNarration={liveNarration} narrationLoading={narrationLoading} />
                  </motion.div>
                )}
                {mobileTab === "data" && (
                  <motion.div key="data"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="px-4 py-5">
                      <ConditionPanel location={currentReading} />
                    </div>
                  </motion.div>
                )}
                {mobileTab === "letter" && (
                  <motion.div key="letter"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <LetterComposer location={currentReading} addLetter={addLetter} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: metrics + chart — desktop only */}
          <div className="hidden w-80 shrink-0 overflow-hidden border-l border-forest/10 xl:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={`panel-${locationId}-${era}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="h-full"
              >
                <ConditionPanel location={currentReading} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile bottom tab bar ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-forest/12 bg-card/95 backdrop-blur-sm lg:hidden">
          {([
            { id: "story",  label: "Story",   icon: <Leaf      size={18} strokeWidth={1.4} /> },
            { id: "data",   label: "Data",    icon: <Waves     size={18} strokeWidth={1.4} /> },
            { id: "letter", label: "Letter",  icon: <Send      size={18} strokeWidth={1.4} /> },
          ] as const).map(({ id, label, icon }) => (
            <button key={id} onClick={() => setMobileTab(id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 font-ui text-[10px] font-medium uppercase tracking-[.1em] transition ${
                mobileTab === id ? "text-forest" : "text-ink/40"
              }`}>
              <span className={mobileTab === id ? "text-forest" : "text-ink/35"}>{icon}</span>
              {label}
              {mobileTab === id && (
                <span className="absolute bottom-0 h-0.5 w-10 rounded-t-full bg-forest" />
              )}
            </button>
          ))}

          {/* Play button in tab bar */}
          <button onClick={togglePlay} disabled={ttsLoading}
            className="flex flex-1 flex-col items-center gap-1 py-3 font-ui text-[10px] font-medium uppercase tracking-[.1em] text-ink/40 transition disabled:opacity-40">
            <span className={`grid h-7 w-7 place-items-center rounded-full ${playing ? "bg-rust text-card" : "bg-forest/10 text-forest"}`}>
              {ttsLoading
                ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-forest/40 border-t-transparent" />
                : playing
                ? <Pause size={12} fill="currentColor" />
                : <Play  size={12} fill="currentColor" className="ml-[1px]" />}
            </span>
            {ttsLoading ? "Loading" : playing ? "Pause" : "Listen"}
          </button>
        </nav>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />
    </div>
  );
}
