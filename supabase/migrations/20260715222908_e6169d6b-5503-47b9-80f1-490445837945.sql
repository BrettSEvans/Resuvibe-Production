
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question text NOT NULL,
  competency text NOT NULL DEFAULT 'General',
  modality text NOT NULL DEFAULT 'behavioral',
  leadership_principle text,
  rubric_anchors jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  source_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_questions TO authenticated;
GRANT ALL ON public.interview_questions TO service_role;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own interview questions" ON public.interview_questions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_iq_app ON public.interview_questions(application_id, is_active, order_index);

CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'inProgress',
  overall_score int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own interview sessions" ON public.interview_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.interview_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question_text text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  attempt_number int NOT NULL DEFAULT 1,
  answer_text text NOT NULL,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  dimensions jsonb NOT NULL DEFAULT '[]'::jsonb,
  score int NOT NULL DEFAULT 0,
  is_counted boolean NOT NULL DEFAULT false,
  prior_turn_id uuid REFERENCES public.interview_turns(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_turns TO authenticated;
GRANT ALL ON public.interview_turns TO service_role;
ALTER TABLE public.interview_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own interview turns" ON public.interview_turns
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_it_session_q ON public.interview_turns(session_id, question_id);

CREATE TABLE public.user_entitlements (
  user_id uuid PRIMARY KEY,
  subscription_tier text NOT NULL DEFAULT 'free',
  trial_used_at timestamptz,
  trial_application_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_entitlements TO authenticated;
GRANT ALL ON public.user_entitlements TO service_role;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own entitlement" ON public.user_entitlements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own entitlement" ON public.user_entitlements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_iq_updated BEFORE UPDATE ON public.interview_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_is_updated BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ue_updated BEFORE UPDATE ON public.user_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
