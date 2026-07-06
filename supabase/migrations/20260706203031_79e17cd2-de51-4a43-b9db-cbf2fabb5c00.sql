
-- 1. Marketing profile access: replace broad policy with a narrow view
DROP POLICY IF EXISTS "Marketing can read profiles for attribution" ON public.profiles;

CREATE OR REPLACE VIEW public.profiles_marketing_attribution
WITH (security_invoker = true) AS
SELECT
  id,
  created_at,
  updated_at,
  approval_status,
  referral_source
FROM public.profiles
WHERE public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'marketing'::app_role]);

REVOKE ALL ON public.profiles_marketing_attribution FROM PUBLIC, anon;
GRANT SELECT ON public.profiles_marketing_attribution TO authenticated;

-- Admins retain full profile access via the pre-existing 'Admins can read all profiles' policy.

-- 2. SECURITY DEFINER lockdown: revoke public/anon EXECUTE, grant only where needed
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_approval_status() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_story_comment_author() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_test_user_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.campaign_auto_approve(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_duplicate_trial_signup(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_soft_delete_user(uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_linked_or_self(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owns_application(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_active_resume(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_and_reassign_resume(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_sprint_story_counts() FROM PUBLIC;

-- Re-grant EXECUTE to `authenticated` only for helpers required by RLS or client RPC.
-- These are safe: they only act on rows the caller already owns (auth.uid()).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_linked_or_self(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_active_resume(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_and_reassign_resume(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sprint_story_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_user(uuid) TO authenticated; -- guarded by has_role() inside

-- Note: handle_new_user, protect_approval_status, enforce_story_comment_author,
-- enforce_test_user_admin are trigger-only. campaign_auto_approve and
-- check_duplicate_trial_signup are server-only utilities not exposed to clients.
-- They intentionally have no anon/authenticated EXECUTE grant.

-- 3. Disable pg_graphql entirely (app uses PostgREST, not GraphQL)
DROP EXTENSION IF EXISTS pg_graphql CASCADE;
