import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendOperationalMemoryPosture } from "../../services/api-prototype/src/lib/operational-memory.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-operational-memory-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Operational memory drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendOperationalMemoryPosture(scenario.input);
  const pass = result.posture === scenario.expectedPosture;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected posture: ${scenario.expectedPosture}`);
  console.log(`  posture: ${result.posture}`);
  console.log(`  uncertainty score: ${result.uncertaintyScore}`);
  console.log(`  model drift: ${result.divergence.driftBand}`);
  console.log(`  false normalization: ${result.normalization.normalizationBand}`);
  console.log(`  chronic regions: ${result.fingerprints.chronicRegions.map((region) => region.id).join(", ") || "none"}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Operational memory drill produced unsafe or unexpected posture.");
  process.exit(1);
}
