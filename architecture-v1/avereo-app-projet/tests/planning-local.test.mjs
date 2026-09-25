import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = relative => readFileSync(new URL(relative, import.meta.url), 'utf8');
const coreSource = read('../frontend/public/planning-core.js');
const controllerSource = read('../frontend/public/planning-local.js');
const pilotCsv = read('../data/generated/planning-pilote.csv');
const pilotMetadata = read('../data/generated/planning-pilote.json');
const STORAGE_KEY = 'avereo.projet.planning.v1';
const BACKUP_KEY = 'avereo.projet.planning.previous.v1';
const plain = value => JSON.parse(JSON.stringify(value));

function project(overrides = {}) {
  return {
    schemaVersion: 1,
    name: 'Planning témoin',
    startDate: '2026-09-21',
    targetDate: '2026-10-30',
    capacityPerWeek: 5,
    schedulingMode: 'sequential',
    tasks: [{
      id: 'A', name: 'Tâche conservée', lot: 'Lot témoin', duration: 1.25,
      dependencies: [], owner: 'À confirmer', status: 'À faire', progress: 0,
      riskWeight: 'Majeur', riskStatus: 'Aucun', isMilestone: false,
    }],
    ...overrides,
  };
}

function makeBrowser({ hostname = 'localhost', storedRaw = null, metadataOverride, fetchOverride } = {}) {
  const values = new Map(storedRaw === null ? [] : [[STORAGE_KEY, storedRaw]]);
  const elements = new Map();
  const writes = [];
  const alerts = [];
  const confirms = [];
  const toasts = [];
  const fetches = [];
  const failingWrites = new Set();
  const listeners = { window: new Map(), document: new Map() };
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      id, value: '', textContent: '', className: '', hidden: false,
      reportValidity: () => true,
    });
    return elements.get(id);
  };
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) {
      writes.push({ key, value });
      if (failingWrites.has(key)) {
        const error = new Error('Quota de stockage dépassé');
        error.name = 'QuotaExceededError';
        throw error;
      }
      values.set(key, String(value));
    },
  };
  const location = { hostname };
  const context = vm.createContext({
    console,
    location,
    localStorage: storage,
    window: {
      location,
      alert: message => alerts.push(message),
      confirm: message => { confirms.push(message); return true; },
      addEventListener: (name, listener) => listeners.window.set(name, listener),
    },
    document: {
      getElementById: element,
      addEventListener: (name, listener) => listeners.document.set(name, listener),
    },
    fetch: async (url, options) => {
      fetches.push({ url, options: plain(options) });
      let response;
      if (url === '/local-planning/planning-pilote.json') {
        response = { ok: true, json: async () => plain(metadataOverride ?? JSON.parse(pilotMetadata)) };
      } else if (url === '/local-planning/planning-pilote.csv') {
        response = { ok: true, text: async () => pilotCsv };
      } else {
        throw new Error(`URL inattendue : ${url}`);
      }
      return fetchOverride ? fetchOverride(url, options, response) : response;
    },
    showToast: (message, color) => toasts.push({ message, color }),
  });
  const run = expression => vm.runInContext(expression, context);
  vm.runInContext(coreSource, context, { filename: 'planning-core.js' });
  run(`
    let projectSettings = {
      schemaVersion: 1, name: 'Projet vide', startDate: '2026-09-21',
      targetDate: '2026-10-30', capacityPerWeek: 5, schedulingMode: 'sequential'
    };
    let tasks = [];
    const state = { refreshCount: 0, scheduled: null };
    function refreshAll() {
      state.scheduled = ProjetPlanning.schedule(currentProject(), '2026-09-19');
      state.refreshCount++;
    }
  `);
  vm.runInContext(controllerSource, context, { filename: 'planning-local.js' });
  return {
    run, values, writes, alerts, confirms, toasts, fetches, failingWrites, element,
    snapshot: () => plain(run('currentProject()')),
    initialize: () => run('initializeLocalProject()'),
    normalize(value) {
      context.normalizationInput = value;
      return plain(run('ProjetPlanning.normalizeProject(normalizationInput)'));
    },
    commit(candidate, options = {}) {
      context.candidate = candidate;
      context.commitOptions = options;
      return run('commitProject(candidate, commitOptions)');
    },
    async importFile(name, content) {
      context.importFile = { name, size: Buffer.byteLength(content), text: async () => content };
      await run('importPlanningFile(importFile)');
    },
  };
}

