import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryMessage, phaseDate, phaseProgress, priorApprovalSummary, recentActivity } from '../frontend/src/review/review-progress.mjs';

function snapshot() {
  return {
    data: {
      currentPhase: 1,
      statusLabels: { validated: 'Validée', in_progress: 'En cours', not_started: 'Non commencée', awaiting_review: 'À valider' },
      phases: [
        { id: 0, status: 'validated', deliveredOn: '2026-09-23', validatedOn: '2026-09-24', deliverables: [{ path: 'audit.md', availability: 'present' }] },
        { id: 1, status: 'in_progress', deliveredOn: '2026-09-24', validatedOn: null, deliverables: [{ path: 'recette/', kind: 'directory', availability: 'present' }] },
        { id: 2, status: 'not_started', startEvidence: { decisionId: 'D02' }, deliverables: [{ path: 'suite.md', availability: 'planned' }] },
      ],
      decisions: [],
    },
    documents: [
      { phaseId: 0, artifact: 'audit.md', path: 'audit.md' },
      { phaseId: 1, artifact: 'recette/', path: 'recette/a.md' },
      { phaseId: 1, artifact: 'recette/', path: 'recette/b.md' },
    ],
    issues: [{ phaseId: 2, path: 'suite.md', message: 'Livrable non disponible' }],
    actions: { 2: ['comment', 'start'] },
  };
}

test('remise, validation et autorisation restent distinctes sans estimer les travaux', () => {
  const view = snapshot();
  const before = structuredClone(view);
  const result = phaseProgress(view);
  assert.equal(result.total, 3);
  assert.equal(result.delivered, 2);
  assert.equal(result.approved, 1);
  assert.equal(result.current.id, 1);
  assert.equal(result.awaitingReview, 0);
  assert.deepEqual(result.ready.map(phase => phase.id), [2]);
  assert.equal(result.phases[2].statusLabel, 'Démarrage autorisé');
  assert.equal(result.phases[2].status, 'not_started');
  assert.equal(result.phases[2].startedOn, undefined);
  assert.equal('percent' in result, false);
  assert.equal('executionPercent' in result, false);
  assert.deepEqual(view, before);
});

test('un dossier de plusieurs documents compte pour un livrable déclaré et les absents restent prévus', () => {
  const result = phaseProgress(snapshot());
  assert.equal(result.phases[1].availableDeliverables, 1);
  assert.equal(result.phases[1].deliverables[0].documentCount, 2);
  assert.equal(result.phases[2].availableDeliverables, 0);
  assert.equal(result.phases[2].deliverables[0].label, 'Prévu');
});

test('un livrable annoncé présent mais illisible ne devient pas disponible', () => {
  const view = snapshot();
  view.issues.push({ phaseId: 1, path: 'recette/', message: 'Un document du dossier est illisible.' });
  view.documents = view.documents.filter(file => file.phaseId !== 0);
  const result = phaseProgress(view);
  assert.equal(result.phases[0].deliverables[0].label, 'Indisponible');
  assert.equal(result.phases[1].deliverables[0].label, 'Incomplet');
  assert.equal(result.phases[1].availableDeliverables, 0);
  assert.equal(result.approved, 1, 'La validation enregistrée reste un jalon distinct de la disponibilité actuelle.');
});

test('seuls les blocages explicites et décisions en attente de la phase sont affichés', () => {
  const view = snapshot();
  view.data.phases[1].blockers = ['Donnée attendue', 'Donnée attendue', { message: 'Recette à compléter' }];
  view.data.decisions = [
    { id: 'D03', title: 'Autoriser la suite', status: 'pending', blocksPhase: 2 },
    { id: 'D01', title: 'Valider audit', status: 'approved', blocksPhase: 1 },
    { id: 'D00', title: 'Ancien accord', status: 'superseded', blocksPhase: 1 },
  ];
  const result = phaseProgress(view);
  assert.deepEqual(result.phases[1].blockers, ['Donnée attendue', 'Recette à compléter']);
  assert.deepEqual(result.phases[2].blockers, ['D03 · Autoriser la suite']);
  assert.deepEqual(result.phases[0].blockers, []);
});

test('une preuve historique seule n’annonce pas un démarrage encore interdit côté service', () => {
  const view = snapshot();
  view.actions[2] = ['comment'];
  assert.equal(phaseProgress(view).phases[2].statusLabel, 'Non commencée');
  assert.deepEqual(phaseProgress(view).ready, []);
});

test('les corrections conservent la remise historique sans annoncer une revue actuellement ouverte', () => {
  const view = snapshot();
  assert.equal(phaseProgress(view).delivered, 2);
  assert.equal(phaseProgress(view).awaitingReview, 0);
  view.data.phases[1].status = 'awaiting_review';
  assert.equal(phaseProgress(view).awaitingReview, 1);
});

