import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { recommendEpistemicDecision } from "../../services/api-prototype/src/lib/epistemic-resilience.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-epistemic-resilience-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Epistemic resilience drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const result = recommendEpistemicDecision(scenario.input);
  const pass = result.decision === scenario.expectedDecision;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected decision: ${scenario.expectedDecision}`);
  console.log(`  decision: ${result.decision}`);
  console.log(`  humility score: ${result.humilityScore}`);
  console.log(`  knowledge: ${result.knowledge.knowledgeBand}`);
  console.log(`  overconfidence: ${result.overconfidence.overconfidenceBand}`);
  console.log(`  truth state: ${result.perspectives.truthState}`);
  console.log(`  boundary: ${result.certificationBoundary}`);

  return pass;
});

if (results.some((pass) => !pass)) {
  console.error("Epistemic resilience drill produced unsafe or unexpected decision.");
  process.exit(1);
}
