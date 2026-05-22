import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { assessCivicLegibility } from "../../services/api-prototype/src/lib/civic-legibility.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-civic-legibility-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Civic legibility drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = assessCivicLegibility(scenario.input);
  const pass = result.legibilityBand === scenario.expectedLegibilityBand && result.requiredAction === scenario.expectedAction;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected band: ${scenario.expectedLegibilityBand}`);
  console.log(`  legibility band: ${result.legibilityBand}`);
  console.log(`  expected action: ${scenario.expectedAction}`);
  console.log(`  required action: ${result.requiredAction}`);
  console.log(`  risks: ${result.risks.join(", ") || "none"}`);
  console.log(`  decision confidence display: ${result.decisionExplanation.confidenceDisplay}`);
  console.log(`  conflicting reality: ${result.conflictingReality.realityState}`);
  console.log(`  trace: ${result.trace.traceBand}`);
  console.log(`  boundary: ${result.certificationBoundary}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Civic legibility drill produced opaque or unexpected interpretability posture.");
  process.exit(1);
}
