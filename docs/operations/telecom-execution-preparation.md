# Telecom Execution Preparation

This document prepares real SMS provider execution. No telecom readiness is claimed until live sends, receipts, failover, and reconciliation artifacts exist.

## Provider Onboarding Checklist

- Twilio account approved for target destination numbers.
- Africa's Talking account approved for Nigerian SMS traffic.
- Infobip sender configured and approved.
- Sender IDs and from numbers documented.
- Billing method active.
- Test number owner consent recorded.
- Webhook callback URLs configured over HTTPS.
- Provider signature verification enabled where available.

## Webhook Exposure Requirements

- Public HTTPS endpoint.
- Stable DNS name.
- Provider-specific callback paths documented.
- Request body preserved for signature verification.
- Timestamp and provider message ID logged.
- Duplicate receipts retained as duplicate-suppression evidence.

## Test Number Workflow

1. Record test number owner consent.
2. Send one message per provider:

```bash
npm run telecom:validate-live -- --providers=twilio --to=<test-number>
npm run telecom:validate-live -- --providers=africas-talking --to=<test-number>
npm run telecom:validate-live -- --providers=infobip --to=<test-number>
```

3. Capture provider dashboard screenshots.
4. Capture webhook receipts.
5. Capture latency from submit to receipt.
6. Repeat with one provider disabled to validate failover routing.

## SMS Cost Estimation

Estimate before each pilot day:

- Expected incidents.
- Expected SMS per incident.
- Provider retry multiplier.
- Receipt callback volume.
- Daily cost ceiling.
- Emergency stop threshold when cost exceeds ceiling.

The estimate is operational planning only. Replace it with provider invoice and delivery data after testing.

## Failover Routing Verification

- Twilio primary, Africa's Talking secondary, Infobip tertiary.
- Africa's Talking primary, Infobip secondary.
- Infobip primary, Twilio secondary.
- One provider credential invalid.
- One provider timeout.
- Duplicate receipt from provider.
- Delayed receipt after failover.

Each scenario must produce a telecom report and reconciliation evidence.

## Provider Outage Procedure

1. Mark provider as degraded in the operator note.
2. Run provider-specific validation against the test number.
3. Route through remaining providers if receipts are valid.
4. If all providers fail, activate degraded mode or pilot shutdown.
5. Preserve logs, provider dashboard evidence, and receipt timelines.