test('les accords antérieurs gardent leurs remarques et preuves sans changer les compteurs du chantier', () => {
  const view = snapshot();
  view.data.priorApprovals = {
    sourceProject: 'Autre chantier',
    entries: [
      { id: 'D01', kind: 'approval', phaseId: 0, comment: 'Remarque historique', evidenceStatus: 'message_reference', reviewId: null },
      { id: 'D03', kind: 'approval', phaseId: 1, comment: 'Remarque vérifiée', evidenceStatus: 'verified', reviewId: 'review-3' },
      { id: 'D04', kind: 'authorization', phaseId: 2, comment: 'Suite autorisée' },
    ],
  };
  const before = structuredClone(view);
  const prior = priorApprovalSummary(view.data.priorApprovals);
  assert.equal(prior.approvedPhases, 2);
  assert.equal(prior.authorizedPhases, 1);
  assert.equal(prior.entries[0].evidenceStatus, 'message_reference');
  assert.equal(prior.entries[0].comment, 'Remarque historique');
  assert.equal(prior.entries[0].reviewId, null);
  assert.equal(phaseProgress(view).approved, 1);
  assert.equal(phaseProgress(view).total, 3);
  assert.deepEqual(priorApprovalSummary(null), { entries: [], approvedPhases: 0, authorizedPhases: 0 });
  assert.deepEqual(view, before);
});

test('l’activité reprend les cinq dernières entrées sans dupliquer les décisions humaines', () => {
  const data = { history: Array.from({ length: 7 }, (_, index) => ({ date: '2026-09-24', event: `Action ${index}` })) };
  data.history.push({ date: '2026-09-24', event: 'Accord humain', reviewId: 'review-1' });
  const before = structuredClone(data);
  assert.deepEqual(recentActivity(data).map(entry => entry.event), ['Action 6', 'Action 5', 'Action 4', 'Action 3', 'Action 2']);
  assert.deepEqual(data, before);
  assert.deepEqual(recentActivity({}), []);
});

test('les dates ou phases absentes ne créent ni date ni progression artificielle', () => {
  const result = phaseProgress({ data: { phases: [], currentPhase: 0 } });
  assert.equal(result.total, 0);
  assert.equal(result.approved, 0);
  assert.equal(result.delivered, 0);
  assert.equal(result.current, null);
  assert.equal(phaseDate(null, 'En attente'), 'En attente');
  assert.equal(phaseDate('incorrecte'), 'Non renseignée');
  assert.match(phaseDate('2026-09-24'), /24.*2026/);
});


test('les livrables prévus exposent leur titre, description et preuves sans créer de document', () => {
  const view = snapshot();
  Object.assign(view.data.phases[2].deliverables[0], { title: 'Recette de la prochaine phase', description: 'Travaux à réaliser', expectedEvidence: ['Capture locale', 'Résultats des vérifications', null, ''] });
  const before = structuredClone(view);
  const result = phaseProgress(view).phases[2].deliverables[0];
  assert.equal(result.title, 'Recette de la prochaine phase');
  assert.equal(result.description, 'Travaux à réaliser');
  assert.deepEqual(result.expectedEvidence, ['Capture locale', 'Résultats des vérifications']);
  assert.equal(result.available, false);
  assert.equal(result.documentCount, 0);
  assert.equal(result.label, 'Prévu');
  assert.deepEqual(view, before);
  view.documents.push({ phaseId: 2, artifact: 'suite.md', path: 'suite.md' });
  view.issues = [];
  assert.equal(phaseProgress(view).phases[2].deliverables[0].label, 'Disponible');
});

test('un livrable prévu avec une erreur de sécurité est signalé indisponible', () => {
  const view = snapshot();
  view.issues[0].message = 'Livrable hors du dossier autorisé.';
  const result = phaseProgress(view).phases[2].deliverables[0];
  assert.equal(result.label, 'Indisponible');
  assert.equal(result.issue, 'Livrable hors du dossier autorisé.');
  assert.equal(result.title, 'suite.md');
  assert.deepEqual(result.expectedEvidence, []);
});

test('le message des documents manquants distingue autorisation, production et livraison incohérente', () => {
  const phase = snapshot().data.phases[2];
  assert.match(deliveryMessage(phase, ['comment', 'start'], []), /démarrage est autorisé/);
  assert.match(deliveryMessage(phase, ['comment'], []), /autorisation de démarrage reste à vérifier/);
  assert.match(deliveryMessage({ ...phase, status: 'in_progress' }, ['comment'], []), /travaux ont commencé/);
  assert.match(deliveryMessage({ ...phase, status: 'validated' }, ['comment'], []), /documents ne sont pas disponibles/);
  assert.match(deliveryMessage({ ...phase, deliverables: [] }, ['comment'], []), /restent à définir/);
  assert.equal(deliveryMessage(phase, ['comment'], [{ path: 'suite.md' }]), '');
});
