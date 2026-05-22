CREATE TABLE IF NOT EXISTS incident_events_archive (
  LIKE incident_events INCLUDING ALL
);

CREATE INDEX IF NOT EXISTS incident_events_payload_gin ON incident_events USING GIN (payload);

CREATE MATERIALIZED VIEW IF NOT EXISTS incident_replay_latest AS
SELECT DISTINCT ON (incident_id)
  incident_id,
  sequence,
  event_type,
  payload,
  recorded_at
FROM incident_events
ORDER BY incident_id, sequence DESC;

CREATE INDEX IF NOT EXISTS incident_replay_latest_incident_idx ON incident_replay_latest (incident_id);