test('invalid CSV import leaves the existing project and stored bytes untouched', async t => {
  const invalidFiles = [
    ['invalid duration', 'ID;Nom;Durée (jours ouvrés)\nB;Nouvelle tâche;inconnue'],
    ['missing dependency', 'ID;Nom;Durée (jours ouvrés);Dépendances\nB;Nouvelle tâche;1;ABSENT'],
    ['cycle', 'ID;Nom;Durée (jours ouvrés);Dépendances\nA;Première;1;B\nB;Seconde;1;A'],
    ['unrenderable horizon', 'ID;Nom;Durée (jours ouvrés)\nB;Trop longue;3650'],
  ];
  for (const [label, csv] of invalidFiles) {
    await t.test(label, async () => {
      const raw = JSON.stringify(project());
      const browser = makeBrowser({ storedRaw: raw });
      await browser.initialize();
      const before = browser.snapshot();
      await browser.importFile('invalide.csv', csv);
      assert.deepEqual(browser.snapshot(), before);
      assert.equal(browser.values.get(STORAGE_KEY), raw);
      assert.equal(browser.values.has(BACKUP_KEY), false);
      assert.equal(browser.writes.length, 0);
      assert.equal(browser.confirms.length, 0, 'Validation must precede replacement confirmation.');
      assert.equal(browser.alerts.length, 1);
      assert.equal(browser.toasts.length, 0);
    });
  }
});

test('quota failures return false and distinguish memory changes from a successful save', async () => {
  const raw = JSON.stringify(project());
  const browser = makeBrowser({ storedRaw: raw });
  await browser.initialize();
  browser.failingWrites.add(STORAGE_KEY);
  assert.equal(browser.run('persistProject(currentProject())'), false);
  assert.equal(browser.values.get(STORAGE_KEY), raw);
  assert.equal(browser.run('lastStoredRaw'), raw);
  assert.match(browser.element('storage-status').textContent, /impossible.*mémoire.*JSON/i);
  const changed = browser.snapshot();
  changed.tasks[0].name = 'Modification encore en mémoire';
  assert.equal(browser.commit(changed), true, 'The in-memory change is accepted with an explicit warning.');
  assert.equal(browser.snapshot().tasks[0].name, changed.tasks[0].name);
  assert.equal(browser.values.get(STORAGE_KEY), raw);
  assert.equal(browser.run('lastStoredRaw'), raw);
  assert.equal(browser.toasts.at(-1).color, 'amber');
  assert.match(browser.toasts.at(-1).message, /mémoire.*export JSON/i);
  assert.doesNotMatch(browser.element('storage-status').textContent, /^Enregistré/);
});

test('a concurrent stored change prevents overwriting either the other tab or the current project', async () => {
  const originalRaw = JSON.stringify(project());
  const browser = makeBrowser({ storedRaw: originalRaw });
  await browser.initialize();
  const before = browser.snapshot();
  const otherRaw = JSON.stringify(project({ name: 'Version de l’autre onglet' }));
  browser.values.set(STORAGE_KEY, otherRaw);
  const changed = browser.snapshot();
  changed.tasks[0].duration = 4.75;
  assert.equal(browser.commit(changed), false);
  assert.equal(browser.values.get(STORAGE_KEY), otherRaw);
  assert.equal(browser.run('lastStoredRaw'), originalRaw);
  assert.deepEqual(browser.snapshot(), before);
  assert.equal(browser.writes.length, 0);
  assert.equal(browser.toasts.length, 0);
  assert.match(browser.alerts.at(-1), /autre onglet/);
});

test('corrupt initial storage is preserved and never replaced by the localhost seed', async t => {
  const corruptions = [
    ['malformed JSON', '{"schemaVersion":1,texte incomplet'],
    ['invalid saved graph', JSON.stringify(project({ tasks: [{ id: 'A', name: 'A', duration: 1, dependencies: ['B'] }] }))],
    ['unschedulable saved project', JSON.stringify(project({ capacityPerWeek: 0.0001 }))],
  ];
  for (const [label, raw] of corruptions) {
    await t.test(label, async () => {
      const browser = makeBrowser({ storedRaw: raw });
      await browser.initialize();
      assert.equal(browser.values.get(STORAGE_KEY), raw);
      assert.equal(browser.run('lastStoredRaw'), raw);
      assert.equal(browser.run('storageBlocked'), true);
      assert.equal(browser.snapshot().tasks.length, 0);
      assert.equal(browser.fetches.length, 0);
      assert.equal(browser.writes.length, 0);
      assert.match(browser.element('storage-status').textContent, /illisible.*conservé/i);
    });
  }
});

