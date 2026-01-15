import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ElevenLabs voice options - preset voices
const VOICES: Record<string, { id: string; name: string }> = {
  // Male voices - good for English and multilingual
  george: { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  brian: { id: "nPczCjzI2devNBz1zQrb", name: "Brian" },
  daniel: { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel" },
  liam: { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  charlie: { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie" },
  // Female voices
  sarah: { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  laura: { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" },
  alice: { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
  jessica: { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica" },
  lily: { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
};

// Detect if text is likely Zulu/African language
function detectLanguage(text: string): 'zulu' | 'english' | 'mixed' {
  const zuluPatterns = [
    /\bng[aeiou]/i,
    /\buku/i,
    /\bisi/i,
    /\bum[aeiou]/i,
    /\baba/i,
    /nkosi/i,
    /bona/i,
    /hamba/i,
    /yebo/i,
    /cha\b/i,
  ];
  
  const zuluMatches = zuluPatterns.filter(pattern => pattern.test(text)).length;
  const wordCount = text.split(/\s+/).length;
  
  if (zuluMatches >= 3 || (zuluMatches >= 1 && wordCount < 20)) {
    return 'zulu';
  }
  
  const englishWords = ['the', 'and', 'is', 'are', 'was', 'were', 'have', 'has', 'been', 'will'];
  const englishMatches = englishWords.filter(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(text)
  ).length;
  
  if (englishMatches >= 3) {
    return zuluMatches >= 1 ? 'mixed' : 'english';
  }
  
  return 'zulu';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "george", language = "isiZulu", isCustomVoice = false } = await req.json();
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
        JSON.stringify({ error: "Text too long. Maximum 5000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine the voice ID to use
    let voiceId: string;
    
    if (isCustomVoice) {
      // Custom cloned voice - the voice parameter IS the voice ID
      voiceId = voice;
      console.log(`Using custom cloned voice: ${voiceId}`);
    } else {
      // Preset voice - look up the ID from our mapping
      const voiceConfig = VOICES[voice.toLowerCase()];
      if (!voiceConfig) {
        return new Response(
          JSON.stringify({ error: `Invalid voice: ${voice}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      voiceId = voiceConfig.id;
      console.log(`Using preset voice: ${voiceConfig.name} (${voiceId})`);
    }

    // Detect language from text
    const detectedLanguage = detectLanguage(text);
    const isZulu = language === "isiZulu" || detectedLanguage === 'zulu';
    
    console.log(`Converting text to speech. Language: ${language}, Detected: ${detectedLanguage}, Using custom voice: ${isCustomVoice}`);

    // Voice settings optimized for the content
    const voice_settings = isZulu && !isCustomVoice 
      ? {
          // For Zulu with preset voices, use more stable settings
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true,
        }
      : isCustomVoice
      ? {
          // For custom cloned voices, maximize similarity to original
          stability: 0.6,
          similarity_boost: 0.9,
          style: 0.2,
          use_speaker_boost: true,
        }
      : {
          // Default settings for English
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        };

    // Always use multilingual model for best language support
    const model_id = "eleven_multilingual_v2";

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
          model_id,
          voice_settings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      
      // Check for specific error types
      if (response.status === 422) {
        throw new Error("Invalid voice ID or voice has been deleted");
      }
      
      throw new Error(`TTS conversion failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    // Estimate duration based on word count (roughly 150 words per minute)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60);

    return new Response(
      JSON.stringify({
        audioContent: base64Audio,
        duration: estimatedDuration,
        model: model_id,
        voiceUsed: isCustomVoice ? "custom" : voice,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Conversion error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to convert to audiobook" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
