import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendCivicSustainabilityPosture } from "../../services/api-prototype/src/lib/civic-sustainability.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-civic-sustainability-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Civic sustainability drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendCivicSustainabilityPosture(scenario.input);
  const pass = result.posture === scenario.expectedPosture;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected posture: ${scenario.expectedPosture}`);
  console.log(`  posture: ${result.posture}`);
  console.log(`  risk score: ${result.riskScore}`);
  console.log(`  sustainability: ${result.longHorizon.sustainabilityBand}`);
  console.log(`  economic: ${result.economic.economicBand}`);
  console.log(`  fatigue: ${result.fatigue.fatigueBand}`);
  console.log(`  trust: ${result.trust.trustBand}`);
  console.log(`  dependency: ${result.dependency.dependencyBand}`);
  console.log(`  governance: ${result.governance.governanceBand}`);
  console.log(`  minimalism: ${result.minimalism.minimalismBand}`);
  console.log(`  cultural: ${result.cultural.adaptationBand}`);
  console.log(`  recovery: ${result.recovery.recoveryBand}`);
  console.log(`  boundary: ${result.certificationBoundary}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Civic sustainability drill produced unsafe or unexpected sustainability posture.");
  process.exit(1);
}
