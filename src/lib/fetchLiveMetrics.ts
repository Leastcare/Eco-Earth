/**
 * fetchLiveMetrics.ts
 * Pulls real-time environmental data from 100% free, no-key APIs:
 *   • Open-Meteo Weather  — temperature, precipitation, weather code
 *   • Open-Meteo Air Quality — PM2.5, PM10, European AQI, UV index
 *   • USGS Water Services — stream discharge + temperature (US rivers)
 *
 * Called server-side only (Next.js API routes).
 *
 * DO derivation: uses the Benson–Krause equation for theoretical O₂
 * saturation at the measured temperature, then scales by a pollution
 * multiplier derived from PM2.5 and local health index context.
 */

export type LiveMetrics = {
  temperatureC: number;         // real-time surface / air temperature °C
  precipitationMm: number;      // precipitation in last hour mm
  weatherCode: number;          // WMO weather interpretation code
  weatherDescription: string;   // human-readable weather condition
  pm25: number | null;          // PM2.5 µg/m³ (air quality)
  pm10: number | null;          // PM10 µg/m³
  uvIndex: number | null;       // UV index (0-11+)
  europeanAqi: number | null;   // European AQI (0-500)
  aqiCategory: string | null;   // "Good" | "Fair" | "Moderate" | "Poor" | "Very Poor" | "Extremely Poor"
  dissolvedOxygenMgL: number | null; // derived DO estimate mg/L
  doSource: string;             // how DO was derived
  flowStatus: string | null;    // "Low" | "Normal" | "High" | null (USGS only)
  dischargeM3s: number | null;  // stream discharge m³/s (USGS only)
  fetchedAt: string;            // ISO timestamp
  source: string;               // attribution string
};

// ── WMO weather code → human description ────────────────────────────────────
function describeWeatherCode(code: number): string {
  if (code === 0)   return "Clear sky";
  if (code <= 3)    return "Partly cloudy";
  if (code <= 49)   return "Foggy";
  if (code <= 59)   return "Drizzle";
  if (code <= 69)   return "Rain";
  if (code <= 79)   return "Snow";
  if (code <= 82)   return "Rain showers";
  if (code <= 86)   return "Snow showers";
  if (code <= 99)   return "Thunderstorm";
  return "Unknown";
}

// ── European AQI → category ──────────────────────────────────────────────────
function categoriseAqi(aqi: number): string {
  if (aqi <= 20)  return "Good";
  if (aqi <= 40)  return "Fair";
  if (aqi <= 60)  return "Moderate";
  if (aqi <= 80)  return "Poor";
  if (aqi <= 100) return "Very Poor";
  return "Extremely Poor";
}

/**
 * Benson–Krause dissolved oxygen saturation (mg/L) at temperature T °C.
 * Source: APHA Standard Methods for the Examination of Water.
 * Valid for fresh water at sea level.
 */
function bkDOSaturation(tempC: number): number {
  // Simplified Benson–Krause equation
  const T = tempC + 273.15;
  const lnDO =
    -139.34411 +
    (157570.1 / T) -
    (66423080 / (T * T)) +
    (12438000000 / (T * T * T)) -
    (862194900000 / (T * T * T * T));
  return Math.exp(lnDO);
}

/**
 * Derive an estimated dissolved oxygen value from:
 *  - temperature (physics-based saturation)
 *  - pm2.5 as a proxy for industrial/urban pressure
 *  - a static baseline health factor (0–1) per location
 *
 * This is an environmental estimation, not a sensor reading.
 */
export function estimateDO(
  tempC: number,
  pm25: number | null,
  healthFactor: number, // 0-1 where 1 = pristine
): number {
  const saturation = bkDOSaturation(tempC);
  // PM2.5 > 75 µg/m³ is "Very Unhealthy" — strong proxy for industrial load
  const aqiPenalty = pm25 !== null ? Math.min(pm25 / 200, 0.4) : 0;
  // Health factor is the N-WQI / 100 scaled to a pollution depletion
  const pollutionDepletion = (1 - healthFactor) * 0.5;
  const estimated = saturation * (1 - pollutionDepletion - aqiPenalty);
  return Math.max(0.5, Math.round(estimated * 10) / 10);
}

// ── Open-Meteo Weather (free, no key) ────────────────────────────────────────
export async function fetchOpenMeteo(lat: number, lng: number): Promise<
  Pick<LiveMetrics, "temperatureC" | "precipitationMm" | "weatherCode" | "weatherDescription">
> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,precipitation,weather_code` +
    `&timezone=auto`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`Open-Meteo weather error: ${res.status}`);
  const data = await res.json();
  const cur = data?.current ?? {};
  return {
    temperatureC:       cur.temperature_2m ?? 0,
    precipitationMm:    cur.precipitation  ?? 0,
    weatherCode:        cur.weather_code   ?? 0,
    weatherDescription: describeWeatherCode(cur.weather_code ?? 0),
  };
}

// ── Open-Meteo Air Quality (free, no key) ───────────────────────────────────
export async function fetchAirQuality(lat: number, lng: number): Promise<
  Pick<LiveMetrics, "pm25" | "pm10" | "uvIndex" | "europeanAqi" | "aqiCategory">
> {
  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=pm2_5,pm10,uv_index,european_aqi` +
      `&timezone=auto`;

    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 hr
    if (!res.ok) return { pm25: null, pm10: null, uvIndex: null, europeanAqi: null, aqiCategory: null };
    const data = await res.json();
    const cur = data?.current ?? {};
    const aqi = cur.european_aqi ?? null;
    return {
      pm25:         cur.pm2_5 !== undefined ? Math.round(cur.pm2_5 * 10) / 10 : null,
      pm10:         cur.pm10  !== undefined ? Math.round(cur.pm10  * 10) / 10 : null,
      uvIndex:      cur.uv_index !== undefined ? Math.round(cur.uv_index * 10) / 10 : null,
      europeanAqi:  aqi !== null ? Math.round(aqi) : null,
      aqiCategory:  aqi !== null ? categoriseAqi(aqi) : null,
    };
  } catch {
    return { pm25: null, pm10: null, uvIndex: null, europeanAqi: null, aqiCategory: null };
  }
}

// ── USGS Water Services (free, no key, US rivers only) ───────────────────────
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
    const flowStatus =
      dischargeM3s < 50  ? "Low"  :
      dischargeM3s > 500 ? "High" : "Normal";
    return { flowStatus, dischargeM3s: Math.round(dischargeM3s * 10) / 10 };
  } catch {
    return null;
  }
}

// ── Coordinates + health context + optional USGS site ────────────────────────
type LocationGeo = {
  lat: number;
  lng: number;
  usgsSite?: string;
  /** N-WQI "Today" baseline (0-100) used for DO derivation */
  baselineHealthIndex: number;
};

export const LOCATION_GEO: Record<string, LocationGeo> = {
  ganga:        { lat: 25.2948,  lng: 83.1773,  baselineHealthIndex: 38 },
  yamuna:       { lat: 28.6139,  lng: 77.2090,  baselineHealthIndex: 19 },
  dal:          { lat: 34.0837,  lng: 74.7973,  baselineHealthIndex: 47 },
  chilika:      { lat: 19.7167,  lng: 85.3167,  baselineHealthIndex: 54 },
  brahmaputra:  { lat: 26.1445,  lng: 91.7362,  baselineHealthIndex: 61 },
  periyar:      { lat: 10.0261,  lng: 76.3083,  baselineHealthIndex: 43 },
  lonar:        { lat: 19.9800,  lng: 76.5100,  baselineHealthIndex: 48 },
  wular:        { lat: 34.3500,  lng: 74.5300,  baselineHealthIndex: 39 },
  amazon:       { lat: -3.4653,  lng: -62.2159, baselineHealthIndex: 63 },
  nile:         { lat: 15.5007,  lng: 32.5599,  baselineHealthIndex: 34 },
  thames:       { lat: 51.5074,  lng: -0.1278,  baselineHealthIndex: 55 },
  danube:       { lat: 47.4979,  lng: 19.0402,  baselineHealthIndex: 62 },
  yangtze:      { lat: 30.5928,  lng: 114.3055, baselineHealthIndex: 44 },
  colorado:     { lat: 36.1069,  lng: -112.1129, usgsSite: "09380000", baselineHealthIndex: 58 },
  mekong:       { lat: 18.0,     lng: 102.6,    baselineHealthIndex: 51 },
};

// ── Main export ───────────────────────────────────────────────────────────────
export async function fetchLiveMetrics(locationId: string): Promise<LiveMetrics> {
  const geo = LOCATION_GEO[locationId];
  if (!geo) {
    return {
      temperatureC: 0, precipitationMm: 0, weatherCode: 0,
      weatherDescription: "Unknown", pm25: null, pm10: null,
      uvIndex: null, europeanAqi: null, aqiCategory: null,
      dissolvedOxygenMgL: null, doSource: "unavailable",
      flowStatus: null, dischargeM3s: null,
      fetchedAt: new Date().toISOString(),
      source: "No geo data available",
    };
  }

  const [meteo, airQuality, usgs] = await Promise.all([
    fetchOpenMeteo(geo.lat, geo.lng),
    fetchAirQuality(geo.lat, geo.lng),
    geo.usgsSite ? fetchUSGS(geo.usgsSite) : Promise.resolve(null),
  ]);

  // Derive dissolved oxygen from real temperature + air quality data
  const healthFactor = geo.baselineHealthIndex / 100;
  const dissolvedOxygenMgL = estimateDO(meteo.temperatureC, airQuality.pm25, healthFactor);
  const doSource = airQuality.pm25 !== null
    ? "Derived from live temperature (Benson-Krause) + PM2.5 proxy"
    : "Derived from live temperature (Benson-Krause equation)";

  const sourceParts = ["Open-Meteo Weather", "Open-Meteo Air Quality"];
  if (geo.usgsSite && usgs) sourceParts.push("USGS Water Services");

  return {
    ...meteo,
    ...airQuality,
    dissolvedOxygenMgL,
    doSource,
    flowStatus:   usgs?.flowStatus   ?? null,
    dischargeM3s: usgs?.dischargeM3s ?? null,
    fetchedAt:    new Date().toISOString(),
    source:       sourceParts.join(" · "),
  };
}
