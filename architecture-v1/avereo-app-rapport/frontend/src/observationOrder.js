import { isHabitologieReport } from './reportClassification.js';
import { HABITOLOGIE_PROTOCOL_STAGES } from './habitologieProtocol.js';

// The array preserves the user's order within a phase. Numbers are a derived
// presentation value, never an identifier used by photos, plans or decisions.
export function observationPhase(report, observation) {
  if (!isHabitologieReport(report)) return '';
  return HABITOLOGIE_PROTOCOL_STAGES.some(stage => stage.key === observation?.phase_habitologie)
    ? observation.phase_habitologie : '';
}

export function orderedObservations(report) {
  const observations = Array.isArray(report?.observations) ? report.observations : [];
  if (!isHabitologieReport(report)) return [...observations];
  const phases = [...HABITOLOGIE_PROTOCOL_STAGES.map(stage => stage.key), ''];
  return phases.flatMap(phase => observations.filter(observation => observationPhase(report, observation) === phase));
}

export function observationNumber(report, observation) {
  return orderedObservations(report).indexOf(observation) + 1;
}

// Reorder only the slots of the source phase; every other phase and all objects
// keep their contents. A cross-phase drop or ambiguous ID is a no-op.
export function moveObservation(report, sourceId, targetId) {
  if (!sourceId || sourceId === targetId) return report;
  const observations = Array.isArray(report?.observations) ? report.observations : [];
  const sources = observations.filter(observation => observation.id === sourceId);
  const targets = observations.filter(observation => observation.id === targetId);
  if (sources.length !== 1 || targets.length !== 1) return report;
  const phase = observationPhase(report, sources[0]);
  if (observationPhase(report, targets[0]) !== phase) return report;
  const group = observations.filter(observation => observationPhase(report, observation) === phase);
  const from = group.indexOf(sources[0]), to = group.indexOf(targets[0]);
  group.splice(from, 1);
  group.splice(to, 0, sources[0]);
  let index = 0;
  return { ...report, observations: observations.map(observation => observationPhase(report, observation) === phase ? group[index++] : observation) };
}