test('importing a valid JSON backup restores the whole project and retains the previous raw backup', async () => {
  const damagedRaw = '{sauvegarde endommagée à conserver';
  const browser = makeBrowser({ storedRaw: damagedRaw });
  await browser.initialize();
  const restored = project({ name: 'Dossier restauré', startDate: '2026-10-05', capacityPerWeek: 4 });
  restored.tasks[0].duration = 2.75;
  restored.tasks[0].status = 'En cours';
  restored.tasks[0].progress = 25;
  await browser.importFile('sauvegarde.json', JSON.stringify(restored));
  const result = browser.snapshot();
  assert.equal(result.name, restored.name);
  assert.equal(result.startDate, restored.startDate);
  assert.equal(result.capacityPerWeek, restored.capacityPerWeek);
  assert.equal(result.tasks[0].duration, 2.75);
  assert.equal(result.tasks[0].progress, 25);
  assert.equal(browser.values.get(BACKUP_KEY), damagedRaw);
  assert.deepEqual(JSON.parse(browser.values.get(STORAGE_KEY)), result);
  assert.equal(browser.run('storageBlocked'), false);
  assert.equal(browser.run('projectLoaded'), true);
  assert.equal(browser.confirms.length, 1);
  assert.equal(browser.alerts.length, 0);
  assert.equal(browser.fetches.length, 0);
  assert.equal(browser.toasts.at(-1).color, 'emerald');
  assert.equal(browser.element('project-start').value, '2026-10-05');
});

test('a fresh localhost session loads the real pilot CSV and metadata, preserving all fractional durations', async () => {
  const browser = makeBrowser();
  await browser.initialize();
  const result = browser.snapshot();
  assert.equal(result.name, JSON.parse(pilotMetadata).name);
  assert.equal(result.startDate, '2026-09-21');
  assert.equal(result.targetDate, '2026-10-30');
  assert.equal(result.capacityPerWeek, 5);
  assert.equal(result.schedulingMode, 'sequential');
  assert.deepEqual(result.tasks.map(task => task.id), ['L0', 'L1', 'L2', 'L3', 'RES', 'L4']);
  assert.deepEqual(result.tasks.map(task => task.duration), [5, 5.75, 5.25, 7, 4.9, 1.5]);
  assert.equal(browser.run('state.scheduled.totalDuration'), 29.4);
  assert.equal(browser.run('localIso(state.scheduled.projectEnd)'), '2026-10-30');
  assert.deepEqual(JSON.parse(browser.values.get(STORAGE_KEY)), result);
  assert.equal(browser.element('load-pilot').hidden, false);
  assert.deepEqual(browser.fetches.map(call => call.url).sort(), [
    '/local-planning/planning-pilote.csv', '/local-planning/planning-pilote.json',
  ]);
  assert(browser.fetches.every(call => call.options.cache === 'no-store'));
  assert.equal(browser.confirms.length, 0);
  assert.equal(browser.alerts.length, 0);
});

test('reload restores a user modification without resetting it during the metadata refresh', async () => {
  const firstBrowser = makeBrowser();
  await firstBrowser.initialize();
  const changed = firstBrowser.snapshot();
  changed.name = 'Mon planning ajusté';
  changed.tasks[1].duration = 6.125;
  changed.tasks[1].name = 'Qualification adaptée';
  changed.tasks[1].status = 'En cours';
  changed.tasks[1].progress = 37;
  assert.equal(firstBrowser.commit(changed), true);
  const savedRaw = firstBrowser.values.get(STORAGE_KEY);
  const reloaded = makeBrowser({ storedRaw: savedRaw });
  await reloaded.initialize();
  assert.deepEqual(reloaded.snapshot(), firstBrowser.snapshot());
  assert.equal(reloaded.snapshot().tasks[1].duration, 6.125);
  assert.equal(reloaded.snapshot().tasks[1].progress, 37);
  assert(reloaded.fetches.every(call => call.url.startsWith('/local-planning/')));
  assert.equal(reloaded.writes.length, 0);
  assert.match(reloaded.element('storage-status').textContent, /restauré/);
});

