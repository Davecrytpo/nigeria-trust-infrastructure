import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendLiveOperationalizationDecision } from "../../services/api-prototype/src/lib/live-operationalization.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-live-operationalization-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Live operationalization drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendLiveOperationalizationDecision(scenario.input);
  const pass = result.decision === scenario.expectedDecision;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected decision: ${scenario.expectedDecision}`);
  console.log(`  decision: ${result.decision}`);
  console.log(`  scope: ${result.scope.scopeBand}`);
  console.log(`  telecom: ${result.telecom.telecomRealityBand}`);
  console.log(`  human: ${result.human.humanRiskBand}`);
  console.log(`  governance: ${result.governance.governanceFrictionBand}`);
  console.log(`  failed readiness gates: ${result.failedReadinessGates.join(", ") || "none"}`);
  console.log(`  boundary: ${result.certificationBoundary}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Live operationalization drill produced unsafe or unexpected decision.");
  process.exit(1);
}
