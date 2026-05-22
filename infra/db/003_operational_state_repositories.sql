CREATE TABLE IF NOT EXISTS responders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  responder_type TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  availability TEXT NOT NULL DEFAULT 'available',
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  territory TEXT NOT NULL,
  supported_incident_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  last_known_location GEOGRAPHY(POINT, 4326),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS responders_type_availability_idx ON responders (responder_type, availability, verification_status);
CREATE INDEX IF NOT EXISTS responders_location_gix ON responders USING GIST (last_known_location);

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS assigned_responder_id UUID REFERENCES responders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS operator_owner_ref TEXT,
  ADD COLUMN IF NOT EXISTS ownership_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS degraded_state TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS client_mutation_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS incidents_client_mutation_id_idx
  ON incidents (client_mutation_id)
  WHERE client_mutation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_ref TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator',
  status TEXT NOT NULL DEFAULT 'offline',
  active_queue TEXT NOT NULL DEFAULT 'yaba-primary',
  current_load INTEGER NOT NULL DEFAULT 0,
  shift_started_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operators_queue_status_idx ON operators (active_queue, status, current_load);

CREATE TABLE IF NOT EXISTS operator_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  queue_name TEXT NOT NULL DEFAULT 'yaba-primary',
  priority INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'queued',
  owner_operator_ref TEXT,
  locked_until TIMESTAMPTZ,
  starvation_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operator_queue_routing_idx ON operator_queue_items (queue_name, status, priority DESC, starvation_score DESC, created_at ASC);
CREATE UNIQUE INDEX IF NOT EXISTS operator_queue_open_incident_idx ON operator_queue_items (incident_id) WHERE status IN ('queued', 'locked');

CREATE TABLE IF NOT EXISTS trust_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_ref TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending',
  risk_score NUMERIC(5,3) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS trust_reviews_status_created_idx ON trust_reviews (review_status, created_at ASC);

CREATE TABLE IF NOT EXISTS degraded_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_ref TEXT NOT NULL,
  state TEXT NOT NULL,
  reason TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ,
  evidence JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS degraded_state_region_active_idx ON degraded_state_history (region_ref, state) WHERE exited_at IS NULL;

CREATE TABLE IF NOT EXISTS presence_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_ref TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '45 seconds',
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE (actor_ref, actor_type)
);

CREATE INDEX IF NOT EXISTS presence_sessions_active_idx ON presence_sessions (actor_type, status, expires_at DESC);
