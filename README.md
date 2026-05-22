# Nigeria Trust and Emergency Infrastructure

This workspace is the operating record for the **Nigeria Emergency, Trust & Human Infrastructure System**. It is a large-scale societal coordination infrastructure designed to improve emergency response, trust systems, and local safety across Nigeria and Africa.

## Project Vision (Section 1)

To build a digital coordination layer for society, established through five foundational pillars: **Trust**, **Emergency**, **Community**, **Address**, and **Urban Intelligence**.

## Current State

- **Source:** Full recovery of the 15-section Master Architecture & Operational Blueprint (2026-05-20).
- **Foundation:** All product, architecture, and operational documents are strictly aligned with the master blueprint.
- **Prototype:** A runnable "Proof of Concept" (Resident PWA + Ops Console) is available to demonstrate basic incident flows.
- **Roadmap:** The project has entered Infrastructure Execution Phase. The priority is now operational reliability, field validation, governance, and survivability under Nigerian conditions.

## Technical Alignment (Section 11)

The project is transitioning to the master technical stack:
- **Frontend:** Flutter (Android-first).
- **Backend:** Node.js / NestJS.
- **Database:** PostgreSQL / PostGIS.
- **Communication:** WebSockets and SMS Gateway.

## Local Prototype (PoC)

The repository currently includes a web-based "Proof of Concept":
- **Resident App:** served at `/`
- **Ops Console:** served at `/ops`
- **API:** served from `services/api/src/server.js`
- **Persistent State:** `data/state.json`

Run it with:
```bash
npm.cmd start
```

Operator routes require the access key: `yaba-ops-demo-key`.

## Field Survivability Drills

Run the deterministic Yaba field-readiness gate with:

```bash
npm.cmd run field:test
```

The current baseline is intentionally strict and may fail until offline recovery, Android survivability, SMS failover, and surge coordination are hardened. Readiness findings are tracked in `docs/field-testing/yaba-readiness-findings.md`.

Run the harsher operational stress gate with:

```bash
npm.cmd run field:stress
```

Stress findings are tracked in `docs/field-testing/yaba-operational-stress-findings.md`.

Run integrated convergence drills with:

```bash
npm.cmd run field:convergence
```

Convergence findings are tracked in `docs/field-testing/system-convergence-findings.md`.

Run adaptive resilience drills with:

```bash
npm.cmd run field:adaptive
```

These validate whether the system recommends cautious recovery behavior under repeated instability, propagation, and human uncertainty.

Run strategic maturity drills with:

```bash
npm.cmd run field:maturity
```

These validate long-horizon trust durability, institutional reliability, regional readiness, and governance posture.

Run civic governance drills with:

```bash
npm.cmd run field:governance
```

These validate pre-deployment decisions, civic trust safeguards, liability controls, and safe pilot governance.

Run limited pilot preparation drills with:

```bash
npm.cmd run field:pilot
```

These validate pilot scope limits, human preparation, live observability, field safety constraints, and telecom field assumptions.

Run pre-certification operational validation with:

```bash
npm.cmd run field:certify
```

These validate observed field truth, blind-spot discovery, human factors, governance durability, and certification state.

Run controlled reality-validation drills with:

```bash
npm.cmd run field:reality
```

These validate whether limited field experiments remain supervised, reversible, observable, and governed by observed reality rather than simulated assumptions.

Run operational memory accumulation drills with:

```bash
npm.cmd run field:memory
```

These validate longitudinal operational reality collection, model drift detection, chronic instability fingerprints, and false-normalization safeguards.

Run epistemic resilience drills with:

```bash
npm.cmd run field:epistemic
```

These validate decision humility, memory aging, contradiction-aware reasoning, multi-perspective truth comparison, and historical overconfidence detection.

Run controlled live operationalization drills with:

```bash
npm.cmd run field:live
```

These validate low-risk live pilot limits, telecom truth acquisition, human behavior observation, governance friction, incident review discipline, and the non-certifying live-learning boundary.

Run long-duration civic field evolution drills with:

```bash
npm.cmd run field:evolution
```

These validate slow operational drift, chronic degraded-state normalization, fatigue accumulation, telecom evolution, governance erosion, trust degradation, and continuity fragility.

Run civic legibility drills with:

```bash
npm.cmd run field:legibility
```

These validate human-readable decision explanations, uncertainty visibility, governance interpretability, community trust notices, conflicting reality communication, and accountability traces.

Run civic integrity drills with:

```bash
npm.cmd run field:integrity
```

These validate resistance to authority centralization, surveillance drift, governance bypass, political pressure, rights erosion, and weak oversight.

Run civic sustainability drills with:

```bash
npm.cmd run field:sustainability
```

These validate maintenance continuity, economic survivability, fatigue accumulation, community trust evolution, dependency fragility, governance renewal, infrastructure minimalism, cultural adaptation, and recovery sustainability.

Run adaptive legitimacy drills with:

```bash
npm.cmd run field:legitimacy
```

These validate mission drift detection, technology restraint, complexity control, principle preservation, societal alignment, evolutionary oversight, and anti-permanent-emergency protections.

Run civilizational stability drills with:

```bash
npm.cmd run field:civilization
```

These validate systemic societal interaction, panic dynamics, dependency balance, behavioral adaptation, intergenerational legitimacy, institutional interaction, resilience amplification, and safe failure containment.

Run existential civic safety drills with:

```bash
npm.cmd run field:existential
```

These validate irreversibility risk, civic self-sufficiency, catastrophic failure survivability, anti-monopoly coordination, reversible infrastructure, civilizational coupling, redundant societal capability, power limits, and post-infrastructure survivability.

## Operational Infrastructure Execution

The project has now pivoted from additional abstraction layers toward real deployment execution. Current infrastructure scaffolding includes:

- `Dockerfile` for the prototype API, resident PWA, ops console, and shared assets.
- `compose.production.yaml` for API, Redis append-only event pipeline, and PostGIS.
- `infra/k8s/` manifests for API horizontal scaling, Redis durability, PostGIS persistence, and runtime secrets.
- `infra/db/` migrations for PostGIS incidents, replay events, delivery outbox, telecom receipts, dead letters, and immutable audit records.
- Postgres-backed runtime store activated by `DATABASE_URL`; file-backed state remains only as local fallback.
- Redis delivery worker and Redis rebuild recovery scripts for distributed execution hardening.
- Durable operator queue claim/release/reassign endpoints with Postgres row-locking in production.
- Field gate controls for offline queue durability, SMS failover, receipt reconciliation, Android app-kill recovery, operator surge routing, responder balancing, trust abuse quarantine, and convergence recovery.

The execution target is now direct improvement of:

```bash
npm.cmd run field:test
npm.cmd run field:stress
npm.cmd run field:convergence
```

Apply database migrations with:

```bash
npm.cmd run db:migrate
```

Seed Yaba responders/operators into Postgres with:

```bash
npm.cmd run db:seed
```

Run the delivery worker with:

```bash
npm.cmd run worker:delivery
```

Rebuild Redis streams from Postgres after Redis loss with:

```bash
npm.cmd run recovery:redis
```

Run the live distributed runtime validation drill with Docker installed:

```bash
npm.cmd run runtime:validate
```

Run controlled failure drills with Docker installed:

```bash
npm.cmd run runtime:failure-drills
```

Start the observability stack alongside the runtime stack:

```bash
docker compose -f compose.production.yaml -f compose.observability.yaml up -d
```

## Project Structure

- `apps/resident-pwa/`: Web-based resident interface (PoC).
- `apps/ops-console/`: Web-based operator dashboard (PoC).
- `services/api/`: Node.js prototype API.
- `packages/shared-types/`: Shared domain definitions.
- `docs/`: Comprehensive project documentation (Aligned with Blueprint).
- `source/raw/`: Original Master Architecture PDF.

## Immediate Next Steps

1. **Field Testing:** Expand Yaba survivability drills into live device, telecom, responder, and operator exercises.
2. **Offline Recovery:** Implement durable client queues, duplicate-safe replay, and canonical event ordering.
3. **Operational Readiness:** Train operators and responders against the manuals, playbooks, escalation rules, and audit workflow.
4. **Reliability Hardening:** Add SMS provider failover, queue durability, telemetry, and disaster-mode scaling controls.
5. **Governance:** Enforce audit permissions, evidence retention, responder accountability, and privacy lifecycle controls.
