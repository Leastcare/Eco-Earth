"use client";

import Link from "next/link";
import {
  BookOpen,
  Database,
  ExternalLink,
  Globe,
  Info,
  Leaf,
  Mail,
  MapPin,
  Microscope,
  ShieldCheck,
  Waves,
} from "lucide-react";

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
              route === "/about" ? "bg-forest/8 text-forest" : "text-ink/55"
            }`}
          >
            <Icon size={13} strokeWidth={1.5} />{label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

const SOURCES = [
  {
    name: "Central Pollution Control Board (CPCB)",
    description: "National water quality monitoring data for Indian rivers and lakes.",
    url: "https://cpcb.nic.in",
    icon: Database,
  },
  {
    name: "National Mission for Clean Ganga (NMCG)",
    description: "Real-time monitoring of Ganga basin BOD, dissolved oxygen, and flow.",
    url: "https://nmcg.nic.in",
    icon: Waves,
  },
  {
    name: "India Meteorological Department (IMD)",
    description: "Surface water temperature and seasonal flow stress data.",
    url: "https://mausam.imd.gov.in",
    icon: Globe,
  },
  {
    name: "ISRO — National Remote Sensing Centre",
    description: "Satellite-derived plastic load estimates and land-use change.",
    url: "https://www.nrsc.gov.in",
    icon: Microscope,
  },
  {
    name: "WWF India",
    description: "Biological diversity assessments for freshwater ecosystems.",
    url: "https://www.wwfindia.org",
    icon: Leaf,
  },
  {
    name: "J&K Pollution Control Committee",
    description: "Dal Lake water quality and nutrient monitoring reports.",
    url: "https://jkpcc.nic.in",
    icon: Database,
  },
];

const METHODOLOGY = [
  {
    step: "01",
    title: "Data collection",
    body: "Environmental metrics are sourced from government monitoring agencies and satellite datasets. Where live APIs are unavailable, the most recent published reference values are used.",
  },
  {
    step: "02",
    title: "Health Index calculation",
    body: "The N-WQI (National Water Quality Index) score aggregates dissolved oxygen, BOD, pH, temperature, and biological diversity into a single 0–100 index. Lower scores indicate greater stress.",
  },
  {
    step: "03",
    title: "Era projections",
    body: "The 1976 era uses published historical reference datasets. The 2050 era is a scenario projection based on IPCC SSP2-4.5 warming trajectories combined with current pollution trends — not a forecast.",
  },
  {
    step: "04",
    title: "Narration generation",
    body: "Each location's narration is written to be data-grounded: every claim in the voice of the place is traceable to at least one displayed metric. Narrations are reviewed for factual accuracy.",
  },
  {
    step: "05",
    title: "Transparency",
    body: "Data sources and update timestamps are shown alongside every reading. Projected values are clearly labelled. No metric is presented without its origin.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      <NavSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="flex shrink-0 items-center justify-between border-b border-forest/10 bg-card/80 px-5 py-3 backdrop-blur-sm">
          <div>
            <h1 className="font-display text-base font-semibold text-forest">About EchoEarth</h1>
            <p className="font-ui text-[11px] text-ink/50">Data sources, methodology, and mission</p>
          </div>
          <Link href="/narration" className="font-ui text-xs text-ink/50 transition hover:text-forest">
            ← Back to narration
          </Link>
        </header>

        {/* content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">

            {/* Mission */}
            <section>
              <p className="font-ui text-[10px] font-semibold uppercase tracking-[.2em] text-rust">
                Mission
              </p>
              <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-ink">
                Places speak.
                <br />We listen.
              </h2>
              <p className="mt-5 max-w-2xl font-display text-lg leading-8 text-ink/75">
                EchoEarth turns environmental data into stories told from the perspective of the places
                themselves — rivers, lakes, forests, coastlines. Every number displayed has a source.
                Every voice is grounded in that record.
              </p>
              <p className="mt-4 max-w-2xl font-display text-lg leading-8 text-ink/75">
                The goal is not alarm, but understanding. When you know what a river carries in its water
                today, and what it carried fifty years ago, the story it tells becomes impossible to ignore.
              </p>
            </section>

            {/* Divider */}
            <div className="my-10 h-px bg-forest/10" />

            {/* Methodology */}
            <section>
              <p className="font-ui text-[10px] font-semibold uppercase tracking-[.2em] text-ink/40">
                Methodology
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink">How the data becomes a story</h2>
              <div className="mt-7 space-y-6">
                {METHODOLOGY.map(({ step, title, body }) => (
                  <div key={step} className="flex gap-5">
                    <span className="mt-0.5 shrink-0 font-display text-2xl font-bold text-forest/20">
                      {step}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
                      <p className="mt-1 font-ui text-sm leading-6 text-ink/65">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Divider */}
            <div className="my-10 h-px bg-forest/10" />

            {/* Data sources */}
            <section>
              <p className="font-ui text-[10px] font-semibold uppercase tracking-[.2em] text-ink/40">
                Data Sources
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink">Where the numbers come from</h2>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {SOURCES.map(({ name, description, url, icon: Icon }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-lg border border-forest/10 bg-card px-4 py-4 transition hover:border-forest/25 hover:shadow-paper"
                  >
                    <span className="mt-0.5 shrink-0 text-forest/50">
                      <Icon size={16} strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-ui text-xs font-semibold text-ink">{name}</p>
                        <ExternalLink size={10} className="shrink-0 text-ink/30" />
                      </div>
                      <p className="mt-0.5 font-ui text-[11px] leading-4 text-ink/55">{description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* Divider */}
            <div className="my-10 h-px bg-forest/10" />

            {/* Principles */}
            <section className="rounded-lg border border-forest/12 bg-card p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-forest" strokeWidth={1.5} />
                <h2 className="font-display text-base font-semibold text-ink">Our principles</h2>
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  "Every metric shown has a named source and a timestamp.",
                  "Projected values are always labelled as scenarios, not forecasts.",
                  "The voice of the place is poetic, but never factually misleading.",
                  "No data is invented. If a number is uncertain, we say so.",
                  "This project is not affiliated with any government body or lobby.",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 font-ui text-sm text-ink/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest/40" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-10 pb-10 text-center">
              <Link
                href="/narration"
                className="inline-flex items-center gap-2 rounded-md bg-forest px-5 py-3 font-ui text-sm text-card transition hover:bg-sage"
              >
                <Waves size={15} />
                Start listening
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
