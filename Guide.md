# EchoEarth — Complete Interview Prep Guide

> Read this like a story, not a textbook. Everything is explained simply.
> By the end you should be able to explain every line of this project confidently.

---

## PART 1 — THE BRIEF (30-second pitch)

**EchoEarth is a website where rivers and lakes speak in their own voice.**

You pick a location — say, the Ganga River. The app fetches real environmental data (actual temperature, air quality, dissolved oxygen). Then an AI writes a narration *as if the river is talking to you*. You can also listen to it being read aloud, see how the river looked in 1976, how it looks today, and what it might look like in 2050.

There are 15 locations worldwide. You can write a letter to a river and it writes back. You can save readings to a journal. There is an interactive map.

**The problem it solves:** Environmental data is boring and nobody reads it. This app makes it emotional and personal so people actually care.

**Built for:** NextStep Hacks 2026 — Earth Forward hackathon (environmental technology theme).

---

## PART 2 — DETAILED EXPLANATION

### How the whole app is structured

Think of the app like a newspaper with different sections:

```
/ (homepage)          → redirects to /narration
/narration            → the main page — river speaks, you listen
/map                  → map of all 15 rivers with health pins
/journal              → your saved readings
/letters              → letters you wrote to rivers
/about                → data sources and methodology
```

Everything is built with **Next.js** — a framework that runs React on top but also has a backend (API routes) built in. So the same codebase handles both the website AND the server.

---

### The Data Flow — How a page actually loads

This is the most important thing to understand. Here is exactly what happens when you open `/narration` and pick "Ganga River, Today":

```
1. Browser loads the page
2. NarrationExperience component mounts
3. It calls GET /api/location?id=ganga&era=Today
4. That API route calls THREE external APIs in parallel:
      - Open-Meteo Weather → gets temperature, weather
      - Open-Meteo Air Quality → gets PM2.5, PM10, AQI
      - (USGS for US rivers only)
5. It derives dissolved oxygen using the Benson-Krause formula
6. It merges live data into the static location data
7. Returns enriched JSON to the browser
8. The browser now has real metrics
9. It then calls POST /api/narration (streaming)
10. That API calls Groq AI with the real metrics
11. AI writes a narration in the river's voice
12. Words stream back word-by-word (like ChatGPT typing)
13. The page shows it live as it arrives
14. User can press Play → calls POST /api/tts
15. ElevenLabs turns the narration into audio
16. Audio plays in the browser
```

---

### File by file — What each file does

#### `src/data/locations.ts`
This is the brain of the project. It's a big TypeScript object that stores curated data for all 15 rivers across 3 time periods.

```typescript
// The data structure looks like this:
LOCATION_READINGS = {
  ganga: {
    "1976": { healthIndex: 71, metrics: [...], narration: "..." },
    "Today": { healthIndex: 38, metrics: [...], narration: "..." },
    "2050":  { healthIndex: 22, metrics: [...], narration: "..." },
  },
  yamuna: { ... },
  // 13 more rivers...
}
```

Each era has:
- `healthIndex` — a number from 0 to 100 (higher = healthier)
- `healthStatus` — "Good", "Moderate", "Poor", or "Critical"
- `metrics` — array of things like temperature, dissolved oxygen, plastic load
- `narration` — a static fallback text if the AI is unavailable
- `trend` — an array of 8 numbers used to draw the chart

**Why three eras?** Because seeing the change over time (1976 → Today → 2050) is what makes the story powerful. 1976 data comes from historical records. Today comes from monitoring agencies like CPCB. 2050 is an IPCC climate scenario — not a prediction, a warning.

---

#### `src/lib/fetchLiveMetrics.ts`
This file fetches real-time data. It runs on the **server** (not in the browser).

**Three APIs it calls — all free, no signup needed:**

**1. Open-Meteo Weather** (`api.open-meteo.com`)
- Gives: temperature, precipitation, weather code
- How: pass latitude + longitude, get JSON back
- Cached for 30 minutes (`next: { revalidate: 1800 }`)

**2. Open-Meteo Air Quality** (`air-quality-api.open-meteo.com`)
- Gives: PM2.5 (fine particles), PM10 (coarse particles), UV index, European AQI
- Cached for 1 hour

