import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendCivicIntegrityPosture } from "../../services/api-prototype/src/lib/civic-integrity.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-civic-integrity-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Civic integrity drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendCivicIntegrityPosture(scenario.input);
  const pass = result.posture === scenario.expectedPosture;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected posture: ${scenario.expectedPosture}`);
  console.log(`  posture: ${result.posture}`);
  console.log(`  risk score: ${result.riskScore}`);
  console.log(`  power: ${result.power.powerBand}`);
  console.log(`  surveillance: ${result.surveillance.driftBand}`);
  console.log(`  bypass: ${result.bypass.bypassBand}`);
  console.log(`  political pressure: ${result.political.pressureBand}`);
  console.log(`  rights: ${result.rights.rightsBand}`);
  console.log(`  oversight: ${result.oversight.oversightBand}`);
  console.log(`  boundary: ${result.certificationBoundary}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Civic integrity drill produced unsafe or unexpected integrity posture.");
  process.exit(1);
}
