import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { buildTelemetrySnapshot, evaluateConvergenceScenario } from "../../services/api-prototype/src/lib/system-convergence.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-convergence-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Convergence drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const results = drillPlan.scenarios.map(evaluateConvergenceScenario);
for (const result of results) {
  const telemetry = buildTelemetrySnapshot(result);
  console.log(`${result.convergence.stable ? "PASS" : "FAIL"} ${result.id} - ${result.name}`);
  console.log(`  modes: ${telemetry.activeModes.join(", ")}`);
  console.log(`  stability: ${telemetry.systemStability}`);
  console.log(`  critical risks: ${telemetry.unresolvedCriticalRisks}`);
  console.log(`  containment boundaries: ${telemetry.containmentBoundaryCount}`);
  console.log(`  recovery: ${telemetry.recoveryState}`);
  console.log(`  convergence confidence: ${telemetry.convergenceConfidence} (${telemetry.convergenceConfidenceBand})`);
  console.log(`  recovery action: ${telemetry.recoveryAction}`);
  if (telemetry.exitSequence.length > 0) {
    console.log(`  exit sequence: ${telemetry.exitSequence.join(" -> ")}`);
  }
}

const failed = results.filter((result) => !result.convergence.stable);
if (failed.length > 0) {
  console.error(`${failed.length} convergence drill(s) exposed unstable compound degradation.`);
  process.exit(1);
}