test('a remote hostname neither auto-loads nor explicitly fetches the local seed', async () => {
  const browser = makeBrowser({ hostname: 'projet.avereo.fr' });
  await browser.initialize();
  assert.equal(browser.element('load-pilot').hidden, true);
  assert.equal(browser.snapshot().tasks.length, 0);
  assert.equal(browser.fetches.length, 0);
  assert.equal(browser.writes.length, 0);
  await assert.rejects(browser.run('getPilotProject()'), /uniquement.*local/i);
  await browser.run('loadPilotProject()');
  assert.equal(browser.fetches.length, 0);
  assert.equal(browser.writes.length, 0);
  assert.match(browser.alerts.at(-1), /uniquement.*local/i);
});

function legacyPilot() {
  const canonical = JSON.parse(read('../data/planning-pilote.json'));
  return {
    ...JSON.parse(pilotMetadata),
    tasks: canonical.tasks.map(({ description, checklist, risks, ...task }) => task),
  };
}

function checklistEntry(id, overrides = {}) {
  return {
    id: `${id}-controle`, title: `Contrôle ${id}`, action: 'Exécuter le contrôle décrit.',
    expected: 'Conserver la preuve du résultat.', sourceRefs: ['Audit : scénario témoin'],
    completed: false, validated: false, evidence: '', validatedBy: '', validatedAt: null,
    ...overrides,
  };
}

function riskEntry(id, overrides = {}) {
  return {
    id: `${id}-risque`, title: `Risque ${id}`, cause: 'Disponibilité à confirmer',
    consequence: 'Recette décalée', probability: 'À qualifier', impact: 'À qualifier',
    prevention: 'Préparer la recette', contingency: 'Replanifier', owner: '', status: 'À qualifier',
    followUp: '', evidence: '', reviewDate: null, sourceRefs: ['Audit : risque témoin'],
    ...overrides,
  };
}

function detailedMetadata() {
  return {
    ...JSON.parse(pilotMetadata),
    taskDetails: Object.fromEntries(legacyPilot().tasks.map(task => [task.id, {
      description: `Fiche documentée du lot ${task.id}.`,
      checklist: [checklistEntry(task.id)],
    }])),
  };
}

function withoutTaskDetails(value) {
  return {
    ...value,
    tasks: value.tasks.map(({ description, checklist, ...task }) => task),
  };
}

test('enriching an existing pilot adds documented details without resetting user edits', async () => {
  const existing = legacyPilot();
  existing.startDate = '2026-09-22';
  existing.capacityPerWeek = 4;
  Object.assign(existing.tasks[1], {
    name: 'Qualification adaptée par le responsable', duration: 6.125,
    owner: 'Responsable du lot', status: 'En cours', progress: 37,
    manualStart: '2026-09-30',
  });
  const browser = makeBrowser({ storedRaw: JSON.stringify(existing), metadataOverride: detailedMetadata() });
  const expectedStructure = withoutTaskDetails(browser.normalize(existing));
  await browser.initialize();
  const result = browser.snapshot();
  assert.deepEqual(withoutTaskDetails(result), expectedStructure);
  for (const task of result.tasks) {
    assert.equal(task.description, `Fiche documentée du lot ${task.id}.`);
    assert.equal(task.checklist.length, 1);
    assert.equal(task.checklist[0].completed, false);
    assert.equal(task.checklist[0].validated, false);
  }
  assert.deepEqual(JSON.parse(browser.values.get(STORAGE_KEY)), result);
  assert.equal(browser.run('storageBlocked'), false);
});

