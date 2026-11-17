// A mission profile is an explicit report choice, independent of CONNECT roles.
// Missing or unknown values retain the historical projection behaviour.
// The observation advice label is shared by all profiles, as requested in lot 0.
export const MISSION_PROFILES = [
  ['', 'Parcours actuel'], ['habitologue', 'Habitologue'],
  ['architecte', 'Architecte'], ['maitre_oeuvre', 'Maître d’œuvre'],
];

export function recognizedMissionProfile(value) {
  return typeof value === 'string' && value !== '' && MISSION_PROFILES.some(([key]) => key === value);
}

export function missionProfileLabel(report) {
  return MISSION_PROFILES.find(([key]) => key === report?.profil_metier)?.[1] || 'Parcours actuel';
}

export function withMissionDefault(report, profile) {
  return !report.profil_metier && recognizedMissionProfile(profile) ? { ...report, profil_metier: profile } : report;
}

export function usesMissionContext(report) {
  return isHabitologueProfile(report) || (recognizedMissionProfile(report?.profil_metier) && report?.categorie === 'Visite Globale');
}

const legacyProjections = {
  intro: 'Organisez les actions, puis comparez deux options. ',
  step4: '4 · Projection 1 : organiser les actions',
  step5: '5 · Projection 2 : préparer deux options comparables',
  step6: '6 · Comparer les conséquences et préparer l’arbitrage',
  actions: 'Projection 1 · Organiser les actions', options: 'Projection 2 · Deux options de projet',
  comparison: 'Comparaison des conséquences', arbitration: 'Arbitrage à discuter',
};

export function decisionProjectionLabels(report) {
  if (report?.profil_metier === 'architecte') return {
    intro: 'Organisez les actions du projet, puis comparez deux variantes. ',
    step4: '4 · Organiser les actions du projet', step5: '5 · Préparer deux variantes du projet',
    step6: '6 · Comparer les variantes et préparer l’arbitrage',
    actions: 'Actions du projet', options: 'Deux variantes du projet',
    comparison: 'Comparaison des variantes', arbitration: 'Arbitrage du projet à discuter',
  };
  if (report?.profil_metier === 'maitre_oeuvre') return {
    intro: 'Organisez les interventions et leur phasage, puis comparez deux options de réalisation. ',
    step4: '4 · Organiser les interventions et leur phasage', step5: '5 · Préparer deux options de réalisation',
    step6: '6 · Comparer les conditions de réalisation et préparer l’arbitrage',
    actions: 'Interventions et phasage', options: 'Deux options de réalisation',
    comparison: 'Comparaison des conditions de réalisation', arbitration: 'Arbitrage de réalisation à discuter',
  };
  return legacyProjections;
}

export function isHabitologueProfile(report) {
  return report?.profil_metier === 'habitologue';
}

export function allowsDecisionProjections(report) {
  return !isHabitologueProfile(report);
}

export function observationAdviceLabel() {
  return 'Conseils habitologue';
}
