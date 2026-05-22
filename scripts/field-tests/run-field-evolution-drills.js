import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendFieldEvolutionPosture } from "../../services/api-prototype/src/lib/field-evolution.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-field-evolution-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Field evolution drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendFieldEvolutionPosture(scenario.input);
  const pass = result.posture === scenario.expectedPosture;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected posture: ${scenario.expectedPosture}`);
  console.log(`  posture: ${result.posture}`);
  console.log(`  slow failure score: ${result.slowFailureScore}`);
  console.log(`  drift: ${result.drift.driftBand}`);
  console.log(`  normalization: ${result.normalization.normalizationBand}`);
  console.log(`  fatigue: ${result.fatigue.fatigueBand}`);
  console.log(`  telecom: ${result.telecom.telecomEvolutionBand}`);
  console.log(`  governance: ${result.governance.governanceDecayBand}`);
  console.log(`  trust: ${result.trust.trustErosionBand}`);
  console.log(`  continuity: ${result.continuity.continuityBand}`);
  console.log(`  boundary: ${result.certificationBoundary}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Field evolution drill produced unsafe or unexpected posture.");
  process.exit(1);
}
