// A mission profile is an explicit report choice, independent of CONNECT roles.
// Missing or unknown values retain the historical projection behaviour.
// The observation advice label is shared by all profiles, as requested in lot 0.
export function isHabitologueProfile(report) {
  return report?.profil_metier === 'habitologue';
}

export function allowsDecisionProjections(report) {
  return !isHabitologueProfile(report);
}

export function observationAdviceLabel() {
  return 'Conseils habitologue';
}
