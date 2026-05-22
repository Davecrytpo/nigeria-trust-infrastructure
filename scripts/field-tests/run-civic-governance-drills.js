import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendPreDeploymentDecision } from "../../services/api-prototype/src/lib/civic-governance.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-civic-governance-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Civic governance drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendPreDeploymentDecision(scenario.input);
  const pass = result.decision === scenario.expectedDecision;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected decision: ${scenario.expectedDecision}`);
  console.log(`  recommended decision: ${result.decision}`);
  console.log(`  deployment decision: ${result.deployment.decision}`);
  console.log(`  civic safeguards: ${result.safeguards.safeguardBand}`);
  console.log(`  liability: ${result.liability.liabilityBand}`);
  console.log(`  pilot governance: ${result.pilot.pilotGovernanceBand}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Civic governance drill produced unsafe or unexpected deployment decision.");
  process.exit(1);
}
