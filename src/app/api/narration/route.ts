/**
 * POST /api/narration
 * Generates a fresh, emotional, first-person narration from the river/lake.
 * Grounded in real metrics. Ends with specific actions the reader can take.
 */

import { NextRequest } from "next/server";
import type { Metric } from "@/data/locations";
import type { LiveMetrics } from "@/lib/fetchLiveMetrics";

type NarrationRequest = {
  locationId: string;
  era: string;
  locationName: string;
  subtitle: string;
  headline: string;
  metrics: Metric[];
  liveMetrics: LiveMetrics | null;
  summary: string;
};

function buildPrompt(body: NarrationRequest): string {
  const { locationName, subtitle, era, metrics, liveMetrics, summary } = body;

  const isToday     = era === "Today";
  const isPast      = era === "1976";
  const isProjected = era === "2050";

  const metricLines = metrics
    .map((m) => `  ${m.label}: ${m.value} — ${m.status}`)
    .join("\n");

  const liveSection = liveMetrics
    ? `\nRight now, live: temperature ${liveMetrics.temperatureC}°C, weather: ${liveMetrics.weatherDescription}${liveMetrics.dischargeM3s !== null ? `, flow: ${liveMetrics.dischargeM3s} m³/s (${liveMetrics.flowStatus})` : ""}.`
    : "";

  const toneGuide = isPast
    ? "You are speaking from a memory of when things were better. Sound alive, energetic, even joyful where the data was good. Describe what it felt like to be healthy — the clarity of your water, the life in you, the ease of your current."
    : isProjected
    ? "You are imagining a possible future. Sound worried but not hopeless. Be honest about what the numbers predict. The tone should be urgent but still human — like someone telling you a difficult truth."
    : "You are speaking right now, today. Your tone should match your health index. If things are bad, sound tired, burdened, honest about the pain — like a person describing their own illness. If improving, sound relieved but cautious.";

  const endingGuide = isProjected
    ? "End with 3 specific things people must stop doing to prevent this future. Make them concrete — not 'reduce pollution' but the actual behaviours. Format as a short paragraph, not a list."
    : isToday
    ? "End with 3 specific things people must stop doing right now that would directly help you recover. Base these on the worst metrics above. Make them concrete and personal — talk directly to the reader as 'you'."
    : "End with one sentence about what you had that is now gone or diminishing — and ask them to remember it.";

  return `You are ${locationName}, a body of water in ${subtitle}.

TODAY'S REAL DATA:
${metricLines}
${liveSection}

CONTEXT: ${summary}

TONE GUIDE: ${toneGuide}

Write a narration in first person. Rules:
1. Do NOT open with "I am [name]" — start differently, in the middle of a feeling or moment
2. Mention at least 3 of the metrics above by their actual numbers — weave them into the story naturally, not as a report
3. Sound like a real person talking, not a nature documentary. Use short sentences when emotional. Use longer ones when remembering or imagining.
4. 3 paragraphs total. No headers. No bullet points. Keep it concise — each paragraph should be 2-4 sentences max.
5. ${endingGuide}
6. Never mention AI, narration, or data generation.

Write now:`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return new Response("GROQ_API_KEY not configured", { status: 500 });

  let body: NarrationRequest;
  try { body = await req.json(); }
  catch { return new Response("Invalid JSON body", { status: 400 }); }

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: "You are a natural place — a river, lake, or lagoon — speaking in first person. You are emotionally honest, grounded in real data, and deeply personal. You never mention AI or narration. You speak like a person who has been through a lot.",
        },
        { role: "user", content: buildPrompt(body) },
      ],
      temperature: 0.88,
      max_tokens: 380,
      stream: true,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    console.error("[api/narration] Groq error:", err);
    return new Response(`Groq error: ${groqRes.status}`, { status: 502 });
  }

  const { readable, writable } = new TransformStream();
  const writer  = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  (async () => {
    const reader = groqRes.body!.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          const t = line.trim();
          if (!t || t === "data: [DONE]" || !t.startsWith("data: ")) continue;
          try {
            const token: string = JSON.parse(t.slice(6))?.choices?.[0]?.delta?.content ?? "";
            if (token) await writer.write(encoder.encode(token));
          } catch { /* skip */ }
        }
      }
    } finally { await writer.close(); }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-store",
    },
  });
}
