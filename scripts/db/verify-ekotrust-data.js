import process from "node:process";
import pg from "pg";

const { Client } = pg;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to verify EkoTrust data.");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const result = await client.query(`
      SELECT
        (SELECT COUNT(1)::int FROM artisan_profiles) AS profiles,
        (SELECT COUNT(1)::int FROM work_proofs) AS proofs,
        (
          SELECT COUNT(1)::int
          FROM schema_migrations
          WHERE filename = '004_ekotrust_reputation_schema.sql'
        ) AS migration_applied
    `);
    console.log(JSON.stringify(result.rows[0]));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
