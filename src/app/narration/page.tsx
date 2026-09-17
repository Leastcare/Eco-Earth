import type { Metadata } from "next";
import { Suspense } from "react";
import NarrationExperience from "@/components/NarrationExperience";
import { getLocationReading } from "@/data/locations";
import type { Era } from "@/data/locations";

type Props = { searchParams: Promise<{ location?: string; era?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const locationId = params.location ?? "ganga";
  const era = (params.era ?? "Today") as Era;
  const validEras: Era[] = ["1976", "Today", "2050"];
  const safeEra = validEras.includes(era) ? era : "Today";

  let reading;
  try {
    reading = getLocationReading(locationId, safeEra);
  } catch {
    reading = getLocationReading("ganga", "Today");
  }

  const eraLabel =
    safeEra === "1976" ? "50 years ago" :
    safeEra === "2050" ? "2050 scenario" :
    "Today";

  const title = `${reading.name} — ${eraLabel} | EchoEarth`;
  const description = `${reading.name} is speaking. Health index: ${reading.healthIndex}/100 (${reading.healthStatus}). ${reading.narration.split(/[.!?]/)[0].trim()}.`;

  const ogUrl = `/api/og?location=${locationId}&era=${safeEra}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${reading.name} health status` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default function NarrationPage() {
  return (
    <Suspense>
      <NarrationExperience />
    </Suspense>
  );
}