test('enrichment is idempotent and preserves an existing or partially filled task detail entirely', async () => {
  const existing = legacyPilot();
  existing.tasks[0].description = 'Texte personnel à préserver';
  existing.tasks[0].checklist = [checklistEntry('L0', {
    completed: true, validated: true, evidence: 'Procès-verbal témoin conservé',
    validatedBy: 'Validateur déclaré', validatedAt: '2026-09-19T10:30:00.000Z',
  })];
  existing.tasks[1].description = 'Description seule volontaire';
  existing.tasks[1].checklist = [];
  existing.tasks[2].description = '';
  existing.tasks[2].checklist = [checklistEntry('L2', { completed: true, evidence: 'Contrôle effectué, non validé' })];
  const browser = makeBrowser({ storedRaw: JSON.stringify(existing), metadataOverride: detailedMetadata() });
  const expected = browser.normalize(existing);
  await browser.initialize();
  assert.deepEqual(browser.snapshot().tasks.slice(0, 3), expected.tasks.slice(0, 3));
  const once = browser.snapshot();
  const savedRaw = browser.values.get(STORAGE_KEY);
  const writes = browser.writes.length;
  await browser.run('enrichPilotTaskDetails(true)');
  assert.deepEqual(browser.snapshot(), once);
  assert.equal(browser.values.get(STORAGE_KEY), savedRaw);
  assert.equal(browser.writes.length, writes, 'An unchanged enrichment must not rewrite the project.');
});

test('missing risks are enriched independently of a personal checklist while existing risk tracking is preserved', async () => {
  const existing = legacyPilot();
  existing.tasks[0].description = 'Description personnelle';
  existing.tasks[0].checklist = [checklistEntry('L0', { completed: true, evidence: 'Contrôle en attente de validation' })];
  existing.tasks[1].risks = [riskEntry('L1', {
    probability: 'Moyenne', impact: 'Majeur', owner: 'Responsable déclaré', status: 'Accepté',
    evidence: 'Décision motivée conservée', reviewDate: '2026-09-25', followUp: 'Revue hebdomadaire',
  })];
  const metadata = detailedMetadata();
  for (const task of existing.tasks) metadata.taskDetails[task.id].risks = [riskEntry(task.id)];
  const browser = makeBrowser({ storedRaw: JSON.stringify(existing), metadataOverride: metadata });
  await browser.initialize();
  const result = browser.snapshot();
  assert.equal(result.tasks[0].description, existing.tasks[0].description);
  assert.deepEqual(result.tasks[0].checklist, existing.tasks[0].checklist);
  assert.deepEqual(result.tasks[0].risks, metadata.taskDetails.L0.risks);
  assert.deepEqual(result.tasks[1].risks, existing.tasks[1].risks);
  assert.equal(result.tasks[1].description, metadata.taskDetails.L1.description);
  const writes = browser.writes.length;
  await browser.run('enrichPilotTaskDetails(true)');
  assert.deepEqual(browser.snapshot(), result);
  assert.equal(browser.writes.length, writes);
});

test('initial unqualified risks receive only the proposed axes and rationale, once', async t => {
  const legacyFollowUp = 'Qualification initiale à réaliser avec le responsable ; consigner observations, décision et prochaine revue sans clôture automatique.';
  for (const [label, owner, followUp] of [
    ['blank owner and follow-up', '', ''],
    ['initial owner and follow-up', 'À confirmer', legacyFollowUp],
  ]) {
    await t.test(label, async () => {
      const existing = legacyPilot();
      const beforeRisk = riskEntry('L0', { owner, followUp, title: 'Titre local conservé', prevention: 'Prévention conservée' });
      existing.tasks[0].risks = [beforeRisk];
      const metadata = detailedMetadata();
      const proposal = riskEntry('L0', {
        probability: 'Moyenne', impact: 'Critique', followUp: 'Proposition argumentée à confirmer au démarrage.',
        title: 'Titre différent de la source', prevention: 'Autre prévention', owner: 'Responsable source',
      });
      metadata.taskDetails.L0.risks = [proposal];
      const browser = makeBrowser({ storedRaw: JSON.stringify(existing), metadataOverride: metadata });
      await browser.initialize();
      const result = browser.snapshot();
      assert.deepEqual(result.tasks[0].risks[0], {
        ...beforeRisk, probability: proposal.probability, impact: proposal.impact, followUp: proposal.followUp,
      });
      assert.equal(result.tasks[0].risks[0].status, 'À qualifier', 'proposed axes do not imply a human qualification');
      assert.deepEqual(JSON.parse(browser.values.get(BACKUP_KEY)), existing);
      const writes = browser.writes.length;
      await browser.run('enrichPilotTaskDetails(true)');
      assert.deepEqual(browser.snapshot(), result);
      assert.equal(browser.writes.length, writes, 'the proposed qualification must not be repeatedly written');
    });
  }
});

