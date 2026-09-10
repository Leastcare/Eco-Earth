/**
 * GET /api/og?location=ganga&era=Today
 * Generates a beautiful OG preview image for social sharing.
 * Uses @vercel/og (Edge runtime, no Node canvas needed).
 */

import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getLocationReading, type Era } from "@/data/locations";

export const runtime = "nodejs";

function healthColor(status: string): string {
  if (status === "Critical" || status === "Poor") return "#b23b2e";
  if (status === "Moderate") return "#c4872e";
  return "#4c7a3d";
}

function healthBar(index: number, status: string): string {
  const color = healthColor(status);
  const pct   = `${index}%`;
  return `linear-gradient(to right, ${color} ${pct}, rgba(67,83,58,.12) ${pct})`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const locationId = searchParams.get("location") ?? "ganga";
  const era        = (searchParams.get("era") ?? "Today") as Era;

  const reading = getLocationReading(locationId, era);

  // Pull top 3 metrics
  const top3 = reading.metrics.slice(0, 3);

  const isProjection = reading.updatedAt.toLowerCase().includes("projected");
  const eraLabel =
    era === "1976" ? "50 years ago" :
    era === "2050" ? "2050 projected" :
    "Today";

  const hColor = healthColor(reading.healthStatus);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "#f4efe4",
          fontFamily: "serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Left dark panel */}
        <div style={{
          width: "380px",
          height: "100%",
          background: "#1a2416",
          display: "flex",
          flexDirection: "column",
          padding: "48px 40px",
          justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "28px", fontWeight: 600, color: "#c8bfa0", letterSpacing: "-0.02em" }}>
              EchoEarth
            </span>
            <span style={{ fontSize: "13px", color: "rgba(200,191,160,.5)", fontFamily: "sans-serif" }}>
              Places speak. We listen.
            </span>
          </div>

          {/* Health index */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", color: "rgba(200,191,160,.4)", fontFamily: "sans-serif", textTransform: "uppercase" }}>
              Health Index
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "72px", fontWeight: 700, color: hColor, lineHeight: 1 }}>
                {reading.healthIndex}
              </span>
              <span style={{ fontSize: "28px", color: "rgba(200,191,160,.25)" }}>/100</span>
            </div>
            {/* Bar */}
            <div style={{
              width: "100%", height: "6px", borderRadius: "3px",
              background: healthBar(reading.healthIndex, reading.healthStatus),
            }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: hColor, letterSpacing: "0.1em", fontFamily: "sans-serif", textTransform: "uppercase" }}>
              {reading.healthStatus}
            </span>
          </div>

          {/* Era */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "10px", letterSpacing: "0.15em", color: "rgba(200,191,160,.35)", fontFamily: "sans-serif", textTransform: "uppercase" }}>
              Era
            </span>
            <span style={{ fontSize: "16px", color: "#c8bfa0", fontFamily: "sans-serif" }}>
              {eraLabel}
            </span>
          </div>
        </div>

        {/* Right content panel */}
        <div style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "48px 52px",
          justifyContent: "space-between",
        }}>
          {/* Location header */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em",
              color: "rgba(44,42,36,.4)", fontFamily: "sans-serif", textTransform: "uppercase",
            }}>
              {reading.type} · {reading.subtitle}
            </span>
            <span style={{
              fontSize: "58px", fontWeight: 600, color: "#2c2a24",
              letterSpacing: "-0.03em", lineHeight: 1.0,
            }}>
              {reading.name}
            </span>
            <span style={{ fontSize: "13px", color: "rgba(44,42,36,.45)", fontFamily: "sans-serif" }}>
              {reading.coordinates}
            </span>
          </div>

          {/* Narration excerpt */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#c15a2e", fontFamily: "sans-serif" }}>"</span>
            <span style={{
              fontSize: "18px", color: "#2c2a24", lineHeight: 1.65,
              maxWidth: "560px",
            }}>
              {reading.narration.split(/[.!?]/)[0].trim()}.
            </span>
          </div>

          {/* Metrics */}
          <div style={{ display: "flex", gap: "20px" }}>
            {top3.map((m) => {
              const c = m.statusColor === "high" ? "#b23b2e" : m.statusColor === "moderate" ? "#c4872e" : "#4c7a3d";
              return (
                <div key={m.label} style={{
                  display: "flex", flexDirection: "column", gap: "4px",
                  background: "rgba(67,83,58,.06)", borderRadius: "8px",
                  padding: "12px 16px", minWidth: "150px",
                }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "rgba(44,42,36,.45)", fontFamily: "sans-serif", textTransform: "uppercase" }}>
                    {m.label}
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "#2c2a24" }}>
                    {m.value}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: c }} />
                    <span style={{ fontSize: "11px", fontWeight: 600, color: c, fontFamily: "sans-serif" }}>
                      {m.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={{ fontSize: "11px", color: "rgba(44,42,36,.35)", fontFamily: "sans-serif" }}>
              {isProjection ? "Projected scenario" : `Updated: ${reading.updatedAt}`}
            </span>
            <span style={{ fontSize: "12px", color: "rgba(44,42,36,.3)", fontFamily: "sans-serif" }}>
              echoearth.app
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
