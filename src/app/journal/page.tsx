"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  BookmarkX,
  Clock,
  Droplets,
  Info,
  Leaf,
  Mail,
  MapPin,
  Waves,
} from "lucide-react";
import { useEchoEarth } from "@/components/EchoEarthShell";
import type { JournalEntry } from "@/components/EchoEarthShell";

type AppRoute = "/narration" | "/map" | "/journal" | "/letters" | "/about";

function NavSidebar() {
  const items: { route: AppRoute; label: string; Icon: typeof Leaf }[] = [
    { route: "/narration", label: "Narration",  Icon: Leaf     },
    { route: "/map",       label: "Map",        Icon: MapPin   },
    { route: "/journal",   label: "Journal",    Icon: BookOpen },
    { route: "/about",     label: "About",      Icon: Info     },
    { route: "/letters",   label: "Collection", Icon: Mail     },
  ];
  return (
    <nav className="hidden w-44 shrink-0 flex-col border-r border-forest/10 bg-sidebar px-5 py-7 lg:flex">
      <div className="mb-7 flex items-center gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-forest/20 bg-card">
          <Leaf size={15} strokeWidth={1.4} className="text-forest" />
        </div>
        <span className="font-display text-base font-semibold tracking-tight text-forest">EchoEarth</span>
      </div>
      <p className="mb-6 font-ui text-[10px] leading-[1.5] text-ink/50">
        Every place has a voice.<br />Listen. Learn. Love.
      </p>
      <div className="space-y-0.5">
        {items.map(({ route, label, Icon }) => (
          <Link
            key={route}
            href={route}
            className={`flex items-center gap-2.5 rounded px-2 py-2 font-ui text-[11px] font-medium uppercase tracking-[.1em] transition hover:bg-forest/5 hover:text-forest ${
              route === "/journal" ? "bg-forest/8 text-forest" : "text-ink/55"
            }`}
          >
            <Icon size={13} strokeWidth={1.5} />{label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function healthText(status: string) {
  if (status === "Critical" || status === "Poor") return "text-statusHigh";
  if (status === "Moderate") return "text-statusModerate";
  return "text-statusGood";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function EntryCard({
  entry,
  onRemove,
  onOpen,
}: {
  entry: JournalEntry;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const { snapshot } = entry;
  const topMetrics = snapshot.metrics.slice(0, 3);

  return (
    <div className="group relative rounded-lg border border-forest/12 bg-card p-5 transition hover:border-forest/25 hover:shadow-paper">
      {/* remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute right-3 top-3 hidden rounded p-1 text-ink/30 transition hover:text-rust group-hover:block"
        aria-label="Remove entry"
      >
        <BookmarkX size={15} />
      </button>

      {/* header */}
      <div className="flex items-start justify-between gap-3 pr-6">
        <div>
          <p className="font-ui text-[10px] font-semibold uppercase tracking-[.15em] text-ink/40">
            {snapshot.type} · {entry.era === "Today" ? "Today" : entry.era}
          </p>
          <h3 className="mt-0.5 font-display text-lg font-bold text-ink">{snapshot.name}</h3>
          <p className="flex items-center gap-1 font-ui text-xs text-ink/50">
            <MapPin size={10} />{snapshot.subtitle}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-display text-2xl font-bold ${healthText(snapshot.healthStatus)}`}>
            {snapshot.healthIndex}
          </p>
          <p className="font-ui text-[9px] text-ink/35">/ 100</p>
          <p className={`mt-0.5 font-ui text-[10px] font-bold uppercase ${healthText(snapshot.healthStatus)}`}>
            {snapshot.healthStatus}
          </p>
        </div>
      </div>

      {/* metrics */}
      <div className="mt-4 space-y-1.5">
        {topMetrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between gap-2">
            <span className="font-ui text-[11px] text-ink/50">{m.label}</span>
            <span className={`font-ui text-[11px] font-semibold ${
              m.statusColor === "good" ? "text-statusGood" :
              m.statusColor === "moderate" ? "text-statusModerate" : "text-statusHigh"
            }`}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="mt-4 flex items-center justify-between border-t border-forest/8 pt-3">
        <p className="flex items-center gap-1 font-ui text-[10px] text-ink/35">
          <Clock size={10} />{formatDate(entry.savedAt)}
        </p>
        <button
          onClick={onOpen}
          className="font-ui text-[11px] font-medium text-forest transition hover:underline"
        >
          Open record →
        </button>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const router = useRouter();
  const { journalEntries, removeJournalEntry, setLocationId, setEra } = useEchoEarth();

  function handleOpen(entry: JournalEntry) {
    setLocationId(entry.locationId);
    setEra(entry.era);
    router.push("/narration");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      <NavSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="flex shrink-0 items-center justify-between border-b border-forest/10 bg-card/80 px-5 py-3 backdrop-blur-sm">
          <div>
            <h1 className="font-display text-base font-semibold text-forest">Your Journal</h1>
            <p className="font-ui text-[11px] text-ink/50">
              Saved readings — {journalEntries.length} {journalEntries.length === 1 ? "entry" : "entries"}
            </p>
          </div>
          <Link
            href="/narration"
            className="font-ui text-xs text-ink/50 transition hover:text-forest"
          >
            ← Back to narration
          </Link>
        </header>

        {/* content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {journalEntries.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-forest/15 bg-card">
                <BookOpen size={28} strokeWidth={1.2} className="text-forest/40" />
              </div>
              <div>
                <p className="font-display text-xl text-ink/60">Your journal is empty</p>
                <p className="mt-1 font-ui text-sm text-ink/40">
                  Visit a location and click <strong>Save</strong> in the top bar to record a reading.
                </p>
              </div>
              <Link
                href="/narration"
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2.5 font-ui text-sm text-card transition hover:bg-sage"
              >
                <Waves size={14} />
                Explore locations
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="font-ui text-xs text-ink/50">
                  Readings are saved locally on this device.
                </p>
                <div className="flex items-center gap-1.5 font-ui text-[10px] text-ink/35">
                  <Droplets size={11} />
                  Sorted by most recent
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {journalEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onRemove={() => removeJournalEntry(entry.id)}
                    onOpen={() => handleOpen(entry)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
