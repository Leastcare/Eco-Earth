"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  Droplets,
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
  Sparkles,
  Thermometer,
  Trash2,
  Waves,
  X,
} from "lucide-react";
import {
  getLocationReading,
  type Era,
  type LocationReading,
} from "@/data/locations";
import { useEchoEarth } from "@/components/EchoEarthShell";

type Screen = "search" | "data" | "narration" | "time" | "letter";

type AppRoute = "/narration" | "/map" | "/journal" | "/letters" | "/about";

function PaperTexture() {
  return (
    <div
      aria-hidden="true"
      className="paper-texture pointer-events-none fixed inset-0 z-50"
    />
  );
}

function Botanical({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 210 250"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    >
      <path d="M104 243C106 167 105 83 111 4" />
      <path d="M108 178C71 158 42 125 23 82M108 148C145 125 169 91 182 46M106 117C72 101 48 72 39 42M109 91C137 75 153 52 159 28" />
      <path d="M75 157c-27-2-46-16-52-37 24 2 42 14 52 37ZM146 126c27-4 44-20 49-42-25 4-40 18-49 42ZM73 100C48 98 31 84 25 63c22 3 38 14 48 37ZM140 76c21-4 35-16 39-35-20 4-33 14-39 35Z" />
      <path d="M102 207c-29-5-54-24-65-55 31 8 53 26 65 55ZM110 202c28-8 50-29 58-58-29 10-48 30-58 58Z" />
    </svg>
  );
}

function Landscape() {
  return (
    <svg
      viewBox="0 0 450 180"
      aria-hidden="true"
      className="w-full text-sage/50"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M0 123 64 68l44 38 52-75 55 69 38-38 38 41 53-75 106 96" />
      <path d="M0 143c58-18 101 18 157 5 55-13 86-7 126 8 57 21 114-6 167-9" />
      <path d="M0 158c54-12 107 4 157-4 66-10 97 25 160 7 59-17 94-5 133 5" />
      <path d="M282 157c25-11 40-29 56-31 23-3 30 22 47 15 20-9 23-39 65-37" />
    </svg>
  );
}

function Waveform({ playing }: { playing: boolean }) {
  const bars = useMemo(
    () => [
      12, 18, 10, 24, 40, 66, 33, 20, 52, 85, 45, 21, 35, 72, 26, 16, 42, 57,
      30, 18, 12, 8,
    ],
    [],
  );

  return (
    <div
      className="flex h-24 flex-1 items-center gap-1 overflow-hidden"
      aria-label="Narration waveform"
    >
      {bars.map((height, index) => (
        <span
          key={index}
          className={`wave-bar w-1.5 rounded-full bg-waveform/75 ${
            playing ? "animate-wave" : ""
          }`}
          style={{
            height: `${height}%`,
            animationDelay: `${index * 55}ms`,
          }}
        />
      ))}
    </div>
  );
}

function Sidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const navItems: {
    route: AppRoute;
    label: string;
    icon: typeof Leaf;
  }[] = [
    { route: "/narration", label: "Narration", icon: Leaf },
    { route: "/map", label: "Map", icon: MapPin },
    { route: "/journal", label: "Journal", icon: BookOpen },
    { route: "/letters", label: "Letters", icon: Mail },
    { route: "/about", label: "About", icon: Info },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-forest/15 bg-sidebar px-8 py-10 transition-transform lg:translate-x-0 ${
        open ? "translate-x-0 shadow-paper" : "-translate-x-full"
      }`}
    >
      <button
        onClick={() => setOpen(false)}
        className="absolute right-5 top-5 text-forest lg:hidden"
        aria-label="Close menu"
      >
        <X size={20} />
      </button>

      <div className="border-b border-forest/25 pb-9">
        <div className="font-display text-4xl font-semibold tracking-tight text-forest">
          EchoEarth
        </div>

        <p className="mt-3 font-display text-lg leading-6 text-ink/80">
          Places speak.
          <br />
          We listen.
        </p>
      </div>

      <nav className="mt-8 space-y-2">
  {navItems.map(({ route, label, icon: Icon }) => (
    <Link
      key={route}
      href={route}
      onClick={() => setOpen(false)}
      className="flex w-full items-center gap-4 rounded-sm px-2 py-3 text-left font-ui text-sm text-ink/75 transition hover:bg-forest/5 hover:text-forest"
    >
      <Icon size={19} strokeWidth={1.4} />
      {label}
    </Link>
  ))}
</nav>

      <div className="relative mt-auto pt-8 text-sage">
        <Botanical className="absolute -left-12 bottom-16 w-44 rotate-[-8deg] opacity-70" />

        <p className="relative ml-4 font-hand text-2xl leading-7 text-ink/70">
          The Earth
          <br />
          remembers,
          <br />
          and now,
          <br />
          it speaks.
        </p>
      </div>
    </aside>
  );
}

function SearchBar({
  location,
  onChange,
  onSubmit,
}: {
  location: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-xl items-center rounded-lg border border-forest/15 bg-card px-4 py-1.5 shadow-[0_3px_9px_rgba(60,48,28,.06)]"
    >
      <MapPin className="mr-3 text-forest" size={20} strokeWidth={1.4} />

      <input
        value={location}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent py-2 font-ui text-sm text-ink outline-none placeholder:text-ink/45"
        placeholder="Search a river, forest, lake, or city"
      />

      <button
        type="button"
        onClick={() => onChange("")}
        className="p-1 text-ink/60 hover:text-rust"
        aria-label="Clear search"
      >
        <X size={18} />
      </button>
    </form>
  );
}

function Hero({ location }: { location: LocationReading }) {
  return (
    <section>
      <div className="relative inline-block">
        <span className="absolute -left-10 -top-7 font-hand text-xl text-rust">
          You are listening
        </span>

        <svg
          className="absolute -left-5 -top-1 h-10 w-11 text-ink/70"
          viewBox="0 0 50 50"
          fill="none"
          stroke="currentColor"
        >
          <path d="M4 3c-2 23 8 33 29 35" />
          <path d="m28 31 6 8-9 3" />
        </svg>

        <h1 className="font-display text-5xl font-medium leading-none tracking-tight text-forest sm:text-7xl">
          {location.name}
        </h1>
      </div>

      <p className="mt-4 font-ui text-xs font-medium uppercase tracking-[.18em] text-ink/80">
        {location.subtitle}
      </p>

      <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 font-ui text-xs text-ink/75">
        <span className="flex items-center gap-2">
          <Droplets size={15} />
          {location.type}
        </span>

        <span className="flex items-center gap-2">
          <Waves size={15} />
          {location.origin}
        </span>

        <span className="flex items-center gap-2">
          <MapPin size={15} />
          {location.coordinates}
        </span>
      </div>
    </section>
  );
}

function statusDot(statusColor: "good" | "moderate" | "high") {
  if (statusColor === "moderate") return "bg-statusModerate";
  if (statusColor === "high") return "bg-statusHigh";
  return "bg-statusGood";
}

function MetricIcon({ label }: { label: string }) {
  const normalized = label.toLowerCase();

  if (normalized.includes("temperature")) {
    return <Thermometer size={19} />;
  }

  if (normalized.includes("oxygen")) {
    return <Sparkles size={19} />;
  }

  if (normalized.includes("plastic")) {
    return <Trash2 size={19} />;
  }

  if (normalized.includes("ph")) {
    return <Waves size={19} />;
  }

  return <Droplets size={19} />;
}

function Snapshot({ location }: { location: LocationReading }) {
  const isProjection = location.updatedAt.toLowerCase().includes("projected");

  return (
    <aside className="rounded-sm border-y border-forest/15 py-4">
      <h2 className="font-display text-xl text-forest">Current condition</h2>

      <p className="mt-1 font-ui text-xs text-ink/65">
        {isProjection ? "Projected scenario snapshot" : "Live data snapshot"}
      </p>

      <div className="mt-5">
        {location.metrics.map((metric) => (
          <div
            className="grid grid-cols-[26px_1fr_auto] gap-2 border-t border-forest/15 py-3"
            key={metric.label}
          >
            <span className="mt-1 text-sage">
              <MetricIcon label={metric.label} />
            </span>

            <div>
              <p className="font-display text-sm text-ink">{metric.label}</p>
              <p className="font-ui text-xs text-ink/72">{metric.value}</p>
            </div>

            <span className="mt-4 flex items-center gap-1.5 font-ui text-[10px] text-ink/65">
              <i
                className={`h-2 w-2 rounded-full ${statusDot(metric.statusColor)}`}
              />
              {metric.status}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 font-ui text-[10px] leading-5 text-ink/65">
        Source: {location.source}
        <br />
        Updated: {location.updatedAt}
      </p>
    </aside>
  );
}

function MiniChart({ location }: { location: LocationReading }) {
  const values = location.trend;

  const points = values
    .map((value, index) => {
      const x = 15 + (index * 260) / Math.max(values.length - 1, 1);
      const y = 132 - ((value - 0.5) / 10) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const annotation =
    location.name === "Yamuna River"
      ? "Needs care"
      : location.name === "Dal Lake"
        ? "Restoring slowly"
        : "Improving, slowly";

  return (
    <div className="paper-card relative rotate-[1deg] p-6 sm:p-8">
      <span className="washi-tape" />

      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg text-ink">Water quality (BOD)</h3>

          <p className="font-hand text-xl text-ink/80">
            {location.updatedAt.toLowerCase().includes("projected")
              ? "Projected trend"
              : "Last 12 months"}
          </p>
        </div>

        <span className="font-ui text-[10px] uppercase tracking-[.16em] text-sage">
          mg/L
        </span>
      </div>

      <svg
        className="mt-5 h-40 w-full overflow-visible"
        viewBox="0 0 300 150"
        role="img"
        aria-label="Biochemical oxygen demand trend chart"
      >
        <path d="M15 15V135H285" fill="none" stroke="rgba(44,42,36,.25)" />

        <path
          d="M15 55H285M15 95H285"
          fill="none"
          stroke="rgba(44,42,36,.12)"
          strokeDasharray="3 5"
        />

        <polyline
          points={points}
          fill="none"
          stroke="#43533A"
          strokeWidth="2"
        />

        {points.split(" ").map((point, index) => {
          const [cx, cy] = point.split(",");

          return <circle key={index} cx={cx} cy={cy} r="3.2" fill="#43533A" />;
        })}

        <text x="20" y="148" className="fill-ink/60 text-[9px]">
          Start
        </text>

        <text x="250" y="148" className="fill-ink/60 text-[9px]">
          Now
        </text>
      </svg>

      <div className="absolute right-5 top-1/2 rotate-[-4deg] font-hand text-xl text-ink/80">
        {annotation} <span className="ml-2 text-rust">↘</span>
      </div>

      <p className="mt-3 text-center font-hand text-xl text-ink/75">
        Lower is better
      </p>
    </div>
  );
}

function AudioNarration({
  location,
  playing,
  onToggle,
}: {
  location: LocationReading;
  playing: boolean;
  onToggle: () => void;
}) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    if (!playing) {
      utteranceRef.current = null;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(location.narration);

    utterance.rate = 0.88;
    utterance.pitch = 0.92;
    utterance.volume = 1;

    utterance.onend = () => {
      utteranceRef.current = null;
      onToggle();
    };

    utterance.onerror = () => {
      utteranceRef.current = null;
      onToggle();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    };
  }, [location.narration, onToggle, playing]);

  return (
    <section className="mt-10">
      <div className="flex items-center gap-5">
        <button
          onClick={onToggle}
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-[8px] border-forest/10 bg-sage text-card shadow-[0_0_0_1px_rgba(67,83,58,.25)] transition hover:scale-105"
          aria-label={playing ? "Pause narration" : "Play narration"}
        >
          {playing ? (
            <Pause fill="currentColor" size={22} />
          ) : (
            <Play fill="currentColor" className="ml-1" size={22} />
          )}
        </button>

        <Waveform playing={playing} />
      </div>

      <div className="relative mt-8 max-w-2xl px-8">
        <span className="absolute left-0 -top-2 font-display text-5xl leading-none text-rust">
          “
        </span>

        <p className="font-display text-xl leading-8 text-ink sm:text-2xl sm:leading-9">
          {location.narration}
        </p>

        <span className="absolute -bottom-8 right-0 font-display text-5xl leading-none text-rust">
          ”
        </span>
      </div>

      <p className="mt-12 flex items-center gap-1.5 font-ui text-[11px] text-ink/65">
        Browser voice preview · replace with TTS audio in production
        <Info size={13} />
      </p>
    </section>
  );
}

function TimeControl({
  era,
  setEra,
}: {
  era: Era;
  setEra: (era: Era) => void;
}) {
  const labels: Era[] = ["1976", "Today", "2050"];

  return (
    <section className="mt-8 rounded-sm border border-forest/15 bg-card p-5 shadow-[0_5px_18px_rgba(60,48,28,.06)]">
      <p className="font-hand text-2xl text-rust">Move through the current</p>

      <div className="relative mt-6 grid grid-cols-3">
        <div className="absolute left-[16.5%] right-[16.5%] top-4 h-px bg-forest/30" />

        {labels.map((label) => (
          <button
            key={label}
            onClick={() => setEra(label)}
            className="relative z-10 flex flex-col items-center gap-2"
          >
            <i
              className={`h-8 w-8 rounded-full border-4 border-card ${
                era === label
                  ? "bg-rust shadow-[0_0_0_1px_#C15A2E]"
                  : "bg-sidebar shadow-[0_0_0_1px_rgba(67,83,58,.25)]"
              }`}
            />

            <span
              className={`font-ui text-xs ${
                era === label ? "font-semibold text-forest" : "text-ink/60"
              }`}
            >
              {label === "1976"
                ? "50 years ago"
                : label === "2050"
                  ? "2050 projected"
                  : "Today"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function LetterComposer({ location }: { location: LocationReading }) {
  const [letter, setLetter] = useState(`Dear ${location.name},\n\n`);
  const [response, setResponse] = useState("");

  function handleSend(event: FormEvent) {
    event.preventDefault();

    // TODO: POST the letter and current structured environmental data
    // to the FastAPI/Express backend, then request a grounded Claude reply.
    setResponse(
      "I hear your promise in the small things: a refill bottle carried, a drain kept clear, a question asked at a public meeting. Care becomes a current when it is shared. Keep it moving.",
    );
  }

  return (
    <section className="relative mt-12 overflow-hidden rounded-sm border border-forest/15 bg-card p-6 shadow-paper sm:p-8">
      <div className="absolute inset-x-0 top-20 h-px bg-forest/10" />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl text-rust">
            <PencilLine size={23} />
            Write a letter back
          </h2>

          <p className="mt-1 font-ui text-xs text-ink/70">
            Your words matter. The places you love are listening.
          </p>
        </div>

        <button
          type="button"
          className="font-ui text-xs text-ink/75 hover:text-rust"
        >
          Guidelines for a meaningful letter ↓
        </button>
      </div>

      <form
        onSubmit={handleSend}
        className="relative mt-7 grid gap-5 md:grid-cols-[1fr_auto]"
      >
        <textarea
          value={letter}
          onChange={(event) => setLetter(event.target.value)}
          className="min-h-40 w-full resize-y rounded-sm border border-forest/15 bg-transparent px-5 py-4 font-hand text-2xl leading-[2.05rem] text-ink outline-none [background-image:linear-gradient(transparent_32px,rgba(67,83,58,.12)_33px)] [background-size:100%_33px]"
          aria-label="Letter to the location"
        />

        <div className="flex flex-row items-end gap-4 md:flex-col">
          <div className="stamp hidden text-sage md:grid">
            <Leaf size={34} strokeWidth={1.1} />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-3 font-ui text-sm text-card transition hover:bg-sage"
          >
            Send letter
            <Send size={16} />
          </button>
        </div>
      </form>

      {response && (
        <div className="relative mt-7 rotate-[-0.7deg] border border-rust/20 bg-[#f6e7c5] p-5 shadow-[0_6px_14px_rgba(60,48,28,.1)]">
          <span className="font-hand text-xl text-rust">
            A reply from {location.name}
          </span>

          <p className="mt-2 font-display text-lg leading-7 text-ink">
            {response}
          </p>

          <p className="mt-3 font-ui text-[10px] uppercase tracking-[.13em] text-ink/55">
            Grounded in this location’s displayed data
          </p>
        </div>
      )}
    </section>
  );
}

function StageHeader({ screen }: { screen: Screen }) {
  const content: Record<
    Screen,
    { eyebrow: string; title: string; description: string }
  > = {
    search: {
      eyebrow: "Screen 1 · begin with a place",
      title: "Which place would you like to hear?",
      description:
        "Search for a river, forest, lake, park, or the place you call home.",
    },
    data: {
      eyebrow: "Screen 2 · evidence first",
      title: "Before the voice, the record.",
      description:
        "EchoEarth makes its sources visible before it turns environmental data into a narrative.",
    },
    narration: {
      eyebrow: "Screen 3 · listen closely",
      title: "A place speaks in signals.",
      description:
        "Play the narration while keeping the underlying numbers in view.",
    },
    time: {
      eyebrow: "Screen 4 · shift the current",
      title: "The same place, across time.",
      description:
        "Move between a remembered past, the present record, and a data-grounded projection.",
    },
    letter: {
      eyebrow: "Screen 5 · write back",
      title: "A letter, not a chat.",
      description:
        "Respond to the place in your own words. Its reply remains tied to the same environmental record.",
    },
  };

  const current = content[screen];

  return (
    <section className="mb-10 border-b border-forest/15 pb-7">
      <p className="font-hand text-2xl text-rust">{current.eyebrow}</p>

      <h2 className="mt-2 font-display text-4xl text-forest">
        {current.title}
      </h2>

      <p className="mt-2 max-w-2xl font-ui text-sm leading-6 text-ink/72">
        {current.description}
      </p>
    </section>
  );
}

export default function NarrationExperience() {
  const { locationId, era, setEra, location, searchLocation } = useEchoEarth();

  const [screen, setScreen] = useState<Screen>("search");
  const [query, setQuery] = useState(location.subtitle);
  const [playing, setPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearch(event: FormEvent) {
    event.preventDefault();

    searchLocation(query);
    setScreen("data");
    setPlaying(false);
  }

  function togglePlayback() {
    setPlaying((value) => !value);
  }

  const currentReading = getLocationReading(locationId, era);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <PaperTexture />

      <Sidebar open={menuOpen} setOpen={setMenuOpen} />

      <main className="relative z-10 min-h-screen lg:ml-64">
        <header className="flex items-center gap-4 px-5 py-5 sm:px-9 lg:px-12">
          <button
            onClick={() => setMenuOpen(true)}
            className="text-forest lg:hidden"
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <SearchBar
            location={query}
            onChange={setQuery}
            onSubmit={handleSearch}
          />

          <div className="hidden items-center gap-5 font-ui text-sm text-ink/80 sm:flex">
            <button
              type="button"
              className="flex items-center gap-1.5 hover:text-rust"
            >
              <BookOpen size={18} />
              Sources
            </button>

            <button
              type="button"
              className="flex items-center gap-1.5 hover:text-rust"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        </header>

        <div className="px-5 pb-14 pt-8 sm:px-9 lg:px-12 lg:pt-10">
          <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2 font-ui text-[10px] uppercase tracking-[.15em] text-ink/50">
            {(
              ["search", "data", "narration", "time", "letter"] as Screen[]
            ).map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => setScreen(item)}
                className={`whitespace-nowrap ${
                  screen === item ? "text-rust" : ""
                }`}
              >
                {index + 1}. {item}
              </button>
            ))}
          </div>

          {screen === "search" && (
            <>
              <StageHeader screen={screen} />

              <section className="grid min-h-[55vh] place-items-center text-center">
                <div>
                  <p className="font-hand text-3xl text-rust">
                    Every place has a record.
                  </p>

                  <h1 className="mt-4 font-display text-5xl leading-tight text-forest sm:text-7xl">
                    Let a place tell it.
                  </h1>

                  <p className="mx-auto mt-5 max-w-lg font-ui text-sm leading-6 text-ink/70">
                    Enter a place, reveal the real environmental signals, then
                    listen to a data-grounded voice.
                  </p>

                  <form
                    onSubmit={handleSearch}
                    className="mx-auto mt-8 flex max-w-xl items-center rounded-lg border border-forest/20 bg-card p-2 shadow-paper"
                  >
                    <MapPin className="ml-2 text-rust" />

                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 font-ui text-sm outline-none"
                      placeholder="Try Yamuna River, Delhi"
                    />

                    <button
                      type="submit"
                      className="rounded-md bg-forest px-5 py-3 font-ui text-sm text-card"
                    >
                      Reveal record
                    </button>
                  </form>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {[
                      "Yamuna River, Delhi",
                      "Ganga River, Rishikesh",
                      "Dal Lake, Srinagar",
                    ].map((place) => (
                      <button
                        key={place}
                        type="button"
                        onClick={() => setQuery(place)}
                        className="rounded-full border border-forest/15 px-3 py-1.5 font-ui text-xs text-ink/70 hover:border-rust hover:text-rust"
                      >
                        {place}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {screen !== "search" && (
            <>
              <StageHeader screen={screen} />

              <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_350px]">
                <div>
                  <Hero location={currentReading} />

                  <div className="mt-10 xl:hidden">
                    <Snapshot location={currentReading} />
                  </div>

                  {screen === "data" && (
                    <div className="mt-9 max-w-2xl">
                      <MiniChart location={currentReading} />

                      <p className="mt-7 font-display text-xl leading-8 text-ink/85">
                        {currentReading.summary}
                      </p>

                      <button
                        onClick={() => setScreen("narration")}
                        className="mt-7 inline-flex items-center gap-2 rounded-md bg-forest px-5 py-3 font-ui text-sm text-card"
                      >
                        Hear the narration
                        <Play size={15} fill="currentColor" />
                      </button>
                    </div>
                  )}

                  {["narration", "time", "letter"].includes(screen) && (
                    <AudioNarration
                      location={currentReading}
                      playing={playing}
                      onToggle={togglePlayback}
                    />
                  )}

                  {screen === "time" && (
                    <TimeControl era={era} setEra={setEra} />
                  )}

                  {screen === "letter" && (
                    <LetterComposer location={currentReading} />
                  )}

                  {screen === "narration" && (
                    <div className="mt-10 grid gap-7 xl:grid-cols-2">
                      <TimeControl era={era} setEra={setEra} />

                      <div className="self-end border-l-2 border-rust pl-5 font-display text-lg leading-7 text-ink/80">
                        The voice is never separate from the record: every line
                        should be traceable to the numbers beside it.
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden xl:block">
                  <Snapshot location={currentReading} />

                  <div className="mt-9">
                    <Landscape />
                  </div>

                  <div className="mt-5">
                    <MiniChart location={currentReading} />
                  </div>

                  <div className="relative z-10 -mt-3 ml-[-2rem] max-w-[260px] rotate-[-1.5deg] border border-rust/15 bg-[#f6e7c5] p-5 shadow-paper">
                    <h3 className="font-display text-lg text-ink">
                      What this means
                    </h3>

                    <p className="mt-2 font-hand text-lg leading-6 text-ink/85">
                      BOD indicates organic pollution. Lower levels mean clearer
                      water with more oxygen for aquatic life.
                    </p>

                    <Botanical className="absolute -bottom-7 right-0 w-24 text-sage/70" />
                  </div>
                </div>
              </div>

              {screen !== "letter" && (
                <LetterComposer location={currentReading} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
