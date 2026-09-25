import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../frontend/public/' + name, import.meta.url), 'utf8');
const html = read('legacy-app.html');
const inlineSource = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n');
const sources = [read('planning-core.js'), inlineSource, read('planning-local.js'), read('task-details.js')];
const storageKey = 'avereo.projet.planning.v1';
const plain = value => JSON.parse(JSON.stringify(value));

function fixture() {
    return {
        schemaVersion: 1, name: 'Essai des fiches', startDate: '2026-09-21',
        targetDate: '2026-10-30', capacityPerWeek: 5, schedulingMode: 'sequential',
        tasks: [{
            id: 'L0', name: 'Préparer le pilote', lot: 'Préparation', duration: 2.5,
            dependencies: [], owner: 'À confirmer', status: 'À faire', progress: 0,
            description: 'Objectif du lot.\nConserver les preuves de recette.',
            checklist: [{
                id: 'AT-01', title: 'Contrôle du pilote', action: 'Exécuter le scénario.',
                expected: 'Le résultat est documenté.', sourceRefs: ['Audit §17'],
                completed: false, validated: false, evidence: '', validatedBy: '', validatedAt: null
            }],
            risks: [{
                id: 'R-01', title: 'Disponibilité du pilote', cause: 'Planning à confirmer',
                consequence: 'Décalage de la recette', probability: 'À qualifier', impact: 'À qualifier',
                prevention: 'Confirmer les disponibilités', contingency: 'Replanifier la recette',
                owner: '', status: 'À qualifier', followUp: '', evidence: '', reviewDate: null,
                sourceRefs: ['Audit : hypothèse de capacité']
            }]
        }]
    };
}

// Execute the real inline modal/save functions, controller, detail handlers and
// core together. Only the DOM/storage adapters are fake; no business function
// is copied or replaced here. These tests do not stand in for visual browser QA.
function browser({ project = fixture(), storedRaw = null, hostname = 'example.invalid', fetchOverride } = {}) {
    const elements = new Map();
    const storage = new Map(storedRaw === null ? [] : [[storageKey, storedRaw]]);
    const alerts = [];
    const writes = [];
    function node() {
        const classes = new Set();
        let value = '', markup = '';
        return {
            get value() { return value; }, set value(next) { value = String(next); },
            get innerHTML() { return markup; }, set innerHTML(next) { markup = String(next); this.options = []; },
            textContent: '', style: {}, className: '', checked: false, disabled: false, hidden: false,
            options: [], get selectedOptions() { return this.options.filter(option => option.selected); },
            appendChild(child) { this.options.push(child); },
            classList: { add(...names) { names.forEach(name => classes.add(name)); }, remove(...names) { names.forEach(name => classes.delete(name)); }, contains(name) { return classes.has(name); } },
            addEventListener() {}, querySelector() { return null; },
            reportValidity() { return true; }, scrollIntoView() {}, reset() {}
        };
    }
    const element = id => {
        if (!elements.has(id)) elements.set(id, node());
        return elements.get(id);
    };
    const context = vm.createContext({
        Date, console, setTimeout() {}, location: { hostname },
        fetch: fetchOverride || (() => { throw new Error('Unexpected fetch in this test'); }),
        document: { getElementById: element, createElement: node, addEventListener() {}, body: node() },
        window: { addEventListener() {}, alert(message) { alerts.push(message); }, confirm() { return true; } },
        localStorage: {
            getItem(key) { return storage.get(key) ?? null; },
            setItem(key, value) { writes.push({ key, value }); storage.set(key, value); }
        }
    });
    const run = source => vm.runInContext(source, context);
    sources.forEach(run);
    if (storedRaw === null) {
        context.inputProject = project;
        run('applyProject(inputProject); persistProject(currentProject())');
        writes.length = 0;
    }
    return {
        run, element, alerts, writes,
        raw: () => storage.get(storageKey),
        project: () => plain(run('ProjetPlanning.normalizeProject(currentProject())')),
        checklist: () => plain(run('editingChecklist')),
        risks: () => plain(run('editingRisks')),
        open: () => run("openTaskModal('L0')"),
        initialize: () => run('initializeLocalProject()'),
        checklistField(field, value) {
            const control = element(`step-${field}-0`);
            if (typeof value === 'boolean') control.checked = value; else control.value = value;
            run(`updateChecklistEntry(0, ${JSON.stringify(field)})`);
        },
        riskField(field, value) {
            element(`risk-${field}-0`).value = value;
            run(`updateRiskField(0, ${JSON.stringify(field)})`);
        }
    };
}