**3. USGS Water Services** (only for Colorado River)
- Gives: actual stream discharge in cubic feet per second
- Parameter code `00060` = discharge, `00010` = temperature
- Converts cubic feet/sec to cubic metres/sec (multiply by 0.0283168)

**The clever part — Dissolved Oxygen estimation:**

Dissolved oxygen (DO) is how much oxygen is dissolved in water. Fish need it. If it's too low, the river is dying. We don't have a free real-time DO sensor API, so we calculate it using real science:

```
Step 1: Get the theoretical maximum DO at this temperature
        (using the Benson-Krause equation — standard water chemistry)

Step 2: Reduce it based on how polluted the location is
        (using PM2.5 as a proxy for industrial pressure)

Step 3: Reduce it further based on the research baseline health index
```

The Benson-Krause equation:
```typescript
function bkDOSaturation(tempC: number): number {
  const T = tempC + 273.15;  // convert to Kelvin
  const lnDO =
    -139.34411 +
    (157570.1 / T) -
    (66423080 / (T * T)) +
    (12438000000 / (T * T * T)) -
    (862194900000 / (T * T * T * T));
  return Math.exp(lnDO);
}
```
This looks scary but it's just a physics formula that says: cold water holds more oxygen than warm water. At 10°C, water can hold ~11 mg/L. At 30°C, only ~7.5 mg/L.

Then:
```typescript
function estimateDO(tempC, pm25, healthFactor) {
  const saturation = bkDOSaturation(tempC);   // max possible
  const aqiPenalty = pm25 / 200;              // industrial pressure
  const pollutionDepletion = (1 - healthFactor) * 0.5;  // baseline damage
  return saturation * (1 - pollutionDepletion - aqiPenalty);
}
```

The `Promise.all()` call runs all three API requests at the same time, not one after another — so the total wait time is the slowest one, not all three added together:
```typescript
const [meteo, airQuality, usgs] = await Promise.all([
  fetchOpenMeteo(geo.lat, geo.lng),
  fetchAirQuality(geo.lat, geo.lng),
  fetchUSGS(geo.usgsSite),
]);
```

---

#### `src/app/api/location/route.ts`
This is a Next.js API route — it's a backend endpoint. When the browser calls `GET /api/location?id=ganga&era=Today`, this file handles it.

What it does:
1. Gets the static data from `locations.ts`
2. If era is "Today", calls `fetchLiveMetrics()`
3. Replaces the static temperature and DO metrics with live values
4. Returns everything as JSON

The `live: true` flag is what makes the green "Live" badge appear in the UI:
```typescript
return {
  ...m,
  value: `${t.toFixed(1)} °C`,
  live: true,  // ← this tells the UI to show the Live badge
}
```

---

#### `src/app/api/narration/route.ts`
This calls the **Groq AI** to generate a new narration every time, based on real data.

How the prompt is built:
- It tells the AI "You are [River Name], a body of water in [location]"
- It passes the real metrics (temperature, DO, plastic load, etc.)
- It gives tone instructions based on the era (joyful for 1976, tired for Today, urgent for 2050)
- It tells the AI to end with 3 specific actions the reader can take

**Streaming** — why words appear one at a time:
```typescript
// Groq sends the response as a stream of chunks
// Each chunk is a Server-Sent Event like: data: {"choices":[{"delta":{"content":"I"}}]}
// We parse each chunk and immediately send the word to the browser
// This is why text appears word by word, not all at once
```

The code reads the stream:
```typescript
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  for (const line of decoder.decode(value).split("\n")) {
    const token = JSON.parse(line.slice(6))?.choices?.[0]?.delta?.content;
    if (token) await writer.write(encoder.encode(token));
  }
}
```

---

#### `src/app/api/letter-reply/route.ts`
Same pattern as narration, but now the AI is replying to a letter the user wrote.

The clever part of the prompt:
```
"Read their letter carefully. Pick out something specific they said
and respond to it directly — like a real conversation, not a speech."
```

It also passes the worst metrics to the AI:
```typescript
const criticalMetrics = metrics.filter(m => m.statusColor === "high");
```
So the river's reply is emotionally grounded in its actual suffering, not generic.

---

#### `src/app/api/tts/route.ts`
Calls ElevenLabs to turn text into speech.

