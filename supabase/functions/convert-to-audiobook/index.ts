import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ElevenLabs voice options - expanded selection for variety
const VOICES = {
  // Male voices
  george: { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "male", description: "Warm, authoritative" },
  brian: { id: "nPczCjzI2devNBz1zQrb", name: "Brian", gender: "male", description: "Deep, mature" },
  daniel: { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", gender: "male", description: "British, professional" },
  liam: { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "male", description: "Young, friendly" },
  charlie: { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male", description: "Conversational" },
  // Female voices
  sarah: { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "female", description: "Warm, engaging" },
  laura: { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "female", description: "Soft, soothing" },
  alice: { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", gender: "female", description: "British, elegant" },
  jessica: { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", gender: "female", description: "Expressive, dynamic" },
  lily: { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "female", description: "Warm, narrative" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "george" } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Text is too long. Maximum 5000 characters per request." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get voice ID from voice name, fallback to george
    const voiceConfig = VOICES[voice as keyof typeof VOICES] || VOICES.george;
    const voiceId = voiceConfig.id;

    console.log("Converting text to speech, length:", text.length, "voice:", voice, "voiceId:", voiceId);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      
      if (response.status === 401) {
        throw new Error("Invalid API key");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error(`TTS generation failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    console.log("Audio generated successfully, size:", audioBuffer.byteLength);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        duration: Math.ceil(text.length / 15), // Rough estimate: ~15 chars per second
        voice: voiceConfig,
        message: "Audiobook generated successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in convert-to-audiobook function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
