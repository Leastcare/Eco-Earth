/**
 * POST /api/letter-reply
 * The river/lake reads the user's letter and replies personally.
 * Grounded in real metrics. Emotionally honest. Ends with a specific ask.
 */

import { NextRequest } from "next/server";
import type { Metric } from "@/data/locations";

type LetterReplyRequest = {
  locationName: string;
  locationId: string;
  era: string;
  metrics: Metric[];
  liveMetrics: Record<string, unknown> | null;
  letterBody: string;
  authorName: string;
};

function buildPrompt(body: LetterReplyRequest): string {
  const { locationName, metrics, liveMetrics, letterBody, authorName } = body;

  const author = authorName?.trim() || "friend";

  // Pull out the worst metrics to anchor the reply emotionally
  const criticalMetrics = metrics.filter((m) => m.statusColor === "high");
  const moderateMetrics = metrics.filter((m) => m.statusColor === "moderate");
  const goodMetrics     = metrics.filter((m) => m.statusColor === "good");

  const metricSummary = [
    criticalMetrics.length > 0
      ? `Things that hurt most right now: ${criticalMetrics.map((m) => `${m.label} at ${m.value} (${m.status})`).join(", ")}.`
      : "",
    moderateMetrics.length > 0
      ? `Things under stress: ${moderateMetrics.map((m) => `${m.label} at ${m.value}`).join(", ")}.`
      : "",
    goodMetrics.length > 0
      ? `Things still holding: ${goodMetrics.map((m) => `${m.label} at ${m.value}`).join(", ")}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const liveNote = liveMetrics
    ? `Right now it is ${liveMetrics.temperatureC ?? "?"}°C at my surface. ${liveMetrics.weatherDescription ?? ""}.`
    : "";

  return `You are ${locationName}. ${author} has written you a letter. Read it carefully, then reply.

THEIR LETTER:
---
${letterBody.trim()}
---

YOUR CURRENT CONDITION (real data):
${metricSummary}
${liveNote}

HOW TO REPLY:
- Read their letter carefully. Pick out something specific they said and respond to it directly — like a real conversation, not a speech.
- If they asked a question, answer it honestly from your perspective as this river/lake.
- Share how you are actually feeling right now based on the data. Don't be vague — if your oxygen is at ${metrics.find((m) => m.label.includes("Oxygen"))?.value ?? "a low level"}, say what that feels like. If your plastic load is high, describe the weight of it.
- Sound like a person who is tired but still trying. Or relieved if things are okay. Match the data to the emotion.
- Be conversational. Short sentences where it matters. Longer ones when you're explaining something.
- End with ONE specific thing you want ${author} to actually stop doing — something concrete that would directly help you, based on your worst metric. Not "reduce pollution" — something real like "stop throwing plastic into the drains that lead to me" or "stop letting factories release untreated water at night".
- 3 paragraphs. No headers. No bullet points. No AI mentions.

Reply now as ${locationName}, speaking directly to ${author}:`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return new Response("GROQ_API_KEY not configured", { status: 500 });

  let body: LetterReplyRequest;
  try { body = await req.json(); }
  catch { return new Response("Invalid JSON", { status: 400 }); }

  // Accept letters that are just the greeting — Groq will work with it
  if (!body.letterBody) return new Response("letterBody is required", { status: 400 });

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: `You are ${body.locationName}, a river or lake. You are replying to a personal letter from someone who cares about you. You speak honestly, emotionally, and directly — like a person, not a poem. You reference your actual environmental data. You never break character. You never mention AI or data generation.`,
        },
        { role: "user", content: buildPrompt(body) },
      ],
      temperature: 0.85,
      max_tokens: 500,
      stream: true,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    console.error("[api/letter-reply] Groq error:", groqRes.status, err);
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
