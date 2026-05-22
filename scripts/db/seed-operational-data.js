import process from "node:process";
import pg from "pg";

const { Client } = pg;

const responders = [
  {
    fullName: "Tade Bakare",
    responderType: "community",
    trustScore: 96,
    supportedIncidentTypes: ["medical", "security", "fire"]
  },
  {
    fullName: "Ife Akinyemi",
    responderType: "medical",
    trustScore: 94,
    supportedIncidentTypes: ["medical"]
  },
  {
    fullName: "Kemi Omotoso",
    responderType: "security",
    trustScore: 91,
    supportedIncidentTypes: ["security"]
  },
  {
    fullName: "Femi Adewale",
    responderType: "fire",
    trustScore: 90,
    supportedIncidentTypes: ["fire"]
  }
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed operational data.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    for (const responder of responders) {
      await client.query(
        `
          INSERT INTO responders (
            full_name,
            responder_type,
            verification_status,
            availability,
            trust_score,
            territory,
            supported_incident_types,
            last_seen_at
          )
          SELECT $1, $2, 'verified', 'available', $3, 'Yaba, Lagos', $4, now()
          WHERE NOT EXISTS (
            SELECT 1 FROM responders WHERE full_name = $1 AND territory = 'Yaba, Lagos'
          )
        `,
        [responder.fullName, responder.responderType, responder.trustScore, responder.supportedIncidentTypes]
      );
    }

    await client.query(
      `
        INSERT INTO operators (operator_ref, display_name, role, status, active_queue, shift_started_at, last_seen_at)
        VALUES
          ('yaba-ops-1', 'Yaba Operator 1', 'operator', 'online', 'yaba-primary', now(), now()),
          ('yaba-supervisor-1', 'Yaba Supervisor 1', 'supervisor', 'online', 'yaba-primary', now(), now())
        ON CONFLICT (operator_ref) DO UPDATE
        SET status = EXCLUDED.status,
            last_seen_at = now()
      `
    );

    console.log(`seeded responders=${responders.length} operators=2`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