test('any human risk qualification or follow-up prevents the proposed axes from overwriting the risk', async t => {
  for (const [label, changes] of [
    ['probability already assessed', { probability: 'Faible' }],
    ['impact already assessed', { impact: 'Mineur' }],
    ['status changed', { status: 'Ouvert' }],
    ['evidence entered', { evidence: 'Observation humaine conservée' }],
    ['review scheduled', { reviewDate: '2026-09-25' }],
    ['owner named', { owner: 'Responsable du test' }],
    ['follow-up entered', { followUp: 'Note humaine : faire confirmer la disponibilité.' }],
    ['unmatched local risk ID', { id: 'R-LOCAL-1' }],
  ]) {
    await t.test(label, async () => {
      const existing = legacyPilot();
      const originalRisk = riskEntry('L0', changes);
      existing.tasks[0].risks = [originalRisk];
      const metadata = detailedMetadata();
      metadata.taskDetails.L0.risks = [riskEntry('L0', {
        probability: 'Élevée', impact: 'Critique', followUp: 'Proposition documentaire à confirmer.',
      })];
      const browser = makeBrowser({ storedRaw: JSON.stringify(existing), metadataOverride: metadata });
      await browser.initialize();
      assert.deepEqual(browser.snapshot().tasks[0].risks[0], originalRisk);
      assert.deepEqual(JSON.parse(browser.values.get(STORAGE_KEY)).tasks[0].risks[0], originalRisk);
    });
  }
});

test('a complete JSON backup round-trips descriptions, checklists and human validation evidence', async () => {
  const detailed = project();
  detailed.tasks[0].description = 'Mesure localisée et méthode documentée.\nLimite explicite.';
  detailed.tasks[0].checklist = [checklistEntry('A', {
    completed: true, validated: true, evidence: 'Compte rendu local du contrôle',
    validatedBy: 'Responsable déclaré', validatedAt: '2026-09-19T10:30:00.000Z',
  })];
  detailed.tasks[0].risks = [riskEntry('A', {
    probability: 'Faible', impact: 'Majeur', owner: 'Responsable déclaré', status: 'Résolu',
    evidence: 'Compte rendu de traitement', reviewDate: '2026-09-25',
  })];
  const browser = makeBrowser({ hostname: 'projet.avereo.fr' });
  await browser.initialize();
  await browser.importFile('restauration-complete.json', JSON.stringify(detailed));
  assert.deepEqual(browser.snapshot(), browser.normalize(detailed));
  const encoded = browser.run('ProjetPlanning.encodeProject(currentProject())');
  assert.deepEqual(JSON.parse(encoded), browser.snapshot());
  const reopened = makeBrowser({ hostname: 'projet.avereo.fr', storedRaw: encoded });
  await reopened.initialize();
  assert.deepEqual(reopened.snapshot(), browser.snapshot());
  assert.equal(reopened.snapshot().tasks[0].checklist[0].validated, true);
  assert.equal(reopened.writes.length, 0);
});

test('CSV reimport preserves details only for an unchanged task identity, name and lot', async t => {
  const detailed = project();
  detailed.tasks[0].description = 'Fiche personnelle';
  detailed.tasks[0].checklist = [checklistEntry('A', {
    completed: true, validated: true, evidence: 'Preuve vérifiée',
    validatedBy: 'Validateur', validatedAt: '2026-09-19T10:30:00.000Z',
  })];
  detailed.tasks[0].risks = [riskEntry('A', { status: 'Actif', followUp: 'Suivi personnel à conserver' })];
  const header = 'ID;Nom;Lot;Durée (jours ouvrés);Dépendances;Responsable;Statut;Avancement (%);Criticité';
  await t.test('the same task keeps its detailed evidence while duration is imported', async () => {
    const browser = makeBrowser({ storedRaw: JSON.stringify(detailed) });
    await browser.initialize();
    await browser.importFile('planning.csv', `${header}\nA;Tâche conservée;Lot témoin;2.75;;À confirmer;À faire;0;Majeur`);
    assert.equal(browser.snapshot().tasks[0].duration, 2.75);
    assert.equal(browser.snapshot().tasks[0].description, detailed.tasks[0].description);
    assert.deepEqual(browser.snapshot().tasks[0].checklist, detailed.tasks[0].checklist);
    assert.deepEqual(browser.snapshot().tasks[0].risks, detailed.tasks[0].risks);
  });
  for (const [label, name, lot] of [
    ['renamed task', 'Autre tâche', 'Lot témoin'],
    ['another lot', 'Tâche conservée', 'Autre lot'],
  ]) {
    await t.test(label, async () => {
      const browser = makeBrowser({ storedRaw: JSON.stringify(detailed) });
      await browser.initialize();
      await browser.importFile('autre-planning.csv', `${header}\nA;${name};${lot};2.75;;À confirmer;À faire;0;Majeur`);
      assert.equal(browser.snapshot().tasks[0].description, '');
      assert.deepEqual(browser.snapshot().tasks[0].checklist, []);
      assert.deepEqual(browser.snapshot().tasks[0].risks, []);
      assert(browser.confirms.some(message => /fiche|checklist/i.test(message)),
        'Replacing a detailed task through CSV must explicitly warn about the detail loss.');
      assert.deepEqual(JSON.parse(browser.values.get(BACKUP_KEY)), detailed);
    });
  }
});

