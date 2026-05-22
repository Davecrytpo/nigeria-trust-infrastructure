# Data Model V1

Status: Aligned with Master Architecture & Operational Blueprint.

## Core Entities

### users
- id (UUID)
- phone_number (Unique)
- full_name
- **trust_score** (Decimal)
- **device_id** (String)
- **verification_status** (Enum: PENDING, VERIFIED, SUSPENDED)
- primary_role (Enum: RESIDENT, RESPONDER, OPERATOR)
- created_at

### incidents (Section 6)
- id (UUID)
- requester_id (FK: users)
- **incident_type** (Enum: FIRE, HELP, KIDNAP, ROBBERY, MEDICAL)
- **entry_method** (Enum: APP, SMS, PANIC, VOICE, COMMUNITY)
- **severity** (Enum: LOW, MEDIUM, HIGH, CRITICAL)
- **location** (PostGIS Geometry: Point)
- **nearby_landmarks** (Text)
- **device_context** (JSONB: OS, Version, Battery, etc.)
- current_status (Enum: DETECTED, VALIDATING, COORDINATING, ESCALATED, TRACKING, RESOLVED)
- created_at
- closed_at

### address_nodes (Section 9)
- id (UUID)
- **smart_address** (Unique String)
- **coordinates** (PostGIS Geometry: Point)
- **building_pin** (JSONB: Polyline/Polygon)
- neighborhood_id (FK: neighborhoods)
- landmark_description (Text)

### responder_profiles (Section 2)
- user_id (FK: users)
- **responder_tier** (Enum: TIER_1_COMMUNITY, TIER_2_INSTITUTIONAL)
- **specialties** (Array: FIRE, MEDICAL, etc.)
- **assigned_territory** (PostGIS Geometry: Polygon)
- availability_status (Boolean)
- last_active_at

### community_alerts (Section 8)
- id (UUID)
- neighborhood_id (FK: neighborhoods)
- **alert_type** (Enum: ROBBERY, FLOOD, BLACKOUT, ROAD_BLOCKAGE, DANGER, BROADCAST)
- message (Text)
- **priority** (Enum: NORMAL, URGENT)
- expires_at

### audit_logs (Section 10)
- id (UUID)
- actor_id (FK: users)
- **action_type** (Enum: ACCESS, EDIT, STATUS_CHANGE, OVERRIDE)
- **target_entity** (String)
- **target_id** (UUID)
- metadata (JSONB)
- created_at

## Design Principles
- **Geospatial First:** All location data must use PostGIS types (Point, Polygon) for precise routing and navigation.
- **Trust-Centric:** Trust scores and verification statuses are mandatory for all coordination logic.
- **Auditability:** Every state transition in the `incidents` table must trigger an `audit_log` entry.
- **Offline Compatibility:** Address nodes should be cacheable for offline lookup and routing.
