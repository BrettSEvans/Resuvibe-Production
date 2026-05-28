-- privacy_requests
-- Stores inbound emails received at privacy@resuvibe.ai via the inbound-email edge function.
-- Only admins can read or update rows; the edge function inserts via the service role.

CREATE TABLE public.privacy_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at   timestamptz NOT NULL DEFAULT now(),
  from_email    text        NOT NULL,
  from_name     text,
  subject       text        NOT NULL DEFAULT '',
  body_text     text,
  body_html     text,
  -- Automatically classified from subject/body keywords; can be corrected manually.
  request_type  text        NOT NULL DEFAULT 'other',
  -- Lifecycle: new → acknowledged → in_progress → resolved
  status        text        NOT NULL DEFAULT 'new',
  notes         text,
  resolved_at   timestamptz,
  resolved_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT privacy_requests_request_type_check
    CHECK (request_type IN ('erasure', 'access', 'portability', 'rectification', 'objection', 'other')),
  CONSTRAINT privacy_requests_status_check
    CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved'))
);

ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;

-- Admins can read all requests
CREATE POLICY "Admins can read privacy requests"
  ON public.privacy_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update status, notes, resolved_at, resolved_by
CREATE POLICY "Admins can update privacy requests"
  ON public.privacy_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- No public INSERT — the edge function uses the service role key to insert.
-- No DELETE — requests must be retained for compliance audit purposes.

-- Index for common admin queries
CREATE INDEX privacy_requests_status_idx   ON public.privacy_requests (status);
CREATE INDEX privacy_requests_received_idx ON public.privacy_requests (received_at DESC);
