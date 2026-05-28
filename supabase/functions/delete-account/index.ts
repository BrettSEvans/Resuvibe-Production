import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { makeCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the caller's identity with the anon client
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Use the service-role client for privileged deletes
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Hard-delete all user data in dependency order
    const tables = [
      // Revision tables (FK → job_applications)
      'resume_revisions',
      'cover_letter_revisions',
      'dashboard_revisions',
      'roadmap_revisions',
      'raid_log_revisions',
      'architecture_diagram_revisions',
      'executive_report_revisions',
      'generated_asset_revisions',
      // Asset tables
      'generated_assets',
      'proposed_assets',
      // Activity tables
      'pipeline_stage_history',
      'asset_download_signals',
      'generation_usage',
      // Core application data
      'job_applications',
      // Profile
      'profiles',
    ];

    for (const table of tables) {
      const col = table === 'job_applications' || table === 'profiles' ? 'id' : 'user_id';
      const filterCol = table === 'profiles' ? 'id' : 'user_id';

      if (table === 'job_applications') {
        // Delete via user_id (all rows, including soft-deleted ones)
        const { error } = await admin.from(table).delete().eq('user_id', userId);
        if (error) console.error(`[delete-account] Failed to delete from ${table}:`, error.message);
      } else if (table === 'profiles') {
        const { error } = await admin.from(table).delete().eq('id', userId);
        if (error) console.error(`[delete-account] Failed to delete from ${table}:`, error.message);
      } else {
        // For child tables linked via application_id, we need to cascade through job_applications
        // These were already handled by DB cascades if set up; otherwise delete directly
        const { error } = await admin.from(table).delete().eq('user_id', userId);
        if (error) {
          // Child tables may use application_id — attempt that column
          const { error: e2 } = await admin
            .from(table)
            .delete()
            .in(
              'application_id',
              (await admin.from('job_applications').select('id').eq('user_id', userId)).data?.map((r: { id: string }) => r.id) ?? []
            );
          if (e2) console.error(`[delete-account] Failed to delete from ${table} (app cascade):`, e2.message);
        }
      }
    }

    // Delete user roles
    await admin.from('user_roles').delete().eq('user_id', userId);

    // Finally, delete the auth user itself (requires service role)
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.error('[delete-account] Failed to delete auth user:', authDeleteError.message);
      return new Response(JSON.stringify({ error: 'Failed to delete auth user: ' + authDeleteError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[delete-account] Successfully deleted user ${userId}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[delete-account] Unexpected error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
