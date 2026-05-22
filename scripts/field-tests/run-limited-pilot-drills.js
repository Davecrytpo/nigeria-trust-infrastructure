import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendLimitedPilotDecision } from "../../services/api-prototype/src/lib/field-pilot.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-limited-pilot-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Limited pilot drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendLimitedPilotDecision(scenario.input);
  const pass = result.decision === scenario.expectedDecision;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected decision: ${scenario.expectedDecision}`);
  console.log(`  recommended decision: ${result.decision}`);
  console.log(`  scope: ${result.scope.scopeBand}`);
  console.log(`  human prep: ${result.human.preparationBand}`);
  console.log(`  observability: ${result.observability.observabilityBand}`);
  console.log(`  safety: ${result.safety.safetyBand}`);
  console.log(`  telecom validation: ${result.telecom.telecomValidationBand}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Limited pilot drill produced unsafe or unexpected field decision.");
  process.exit(1);
}