function pendingPilotEnrichment() {
    const canonical = JSON.parse(readFileSync(new URL('../data/planning-pilote.json', import.meta.url), 'utf8'));
    const metadata = JSON.parse(readFileSync(new URL('../data/generated/planning-pilote.json', import.meta.url), 'utf8'));
    const csv = readFileSync(new URL('../data/generated/planning-pilote.csv', import.meta.url), 'utf8');
    const legacy = { ...canonical, tasks: canonical.tasks.map(({ description, checklist, risks, ...task }) => task) };
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    const ui = browser({
        storedRaw: JSON.stringify(legacy), hostname: 'localhost',
        fetchOverride: async url => {
            await pending;
            if (url.endsWith('.json')) return { ok: true, json: async () => metadata };
            if (url.endsWith('.csv')) return { ok: true, text: async () => csv };
            throw new Error(`Unexpected local URL: ${url}`);
        }
    });
    const initialized = ui.initialize();
    assert.equal(ui.run('projectLoaded'), true);
    return { ui, release, initialized };
}

test('saving a sheet opened before automatic enrichment keeps newly arrived checklist and risks', async t => {
    for (const [label, description] of [['untouched description', ''], ['personal description', 'Note saisie pendant le chargement']]) {
        await t.test(label, async () => {
            const { ui, release, initialized } = pendingPilotEnrichment();
            ui.open();
            assert.deepEqual(ui.checklist(), []);
            assert.deepEqual(ui.risks(), []);
            ui.element('task-description').value = description;
            release();
            await initialized;
            const enriched = ui.project().tasks[0];
            assert(enriched.checklist.length > 0);
            assert(enriched.risks.length > 0);
            assert.deepEqual(ui.checklist(), [], 'the open modal keeps its separate draft');
            ui.run('saveTask()');
            const saved = JSON.parse(ui.raw()).tasks[0];
            assert.deepEqual(saved.checklist, enriched.checklist);
            assert.deepEqual(saved.risks, enriched.risks);
            assert.equal(saved.description, description || enriched.description);
            assert.deepEqual(ui.alerts, []);
        });
    }
});

test('a risk entered in the open draft survives enrichment together with new documented risks', async () => {
    const { ui, release, initialized } = pendingPilotEnrichment();
    ui.open();
    ui.run('addTaskRisk()');
    ui.riskField('title', 'Risque saisi avant la fin du chargement');
    ui.riskField('followUp', 'Suivi humain à conserver');
    ui.riskField('probability', 'Faible');
    ui.riskField('impact', 'Majeur');
    ui.riskField('status', 'Ouvert');
    const personal = ui.risks()[0];
    release();
    await initialized;
    const documented = ui.project().tasks[0].risks;
    ui.run('saveTask()');
    const saved = JSON.parse(ui.raw()).tasks[0];
    assert.deepEqual(saved.risks, [personal, ...documented]);
    assert.equal(new Set(saved.risks.map(risk => risk.id)).size, saved.risks.length);
    assert.deepEqual(ui.alerts, []);
});

test('cancelling a sheet during enrichment never commits its personal description or risk draft', async () => {
    const { ui, release, initialized } = pendingPilotEnrichment();
    ui.open();
    ui.element('task-description').value = 'Description à annuler';
    ui.run('addTaskRisk()');
    ui.riskField('followUp', 'Suivi à annuler');
    release();
    await initialized;
    const enriched = ui.project();
    const stored = ui.raw();
    const writes = ui.writes.length;
    ui.run('closeTaskModal()');
    assert.deepEqual(ui.project(), enriched);
    assert.equal(ui.raw(), stored);
    assert.equal(ui.writes.length, writes);
    ui.open();
    assert.equal(ui.element('task-description').value, enriched.tasks[0].description);
    assert.deepEqual(ui.risks(), enriched.tasks[0].risks);
    assert.deepEqual(ui.checklist(), enriched.tasks[0].checklist);
});

test('saving a normal task edit keeps its description, checklist and risk sheet', () => {
    const ui = browser();
    const before = ui.project().tasks[0];
    ui.open();
    ui.element('task-duration').value = '3.25';
    ui.run('saveTask()');
    const after = JSON.parse(ui.raw()).tasks[0];
    assert.equal(after.duration, 3.25);
    for (const field of ['description', 'checklist', 'risks']) assert.deepEqual(after[field], before[field]);
    assert.deepEqual(ui.alerts, []);
    assert.equal(ui.element('task-modal').classList.contains('open'), false);
});

test('closing a task sheet discards draft checklist and risk changes without mutating the project', () => {
    const ui = browser();
    const before = ui.project();
    const raw = ui.raw();
    ui.open();
    ui.checklistField('completed', true);
    ui.checklistField('evidence', 'Preuve non enregistrée');
    ui.riskField('followUp', 'Action non enregistrée');
    ui.element('task-description').value = 'Description non enregistrée';
    ui.run('closeTaskModal()');
    assert.deepEqual(ui.project(), before);
    assert.equal(ui.raw(), raw);
    assert.equal(ui.writes.length, 0);
    ui.open();
    assert.deepEqual(ui.checklist(), before.tasks[0].checklist);
    assert.deepEqual(ui.risks(), before.tasks[0].risks);
    assert.equal(ui.element('task-description').value, before.tasks[0].description);
});

