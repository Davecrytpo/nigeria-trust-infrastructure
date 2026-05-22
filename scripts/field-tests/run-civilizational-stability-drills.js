import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendCivilizationalStabilityPosture } from "../../services/api-prototype/src/lib/civilizational-stability.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-civilizational-stability-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Civilizational stability drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendCivilizationalStabilityPosture(scenario.input);
  const pass = result.posture === scenario.expectedPosture;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected posture: ${scenario.expectedPosture}`);
  console.log(`  posture: ${result.posture}`);
  console.log(`  risk score: ${result.riskScore}`);
  console.log(`  stability: ${result.stability.stabilityBand}`);
  console.log(`  panic: ${result.panic.panicBand}`);
  console.log(`  dependency: ${result.dependency.dependencyBand}`);
  console.log(`  behavior: ${result.behavior.adaptationBand}`);
  console.log(`  intergenerational: ${result.intergenerational.legitimacyBand}`);
  console.log(`  institutions: ${result.institutions.interactionBand}`);
  console.log(`  resilience: ${result.resilience.amplificationBand}`);
  console.log(`  containment: ${result.containment.containmentBand}`);
  console.log(`  boundary: ${result.certificationBoundary}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Civilizational stability drill produced unsafe or unexpected systemic posture.");
  process.exit(1);
}
