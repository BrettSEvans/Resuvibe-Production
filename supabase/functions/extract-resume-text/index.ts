import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetchWithRetry } from "../_shared/aiRetry.ts";
import { requireUser } from "../_shared/authGuard.ts";

import { makeCorsHeaders } from "../_shared/cors.ts";
Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: caller must own the resume row before we touch storage or DB
    const guard = await requireUser(req, corsHeaders, { edgeFunction: "extract-resume-text", limitPerHour: 30 });
    if (guard instanceof Response) return guard;
    const { user } = guard;

    const { resumeId, storagePath } = await req.json();
    if (!resumeId || !storagePath) {
      return new Response(JSON.stringify({ error: "resumeId and storagePath required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Ownership check: the resume row must belong to the authenticated user
    const { data: resumeRow, error: ownerErr } = await supabase
      .from("user_resumes")
      .select("id, user_id, storage_path")
      .eq("id", resumeId)
      .maybeSingle();

    if (ownerErr || !resumeRow || resumeRow.user_id !== user.id || resumeRow.storage_path !== storagePath) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download PDF from storage
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("resume-uploads")
      .download(storagePath);

    if (downloadErr || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download PDF: " + (downloadErr?.message || "unknown") }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert PDF to base64 for AI extraction (chunk to avoid stack overflow)
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await aiFetchWithRetry(LOVABLE_API_KEY, {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "Extract ALL text content from this PDF resume. Return ONLY the raw text, preserving the structure (headings, bullet points, sections). Do not summarize or modify the content.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:application/pdf;base64,${base64}` },
            },
            {
              type: "text",
              text: "Extract all text from this resume PDF.",
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 8000,
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return new Response(JSON.stringify({ error: `AI extraction failed (${aiResponse.status}): ${errText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const resumeText = aiData.choices?.[0]?.message?.content?.trim() || "";

    if (!resumeText) {
      return new Response(JSON.stringify({ error: "No text extracted from PDF" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save extracted text to user_resumes
    const { error: updateErr } = await supabase
      .from("user_resumes")
      .update({ resume_text: resumeText })
      .eq("id", resumeId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: "Failed to save text: " + updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, resume_text: resumeText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
