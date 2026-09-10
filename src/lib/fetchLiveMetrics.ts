/**
 * fetchLiveMetrics.ts
 * Pulls real-time environmental data from free, no-key APIs:
 *   • Open-Meteo  — surface temperature, precipitation, weather code
 *   • USGS Water  — stream discharge + temperature for US gauges (optional)
 *
 * Called server-side only (Next.js API routes).
 */

export type LiveMetrics = {
  temperatureC: number;         // current surface / air temperature °C
  precipitationMm: number;      // precipitation in last hour mm
  weatherCode: number;          // WMO weather interpretation code
  weatherDescription: string;   // human-readable weather condition
  flowStatus: string | null;    // "Low" | "Normal" | "High" | null (USGS only)
  dischargeM3s: number | null;  // stream discharge m³/s (USGS only)
  fetchedAt: string;            // ISO timestamp
  source: string;               // attribution string
};

// ── WMO weather code → human description ────────────────────────────────────
function describeWeatherCode(code: number): string {
  if (code === 0)               return "Clear sky";
  if (code <= 3)                return "Partly cloudy";
  if (code <= 49)               return "Foggy";
  if (code <= 59)               return "Drizzle";
  if (code <= 69)               return "Rain";
  if (code <= 79)               return "Snow";
  if (code <= 82)               return "Rain showers";
  if (code <= 86)               return "Snow showers";
  if (code <= 99)               return "Thunderstorm";
  return "Unknown";
}

// ── Open-Meteo (free, no key) ────────────────────────────────────────────────
export async function fetchOpenMeteo(
  lat: number,
  lng: number,
): Promise<Pick<LiveMetrics, "temperatureC" | "precipitationMm" | "weatherCode" | "weatherDescription">> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,precipitation,weather_code` +
    `&timezone=auto`;

  const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

  const data = await res.json();
  const current = data?.current ?? {};

  return {
    temperatureC:        current.temperature_2m     ?? 0,
    precipitationMm:     current.precipitation       ?? 0,
    weatherCode:         current.weather_code        ?? 0,
    weatherDescription:  describeWeatherCode(current.weather_code ?? 0),
  };
}

// ── USGS Water Services (free, no key, US only) ──────────────────────────────
// Pass a USGS site number; returns null if site unavailable.
export async function fetchUSGS(
  siteNo: string,
): Promise<Pick<LiveMetrics, "flowStatus" | "dischargeM3s"> | null> {
  try {
    const url =
      `https://waterservices.usgs.gov/nwis/iv/` +
      `?format=json&sites=${siteNo}&parameterCd=00060,00010&siteStatus=active`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const series: unknown[] = data?.value?.timeSeries ?? [];

    let dischargeCfs: number | null = null;

    for (const s of series as Record<string, unknown>[]) {
      const variable = s.variable as Record<string, unknown> | undefined;
      const code = (variable?.variableCode as { value?: string }[] | undefined)?.[0]?.value;
      if (code === "00060") {
        const values = (s.values as { value?: { value?: string }[] }[] | undefined)?.[0]?.value ?? [];
        const latest = values[values.length - 1]?.value;
        if (latest) dischargeCfs = parseFloat(latest);
      }
    }

    if (dischargeCfs === null) return null;

    const dischargeM3s = dischargeCfs * 0.0283168;

    // Simple classification: below 50 m³/s = low, above 500 = high
    const flowStatus =
      dischargeM3s < 50 ? "Low" :
      dischargeM3s > 500 ? "High" :
      "Normal";

    return { flowStatus, dischargeM3s: Math.round(dischargeM3s * 10) / 10 };
  } catch {
    return null;
  }
}

// ── Coordinates + optional USGS site per location ────────────────────────────
type LocationGeo = {
  lat: number;
  lng: number;
  usgsSite?: string; // only for US rivers
};

export const LOCATION_GEO: Record<string, LocationGeo> = {
  ganga:        { lat: 25.2948,  lng: 83.1773  },
  yamuna:       { lat: 28.6139,  lng: 77.2090  },
  dal:          { lat: 34.0837,  lng: 74.7973  },
  chilika:      { lat: 19.7167,  lng: 85.3167  },
  brahmaputra:  { lat: 26.1445,  lng: 91.7362  },
  periyar:      { lat: 10.0261,  lng: 76.3083  },
  lonar:        { lat: 19.9800,  lng: 76.5100  },
  wular:        { lat: 34.3500,  lng: 74.5300  },
  // world rivers (for future expansion)
  amazon:       { lat: -3.4653,  lng: -62.2159 },
  nile:         { lat: 15.5007,  lng: 32.5599  },
  thames:       { lat: 51.5074,  lng: -0.1278  },
  danube:       { lat: 47.4979,  lng: 19.0402  },
  yangtze:      { lat: 30.5928,  lng: 114.3055 },
  colorado:     { lat: 36.1069,  lng: -112.1129, usgsSite: "09380000" },
  mekong:       { lat: 18.0,     lng: 102.6    },
};

// ── Main export ───────────────────────────────────────────────────────────────
export async function fetchLiveMetrics(locationId: string): Promise<LiveMetrics> {
  const geo = LOCATION_GEO[locationId];

  if (!geo) {
    return {
      temperatureC: 0,
      precipitationMm: 0,
      weatherCode: 0,
      weatherDescription: "Unknown",
      flowStatus: null,
      dischargeM3s: null,
      fetchedAt: new Date().toISOString(),
      source: "No geo data available",
    };
  }

  const [meteo, usgs] = await Promise.all([
    fetchOpenMeteo(geo.lat, geo.lng),
    geo.usgsSite ? fetchUSGS(geo.usgsSite) : Promise.resolve(null),
  ]);

  return {
    ...meteo,
    flowStatus:    usgs?.flowStatus    ?? null,
    dischargeM3s:  usgs?.dischargeM3s  ?? null,
    fetchedAt:     new Date().toISOString(),
    source:        geo.usgsSite
      ? "Open-Meteo · USGS Water Services"
      : "Open-Meteo",
  };
}