The cultural voice assignment — rivers have different genders in different cultures:
```typescript
const MALE_RIVERS = new Set([
  "brahmaputra",  // male in Hindu tradition
  "amazon",       // masculine in Portuguese
  "nile",         // masculine in Arabic
  "colorado",     // masculine in Spanish
  "yangtze",      // masculine in Chinese
]);
// Everything else gets the female voice (Matilda — warm, audiobook style)
```

Text is capped at 420 characters (first 2 paragraphs) to stay within the free tier limit.

---

#### `src/components/EchoEarthShell.tsx`
This is the **global state manager** using React Context.

Think of it like a backpack that every page carries — it holds:
- `locationId` — which river is selected ("ganga", "yamuna", etc.)
- `era` — which time period ("1976", "Today", "2050")
- `journalEntries` — saved snapshots
- `letters` — sent letters

Everything is saved to `localStorage` so it persists when you close the tab:
```typescript
function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
```

The `useEchoEarth()` hook is how any component accesses this state:
```typescript
const { locationId, setLocationId, era } = useEchoEarth();
```

---

#### `src/components/NarrationExperience.tsx`
The biggest file (~1200 lines). This is the main page component.

**Key states:**
```typescript
const [liveReading, setLiveReading]         // enriched data from /api/location
const [liveNarration, setLiveNarration]     // text streaming from /api/narration
const [narrationLoading, setNarration...]   // true while AI is writing
const [locationLoading, setLocationLoading] // true while /api/location fetches
const [playing, setPlaying]                 // is TTS audio playing?
const [ambientOn, setAmbientOn]             // is river sound on?
```

**The fetch effect** — runs every time `locationId` or `era` changes:
```typescript
useEffect(() => {
  // 1. Stop any playing audio
  // 2. Clear old narration
  // 3. Abort previous fetch (AbortController)
  // 4. Fetch /api/location → get live metrics
  // 5. Fetch /api/narration → stream the narration
}, [locationId, era]);
```

The `AbortController` is important — if the user switches rivers quickly, it cancels the old request so you don't get two narrations overlapping:
```typescript
const abort = new AbortController();
abortRef.current = abort;
// ...later if user switches:
abortRef.current?.abort(); // cancels the in-flight request
```

**TakeAction component** — parses the last paragraph of the narration into 3 action items:
```typescript
function parseActionItems(narrationText) {
  const paras = narrationText.split(/\n\n+/);
  const lastPara = paras[paras.length - 1];
  // Try to find numbered items (1. ..., 2. ...)
  // Otherwise split by sentence
  return sentences.slice(0, 3);
}
```

**The skeleton loader** — shows animated grey bars while data loads instead of blank screen:
```typescript
{locationLoading ? <NarrationSkeleton /> : <NarrationHero ... />}
```

---

#### `src/components/LeafletMap.tsx`
An interactive map using the Leaflet library.

Important: Leaflet needs the DOM (the browser), so it can't run on the server. That's why it's imported with `dynamic(..., { ssr: false })` — tells Next.js: don't try to render this on the server.

```typescript
// Custom colored pins
function makePinIcon(color, active, L) {
  const size = active ? 36 : 28;  // active pin is bigger
  return L.divIcon({ html: `<div style="...border: ${size}px solid ${color}">` });
}
```

When you click a pin, the map flies to it smoothly:
```typescript
map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 4), { duration: 0.8 });
```

---

#### `src/components/NavSidebar.tsx`
Shared navigation sidebar used by all pages.

Uses `usePathname()` to know which page you're on and highlight the right link:
```typescript
const pathname = usePathname();
// ...
className={pathname === route ? "bg-forest/8 text-forest" : "text-ink/55"}
```

Before this, the same navigation code was copy-pasted 4 times. Now it's one file.

---

#### `src/app/api/og/route.tsx`
Generates the preview image you see when you share a link on WhatsApp or Twitter.

Uses `@vercel/og` which generates a PNG image from JSX at request time. The image shows the river name, health index with a colored progress bar, and the first sentence of the narration.

---

#### `src/components/SplashScreen.tsx`
The intro screen that shows when you first open the app.

```
"The glaciers are speaking."
"The rivers remember."
"The lakes are listening."
"Are you?"
```

Stored in `sessionStorage` so it only shows once per browser session:
```typescript
if (sessionStorage.getItem("echoearth:splash")) {
  onDone(); return; // skip it
}
```

