import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

function readFlag(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files.sort();
}

async function sha256File(path) {
  const hash = createHash("sha256");
  hash.update(await readFile(path));
  return hash.digest("hex");
}

async function main() {
  const evidenceDir = readFlag("evidence-dir", "reports");
  await stat(evidenceDir);
  const files = await walk(evidenceDir);
  const manifest = {
    generatedAt: new Date().toISOString(),
    evidenceDir,
    files: []
  };

  for (const file of files) {
    if (file.endsWith("manifest.json")) continue;
    manifest.files.push({
      path: file,
      sha256: await sha256File(file)
    });
  }

  const manifestHash = createHash("sha256")
    .update(JSON.stringify(manifest.files))
    .digest("hex");
  manifest.manifestSha256 = manifestHash;

  const output = join(evidenceDir, "manifest.json");
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`evidence manifest: ${output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
