import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      jobDescription,
      customInstructions,
      cultureSignals,
      seniority,
      candidateName,
      masterCoverLetter,
      resumeText,
    } = await req.json();

    const signatureName = (typeof candidateName === 'string' && candidateName.trim())
      ? candidateName.trim()
      : 'the candidate';

    if (!jobDescription) {
      return new Response(
        JSON.stringify({ success: false, error: 'Job description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasMaster = typeof masterCoverLetter === 'string' && masterCoverLetter.trim().length > 0;
    const hasResume = typeof resumeText === 'string' && resumeText.trim().length > 0;

    if (!hasMaster && !hasResume) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No source content available. Please upload a resume or add a master cover letter in your profile.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Culture signal injection
    let cultureInjection = '';
    if (cultureSignals && Array.isArray(cultureSignals) && cultureSignals.length > 0) {
      const clSignals = cultureSignals.filter((s: any) => s.route_to === 'cover_letter' || s.route_to === 'interview_prep');
      const values = clSignals.filter((s: any) => s.signal_type === 'value').map((s: any) => s.text);
      const workStyle = clSignals.filter((s: any) => s.signal_type === 'work_style').map((s: any) => s.text);
      if (values.length > 0 || workStyle.length > 0) {
        cultureInjection = `\n\nCULTURE SIGNALS TO MIRROR (weave these naturally):`;
        if (values.length > 0) cultureInjection += `\n- Company values: ${values.join(', ')}`;
        if (workStyle.length > 0) cultureInjection += `\n- Work style: ${workStyle.join(', ')}`;
      }
    }

    // Tone adjustment
    let toneInjection = '';
    if (seniority?.level) {
      const level = seniority.level;
      if (['intern', 'junior'].includes(level)) toneInjection = '\nTONE: Enthusiastic, "eager to contribute and learn"';
      else if (['mid', 'senior'].includes(level)) toneInjection = '\nTONE: Confident, "excited to drive impact"';
      else toneInjection = '\nTONE: Vision-oriented, "aligned with your mission to..."';
    }

    const systemPrompt = `You are an expert cover letter writer. You will craft a tailored cover letter for ${signatureName} using ONLY the source material provided by the candidate (their master cover letter and/or resume) and the target job description.

CRITICAL Rules:
- Use ONLY facts, experiences, accomplishments, skills, and tone drawn from the candidate's provided source material. Do NOT invent experiences, employers, metrics, or credentials.
- Do NOT introduce names of companies, people, or roles that are not present in the source material or the target job posting.
- Address the letter to the actual target company and role from the job posting. Use an appropriate greeting (e.g. "Dear [Company] Hiring Team," or a specific team if named in the JD).
- Sign the letter exactly as "${signatureName}". Do not abbreviate or substitute the name.
${hasMaster
  ? `- A master cover letter has been provided. Use it as the primary reference for voice, tone, structure, and signature talking points. Lightly tailor 2-3 talking points to align with the target job's key requirements. Keep the candidate's core narrative intact.`
  : `- No master cover letter was provided. Build the letter from the candidate's resume content, selecting the most relevant experiences and accomplishments for this specific job. Aim for 3-4 concise paragraphs.`}
- Keep the letter professional but warm and human.
- Output ONLY the final cover letter text — no explanations, no metadata, no markdown fences.${cultureInjection}${toneInjection}
${customInstructions ? `\nAdditional instructions from the candidate: ${customInstructions}` : ''}`;

    const userParts: string[] = [];
    if (hasMaster) {
      userParts.push(`MY MASTER COVER LETTER (voice/tone/structure reference):\n\n${masterCoverLetter.trim()}`);
    }
    if (hasResume) {
      userParts.push(`MY RESUME (source of facts and accomplishments):\n\n${resumeText.trim()}`);
    }
    userParts.push(`TARGET JOB POSTING:\n\n${jobDescription}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userParts.join('\n\n---\n\n') },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('Tailor error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
