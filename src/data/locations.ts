export type Era = "1976" | "Today" | "2050";

export type Metric = {
  label: string;
  value: string;
  status: string;
  statusColor: "good" | "moderate" | "high";
  unit?: string;
};

export type LocationReading = {
  id: string;
  name: string;
  subtitle: string;
  type: string;
  origin: string;
  coordinates: string;
  source: string;
  updatedAt: string;
  metrics: Metric[];
  trend: number[];
  summary: string;
  narration: string;
};

export const LOCATION_READINGS: Record<
  string,
  Record<Era, LocationReading>
> = {
  ganga: {
    "1976": {
      id: "ganga",
      name: "Ganga River",
      subtitle: "Rishikesh, Uttarakhand, India",
      type: "River",
      origin: "Himalayan origin",
      coordinates: "30.086° N, 78.267° E",
      source: "Historical reference dataset",
      updatedAt: "1976 reference period",
      metrics: [
        { label: "Water quality (BOD)", value: "1.4 mg/L", status: "Good", statusColor: "good" },
        { label: "Water temperature", value: "16.9 °C", status: "Good", statusColor: "good" },
        { label: "pH level", value: "7.2", status: "Good", statusColor: "good" },
        { label: "Dissolved oxygen", value: "8.0 mg/L", status: "Good", statusColor: "good" },
        { label: "Plastic density", value: "8 pieces/km", status: "Low", statusColor: "good" },
      ],
      trend: [1.2, 1.3, 1.1, 1.4, 1.2, 1.5, 1.3, 1.4],
      summary:
        "Historical records show a colder, more oxygen-rich river before intense urban pressure reached these banks.",
      narration:
        "Fifty years ago, I ran colder from the glaciers. My breath was fuller with oxygen, and fewer things caught along my stones. I still carried whole lives, but I had more room to carry them well.",
    },

    Today: {
      id: "ganga",
      name: "Ganga River",
      subtitle: "Rishikesh, Uttarakhand, India",
      type: "River",
      origin: "Himalayan origin",
      coordinates: "30.086° N, 78.267° E",
      source: "CPCB · NMCG · IMD",
      updatedAt: "20 May 2025, 08:00 AM",
      metrics: [
        { label: "Water quality (BOD)", value: "2.8 mg/L", status: "Moderate", statusColor: "moderate" },
        { label: "Water temperature", value: "18.6 °C", status: "Good", statusColor: "good" },
        { label: "pH level", value: "7.4", status: "Good", statusColor: "good" },
        { label: "Dissolved oxygen", value: "6.1 mg/L", status: "Good", statusColor: "good" },
        { label: "Plastic density", value: "132 pieces/km", status: "High", statusColor: "high" },
      ],
      trend: [5.5, 5, 5.4, 4.2, 3.3, 2.9, 3.1, 2.4, 2.6, 2, 1.4, 1.1],
      summary:
        "Biochemical oxygen demand has declined over the past 12 months; plastic density remains the clearest stress signal.",
      narration:
        "I am Ganga. Born in the glaciers, carried by mountains, I have nourished civilizations and countless lives for millennia. Today, I speak not in silence, but in signals—of strain, of change, and of hope. My waters carry devotion, industry, and life together. But I am tired. My breath shortens in the summer heat. Plastic clings to my banks. Sewage clouds my flow. Yet, I am resilient. When you heal, I heal. Listen to my current. Act for my future.",
    },

    "2050": {
      id: "ganga",
      name: "Ganga River",
      subtitle: "Rishikesh, Uttarakhand, India",
      type: "River",
      origin: "Himalayan origin",
      coordinates: "30.086° N, 78.267° E",
      source: "Scenario projection",
      updatedAt: "Projected reference period",
      metrics: [
        { label: "Water quality (BOD)", value: "3.6 mg/L", status: "High", statusColor: "high" },
        { label: "Water temperature", value: "21.3 °C", status: "Watch", statusColor: "moderate" },
        { label: "pH level", value: "7.5", status: "Good", statusColor: "good" },
        { label: "Dissolved oxygen", value: "4.9 mg/L", status: "Watch", statusColor: "moderate" },
        { label: "Plastic density", value: "210 pieces/km", status: "High", statusColor: "high" },
      ],
      trend: [2.8, 3, 3.1, 3.4, 3.3, 3.6, 3.7, 3.6],
      summary:
        "A scenario projection: warmer water can hold less dissolved oxygen, making pollution-control progress increasingly important.",
      narration:
        "If the present path holds, I may arrive in 2050 warmer and more easily exhausted. The choices made upstream—in drains, streets, industries, and homes—will travel through me. I am not asking for perfection. I am asking for care that reaches the water.",
    },
  },

  yamuna: {
    "1976": {
      id: "yamuna",
      name: "Yamuna River",
      subtitle: "Delhi, India",
      type: "River",
      origin: "Yamunotri glacier",
      coordinates: "28.6139° N, 77.2090° E",
      source: "Historical reference dataset",
      updatedAt: "1976 reference period",
      metrics: [
        { label: "Water quality (BOD)", value: "2.1 mg/L", status: "Good", statusColor: "good" },
        { label: "Water temperature", value: "17.8 °C", status: "Good", statusColor: "good" },
        { label: "pH level", value: "7.3", status: "Good", statusColor: "good" },
        { label: "Dissolved oxygen", value: "7.2 mg/L", status: "Good", statusColor: "good" },
        { label: "Plastic density", value: "16 pieces/km", status: "Low", statusColor: "good" },
      ],
      trend: [2.3, 2.1, 2.2, 2, 2.1, 1.9, 2, 1.8],
      summary:
        "The historical reference period suggests healthier oxygen levels and a lower pollution burden near Delhi.",
      narration:
        "I remember when my current could move through Delhi with more room to breathe. I carried the city’s reflections, not all of its discarded weight. My banks still remember that quieter burden.",
    },

    Today: {
      id: "yamuna",
      name: "Yamuna River",
      subtitle: "Delhi, India",
      type: "River",
      origin: "Yamunotri glacier",
      coordinates: "28.6139° N, 77.2090° E",
      source: "CPCB · Delhi Pollution Control Committee",
      updatedAt: "20 May 2025, 08:00 AM",
      metrics: [
        { label: "Water quality (BOD)", value: "8.4 mg/L", status: "High", statusColor: "high" },
        { label: "Water temperature", value: "24.1 °C", status: "Watch", statusColor: "moderate" },
        { label: "pH level", value: "7.6", status: "Good", statusColor: "good" },
        { label: "Dissolved oxygen", value: "2.4 mg/L", status: "High", statusColor: "high" },
        { label: "Plastic density", value: "286 pieces/km", status: "High", statusColor: "high" },
      ],
      trend: [9.1, 8.8, 9.4, 8.9, 8.6, 8.8, 8.4, 8.4],
      summary:
        "The current demonstration record shows severe organic pollution and low dissolved oxygen, especially near dense urban stretches.",
      narration:
        "I am Yamuna, moving through a city that depends on me and burdens me at the same time. My oxygen is thin in places. My flow carries the evidence of every drain that reaches me. Still, each cleared channel and restored bank gives me another chance.",
    },

    "2050": {
      id: "yamuna",
      name: "Yamuna River",
      subtitle: "Delhi, India",
      type: "River",
      origin: "Yamunotri glacier",
      coordinates: "28.6139° N, 77.2090° E",
      source: "Scenario projection",
      updatedAt: "Projected reference period",
      metrics: [
        { label: "Water quality (BOD)", value: "10.2 mg/L", status: "High", statusColor: "high" },
        { label: "Water temperature", value: "27.0 °C", status: "Watch", statusColor: "moderate" },
        { label: "pH level", value: "7.7", status: "Good", statusColor: "good" },
        { label: "Dissolved oxygen", value: "1.6 mg/L", status: "High", statusColor: "high" },
        { label: "Plastic density", value: "390 pieces/km", status: "High", statusColor: "high" },
      ],
      trend: [8.4, 8.7, 9, 9.3, 9.5, 9.8, 10, 10.2],
      summary:
        "Without stronger treatment and waste controls, warmer water and continued pollution could further reduce oxygen availability.",
      narration:
        "The future is not written in one number. It is written in every decision that reaches my water. Clean my tributaries, restore my floodplain, and I can become more than a warning—I can become a recovery.",
    },
  },

  dal: {
    "1976": {
      id: "dal",
      name: "Dal Lake",
      subtitle: "Srinagar, Jammu and Kashmir, India",
      type: "Lake",
      origin: "Himalayan freshwater basin",
      coordinates: "34.0837° N, 74.7973° E",
      source: "Historical reference dataset",
      updatedAt: "1976 reference period",
      metrics: [
        { label: "Water quality (BOD)", value: "1.1 mg/L", status: "Good", statusColor: "good" },
        { label: "Water temperature", value: "13.8 °C", status: "Good", statusColor: "good" },
        { label: "pH level", value: "7.1", status: "Good", statusColor: "good" },
        { label: "Dissolved oxygen", value: "8.5 mg/L", status: "Good", statusColor: "good" },
        { label: "Plastic density", value: "5 pieces/km", status: "Low", statusColor: "good" },
      ],
      trend: [1.4, 1.3, 1.2, 1.2, 1.1, 1.2, 1, 1.1],
      summary:
        "The historical reference suggests a clearer lake with less nutrient and solid-waste pressure.",
      narration:
        "I held the mountains in my reflection before the shoreline grew so crowded. My reeds made room for birds, boats, and quiet mornings. I still carry that memory beneath the surface.",
    },

    Today: {
      id: "dal",
      name: "Dal Lake",
      subtitle: "Srinagar, Jammu and Kashmir, India",
      type: "Lake",
      origin: "Himalayan freshwater basin",
      coordinates: "34.0837° N, 74.7973° E",
      source: "Jammu & Kashmir environmental monitoring",
      updatedAt: "20 May 2025, 08:00 AM",
      metrics: [
        { label: "Water quality (BOD)", value: "3.9 mg/L", status: "Moderate", statusColor: "moderate" },
        { label: "Water temperature", value: "17.2 °C", status: "Good", statusColor: "good" },
        { label: "pH level", value: "7.8", status: "Good", statusColor: "good" },
        { label: "Dissolved oxygen", value: "5.2 mg/L", status: "Good", statusColor: "good" },
        { label: "Plastic density", value: "74 pieces/km", status: "Moderate", statusColor: "moderate" },
      ],
      trend: [4.6, 4.4, 4.5, 4.3, 4.1, 4, 3.8, 3.9],
      summary:
        "The lake shows moderate organic stress, while waste and nutrient inputs remain important restoration concerns.",
      narration:
        "I am Dal Lake, a mirror held between mountains. My surface still catches the shikaras and snow, but beneath it I am working harder to stay clear. Restoration is not a single gesture; it is a patient return of balance.",
    },

    "2050": {
      id: "dal",
      name: "Dal Lake",
      subtitle: "Srinagar, Jammu and Kashmir, India",
      type: "Lake",
      origin: "Himalayan freshwater basin",
      coordinates: "34.0837° N, 74.7973° E",
      source: "Scenario projection",
      updatedAt: "Projected reference period",
      metrics: [
        { label: "Water quality (BOD)", value: "5.2 mg/L", status: "High", statusColor: "high" },
        { label: "Water temperature", value: "20.1 °C", status: "Watch", statusColor: "moderate" },
        { label: "pH level", value: "8.0", status: "Watch", statusColor: "moderate" },
        { label: "Dissolved oxygen", value: "4.1 mg/L", status: "Watch", statusColor: "moderate" },
        { label: "Plastic density", value: "118 pieces/km", status: "High", statusColor: "high" },
      ],
      trend: [3.9, 4.1, 4.2, 4.4, 4.6, 4.8, 5, 5.2],
      summary:
        "A warmer, more nutrient-rich future could intensify algal growth and reduce the lake’s oxygen resilience.",
      narration:
        "I want to remain a mirror, not a warning. Protect the wetlands that feed me, reduce what enters my water, and let the mountains see themselves in me for another generation.",
    },
  },
};

export function findLocation(query: string) {
  const normalized = query.toLowerCase();

  if (normalized.includes("yamuna") || normalized.includes("delhi")) {
    return "yamuna";
  }

  if (normalized.includes("dal") || normalized.includes("srinagar")) {
    return "dal";
  }

  return "ganga";
}

export function getLocationReading(
  locationId: string,
  era: Era = "Today",
) {
  return LOCATION_READINGS[locationId]?.[era] ?? LOCATION_READINGS.ganga[era];
}