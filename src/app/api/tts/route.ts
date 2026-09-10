/**
 * POST /api/tts
 * Body: { text: string, locationId: string }
 *
 * Picks a gendered voice based on the river's cultural identity,
 * calls ElevenLabs TTS, and streams audio back as audio/mpeg.
 */

import { NextRequest } from "next/server";

// ─── Voice assignment ────────────────────────────────────────────────────────
// Female: Matilda — warm, audiobook, poetic (XrExE9yKIg1WjnnlVkGX)
// Male:   Adam    — deep, narration, powerful (pNInz6obpgDQGcFmaJgB)

const FEMALE_VOICE_ID = "XrExE9yKIg1WjnnlVkGX"; // Matilda — warm female narration
const MALE_VOICE_ID   = "pNInz6obpgDQGcFmaJgB"; // Adam    — deep male narration

// Rivers traditionally considered feminine or male in their cultures
const MALE_RIVERS = new Set([
  "brahmaputra", // only major river considered male in Hindu tradition
  "amazon",      // "Amazonas" — masculine in Portuguese
  "nile",        // masculine in Arabic (النيل)
  "colorado",    // masculine in Spanish
  "yangtze",     // masculine in Chinese cultural context
]);

function pickVoice(locationId: string): string {
  return MALE_RIVERS.has(locationId) ? MALE_VOICE_ID : FEMALE_VOICE_ID;
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

  // Cap to ~400 chars for ElevenLabs free tier — take first 2 paragraphs
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const ttsText = paragraphs.slice(0, 2).join("\n\n").slice(0, 420).trim();

  const voiceId = pickVoice(body.locationId ?? "");

  // ElevenLabs TTS — streaming endpoint
  const elRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: ttsText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability:        0.45, // slight variation for natural delivery
          similarity_boost: 0.82,
          style:            0.35, // some expressiveness without overdoing it
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!elRes.ok) {
    const err = await elRes.text();
    console.error("[api/tts] ElevenLabs error:", elRes.status, err);
    return new Response(`ElevenLabs error: ${elRes.status}`, { status: 502 });
  }

  // Stream the audio directly to the client
  return new Response(elRes.body, {
    headers: {
      "Content-Type":  "audio/mpeg",
      "Cache-Control": "no-store",
      "Transfer-Encoding": "chunked",
    },
  });
}
