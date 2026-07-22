import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { makeCorsHeaders } from "../_shared/cors.ts";

/**
 * Transcribes a recorded interview answer (the universal voice-input path).
 * Accepts multipart audio (webm from Chrome/Firefox, mp4/m4a from Safari — both
 * accepted upstream, no transcoding) and returns { text }. Auth required; audio
 * is NOT persisted. Provider defaults to OpenAI transcription and is swappable
 * via env (TRANSCRIBE_MODEL); if the Lovable gateway later exposes an audio
 * endpoint, this is the single place to point it there.
 */
Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ success: false, error: "Unauthorized" }, 401);

    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File)) return json({ success: false, error: "audio file required" }, 400);
    if (audio.size === 0) return json({ success: false, error: "empty audio" }, 400);
    if (audio.size > 25 * 1024 * 1024) {
      return json({ success: false, error: "audio too large (max 25MB)" }, 413);
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) return json({ success: false, error: "Transcription not configured" }, 500);
    const model = Deno.env.get("TRANSCRIBE_MODEL") || "gpt-4o-mini-transcribe";

    const upstream = new FormData();
    upstream.append("file", audio, audio.name || "answer.webm");
    upstream.append("model", model);
    upstream.append("response_format", "json");

    const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: upstream,
    });
    if (!resp.ok) {
      const detail = (await resp.text()).slice(0, 200);
      return json({ success: false, error: `Transcription failed (${resp.status})`, detail }, 502);
    }
    const data = await resp.json();
    const text = ((data.text as string) ?? "").trim();

    // Observability: log the call (audio has no token count). Reuses the shared
    // generation_usage table like the other interview functions.
    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await service.from("generation_usage").insert({
      user_id: user.id,
      asset_type: "answer-transcription",
      edge_function: "transcribe-answer",
    });

    return json({ success: true, text });
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
