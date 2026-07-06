
-- 1. story_comments: server-side authorship
ALTER TABLE public.story_comments ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE public.story_comments sc
SET user_id = s.user_id
FROM public.stories st
JOIN public.epics e ON st.epic_id = e.id
JOIN public.sprints s ON e.sprint_id = s.id
WHERE sc.story_id = st.id AND sc.user_id IS NULL;

-- If any rows still null (orphaned), delete them to allow NOT NULL
DELETE FROM public.story_comments WHERE user_id IS NULL;

ALTER TABLE public.story_comments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.story_comments ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE OR REPLACE FUNCTION public.enforce_story_comment_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_name text;
BEGIN
  NEW.user_id := auth.uid();
  SELECT COALESCE(NULLIF(display_name, ''), split_part(email, '@', 1), 'User')
    INTO v_name FROM public.profiles WHERE id = auth.uid();
  NEW.author_name := COALESCE(v_name, 'User');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_story_comment_author ON public.story_comments;
CREATE TRIGGER trg_enforce_story_comment_author
BEFORE INSERT ON public.story_comments
FOR EACH ROW EXECUTE FUNCTION public.enforce_story_comment_author();

REVOKE EXECUTE ON FUNCTION public.enforce_story_comment_author() FROM PUBLIC, anon, authenticated;

-- 2. test_users: enforce admin_id server-side
CREATE OR REPLACE FUNCTION public.enforce_test_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can manage test users';
  END IF;
  NEW.admin_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_test_user_admin ON public.test_users;
CREATE TRIGGER trg_enforce_test_user_admin
BEFORE INSERT OR UPDATE ON public.test_users
FOR EACH ROW EXECUTE FUNCTION public.enforce_test_user_admin();

REVOKE EXECUTE ON FUNCTION public.enforce_test_user_admin() FROM PUBLIC, anon, authenticated;

-- 3. job_applications: drop public exposure
DROP POLICY IF EXISTS "Public can view completed applications" ON public.job_applications;

-- 4. dashboard-assets bucket: owner-scoped writes, drop public listing
DROP POLICY IF EXISTS "Authenticated users can upload dashboard-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update dashboard-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete dashboard-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can read dashboard-assets" ON storage.objects;

CREATE POLICY "Users can upload own dashboard-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dashboard-assets' AND owner = auth.uid());

CREATE POLICY "Users can update own dashboard-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'dashboard-assets' AND owner = auth.uid())
WITH CHECK (bucket_id = 'dashboard-assets' AND owner = auth.uid());

CREATE POLICY "Users can delete own dashboard-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'dashboard-assets' AND owner = auth.uid());

-- Note: bucket remains public; direct URLs continue to resolve without SELECT policy,
-- but bucket listing via the API is blocked.

-- 5. Revoke EXECUTE on internal SECURITY DEFINER functions from anon (and, where safe,
--    from authenticated). Keep EXECUTE for helpers used in RLS policies or client RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_approval_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.campaign_auto_approve(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_duplicate_trial_signup(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_soft_delete_user(uuid) FROM PUBLIC, anon, authenticated;

-- Helpers used by RLS policies: revoke from anon (never needed pre-signin), keep for authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_linked_or_self(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_application(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_active_resume(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_and_reassign_resume(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_sprint_story_counts() FROM anon;

-- 6. Hide GraphQL schemas from anon/authenticated (app uses PostgREST, not GraphQL)
REVOKE USAGE ON SCHEMA graphql FROM anon, authenticated;
REVOKE USAGE ON SCHEMA graphql_public FROM anon, authenticated;
