import { aiFetchWithRetry } from "./aiRetry.ts";

/**
 * Content fingerprint of (resume + JD) — MUST match the client implementation in
 * src/lib/interviewPrep/fingerprint.ts (FNV-1a, 32-bit, space-delimited, trimmed)
 * so the cache key is stable across client and server.
 */
export function sourceFingerprint(resumeHtml: string, jobDescription: string): string {
  const input = `${resumeHtml.trim()} ${jobDescription.trim()}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** Interview AI model — overridable; defaults to the gateway model the host uses. */
export const INTERVIEW_AI_MODEL =
  Deno.env.get("INTERVIEW_AI_MODEL") || "google/gemini-3-flash-preview";

export interface GatewayResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/** Calls the Lovable AI gateway (house convention) in JSON mode. */
export async function callGateway(
  apiKey: string,
  system: string,
  user: string,
  maxTokens = 4000,
): Promise<GatewayResult> {
  const res = await aiFetchWithRetry(apiKey, {
    model: INTERVIEW_AI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    max_tokens: maxTokens,
  });
  if (!res.ok) {
    throw new Error(`AI gateway error ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const usage = data.usage ?? {};
  return {
    text,
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
  };
}

/** Parse a JSON object from a model response, tolerating ```json fences and trailing text. */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(raw) as T;
  } catch {
    const start = raw.search(/[\{\[]/);
    if (start === -1) throw new Error("No JSON found in AI response");
    const open = raw[start];
    const close = open === "{" ? "}" : "]";
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < raw.length; i++) {
      const ch = raw[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') inStr = true;
      else if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) return JSON.parse(raw.slice(start, i + 1)) as T;
      }
    }
    throw new Error("Malformed JSON in AI response");
  }
}

/**
 * Record an AI call in generation_usage. Token counts come from the gateway;
 * dollar cost needs a per-model rate table the gateway doesn't expose here, so
 * it's logged as 0 for now (tokens are the measurable signal). See backlog.
 */
export async function logInterviewUsage(
  serviceClient: {
    from: (t: string) => { insert: (r: unknown) => Promise<unknown> };
  },
  params: {
    userId: string;
    edgeFunction: string;
    assetType: string;
    inputTokens: number;
    outputTokens: number;
  },
): Promise<void> {
  await serviceClient.from("generation_usage").insert({
    user_id: params.userId,
    asset_type: params.assetType,
    edge_function: params.edgeFunction,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    cost: 0,
  });
}
