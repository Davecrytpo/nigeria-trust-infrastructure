# MVP Scope

Status: Aligned with Master Architecture & Operational Blueprint.

## Scope Statement

The MVP is the foundation for a large-scale societal coordination infrastructure, starting with a high-reliability pilot in Yaba, Lagos.

## In Scope

### 1. Emergency Entry Methods (Section 3)
- **SOS Button:** Primary app interface for immediate help.
- **SMS Gateway:** Support for keywords: `FIRE`, `HELP`, `KIDNAP`, `ROBBERY`, `MEDICAL`.
- **Silent Panic System (Section 4):** Concept verification for power button/volume key triggers.
- **Community Reporting:** Ability for residents to report incidents they witness.

### 2. Core Infrastructure Layers
- **Trust:** Identity capture and verification for responders.
- **Human:** Basic responder notification and assignment flow.
- **Address:** Smart address capture and building pins for Yaba pilot zone.
- **Emergency:** Incident lifecycle from detection to resolution.

### 3. Community Coordination (Section 8)
- Broadcast alerts for: `ROBBERY`, `FLOOD`, `BLACKOUT`, `ROAD BLOCKAGE`.

### 4. Response Nodes (Section 7)
- Web-based dashboard for early response partners (clinics/police).

## Incident Types (Based on Section 5)
- **FIRE**
- **MEDICAL** (HELP/MEDICAL)
- **KIDNAP**
- **ROBBERY**
- **GENERAL HELP**

## Out Of Scope
- Voice activation (Phase 2)
- Sensor/Wearable integration (Long-term)
- Urban Intelligence (Heatmaps/Predictive analysis)
- National rollout (Beyond Yaba)
- Drone response systems

## Core Resident Flows
1. **Multi-Channel Alert:** SOS button or SMS keyword.
2. **Silent Panic:** Hidden activation (prototype level).
3. **Address Sharing:** Precise building pin/landmark capture.
4. **Community Awareness:** Receiving neighborhood alerts for nearby dangers.

## Core Responder Flows
1. **Verification:** Submission of trust documents.
2. **Local Coordination:** Receiving alerts within assigned territory.
3. **Response Tracking:** Real-time status updates (Heading, Arrived, Resolved).

## Non-Functional Requirements (Section 12)
- **Simplicity:** Large buttons, 3-tap alert flow.
- **Low Data:** Minimal payload for high-latency environments.
- **Reliability:** SMS fallback when data is unavailable.
- **Security:** Immutable audit logs and trust scoring.
