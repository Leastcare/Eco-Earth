/**
 * GET /api/location?id=ganga&era=Today
 *
 * Returns the static LocationReading merged with live Open-Meteo metrics.
 * The temperature metric is replaced with the real current value.
 * Other static metrics (DO, BOD, plastic) remain as research-sourced baselines
 * until live sensor APIs become available for those parameters.
 */

import { NextRequest, NextResponse } from "next/server";
import { getLocationReading, type Era } from "@/data/locations";
import { fetchLiveMetrics } from "@/lib/fetchLiveMetrics";

const VALID_ERAS: Era[] = ["1976", "Today", "2050"];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id  = searchParams.get("id")  ?? "ganga";
  const era = (searchParams.get("era") ?? "Today") as Era;

  if (!VALID_ERAS.includes(era)) {
    return NextResponse.json({ error: "Invalid era" }, { status: 400 });
  }

  // Base static reading
  const base = getLocationReading(id, era);

  // Only fetch live metrics for "Today" — 1976 and 2050 are historical/projected
  if (era !== "Today") {
    return NextResponse.json({ ...base, liveMetrics: null });
  }

  try {
    const live = await fetchLiveMetrics(id);

    // Replace temperature metric with live value
    const metrics = base.metrics.map((m) => {
      if (m.label.toLowerCase().includes("temperature")) {
        const t = live.temperatureC;
        const status =
          t > 30 ? "(High)" :
          t > 26 ? "(Watch)" :
          "(Surface)";
        const statusColor =
          t > 30 ? "high" as const :
          t > 26 ? "moderate" as const :
          "good" as const;
        return { ...m, value: `${t.toFixed(1)} °C`, status, statusColor };
      }
      return m;
    });

    // Build an enriched updatedAt timestamp
    const updatedAt = new Date(live.fetchedAt).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    });

    return NextResponse.json({
      ...base,
      metrics,
      updatedAt,
      source: `${base.source} · ${live.source}`,
      liveMetrics: live,
    });
  } catch (err) {
    console.error("[api/location] live fetch failed:", err);
    // Degrade gracefully — return static data
    return NextResponse.json({ ...base, liveMetrics: null });
  }
}