---

#### `src/app/layout.tsx`
The root layout that wraps every page. Sets up:
- Google Fonts (Fraunces for display, Inter for UI, Caveat for handwriting)
- `EchoEarthProvider` — global state
- `AppShell` — handles the splash screen
- SEO metadata — title, description, OG image tags

---

### The styling system

Tailwind CSS v4 is used. Custom colors are defined in `globals.css`:
```css
--color-forest:       #43533a  /* dark green */
--color-sage:         #6e7c5c  /* medium green */
--color-rust:         #c15a2e  /* orange-red */
--color-ink:          #2c2a24  /* near black */
--color-paper:        #f4efe4  /* warm cream background */
--color-statusGood:   #4c7a3d  /* green */
--color-statusModerate: #c4872e /* orange */
--color-statusHigh:   #b23b2e  /* red */
```

The design theme is "old paper / nature journal" — cream backgrounds, botanical SVG decorations, handwritten fonts, washi tape CSS decorations.

---

### What "streaming" means and why it matters

Normal API: Browser asks → Server thinks → Server answers → Browser shows everything at once.

Streaming API: Browser asks → Server starts answering immediately → Browser shows each word as it arrives.

For AI responses this matters because generating text takes 3-5 seconds. With streaming, the user sees the first word in ~0.5 seconds instead of staring at a blank screen for 4 seconds.

In code, streaming works through `ReadableStream` and `TransformStream`:
```typescript
// Server side: create a stream, write to it in the background
const { readable, writable } = new TransformStream();
const writer = writable.getWriter();

(async () => {
  // background: read from Groq, write to our stream
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    await writer.write(value);  // send chunk to browser immediately
  }
  await writer.close();
})();

return new Response(readable);  // browser gets a stream, not a full response
```

```typescript
// Browser side: read chunks as they arrive
const reader = res.body.getReader();
let acc = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  acc += decoder.decode(value, { stream: true });
  setLiveNarration(acc);  // update UI with each new chunk
}
```

---

## PART 3 — INTERVIEW QUESTIONS

---

### 🟢 LOW LEVEL (Beginner / First-year student)

**1. What is EchoEarth?**
EchoEarth is a website that gives rivers and lakes a voice using real environmental data and AI. You can pick any of 15 water bodies, see their health data, listen to an AI narration spoken from the river's perspective, and write letters to them.

**2. What language/framework did you use?**
TypeScript and React, inside Next.js 16. Next.js is a framework that gives you both a frontend (what users see) and a backend (API routes) in one project. I used Tailwind CSS for styling and Framer Motion for animations.

**3. What does API mean and how did you use it?**
API stands for Application Programming Interface — it's a way for one program to ask another program for data. I used:
- Open-Meteo API for real weather and air quality data
- Groq API for AI text generation
- ElevenLabs API for text-to-speech
- USGS API for river flow data in the US

**4. What is the difference between frontend and backend?**
Frontend is what runs in the browser — the buttons, text, animations. Backend is what runs on the server — fetching data, calling AI, keeping secrets like API keys. In this project the pages are frontend, the `/api/` routes are backend.

**5. What is React state?**
State is data that can change and, when it changes, causes the UI to update. For example, `playing` state tracks whether audio is playing — when it changes to `true`, the play button shows a pause icon.

**6. Why did you choose this project for the hackathon?**
The hackathon theme was "Earth Forward" — environmental technology. I wanted to do something that made people emotionally connect with environmental data instead of just reading numbers. Giving rivers a voice was a way to make data feel personal.

**7. What is `localStorage`?**
It's storage built into the browser that survives page refreshes and closing the tab. I used it to save journal entries and letters so users don't lose them.

**8. What does `async/await` do?**
It's a way to handle things that take time (like fetching data from the internet) without freezing the page. `await` says "wait for this to finish before moving on", and `async` marks a function that uses `await`.

**9. What is TypeScript?**
TypeScript is JavaScript with types. Types let you say "this variable must be a number" or "this object must have a `name` property". It catches mistakes before the code even runs.

**10. How does the map work?**
It uses a library called Leaflet. I give it coordinates (latitude + longitude) for each river, and it places a colored pin on the map. Green pin = healthy river, red pin = critical. Clicking a pin selects that location.

---

