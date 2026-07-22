
-- Revoke default PUBLIC EXECUTE on SECURITY DEFINER functions and grant only where needed.

-- Trigger functions: only fire via triggers, no user-callable EXECUTE needed
REVOKE ALL ON FUNCTION public.protect_approval_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_story_comment_author() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_test_user_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Internal helper used by other SECURITY DEFINER funcs / policies (runs as definer regardless)
REVOKE ALL ON FUNCTION public.campaign_auto_approve(uuid, text) FROM PUBLIC, anon, authenticated;

-- Helpers used inside RLS policies — policies evaluate as definer of the policy's owner,
-- but PostgREST-invoked queries still need authenticated to be able to reference them.
-- Restrict to authenticated only (drop PUBLIC/anon).
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_linked_or_self(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_linked_or_self(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_application(uuid) TO authenticated;

-- User-callable RPCs — keep executable by authenticated only, drop PUBLIC/anon
REVOKE ALL ON FUNCTION public.set_active_resume(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_and_reassign_resume(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_soft_delete_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_duplicate_trial_signup(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_sprint_story_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_active_resume(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_and_reassign_resume(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_duplicate_trial_signup(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sprint_story_counts() TO authenticated;
