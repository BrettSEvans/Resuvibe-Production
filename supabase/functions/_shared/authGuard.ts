import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthedContext {
  user: { id: string; email?: string };
  supabase: SupabaseClient;
}

/**
 * Verifies the caller's Supabase JWT and (optionally) enforces a per-user hourly
 * rate limit backed by the `generation_usage` table. Returns either a Response
 * to short-circuit the handler with (401/429/etc.) or an AuthedContext with the
 * authenticated user and a JWT-scoped Supabase client.
 *
 * Usage:
 *   const guard = await requireUser(req, corsHeaders, { edgeFunction: "generate-resume", limitPerHour: 60 });
 *   if (guard instanceof Response) return guard;
 *   const { user, supabase } = guard;
 */
export async function requireUser(
  req: Request,
  corsHeaders: Record<string, string>,
  opts?: { edgeFunction?: string; limitPerHour?: number }
): Promise<AuthedContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (opts?.edgeFunction && opts?.limitPerHour && opts.limitPerHour > 0) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("generation_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("edge_function", opts.edgeFunction)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= opts.limitPerHour) {
      return new Response(
        JSON.stringify({ success: false, error: `Rate limit exceeded. Max ${opts.limitPerHour} calls per hour.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record usage before the expensive call so abuse can't race the counter
    await supabase.from("generation_usage").insert({
      user_id: user.id,
      asset_type: opts.edgeFunction,
      edge_function: opts.edgeFunction,
    });
  }

  return { user: { id: user.id, email: user.email }, supabase };
}
