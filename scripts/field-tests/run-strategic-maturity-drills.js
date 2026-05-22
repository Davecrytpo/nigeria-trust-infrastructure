import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { modelRegionalDeploymentReadiness, recommendGovernancePosture } from "../../services/api-prototype/src/lib/strategic-maturity.js";

const scenarioPath = process.argv[2] || "data/field-tests/yaba-strategic-maturity-scenarios.json";
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, "utf8"));

console.log(`Strategic maturity drills: ${drillPlan.pilotZone} (${drillPlan.version})`);

const postureResults = drillPlan.scenarios.map((scenario) => {
  const posture = recommendGovernancePosture(scenario.input);
  const pass = posture.governancePosture === scenario.expectedPosture;

  console.log(`${pass ? "PASS" : "FAIL"} ${scenario.id} - ${scenario.name}`);
  console.log(`  expected posture: ${scenario.expectedPosture}`);
  console.log(`  recommended posture: ${posture.governancePosture}`);
  console.log(`  governance risk: ${posture.governanceRiskScore}`);
  console.log(`  chronic risk: ${posture.longHorizon.chronicRiskBand}`);
  console.log(`  trust durability: ${posture.trust.durabilityBand}`);

  return pass;
});

const regional = modelRegionalDeploymentReadiness(drillPlan.regions);
const blockedMatches = JSON.stringify(regional.blockedRegions.sort()) === JSON.stringify((drillPlan.expectedBlockedRegions ?? []).sort());

console.log(`${blockedMatches ? "PASS" : "FAIL"} regional-deployment-readiness`);
console.log(`  portfolio readiness: ${regional.portfolioReadinessScore}`);
console.log(`  blocked regions: ${regional.blockedRegions.join(", ") || "none"}`);

if (postureResults.some((pass) => !pass) || !blockedMatches) {
  console.error("Strategic maturity drill exposed unsafe governance or regional readiness behavior.");
  process.exit(1);
}
