"use client";

import Link from "next/link";
import {
  Database,
  ExternalLink,
  Globe,
  Leaf,
  Microscope,
  ShieldCheck,
  Waves,
} from "lucide-react";
import NavSidebar from "@/components/NavSidebar";

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
  {
    name: "Open-Meteo (Weather & Air Quality)",
    description: "Real-time temperature, precipitation, PM2.5, PM10, and European AQI — free, no API key.",
    url: "https://open-meteo.com",
    icon: Globe,
  },
  {
    name: "USGS Water Services",
    description: "Real-time stream discharge data for US rivers including the Colorado.",
    url: "https://waterservices.usgs.gov",
    icon: Waves,
  },
];

const METHODOLOGY = [
  {
    step: "01",
    title: "Data collection",
    body: "Environmental metrics are sourced from government monitoring agencies, satellite datasets, and real-time open APIs. Temperature and air quality (PM2.5, PM10, European AQI) are fetched live from Open-Meteo — free, no key required, updated every 30 minutes.",
  },
  {
    step: "02",
    title: "Health Index calculation",
    body: "The N-WQI (National Water Quality Index) score aggregates dissolved oxygen, BOD, pH, temperature, and biological diversity into a single 0–100 index. Lower scores indicate greater stress.",
  },
  {
    step: "03",
    title: "Live dissolved oxygen derivation",
    body: "Dissolved oxygen is estimated in real time using the Benson–Krause equation (APHA Standard Methods), which models O₂ saturation from live water temperature, adjusted by a pollution multiplier derived from the live PM2.5 reading and the location's research baseline.",
  },
  {
    step: "04",
    title: "Era projections",
    body: "The 1976 era uses published historical reference datasets. The 2050 era is a scenario projection based on IPCC SSP2-4.5 warming trajectories combined with current pollution trends — not a forecast.",
  },
  {
    step: "05",
    title: "Narration generation",
    body: "Each location's narration is AI-generated using Groq (Qwen model) and grounded in live + research metrics. Every claim is traceable to a displayed data point. The narration ends with 3 specific, actionable asks from the river.",
  },
  {
    step: "06",
    title: "Transparency",
    body: "Data sources and update timestamps are shown alongside every reading. Live metrics carry a green 'Live' badge. Research baselines are clearly labelled. Projected values are always marked as scenarios.",
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
