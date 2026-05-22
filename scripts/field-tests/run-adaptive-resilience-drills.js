import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { evaluateConvergenceScenario } from "../../services/api-prototype/src/lib/system-convergence.js";
import { recommendAdaptiveRecovery } from "../../services/api-prototype/src/lib/adaptive-resilience.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-adaptive-resilience-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Adaptive resilience drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map((scenario) => {
  const convergence = evaluateConvergenceScenario(scenario.convergenceScenario);
  const recommendation = recommendAdaptiveRecovery(convergence, scenario.adaptiveContext);
  const pass = recommendation.action === scenario.expectedAction;

  return {
    id: scenario.id,
    name: scenario.name,
    pass,
    expectedAction: scenario.expectedAction,
    recommendation
  };
});

for (const result of results) {
  console.log(`${result.pass ? "PASS" : "FAIL"} ${result.id} - ${result.name}`);
  console.log(`  expected action: ${result.expectedAction}`);
  console.log(`  recommended action: ${result.recommendation.action}`);
  console.log(`  evolved confidence: ${result.recommendation.policy.evolvedConfidence.score} (${result.recommendation.policy.evolvedConfidence.band})`);
  console.log(`  memory band: ${result.recommendation.policy.evolvedConfidence.memory.memoryBand}`);
  console.log(`  propagation band: ${result.recommendation.policy.evolvedConfidence.propagation.propagationBand}`);
  console.log(`  stabilization multiplier: ${result.recommendation.policy.stabilizationMultiplier}`);
}

const failed = results.filter((result) => !result.pass);
if (failed.length > 0) {
  console.error(`${failed.length} adaptive resilience drill(s) produced unsafe or unexpected recovery behavior.`);
  process.exit(1);
}