### 🟡 MID LEVEL (Internship / Junior developer)

**11. Explain the data flow from user selecting a river to seeing the narration.**
1. User picks "Ganga" from the search or map
2. `setLocationId("ganga")` updates global state in `EchoEarthShell`
3. `NarrationExperience` detects the change via `useEffect([locationId, era])`
4. It calls `GET /api/location?id=ganga&era=Today`
5. The API route calls `fetchLiveMetrics("ganga")` which runs 3 API calls in parallel via `Promise.all()`
6. Live temperature and derived DO replace static values in the metrics array
7. Enriched JSON returns to the browser
8. Browser then calls `POST /api/narration` with those metrics
9. Groq streams back the AI narration word by word
10. The UI updates `liveNarration` state on every chunk received

**12. Why do you use `Promise.all()` instead of `await` three times?**
If I `await` each call one after another, I'd wait for Open-Meteo Weather → then Open-Meteo Air Quality → then USGS. That could be 3 × 500ms = 1.5 seconds. With `Promise.all()` all three start simultaneously and I only wait for the slowest one — maybe 600ms total.

**13. What is the Benson-Krause equation and why did you use it?**
It's a published scientific formula (APHA Standard Methods for water chemistry) that calculates the theoretical maximum dissolved oxygen a body of water can hold at a given temperature. Cold water holds more oxygen; warm water holds less. I use it because there's no free live DO sensor API, so I derive an estimate from the live temperature + air quality data. It's scientifically defensible — I can point to a real source.

**14. What is streaming and how does it work in your API routes?**
Instead of waiting for the full AI response to generate before sending anything to the browser, I pipe each chunk as it arrives. The server creates a `TransformStream`, passes the `readable` end as the HTTP response body, and writes chunks to the `writable` end in a background async loop. The browser reads from `res.body.getReader()` and updates state on every chunk, so text appears word by word.

**15. What is `AbortController` and why do you need it?**
When a user switches rivers quickly, there might be an in-flight request for the old river. Without aborting it, the response could arrive late and overwrite the new river's narration. `AbortController` lets you cancel a `fetch()` call. I store the controller in a ref (`abortRef`) and call `.abort()` at the start of every new location switch.

**16. Explain React Context and why you used it.**
React Context lets you share state across many components without passing props through every level. I have `EchoEarthShell.tsx` which wraps the whole app and stores `locationId`, `era`, journal entries, and letters. Any component anywhere can call `useEchoEarth()` to read or update this state — the map, the narration page, the journal, the letters page all share the same selected location.

**17. What is `next: { revalidate: 1800 }` in the fetch calls?**
Next.js has a built-in cache for `fetch()` calls on the server. `revalidate: 1800` means "cache this response for 1800 seconds (30 minutes), then refetch". This means if 100 users look at Ganga at the same time, Open-Meteo is only called once per 30 minutes, not 100 times. This prevents rate limiting and makes the app faster.

**18. Why is Leaflet imported with `dynamic(..., { ssr: false })`?**
Leaflet uses `window`, `document`, and the DOM — things that only exist in a browser. Next.js renders pages on the server first (SSR). If Leaflet tried to run on the server it would crash because those browser APIs don't exist there. `ssr: false` tells Next.js: skip this component during server rendering, only render it in the browser.

**19. What is the health index and how is it calculated?**
The N-WQI (National Water Quality Index) is a real index used by India's CPCB. It aggregates dissolved oxygen, biological oxygen demand, pH, temperature, and biological diversity into a 0-100 score. I curated the values from government reports. The app shows it as a ring chart — the filled arc is proportional to the score.

**20. How does the letter reply work end-to-end?**
1. User types a letter and clicks Send
2. Browser POSTs to `/api/letter-reply` with the letter text, location name, and current metrics
3. The route builds a prompt: "You are [River]. [User] has written you a letter. Read it, reply to something specific they said, mention your worst metrics, end with one concrete ask."
4. Groq streams the reply back
5. Browser reads the stream and appends each word to `response` state
6. When done, the letter + reply is saved to `EchoEarthShell` letters state and `localStorage`

**21. What is `sessionStorage` and how is it different from `localStorage`?**
Both store data in the browser. `localStorage` persists forever (until cleared). `sessionStorage` only lasts for the current browser tab session — close the tab, it's gone. I use `sessionStorage` for the splash screen so it shows once per session, not once ever.