test('unavailable or invalid detail metadata never turns a restored draft into corrupt storage', async t => {
  const existing = legacyPilot();
  existing.tasks[0].duration = 5.125;
  const raw = JSON.stringify(existing);
  const invalid = detailedMetadata();
  invalid.taskDetails.L0.checklist[0].validated = true;
  for (const [label, options] of [
    ['network failure', { fetchOverride: async () => { throw new Error('Réseau indisponible'); } }],
    ['incomplete validation in metadata', { metadataOverride: invalid }],
  ]) {
    await t.test(label, async () => {
      const browser = makeBrowser({ storedRaw: raw, ...options });
      await browser.initialize();
      assert.deepEqual(browser.snapshot(), browser.normalize(existing));
      assert.equal(browser.values.get(STORAGE_KEY), raw);
      assert.equal(browser.run('storageBlocked'), false);
      assert.equal(browser.run('projectLoaded'), true);
      assert.equal(browser.writes.length, 0);
      assert.doesNotMatch(browser.element('storage-status').textContent, /brouillon.*illisible/i);
    });
  }
});

test('an edit made while metadata is loading remains in the enriched and saved project', async () => {
  let release;
  const waitForMetadata = new Promise(resolve => { release = resolve; });
  const browser = makeBrowser({
    storedRaw: JSON.stringify(legacyPilot()), metadataOverride: detailedMetadata(),
    fetchOverride: async (_url, _options, response) => { await waitForMetadata; return response; },
  });
  const initialized = browser.initialize();
  assert.equal(browser.run('projectLoaded'), true, 'Restore must complete before the metadata request finishes.');
  const edited = browser.snapshot();
  edited.tasks[0].duration = 6.875;
  edited.tasks[0].description = 'Note saisie pendant la requête';
  assert.equal(browser.commit(edited), true);
  release();
  await initialized;
  assert.equal(browser.snapshot().tasks[0].duration, 6.875);
  assert.equal(browser.snapshot().tasks[0].description, edited.tasks[0].description);
  assert.deepEqual(browser.snapshot().tasks[0].checklist, []);
  assert.equal(browser.snapshot().tasks[1].description, 'Fiche documentée du lot L1.');
  assert.deepEqual(JSON.parse(browser.values.get(STORAGE_KEY)), browser.snapshot());
});

test('a second-tab write during enrichment cannot be overwritten by the automatic detail migration', async () => {
  let release;
  const waitForMetadata = new Promise(resolve => { release = resolve; });
  const raw = JSON.stringify(legacyPilot());
  const browser = makeBrowser({
    storedRaw: raw, metadataOverride: detailedMetadata(),
    fetchOverride: async (_url, _options, response) => { await waitForMetadata; return response; },
  });
  const initialized = browser.initialize();
  const restored = browser.snapshot();
  const other = legacyPilot();
  other.tasks[0].owner = 'Autre responsable';
  const otherRaw = JSON.stringify(other);
  browser.values.set(STORAGE_KEY, otherRaw);
  release();
  await initialized;
  assert.equal(browser.values.get(STORAGE_KEY), otherRaw);
  assert.equal(browser.writes.length, 0);
  assert.deepEqual(browser.snapshot(), restored);
  assert.equal(browser.run('storageBlocked'), false);
  assert.equal(browser.run('lastStoredRaw'), raw);
});
