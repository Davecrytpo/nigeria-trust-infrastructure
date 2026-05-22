import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendAdaptiveLegitimacyPosture } from "../../services/api-prototype/src/lib/adaptive-legitimacy.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-adaptive-legitimacy-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Adaptive legitimacy drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendAdaptiveLegitimacyPosture(scenario.input);
  const pass = result.posture === scenario.expectedPosture;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected posture: ${scenario.expectedPosture}`);
  console.log(`  posture: ${result.posture}`);
  console.log(`  risk score: ${result.riskScore}`);
  console.log(`  mission: ${result.mission.driftBand}`);
  console.log(`  legitimacy: ${result.legitimacy.legitimacyBand}`);
  console.log(`  technology: ${result.technology.technologyBand}`);
  console.log(`  complexity: ${result.complexity.complexityBand}`);
  console.log(`  principles: ${result.principles.principleBand}`);
  console.log(`  alignment: ${result.alignment.alignmentBand}`);
  console.log(`  oversight: ${result.oversight.oversightBand}`);
  console.log(`  emergency: ${result.emergency.emergencyBand}`);
  console.log(`  boundary: ${result.certificationBoundary}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Adaptive legitimacy drill produced unsafe or unexpected evolution posture.");
  process.exit(1);
}
