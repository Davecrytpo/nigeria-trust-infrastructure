const SEVERITY_WEIGHT = {
  critical: 100,
  high: 70,
  moderate: 40,
  low: 20
};

function minutesSince(value, now) {
  return Math.max(0, (new Date(now).getTime() - new Date(value).getTime()) / 60000);
}

export function prioritizeIncidentQueue(incidents, context = {}) {
  const now = context.now ?? new Date().toISOString();
  const operatorCount = Math.max(context.operatorCount ?? 1, 1);
  const overloadThreshold = context.overloadThresholdPerOperator ?? 6;

  return incidents
    .map((incident) => {
      const ageMinutes = minutesSince(incident.createdAt, now);
      const locationPenalty = incident.locationConfidence !== undefined ? (1 - incident.locationConfidence) * 10 : 0;
      const duplicatePenalty = (incident.mergeConfidence ?? 0) * 20;
      const starvationBoost = ageMinutes > 20 ? 25 : ageMinutes > 10 ? 12 : 0;
      const priorityScore =
        (SEVERITY_WEIGHT[incident.severity] ?? 30) +
        Math.min(ageMinutes * 1.5, 45) +
        starvationBoost -
        locationPenalty -
        duplicatePenalty;

      return {
        ...incident,
        priorityScore: Number(priorityScore.toFixed(2)),
        triageBand: priorityScore >= 100 ? "immediate" : priorityScore >= 75 ? "urgent" : "standard"
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .map((incident, index) => ({
      ...incident,
      operatorPartition: `operator-${(index % operatorCount) + 1}`,
      supervisorEscalationRequired: incidents.length / operatorCount > overloadThreshold && incident.triageBand === "immediate"
    }));
}

export function summarizeOperatorLoad(incidents, context = {}) {
  const operatorCount = Math.max(context.operatorCount ?? 1, 1);
  const activeCount = incidents.filter((incident) => incident.status !== "resolved").length;
  const loadPerOperator = activeCount / operatorCount;

  return {
    activeCount,
    operatorCount,
    loadPerOperator: Number(loadPerOperator.toFixed(2)),
    overloadState: loadPerOperator > 10 ? "disaster" : loadPerOperator > 6 ? "overloaded" : "normal"
  };
}
