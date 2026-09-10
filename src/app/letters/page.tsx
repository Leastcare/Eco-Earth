"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  Info,
  Leaf,
  Mail,
  MapPin,
  PenLine,
  Waves,
} from "lucide-react";
import { useEchoEarth } from "@/components/EchoEarthShell";
import type { LetterEntry } from "@/components/EchoEarthShell";

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
              route === "/letters" ? "bg-forest/8 text-forest" : "text-ink/55"
            }`}
          >
            <Icon size={13} strokeWidth={1.5} />{label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function LetterCard({
  entry,
  onOpen,
}: {
  entry: LetterEntry;
  onOpen: () => void;
}) {
  const preview = entry.body.replace(/\n/g, " ").trim();

  return (
    <article className="rounded-lg border border-forest/12 bg-card p-5 transition hover:border-forest/25 hover:shadow-paper">
      {/* to/from */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-ui text-[10px] font-semibold uppercase tracking-[.15em] text-ink/40">
            Letter to
          </p>
          <h3 className="mt-0.5 font-display text-base font-bold text-ink">
            {entry.locationName}
          </h3>
          {entry.authorName && (
            <p className="font-ui text-xs text-ink/50">from {entry.authorName}</p>
          )}
        </div>
        <span className="rounded-full border border-forest/15 px-2 py-0.5 font-ui text-[10px] text-ink/45">
          {entry.era === "Today" ? "Today" : entry.era}
        </span>
      </div>

      {/* body preview */}
      <p className="mt-3 line-clamp-3 font-display text-sm italic leading-6 text-ink/65">
        {preview}
      </p>

      {/* reply preview */}
      {entry.reply && (
        <div className="mt-3 rounded border-l-2 border-rust/40 bg-[#f6e7c5] pl-3 pr-2 py-2">
          <p className="font-ui text-[9px] font-semibold uppercase tracking-[.1em] text-rust/70">
            Reply from {entry.locationName}
          </p>
          <p className="mt-0.5 line-clamp-2 font-display text-xs italic text-ink/70">
            {entry.reply}
          </p>
        </div>
      )}

      {/* footer */}
      <div className="mt-4 flex items-center justify-between border-t border-forest/8 pt-3">
        <p className="flex items-center gap-1 font-ui text-[10px] text-ink/35">
          <Clock size={10} />{formatDate(entry.sentAt)}
        </p>
        <button
          onClick={onOpen}
          className="font-ui text-[11px] font-medium text-forest transition hover:underline"
        >
          Write again →
        </button>
      </div>
    </article>
  );
}

export default function LettersPage() {
  const router = useRouter();
  const { letters, setLocationId, setEra } = useEchoEarth();

  function handleOpen(entry: LetterEntry) {
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
            <h1 className="font-display text-base font-semibold text-forest">Letter Collection</h1>
            <p className="font-ui text-[11px] text-ink/50">
              {letters.length} {letters.length === 1 ? "letter" : "letters"} sent to the places you visited
            </p>
          </div>
          <Link href="/narration" className="font-ui text-xs text-ink/50 transition hover:text-forest">
            ← Back to narration
          </Link>
        </header>

        {/* content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {letters.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-forest/15 bg-card">
                <PenLine size={26} strokeWidth={1.2} className="text-forest/40" />
              </div>
              <div>
                <p className="font-display text-xl text-ink/60">No letters yet</p>
                <p className="mt-1 font-ui text-sm text-ink/40">
                  Visit a location, scroll to the letter composer, and send your first message.
                </p>
              </div>
              <Link
                href="/narration"
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2.5 font-ui text-sm text-card transition hover:bg-sage"
              >
                <Waves size={14} />
                Write a letter
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="font-ui text-xs text-ink/50">
                  Letters are saved locally on this device.
                </p>
                <div className="flex items-center gap-1.5 font-ui text-[10px] text-ink/35">
                  <Mail size={11} />
                  Most recent first
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {letters.map((entry) => (
                  <LetterCard
                    key={entry.id}
                    entry={entry}
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
