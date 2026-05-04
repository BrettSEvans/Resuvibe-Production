import { aiFetchWithRetry } from "../_shared/aiRetry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText } = await req.json();
    if (!resumeText || resumeText.trim().length < 50) {
      return new Response(JSON.stringify({ success: false, error: "Resume text too short" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await aiFetchWithRetry(LOVABLE_API_KEY, {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Extract the candidate's key professional skills from the resume. Return 8-20 concise skill names (e.g., "JavaScript", "Project Management", "Data Analysis"). Prefer specific tools, technologies, and methodologies over generic soft skills. Use Title Case. Do not include duplicates.`,
        },
        { role: "user", content: `Extract key skills from this resume:\n\n${resumeText.slice(0, 12000)}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "extract_skills",
          description: "Return the extracted skills",
          parameters: {
            type: "object",
            properties: {
              skills: { type: "array", items: { type: "string" } },
            },
            required: ["skills"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "extract_skills" } },
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ success: false, error: "Skill extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { skills: [] };
    const skills: string[] = Array.from(new Set((result.skills ?? []).map((s: string) => s.trim()).filter(Boolean)));

    return new Response(JSON.stringify({ success: true, skills }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-resume-skills error:", e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
