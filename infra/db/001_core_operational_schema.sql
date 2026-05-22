CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_status') THEN
    CREATE TYPE incident_status AS ENUM ('awaiting-response', 'dispatching', 'resolved', 'escalated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') THEN
    CREATE TYPE delivery_status AS ENUM ('queued', 'retrying', 'sent', 'delivered', 'failed', 'dead-lettered', 'unknown');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_ref TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status incident_status NOT NULL DEFAULT 'awaiting-response',
  location_note TEXT NOT NULL,
  precise_location GEOGRAPHY(POINT, 4326),
  neighborhood_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS incidents_created_at_idx ON incidents (created_at DESC);
CREATE INDEX IF NOT EXISTS incidents_status_created_idx ON incidents (status, created_at DESC);
CREATE INDEX IF NOT EXISTS incidents_location_gix ON incidents USING GIST (precise_location);

CREATE TABLE IF NOT EXISTS incident_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  sequence BIGSERIAL NOT NULL,
  event_type TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS incident_events_incident_sequence_idx ON incident_events (incident_id, sequence);
CREATE INDEX IF NOT EXISTS incident_events_recorded_at_idx ON incident_events (recorded_at DESC);

CREATE TABLE IF NOT EXISTS delivery_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  provider_order TEXT[] NOT NULL DEFAULT ARRAY['twilio', 'africas-talking', 'infobip'],
  status delivery_status NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_outbox_due_idx ON delivery_outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS delivery_outbox_incident_idx ON delivery_outbox (incident_id);

CREATE TABLE IF NOT EXISTS telecom_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_message_id TEXT NOT NULL,
  status TEXT NOT NULL,
  recipient TEXT,
  latency_ms INTEGER,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (provider, provider_message_id, status)
);

CREATE INDEX IF NOT EXISTS telecom_receipts_provider_received_idx ON telecom_receipts (provider, received_at DESC);

CREATE TABLE IF NOT EXISTS dead_letter_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_delivery_id UUID,
  incident_id UUID,
  reason TEXT NOT NULL,
  payload JSONB NOT NULL,
  dead_lettered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_ref TEXT NOT NULL,
  action TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  previous_hash TEXT,
  record_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_records_subject_created_idx ON audit_records (subject_ref, created_at DESC);
