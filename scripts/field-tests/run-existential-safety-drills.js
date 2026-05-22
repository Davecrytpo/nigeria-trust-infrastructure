import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendExistentialSafetyPosture } from "../../services/api-prototype/src/lib/existential-safety.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-existential-safety-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Existential civic safety drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendExistentialSafetyPosture(scenario.input);
  const pass = result.posture === scenario.expectedPosture;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected posture: ${scenario.expectedPosture}`);
  console.log(`  posture: ${result.posture}`);
  console.log(`  risk score: ${result.riskScore}`);
  console.log(`  irreversibility: ${result.irreversibility.irreversibilityBand}`);
  console.log(`  self sufficiency: ${result.selfSufficiency.selfSufficiencyBand}`);
  console.log(`  failure survivability: ${result.failure.survivabilityBand}`);
  console.log(`  monopoly: ${result.monopoly.monopolyBand}`);
  console.log(`  reversibility: ${result.reversibility.reversibilityBand}`);
  console.log(`  coupling: ${result.coupling.couplingBand}`);
  console.log(`  redundancy: ${result.redundancy.redundancyBand}`);
  console.log(`  power limits: ${result.powerLimits.powerBand}`);
  console.log(`  post infrastructure: ${result.postInfrastructure.postInfrastructureBand}`);
  console.log(`  boundary: ${result.certificationBoundary}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Existential civic safety drill produced unsafe or unexpected irreversibility posture.");
  process.exit(1);
}
