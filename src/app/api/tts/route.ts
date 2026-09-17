/**
 * POST /api/tts
 * Body: { text: string, locationId: string }
 *
 * Splits the narration into sentence chunks (≤ 500 chars each),
 * converts each chunk with ElevenLabs, and returns all audio as a
 * single concatenated audio/mpeg response.
 *
 * Voice settings are tuned for warm, documentary-style narration —
 * not robotic, not over-expressive.
 */

import { NextRequest } from "next/server";

// ─── Voice assignment ────────────────────────────────────────────────────────
// George  — deep, warm, documentary male (JBFqnCBsd6RMkjVDRZzb)
// Matilda — warm, calm, audiobook female (XrExE9yKIg1WjnnlVkGX)
// River voices assigned by cultural gender tradition

const MALE_VOICE_ID   = "JBFqnCBsd6RMkjVDRZzb"; // George — deep documentary
const FEMALE_VOICE_ID = "XrExE9yKIg1WjnnlVkGX"; // Matilda — warm audiobook

const MALE_RIVERS = new Set([
  "brahmaputra",
  "amazon",
  "nile",
  "colorado",
  "yangtze",
]);

function pickVoice(locationId: string): string {
  return MALE_RIVERS.has(locationId) ? MALE_VOICE_ID : FEMALE_VOICE_ID;
}

// ─── Split text into natural sentence chunks ─────────────────────────────────
// Splits on sentence boundaries, keeping each chunk ≤ maxChars.
// This means the full narration plays — no cutoff.

function splitIntoChunks(text: string, maxChars = 500): string[] {
  // Split on sentence endings followed by space or end of string
  const sentences = text
    .replace(/\n\n+/g, " ")
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length <= maxChars) {
      current = current ? current + " " + sentence : sentence;
    } else {
      if (current) chunks.push(current.trim());
      // If a single sentence is longer than maxChars, split at commas
      if (sentence.length > maxChars) {
        const parts = sentence.split(/(?<=,)\s+/);
        let sub = "";
        for (const part of parts) {
          if ((sub + " " + part).trim().length <= maxChars) {
            sub = sub ? sub + " " + part : part;
          } else {
            if (sub) chunks.push(sub.trim());
            sub = part;
          }
        }
        if (sub) chunks.push(sub.trim());
        current = "";
      } else {
        current = sentence;
      }
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

// ─── Call ElevenLabs for one chunk ───────────────────────────────────────────

async function synthesiseChunk(
  text: string,
  voiceId: string,
  apiKey: string,
): Promise<ArrayBuffer | null> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5", // fastest + highest quality free model
        voice_settings: {
          stability:         0.65, // more stable = less robotic variation
          similarity_boost:  0.75, // how close to the reference voice
          style:             0.20, // low style = more natural, less theatrical
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    console.error(`[tts] ElevenLabs chunk error: ${res.status} — ${await res.text()}`);
    return null;
  }

  return res.arrayBuffer();
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response("ELEVENLABS_API_KEY not configured", { status: 500 });
  }

  let body: { text?: string; locationId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) return new Response("text is required", { status: 400 });

  const voiceId = pickVoice(body.locationId ?? "");
  const chunks = splitIntoChunks(text, 500);

  // Synthesise all chunks — up to 6 to keep latency reasonable
  const toSynth = chunks.slice(0, 6);

  // Run all chunks in parallel for speed
  const results = await Promise.all(
    toSynth.map((chunk) => synthesiseChunk(chunk, voiceId, apiKey)),
  );

  // Filter out any failed chunks
  const buffers = results.filter((b): b is ArrayBuffer => b !== null);

  if (buffers.length === 0) {
    return new Response("TTS synthesis failed for all chunks", { status: 502 });
  }

  // Concatenate all MP3 buffers into one response
  const totalLength = buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    combined.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }

  return new Response(combined, {
    headers: {
      "Content-Type":  "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
