import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { determineCertificationState } from "../../services/api-prototype/src/lib/precertification.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-precertification-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Pre-certification drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = determineCertificationState(scenario.input);
  const pass = result.certificationState === scenario.expectedState;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected state: ${scenario.expectedState}`);
  console.log(`  certification state: ${result.certificationState}`);
  console.log(`  field truth: ${result.fieldTruth.fieldTruthBand}`);
  console.log(`  blind spots: ${result.blindSpots.blindSpotBand}`);
  console.log(`  human validation: ${result.human.humanValidationBand}`);
  console.log(`  governance durability: ${result.governance.governanceDurabilityBand}`);
  console.log(`  restrictions: ${result.restrictions.join(", ") || "none"}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Pre-certification drill produced unsafe or unexpected certification state.");
  process.exit(1);
}