**22. How does the OG image work?**
`/api/og` is an API route that uses `@vercel/og` to render JSX as a 1200×630 PNG image at request time. When someone shares a link like `/narration?location=ganga&era=Today`, social platforms fetch this URL and show the preview card. The `generateMetadata()` function in `narration/page.tsx` sets the `og:image` meta tag dynamically based on the URL params.

**23. How do you handle API failures gracefully?**
Multiple layers:
- `fetchAirQuality` is wrapped in try/catch and returns `null` values on failure — the app still works, just without AQI data
- `fetchUSGS` returns `null` if the site is unavailable
- `/api/location` has a top-level try/catch — if live data fails, it returns the static data with `liveMetrics: null`
- The narration shows the static fallback text if the AI call fails
- TTS shows an error toast but doesn't break the page

**24. What is `useRef` and why do you use it for the abort controller and audio?**
`useRef` stores a value that persists across renders but doesn't trigger a re-render when it changes. I use it for:
- `abortRef` — the abort controller (I don't need the UI to re-render when I create a new one)
- `audioRef` — the HTMLAudioElement (same reason — audio state lives outside React's render cycle)
- `mapRef` — the Leaflet map instance (Leaflet manages its own DOM)

---

### 🔴 HIGH LEVEL (Senior developer / Technical deep-dive)

**25. Why did you choose Groq over OpenAI?**
Groq has a free tier with extremely fast inference — their LPU (Language Processing Unit) hardware is significantly faster than GPU-based inference. For a hackathon demo where I need responses to stream quickly, Groq's speed is a better user experience. The Qwen 3 model I used also handles the poetic, first-person narration style well. OpenAI's free tier is more restricted.

**26. Walk me through how you'd extend this to add a new location.**
1. Add an entry to `LOCATION_READINGS` in `locations.ts` with all three eras of data
2. Add coordinates to `LOCATION_GEO` in `fetchLiveMetrics.ts` with a `baselineHealthIndex`
3. Add coordinates to `PIN_GEO` in `map/page.tsx`
4. Optionally add the location to the `indian` or `world` array in the map page

The health index and metrics for the new location need to be researched from official sources for credibility.

**27. What are the limitations of your dissolved oxygen estimation?**
It's an estimation, not a measurement. The Benson-Krause equation gives theoretical saturation in clean fresh water at sea level. Real rivers have:
- Elevation (higher altitude = lower atmospheric pressure = less DO)
- Salinity (brackish water holds less DO — relevant for Chilika lagoon)
- Biological oxygen demand consuming DO
- Turbulence adding DO

My PM2.5 proxy for industrial pressure is a correlation, not a causation. PM2.5 is airborne particulate matter — it correlates with industrial zones, which also dump into rivers, but it's indirect. For a production system, you'd want actual in-water DO sensors. I label the metric clearly with its derivation method so no one is misled.

**28. How does your caching strategy work and what are its trade-offs?**
- Weather data: `revalidate: 1800` (30 min cache in Next.js data cache)
- Air quality: `revalidate: 3600` (1 hr)
- USGS: `revalidate: 3600` (1 hr)
- AI narration: no cache — generated fresh every visit

Trade-off: Caching reduces API calls and load time but means data can be up to 30-60 minutes stale. For temperature and AQI this is acceptable — river conditions don't change meaningfully in 30 minutes. The narration not being cached means each user gets a slightly different, fresh narration, which is better UX (it feels alive) but costs more Groq tokens.

For a production system I'd add Redis caching per location+era combination and invalidate on schedule.

**29. Explain the state management architecture and why you chose Context over something like Redux.**
The app state is simple and has a clear single owner — one selected location, one era, journal entries, letters. There's no complex derived state, no optimistic updates, no server state syncing. React Context is sufficient and avoids a dependency. Redux would add boilerplate for no benefit at this scale.

The one downside of Context is that any component subscribing to `useEchoEarth()` re-renders when any part of the context changes. I mitigated this with `useMemo` for the `location` reading so it only recomputes when `locationId` or `era` changes:
```typescript
const location = useMemo(
  () => getLocationReading(locationId, era),
  [locationId, era]
);
```

**30. How does the streaming architecture handle backpressure?**
My current implementation reads Groq's stream and immediately writes to the `TransformStream` writer without explicit backpressure handling. If the browser is slow to consume the stream, Node's stream internals handle buffering, but I don't apply explicit flow control. In a production system with many concurrent users, you'd want to check `writer.desiredSize` and pause writing when the buffer is full to avoid memory pressure. For a hackathon demo with light traffic, this is fine.

**31. What security considerations does your API have?**
- API keys are in server-side environment variables only — never exposed to the browser
- User letter content is passed directly to Groq — in production you'd want input sanitisation to prevent prompt injection
- No authentication — all endpoints are public. A malicious user could spam `/api/narration` and exhaust Groq credits. Rate limiting (e.g., with Vercel Edge Config or Upstash Redis) would be needed for production
- The `/api/og` endpoint takes a `location` query param — I call `getLocationReading()` which will throw if the location is invalid. I wrap it in try/catch and fall back to Ganga, so there's no crash but also no validation error — this could be more explicit

**32. How would you make this production-ready?**
1. **Rate limiting** — Upstash Redis + `@upstash/ratelimit` on AI API routes
2. **Real DO sensor data** — partner with water monitoring agencies or use CPCB's real-time API (requires registration)
3. **Database** — move journal and letters from `localStorage` to a server database (Supabase/PlanetScale) for cross-device sync
4. **Error monitoring** — Sentry for runtime errors
5. **Analytics** — understand which rivers get the most engagement
6. **More locations** — the architecture already supports it, just needs data curation
7. **Accessibility** — currently keyboard navigation works, but proper ARIA labels on the waveform visualiser and map need audit
8. **Testing** — unit tests for `estimateDO`, `parseActionItems`, `describeWeatherCode`; integration tests for API routes

**33. The `TakeAction` component parses the last paragraph of the AI narration. What happens if the AI doesn't follow the format?**
Good catch. The parsing is best-effort:
```typescript
// Try numbered list first: "1. Stop...", "2. Reduce..."
const numbered = lastPara.match(/\d[\.\)]\s+[^.!?]+[.!?]/g);
if (numbered && numbered.length >= 2) return numbered.slice(0, 3);
// Fallback: split by sentence
const sentences = lastPara.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
return sentences.slice(0, 3);
```
If the AI outputs one long paragraph with no clear sentences, you might get 1 item instead of 3. The component is designed defensively — if `items.length === 0` it returns `null` and nothing renders. In practice the Groq model follows the prompt format reliably because the prompt is very explicit about the ending format.

**34. Explain how `generateMetadata` in the narration page works with Next.js App Router.**
`generateMetadata` is an async function that Next.js calls at request time (on the server) to produce the `<head>` metadata for the page. It receives the same `searchParams` as the page. For `/narration?location=ganga&era=Today`, it reads `ganga` and `Today`, fetches the static location data, and returns a `Metadata` object with the river's name in the title and its first sentence in the description. The `og:image` URL points to `/api/og?location=ganga&era=Today`, which generates the preview card on demand. This means every shareable link shows a unique preview for that specific river and era.

**35. What is the ERA system and why "1976" specifically?**
1976 is a meaningful reference point for several reasons:
- It predates the major industrialisation wave of the 1980s-90s in India
- The US Clean Water Act was 1972 — so 1976 represents a period before widespread water quality data existed, making it a credible "before" comparison
- It's far enough back to show dramatic change but recent enough to have some documentary records
- For Indian rivers, the Ganga Action Plan began in 1986 — 1976 is clearly before intervention

The 2050 projection uses IPCC SSP2-4.5 (intermediate emissions scenario) as the scientific basis — this is clearly labelled as a scenario, not a prediction.

---

## PART 4 — KEY FORMULAS AND LOGIC TO KNOW

### The Benson-Krause DO Saturation Formula
```
Inputs: temperature in Celsius
Output: mg/L of dissolved oxygen at saturation

T = tempC + 273.15  (convert to Kelvin)

ln(DO_sat) = -139.34411
           + 157570.1 / T
           - 66423080 / T²
           + 12438000000 / T³
           - 862194900000 / T⁴

DO_sat = e^(ln(DO_sat))
```
At 20°C: ~9.1 mg/L. At 30°C: ~7.5 mg/L. At 10°C: ~11.3 mg/L.

### The estimateDO formula
```
DO_estimated = DO_saturation × (1 - pollutionDepletion - aqiPenalty)

where:
  pollutionDepletion = (1 - healthFactor) × 0.5
  aqiPenalty = min(pm25 / 200, 0.4)
  healthFactor = baselineHealthIndex / 100
```
For Yamuna (healthIndex = 19, PM2.5 = say 85 µg/m³, temp = 24°C):
- DO_sat at 24°C ≈ 8.4 mg/L
- pollutionDepletion = (1 - 0.19) × 0.5 = 0.405
- aqiPenalty = 85/200 = 0.425 → capped at 0.4
- DO = 8.4 × (1 - 0.405 - 0.4) = 8.4 × 0.195 ≈ 1.6 mg/L

That's dangerously low — which matches the real Yamuna data. The formula is calibrated to reality.

### The Health Index ring SVG
```typescript
const r = 28;                        // radius
const circ = 2 * Math.PI * r;        // full circumference
const fill = (healthIndex / 100) * circ;  // filled arc length

// SVG circle with strokeDasharray:
// fill = coloured part
// circ - fill = transparent part
strokeDasharray={`${fill} ${circ}`}
```

### The WMO weather code mapping
```
0         → Clear sky
1-3       → Partly cloudy
45-49     → Foggy
51-59     → Drizzle
61-69     → Rain
71-79     → Snow
80-82     → Rain showers
85-86     → Snow showers
95-99     → Thunderstorm
```

### Stream discharge conversion
```
1 cubic foot per second = 0.0283168 cubic metres per second
Low flow: < 50 m³/s
Normal: 50-500 m³/s
High flow: > 500 m³/s
```

---

## PART 5 — THINGS YOU BUILT AND HOW TO EXPLAIN THEM

### "I built the live data layer"
"I integrated three real-time APIs — Open-Meteo for weather and air quality, USGS for river discharge. I ran them in parallel with `Promise.all()` to minimise latency. For dissolved oxygen, there's no free live sensor API, so I implemented the Benson-Krause equation from the APHA water chemistry standard to derive an estimate from live temperature and PM2.5 data."

### "I built the streaming AI narration"
"I used Groq's streaming API with their Qwen model. The server creates a `TransformStream`, reads chunks from Groq, and immediately pipes them to the browser. The browser reads the stream using `ReadableStreamDefaultReader` and updates React state on each chunk, so text appears word by word. I used `AbortController` to cancel in-flight requests when the user switches locations."

### "I built the letter system"
"Users write a letter to a river and it replies in character. The API prompt tells the AI to read the letter, pick something specific the user said, respond to it directly, and end with one concrete ask based on the river's worst metric. The reply streams back the same way as narration. Letters are persisted in `localStorage`."

### "I built the dissolved oxygen derivation"
"I implemented the Benson-Krause equation from APHA Standard Methods — the industry reference for water quality. It calculates the theoretical O₂ saturation at a given temperature. I then apply a pollution depletion factor from the location's research baseline health index, and an AQI penalty from the live PM2.5 reading, which correlates with industrial load. The result is labelled as an estimate with its derivation method shown in the UI."

### "I built the loading skeleton"
"I added a `locationLoading` boolean state that becomes `true` at the start of every location fetch and `false` when the data arrives. While true, the main panel shows a `NarrationSkeleton` component — animated grey placeholder bars shaped like the actual content. This prevents the jarring experience of seeing old content while new content loads."

### "I refactored the NavSidebar"
"The navigation sidebar was copy-pasted in 4 different page files. I extracted it into `src/components/NavSidebar.tsx` using `usePathname()` from Next.js to automatically highlight the active route. This reduced ~150 lines of duplicated code to one 40-line component."

---

## PART 6 — QUESTIONS YOU SHOULD ASK THE INTERVIEWER

These show you think beyond the code:

- "How would you approach getting real dissolved oxygen sensor data at scale?"
- "What trade-offs do you see between the current Context-based state and a server state library like TanStack Query?"
- "Is there a better way to handle the streaming backpressure than what I have now?"
- "For the 2050 projections — I used IPCC SSP2-4.5. Would you use a different scenario for a more conservative/aggressive estimate?"

---

*Built for NextStep Hacks 2026 — Earth Forward*
*"The Earth remembers, and now, it speaks."*
