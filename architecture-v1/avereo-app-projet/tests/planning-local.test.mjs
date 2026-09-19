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

function makeBrowser({ hostname = 'localhost', storedRaw = null } = {}) {
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
      if (url === '/local-planning/planning-pilote.json') {
        return { ok: true, json: async () => JSON.parse(pilotMetadata) };
      }
      if (url === '/local-planning/planning-pilote.csv') {
        return { ok: true, text: async () => pilotCsv };
      }
      throw new Error(`URL inattendue : ${url}`);
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

test('reload restores a user modification without fetching or resetting the pilot', async () => {
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
  assert.equal(reloaded.fetches.length, 0);
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
