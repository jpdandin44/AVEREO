// Synthetic review data, used by tests and the explicitly labelled demo server.
export const demoDocument = '# Audit de démonstration\n\nCe livrable fictif sert uniquement à essayer la revue.\n\n## Résultat attendu\n\n- Lire ce document.\n- Vérifier les deux critères.\n- Enregistrer une décision puis recharger.\n\n## Limites\n\nAucun accord sur le chantier réel ne sera enregistré.\n';
export function demoState() {
  return {
    project: 'avereo-demo', title: 'Chantier de démonstration', owner: 'jpdandin', updated: '2026-09-24', currentPhase: 0, state: 'awaiting_human_review',
    statusLabels: { awaiting_review: 'À valider', validated: 'Validée', in_progress: 'En cours', not_started: 'Non commencée', blocked: 'Bloquée' },
    phases: [
      { id: 0, shortTitle: 'Audit de démonstration', title: 'Relire un livrable fictif', objective: 'Essayer le cycle de revue sans toucher au chantier réel.', status: 'awaiting_review', startedOn: '2026-09-24', deliveredOn: '2026-09-24', validatedOn: null, validationEvidence: null, dependsOn: [], deliverables: [{ path: 'audit-demo.md', kind: 'file', availability: 'present' }], exitCriteria: ['Le résultat attendu est compris.', 'Les limites de la démonstration sont explicites.'], nextAction: 'Relire et décider.' },
      { id: 1, shortTitle: 'Étape suivante', title: 'Préparer la suite fictive', objective: 'Vérifier que l’autorisation reste distincte du démarrage.', status: 'not_started', startedOn: null, deliveredOn: null, validatedOn: null, validationEvidence: null, dependsOn: [0], deliverables: [{ path: 'suite-demo.md', kind: 'file', availability: 'planned' }], exitCriteria: ['La suite est documentée.'], nextAction: 'Attendre la validation et l’accord de passage.' },
    ], decisions: [], history: [], verificationQuestions: [], publication: { pushAuthorized: false, deploymentAuthorized: false },
  };
}