test('checklist validation requires completion, evidence and a verifier independently', async t => {
    for (const missing of ['completed', 'evidence', 'validatedBy']) {
        await t.test(`missing ${missing}`, () => {
            const ui = browser();
            ui.open();
            if (missing !== 'completed') ui.checklistField('completed', true);
            if (missing !== 'evidence') ui.checklistField('evidence', 'Résultat conforme, journal local');
            if (missing !== 'validatedBy') ui.checklistField('validatedBy', 'Vérificateur du test');
            ui.checklistField('validated', true);
            assert.equal(ui.checklist()[0].validated, false);
            assert.equal(ui.checklist()[0].validatedAt, null);
            assert.equal(ui.element('step-validated-0').checked, false);
            assert.match(ui.element('step-feedback-0').textContent, /réalise.*preuve.*vérificateur/i);
            assert.equal(ui.writes.length, 0);
        });
    }
});

test('completion is distinct from validation and a saved proof survives reopening the browser', async () => {
    const ui = browser();
    ui.open();
    ui.checklistField('completed', true);
    assert.equal(ui.checklist()[0].validated, false);
    assert.match(ui.element('task-checklist-summary').textContent, /^0\/1/);
    ui.checklistField('evidence', 'Journal de recette local : scénario conforme.');
    ui.checklistField('validatedBy', 'Vérificateur du test');
    ui.checklistField('validated', true);
    const draft = ui.checklist()[0];
    assert.equal(draft.validated, true);
    assert.match(draft.validatedAt, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    assert.equal(ui.project().tasks[0].checklist[0].validated, false, 'validation remains a draft before saving');
    assert.match(ui.element('task-checklist-summary').textContent, /^1\/1/);
    ui.run('saveTask()');
    assert.deepEqual(JSON.parse(ui.raw()).tasks[0].checklist[0], draft);
    const restored = browser({ storedRaw: ui.raw() });
    await restored.initialize();
    restored.open();
    assert.deepEqual(restored.checklist()[0], draft);
    assert.match(restored.element('task-checklist').innerHTML, /Validation enregistrée le/);
    assert.equal(restored.writes.length, 0);
});

test('changing a validated proof, verifier or completion requires a fresh explicit validation', async t => {
    for (const [field, value] of [['evidence', 'Nouvelle preuve'], ['validatedBy', 'Autre vérificateur'], ['completed', false]]) {
        await t.test(field, () => {
            const project = fixture();
            Object.assign(project.tasks[0].checklist[0], {
                completed: true, validated: true, evidence: 'Preuve initiale',
                validatedBy: 'Vérificateur initial', validatedAt: '2026-09-19T10:00:00.000Z'
            });
            const ui = browser({ project });
            ui.open();
            ui.checklistField(field, value);
            assert.equal(ui.checklist()[0].validated, false);
            assert.equal(ui.checklist()[0].validatedAt, null);
            assert.equal(ui.element('step-validated-0').checked, false);
            assert.equal(ui.project().tasks[0].checklist[0].validated, true);
            ui.run('saveTask()');
            assert.equal(JSON.parse(ui.raw()).tasks[0].checklist[0].validated, false);
        });
    }
});

test('an invalid modal form cannot commit draft checklist changes', () => {
    const ui = browser();
    const raw = ui.raw();
    ui.open();
    ui.checklistField('completed', true);
    ui.element('task-form').reportValidity = () => false;
    ui.run('saveTask()');
    assert.equal(ui.raw(), raw);
    assert.equal(ui.project().tasks[0].checklist[0].completed, false);
    assert.equal(ui.element('task-modal').classList.contains('open'), true);
});

test('risk qualification updates the actual matrix and persists the detailed follow-up', () => {
    const ui = browser();
    ui.open();
    assert.equal(ui.run('riskBadge(editingRisks[0])'), 'À qualifier');
    ui.riskField('probability', 'Élevée');
    assert.equal(ui.element('risk-score-0').textContent, 'À qualifier');
    ui.riskField('impact', 'Critique');
    assert.equal(ui.element('risk-score-0').textContent, 'Critique · 9/9 · proposé');
    ui.riskField('status', 'Actif');
    assert.equal(ui.element('risk-score-0').textContent, 'Critique · 9/9');
    ui.riskField('owner', 'Responsable du test');
    ui.riskField('followUp', 'Confirmer le créneau avant le prochain essai.');
    const draft = ui.risks()[0];
    ui.run('saveTask()');
    assert.deepEqual(JSON.parse(ui.raw()).tasks[0].risks[0], draft);
    assert.match(ui.element('risk-register-summary').textContent, /1 risques documentés.*1 ouverts/);
    assert.match(ui.element('risks-table-body').innerHTML, /Critique · 9\/9/);
    assert.deepEqual(ui.alerts, []);
});

test('a scored proposal stays pending confirmation and does not raise a confirmed critical risk alert', () => {
    const project = fixture();
    Object.assign(project.tasks[0].risks[0], {
        probability: 'Élevée', impact: 'Critique', status: 'À qualifier',
        followUp: 'Proposition initiale argumentée : confirmer les axes avec le responsable.'
    });
    const ui = browser({ project });
    ui.open();
    assert.equal(ui.run('riskBadge(editingRisks[0])'), 'Critique · 9/9 · proposé');
    assert.equal(ui.run('riskAttention(tasks[0])'), false);
    assert.match(ui.element('risk-register-summary').textContent, /1 à qualifier \/ confirmer/);
    assert.match(ui.element('risks-table-body').innerHTML, /Critique · 9\/9 · proposé/);
    ui.riskField('status', 'Ouvert');
    assert.equal(ui.element('risk-score-0').textContent, 'Critique · 9/9');
    assert.equal(ui.run('riskAttention(tasks[0])'), false, 'unsaved qualification must not change the active register');
    ui.run('saveTask()');
    assert.equal(ui.run('riskAttention(tasks[0])'), true);
    assert.match(ui.element('risk-register-summary').textContent, /0 à qualifier \/ confirmer/);
    assert.doesNotMatch(ui.element('risks-table-body').innerHTML, /9\/9 · proposé/);
    assert.equal(JSON.parse(ui.raw()).tasks[0].risks[0].status, 'Ouvert');
});

test('risk closure and acceptance reject missing evidence, then persist a documented decision', async t => {
    for (const status of ['Résolu', 'Accepté']) {
        await t.test(status, () => {
            const ui = browser();
            const raw = ui.raw();
            ui.open();
            ui.riskField('status', status);
            ui.run('saveTask()');
            assert.equal(ui.raw(), raw);
            assert.equal(ui.writes.length, 0);
            assert.equal(ui.element('task-modal').classList.contains('open'), true);
            assert.match(ui.alerts.at(-1), /responsable, preuve et date de revue/);
            ui.riskField('probability', 'Moyenne');
            ui.riskField('impact', 'Majeur');
            ui.riskField('owner', 'À confirmer');
            ui.riskField('evidence', 'Compte rendu : décision et justification conservées.');
            ui.riskField('reviewDate', '2026-09-25');
            ui.run('saveTask()');
            assert.equal(ui.raw(), raw, 'a placeholder owner is not a named decision owner');
            ui.riskField('owner', 'Responsable du test');
            const draft = ui.risks()[0];
            ui.run('saveTask()');
            assert.deepEqual(JSON.parse(ui.raw()).tasks[0].risks[0], draft);
            assert.equal(ui.element('task-modal').classList.contains('open'), false);
        });
    }
});

test('adding a local risk uses distinct IDs and leaves active data untouched until saving', () => {
    const ui = browser();
    ui.open();
    ui.run('addTaskRisk(); addTaskRisk()');
    assert.deepEqual(ui.risks().map(risk => risk.id), ['R-01', 'R-LOCAL-1', 'R-LOCAL-2']);
    assert.equal(ui.project().tasks[0].risks.length, 1);
    ui.run('saveTask()');
    assert.equal(JSON.parse(ui.raw()).tasks[0].risks.length, 3);
});

test('checklist and risk renderers escape source text, proofs and HTML attribute values', () => {
    const project = fixture();
    const payload = '<img src=x onerror="alert(1)"> & \'témoignage\'';
    Object.assign(project.tasks[0].checklist[0], { title: payload, action: payload, expected: payload, sourceRefs: [payload], evidence: '</textarea>' + payload, validatedBy: '" autofocus onfocus="alert(1)' });
    Object.assign(project.tasks[0].risks[0], { title: payload, cause: payload, consequence: payload, evidence: '</textarea>' + payload, owner: '" autofocus onfocus="alert(1)', sourceRefs: [payload] });
    const ui = browser({ project });
    ui.open();
    for (const id of ['task-checklist', 'task-risks', 'risks-table-body']) {
        const markup = ui.element(id).innerHTML;
        assert.ok(!markup.includes('<img'), `${id} must not insert the supplied element`);
        assert.ok(!markup.includes('value="" autofocus'), `${id} must not break an attribute`);
        assert.match(markup, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; &#39;témoignage&#39;/);
    }
    assert.match(ui.element('task-checklist').innerHTML, /&lt;\/textarea&gt;/);
    assert.match(ui.element('task-risks').innerHTML, /&lt;\/textarea&gt;/);
});
