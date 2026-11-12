// A mission profile is an explicit report choice, independent of CONNECT roles.
// Missing or unknown values retain the historical report behaviour.
export function isHabitologueProfile(report) {
  return report?.profil_metier === 'habitologue';
}

export function allowsDecisionProjections(report) {
  return !isHabitologueProfile(report);
}

export function observationAdviceLabel(report) {
  return isHabitologueProfile(report) ? 'Conseils d’habitologue' : 'Suites proposees';
}
