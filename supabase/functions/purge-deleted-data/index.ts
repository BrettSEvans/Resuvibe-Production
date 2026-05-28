import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { makeCorsHeaders } from "../_shared/cors.ts";

/**
 * Purges job_applications that have been soft-deleted for more than 30 days.
 * Intended to be triggered by pg_cron nightly; also callable manually by admins.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set in edge function secrets.
 */
Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Allow either an internal cron secret or an admin JWT
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization') ?? '';
    const providedSecret = req.headers.get('x-cron-secret') ?? '';

    const isCronCall = cronSecret && providedSecret === cronSecret;
    let isAdmin = false;

    if (!isCronCall) {
      // Fall back to JWT admin check
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const admin = createClient(supabaseUrl, serviceKey);
        const { data } = await admin.from('user_roles')
          .select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
        isAdmin = !!data;
      }
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Collect IDs to purge
    const { data: rows, error: selectErr } = await admin
      .from('job_applications')
      .select('id')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoff);

    if (selectErr) throw selectErr;

    const ids = (rows ?? []).map((r: { id: string }) => r.id);

    if (ids.length === 0) {
      return new Response(JSON.stringify({ success: true, purged: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Purge child tables first (in case FK constraints are not CASCADE DELETE)
    const childTables = [
      'resume_revisions', 'cover_letter_revisions', 'dashboard_revisions',
      'roadmap_revisions', 'raid_log_revisions', 'architecture_diagram_revisions',
      'executive_report_revisions', 'generated_asset_revisions',
      'generated_assets', 'proposed_assets', 'pipeline_stage_history',
      'asset_download_signals',
    ];
    for (const table of childTables) {
      await admin.from(table).delete().in('application_id', ids);
    }

    // Hard-delete the applications themselves
    const { error: deleteErr } = await admin
      .from('job_applications')
      .delete()
      .in('id', ids);

    if (deleteErr) throw deleteErr;

    console.log(`[purge-deleted-data] Purged ${ids.length} application(s) deleted before ${cutoff}`);
    return new Response(JSON.stringify({ success: true, purged: ids.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[purge-deleted-data] Error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
