/**
 * GET /api/location?id=ganga&era=Today
 *
 * Returns a LocationReading enriched with live data from:
 *   - Open-Meteo Weather (temperature, precipitation, weather)
 *   - Open-Meteo Air Quality (PM2.5, PM10, AQI, UV)
 *   - Derived dissolved oxygen (Benson-Krause + PM2.5 proxy)
 *   - USGS Water Services for US rivers (discharge)
 *
 * Historical (1976) and projected (2050) eras return static data only.
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

  const base = getLocationReading(id, era);

  // Historical and projected eras use curated research data only
  if (era !== "Today") {
    return NextResponse.json({ ...base, liveMetrics: null });
  }

  try {
    const live = await fetchLiveMetrics(id);

    // Enrich metrics with all available live values
    const metrics = base.metrics.map((m) => {
      const label = m.label.toLowerCase();

      // Temperature — live from Open-Meteo
      if (label.includes("temperature")) {
        const t = live.temperatureC;
        return {
          ...m,
          value: `${t.toFixed(1)} °C`,
          status: t > 30 ? "(High — Heat Stress)" : t > 26 ? "(Watch)" : "(Surface)",
          statusColor: (t > 30 ? "high" : t > 26 ? "moderate" : "good") as typeof m.statusColor,
          live: true,
        };
      }

      // Dissolved Oxygen — derived from live temperature + PM2.5
      if (label.includes("oxygen") && live.dissolvedOxygenMgL !== null) {
        const do_ = live.dissolvedOxygenMgL;
        return {
          ...m,
          value: `${do_} mg/L`,
          status: do_ < 2 ? "Critical" : do_ < 4 ? "Low" : do_ < 6 ? "Watch" : "Good",
          statusColor: (do_ < 2 ? "high" : do_ < 4 ? "high" : do_ < 6 ? "moderate" : "good") as typeof m.statusColor,
          live: true,
        };
      }

      // pH — if precipitation is high, slight acidification proxy
      if (label.includes("ph") && live.precipitationMm > 5) {
        // Heavy rainfall slightly lowers surface pH — minor adjustment only
        const basePh = parseFloat(m.value.replace(/[^0-9.]/g, "")) || 7.5;
        const adjusted = Math.round((basePh - 0.1) * 10) / 10;
        return { ...m, value: adjusted.toFixed(1) };
      }

      return m;
    });

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
    return NextResponse.json({ ...base, liveMetrics: null });
  }
}
