import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    // Get the authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with auth header to get user
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const voiceName = formData.get("name") as string || "My Custom Voice";
    const description = formData.get("description") as string || "Custom voice for Zulu narration";

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "Audio file is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Cloning voice for user ${user.id} with file: ${audioFile.name}, size: ${audioFile.size}`);

    // Create form data for ElevenLabs API
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append("name", voiceName);
    elevenLabsFormData.append("description", description);
    elevenLabsFormData.append("files", audioFile, audioFile.name);

    // Call ElevenLabs Voice Clone API
    const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      
      // Parse error message if possible
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail?.status === "voice_limit_reached") {
          throw new Error("Voice limit reached. Please delete an existing voice first.");
        }
        throw new Error(errorData.detail?.message || "Failed to clone voice");
      } catch {
        throw new Error(`Failed to clone voice: ${response.status}`);
      }
    }

    const voiceData = await response.json();
    console.log("Voice cloned successfully:", voiceData.voice_id);

    // Save the voice ID to the user's profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        custom_voice_id: voiceData.voice_id,
        custom_voice_name: voiceName,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to save voice ID to profile:", updateError);
      // Still return success since voice was created
    }

    return new Response(
      JSON.stringify({
        success: true,
        voiceId: voiceData.voice_id,
        voiceName: voiceName,
        message: "Voice cloned successfully! You can now use it for audiobook conversion.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Voice cloning error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to clone voice" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
