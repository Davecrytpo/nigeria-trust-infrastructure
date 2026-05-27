DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'artisan_trade') THEN
    CREATE TYPE artisan_trade AS ENUM (
      'ELECTRICIAN',
      'PLUMBER',
      'AC_TECHNICIAN',
      'CARPENTER',
      'PAINTER',
      'MECHANIC'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ekotrust_verification_level') THEN
    CREATE TYPE ekotrust_verification_level AS ENUM (
      'BRONZE',
      'SILVER',
      'GOLD',
      'PLATINUM'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_proof_status') THEN
    CREATE TYPE work_proof_status AS ENUM (
      'PENDING_AI_REVIEW',
      'AI_PASSED',
      'PEER_CONFIRMED',
      'FLAGGED'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attestation_decision') THEN
    CREATE TYPE attestation_decision AS ENUM (
      'APPROVE',
      'REJECT',
      'FLAG'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS artisan_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  trade artisan_trade NOT NULL,
  community TEXT NOT NULL,
  location TEXT NOT NULL,
  verification_level ekotrust_verification_level NOT NULL DEFAULT 'BRONZE',
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  completion_rate INTEGER NOT NULL DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  verified_jobs INTEGER NOT NULL DEFAULT 0 CHECK (verified_jobs >= 0),
  peer_attestations INTEGER NOT NULL DEFAULT 0 CHECK (peer_attestations >= 0),
  public_handle TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  identity_confidence INTEGER NOT NULL DEFAULT 0 CHECK (identity_confidence >= 0 AND identity_confidence <= 100),
  peer_validation INTEGER NOT NULL DEFAULT 0 CHECK (peer_validation >= 0 AND peer_validation <= 100),
  customer_reviews INTEGER NOT NULL DEFAULT 0 CHECK (customer_reviews >= 0 AND customer_reviews <= 100),
  work_consistency INTEGER NOT NULL DEFAULT 0 CHECK (work_consistency >= 0 AND work_consistency <= 100),
  activity_history INTEGER NOT NULL DEFAULT 0 CHECK (activity_history >= 0 AND activity_history <= 100),
  fraud_confidence INTEGER NOT NULL DEFAULT 0 CHECK (fraud_confidence >= 0 AND fraud_confidence <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artisan_profiles_trade_location_idx
  ON artisan_profiles (trade, location);

CREATE INDEX IF NOT EXISTS artisan_profiles_score_idx
  ON artisan_profiles (trust_score DESC, verification_level);

CREATE TABLE IF NOT EXISTS work_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisan_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  before_media_count INTEGER NOT NULL DEFAULT 0 CHECK (before_media_count >= 0),
  after_media_count INTEGER NOT NULL DEFAULT 0 CHECK (after_media_count >= 0),
  status work_proof_status NOT NULL DEFAULT 'PENDING_AI_REVIEW',
  image_quality INTEGER NOT NULL DEFAULT 0 CHECK (image_quality >= 0 AND image_quality <= 100),
  duplicate_risk INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_risk >= 0 AND duplicate_risk <= 100),
  fraud_risk INTEGER NOT NULL DEFAULT 0 CHECK (fraud_risk >= 0 AND fraud_risk <= 100),
  category_confidence INTEGER NOT NULL DEFAULT 0 CHECK (category_confidence >= 0 AND category_confidence <= 100),
  gps_consistency INTEGER NOT NULL DEFAULT 0 CHECK (gps_consistency >= 0 AND gps_consistency <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_proofs_artisan_created_idx
  ON work_proofs (artisan_id, created_at DESC);

CREATE INDEX IF NOT EXISTS work_proofs_status_idx
  ON work_proofs (status, created_at DESC);

CREATE TABLE IF NOT EXISTS work_proof_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id UUID NOT NULL REFERENCES work_proofs(id) ON DELETE CASCADE,
  media_role TEXT NOT NULL CHECK (media_role IN ('before', 'after', 'supporting')),
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  storage_provider TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size > 0),
  width INTEGER,
  height INTEGER,
  duration_ms INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (storage_provider, storage_key),
  UNIQUE (content_hash, proof_id)
);

CREATE INDEX IF NOT EXISTS work_proof_media_proof_idx
  ON work_proof_media (proof_id, media_role);

CREATE TABLE IF NOT EXISTS peer_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisan_profiles(id) ON DELETE CASCADE,
  proof_id UUID REFERENCES work_proofs(id) ON DELETE SET NULL,
  attester_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  decision attestation_decision NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS peer_attestations_artisan_created_idx
  ON peer_attestations (artisan_id, created_at DESC);

CREATE INDEX IF NOT EXISTS peer_attestations_proof_idx
  ON peer_attestations (proof_id);

CREATE TABLE IF NOT EXISTS trust_score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES artisan_profiles(id) ON DELETE CASCADE,
  previous_score INTEGER NOT NULL CHECK (previous_score >= 0 AND previous_score <= 100),
  new_score INTEGER NOT NULL CHECK (new_score >= 0 AND new_score <= 100),
  reason TEXT NOT NULL,
  signal_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trust_score_events_artisan_created_idx
  ON trust_score_events (artisan_id, created_at DESC);

INSERT INTO artisan_profiles (
  id,
  full_name,
  phone_number,
  trade,
  community,
  location,
  verification_level,
  trust_score,
  completion_rate,
  verified_jobs,
  peer_attestations,
  public_handle,
  qr_payload,
  identity_confidence,
  peer_validation,
  customer_reviews,
  work_consistency,
  activity_history,
  fraud_confidence
)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Chinedu Okafor',
  '+2348011112222',
  'ELECTRICIAN',
  'Yaba Artisan Circle',
  'Lagos Mainland',
  'GOLD',
  86,
  96,
  47,
  18,
  'ekotrust.ng/chinedu-okafor',
  'https://ekotrust.ng/chinedu-okafor',
  92,
  88,
  90,
  86,
  82,
  94
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_proofs (
  id,
  artisan_id,
  title,
  category,
  location,
  before_media_count,
  after_media_count,
  status,
  image_quality,
  duplicate_risk,
  fraud_risk,
  category_confidence,
  gps_consistency,
  created_at
)
VALUES
  (
    '22222222-2222-4222-8222-222222222221',
    '11111111-1111-4111-8111-111111111111',
    'Lekki apartment rewiring',
    'Electrical repair',
    'Lekki Phase 1',
    3,
    4,
    'PEER_CONFIRMED',
    94,
    4,
    3,
    91,
    88,
    '2026-05-20T10:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'Inverter fault repair',
    'Power systems',
    'Yaba',
    2,
    2,
    'AI_PASSED',
    88,
    6,
    5,
    89,
    92,
    '2026-05-22T13:00:00Z'
  )
ON CONFLICT (id) DO NOTHING;
