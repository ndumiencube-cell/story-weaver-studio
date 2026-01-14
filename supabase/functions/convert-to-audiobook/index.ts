import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ElevenLabs voice options optimized for different languages
const VOICES = {
  // Male voices - good for English and multilingual
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

// Text preprocessing for better Zulu/African language pronunciation
function preprocessZuluText(text: string): string {
  // Add pronunciation hints for common Zulu patterns
  let processed = text;
  
  // Handle click consonants - add slight pauses for clarity
  // Zulu has three main click consonants: c (dental), q (alveolar), x (lateral)
  
  // Ensure proper spacing around Zulu-specific letter combinations
  // Handle 'hl' (voiceless lateral fricative)
  processed = processed.replace(/\bhl/gi, 'shl');
  
  // Handle 'dl' which has a lateral click quality
  processed = processed.replace(/\bdl/gi, 'dl');
  
  // Common Zulu greetings and words - add phonetic hints
  const pronunciationGuide: Record<string, string> = {
    'sawubona': 'sah-woo-boh-nah',
    'ngiyabonga': 'n-gee-yah-boh-n-gah',
    'yebo': 'yeh-boh',
    'unjani': 'oon-jah-nee',
    'ngiyaphila': 'n-gee-yah-pee-lah',
  };
  
  // Don't replace words, the multilingual model handles Zulu
  // Just ensure clean text for the TTS
  
  // Clean up extra whitespace
  processed = processed.replace(/\s+/g, ' ').trim();
  
  return processed;
}

// Detect if text is likely Zulu/African language
function detectLanguage(text: string): 'zulu' | 'english' | 'mixed' {
  const zuluPatterns = [
    /\bng[aeiou]/i,  // Common Zulu prefix
    /\buku/i,        // Infinitive prefix
    /\bisi/i,        // Class prefix
    /\bum[aeiou]/i,  // Class prefix
    /\baba/i,        // Class prefix
    /nkosi/i,        // Lord/chief
    /bona/i,         // See
    /hamba/i,        // Go
    /yebo/i,         // Yes
    /cha/i,          // No (short)
  ];
  
  const zuluMatches = zuluPatterns.filter(pattern => pattern.test(text)).length;
  const wordCount = text.split(/\s+/).length;
  
  if (zuluMatches >= 3 || (zuluMatches >= 1 && wordCount < 20)) {
    return 'zulu';
  }
  
  // Check for English patterns
  const englishWords = ['the', 'and', 'is', 'are', 'was', 'were', 'have', 'has', 'been', 'will'];
  const englishMatches = englishWords.filter(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(text)
  ).length;
  
  if (englishMatches >= 3) {
    return zuluMatches >= 1 ? 'mixed' : 'english';
  }
  
  return 'zulu'; // Default to Zulu for this app
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "george", language = "isiZulu" } = await req.json();
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

    // Detect language and preprocess if Zulu
    const detectedLang = detectLanguage(text);
    let processedText = text;
    
    if (language === "isiZulu" || detectedLang === 'zulu' || detectedLang === 'mixed') {
      processedText = preprocessZuluText(text);
      console.log("Detected Zulu content, using multilingual model with optimized settings");
    }

    // Get voice ID from voice name, fallback to george
    const voiceConfig = VOICES[voice as keyof typeof VOICES] || VOICES.george;
    const voiceId = voiceConfig.id;

    console.log("Converting text to speech, length:", processedText.length, "voice:", voice, "voiceId:", voiceId, "language:", language);

    // Use multilingual v2 model which has better non-English support
    // Adjust settings for clearer pronunciation of Zulu
    const voiceSettings = detectedLang === 'zulu' || language === "isiZulu" 
      ? {
          stability: 0.7,           // Higher stability for clearer pronunciation
          similarity_boost: 0.8,    // Good voice matching
          style: 0.3,               // Lower style for more neutral/clear speech
          use_speaker_boost: true,
        }
      : {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        };

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: processedText,
          model_id: "eleven_multilingual_v2", // Best model for non-English languages
          voice_settings: voiceSettings,
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
        language: detectedLang,
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
