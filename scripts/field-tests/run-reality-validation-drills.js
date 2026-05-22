import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendRealityExperimentDecision } from "../../services/api-prototype/src/lib/reality-validation.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-reality-validation-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Reality validation drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendRealityExperimentDecision(scenario.input);
  const pass = result.decision === scenario.expectedDecision;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected decision: ${scenario.expectedDecision}`);
  console.log(`  decision: ${result.decision}`);
  console.log(`  approval: ${result.approval.approvalState} / ${result.approval.allowedMode}`);
  console.log(`  divergence: ${result.divergence.divergenceBand}`);
  console.log(`  human chaos: ${result.humanChaos.chaosBand}`);
  console.log(`  fatigue: ${result.fatigue.fatigueBand}`);
  console.log(`  false confidence: ${result.falseConfidence.falseConfidenceBand}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Reality validation drill produced unsafe or unexpected experiment decision.");
  process.exit(1);
}
