import process from "node:process";

const bucket = process.env.SUPABASE_WORK_PROOF_BUCKET ?? "ekotrust-work-proofs";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const baseUrl = supabaseUrl.replace(/\/$/, "");
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };

  const getResponse = await fetch(`${baseUrl}/storage/v1/bucket/${bucket}`, {
    headers,
  });
  if (getResponse.ok) {
    console.log(JSON.stringify({ bucket, status: "exists" }));
    return;
  }

  const createResponse = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: false,
      file_size_limit: 26214400,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
    }),
  });

  if (!createResponse.ok) {
    const body = await createResponse.text();
    throw new Error(`Unable to create Supabase bucket: ${createResponse.status} ${body}`);
  }

  console.log(JSON.stringify({ bucket, status: "created" }));
}

main().catch((error) => {
  console.error(error?.stack ?? error?.message ?? String(error));
  process.exit(1);
});
