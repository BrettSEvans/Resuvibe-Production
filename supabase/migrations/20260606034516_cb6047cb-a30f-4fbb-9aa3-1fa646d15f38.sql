
DROP POLICY IF EXISTS "Public can view demo application" ON public.job_applications;

CREATE POLICY "Public can view completed applications"
  ON public.job_applications
  FOR SELECT
  TO anon, authenticated
  USING (generation_status = 'complete' AND deleted_at IS NULL);
