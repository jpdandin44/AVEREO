import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const corePath = new URL('../frontend/public/planning-core.js', import.meta.url);
const context = { module: { exports: {} }, Date, console };
vm.runInNewContext(readFileSync(corePath, 'utf8'), context);
const P = context.module.exports;
const plain = value => JSON.parse(JSON.stringify(value));
const date = value => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
const task = (id, duration = 1, dependencies = [], extra = {}) => ({ id, name: `Tâche ${id}`, duration, dependencies, ...extra });
const project = (tasks, extra = {}) => ({ schemaVersion: 1, name: 'Pilote AVEREO', startDate: '2026-09-21', targetDate: '2026-10-30', capacityPerWeek: 5, schedulingMode: 'sequential', tasks, ...extra });

test('six lots preserve 29.4 days and finish on 30 October, without rounding each task', () => {
    const ids = ['L0', 'L1', 'L2', 'L3', 'RES', 'L4'];
    const tasks = [5, 5.75, 5.25, 7, 4.9, 1.5].map((duration, i) => task(ids[i], duration, i ? [ids[i - 1]] : []));
    const input = project(tasks);
    const before = JSON.stringify(input);
    const result = P.schedule(input, '2026-09-19');
    assert.equal(result.totalDuration, 29.4);
    assert.equal(result.totalWorkDays, 29.4);
    assert.equal(date(result.projectEnd), '2026-10-30');
    assert.equal(result.tasks[2].startOffset, 10.75);
    assert.equal(result.tasks[5].startOffset, 27.9);
    assert.equal(result.tasks[5].endOffset, 29.4);
    assert.equal(JSON.stringify(input), before);
});

test('two half days and a milestone share the correct business-day boundary', () => {
    const result = P.schedule(project([task('A', 0.5), task('M', 0, ['A']), task('B', 0.5, ['M']), task('C', 1, ['B'])]), '2026-09-19');
    assert.deepEqual(result.tasks.map(t => [t.startOffset, t.endOffset]).map(plain), [[0, .5], [.5, .5], [.5, 1], [1, 2]]);
    assert.equal(date(result.tasks[1].calcStart), '2026-09-21');
    assert.equal(date(result.tasks[2].calcEnd), '2026-09-21');
    assert.equal(date(result.tasks[3].calcStart), '2026-09-22');
    assert.equal(result.tasks[1].isMilestone, true);
});

test('capacity converts person-days once and sequential mode prevents accidental parallel work', () => {
    const result = P.schedule(project([task('A'), task('B')], { capacityPerWeek: 2.5 }), '2026-09-19');
    assert.equal(result.totalDuration, 2);
    assert.equal(result.totalWorkDays, 4);
    assert.equal(result.tasks[1].startOffset, 2);
    assert.equal(date(result.projectEnd), '2026-09-24');
});

test('dependency mode is topological, supports unordered input and uses manual dates only as lower bounds', () => {
    const result = P.schedule(project([task('B', 1, ['A'], { manualStart: '2026-09-21' }), task('A', 5), task('C', .25)], { schedulingMode: 'dependencies' }), '2026-09-19');
    assert.equal(result.tasks[0].id, 'B');
    assert.equal(date(result.tasks[0].calcStart), '2026-09-28');
    assert.equal(result.tasks[2].startOffset, 0);
    assert.throws(() => P.schedule(project([task('B', 1, ['A']), task('A')]), '2026-09-19'), /doit précéder/);
});

test('weekends are skipped for origins, manual lower bounds and successors', () => {
    const result = P.schedule(project([task('A', 1), task('B', 1, ['A'], { manualStart: '2026-10-03' })], { startDate: '2026-09-26' }), '2026-09-19');
    assert.equal(date(result.projectStart), '2026-09-28');
    assert.equal(date(result.tasks[1].calcStart), '2026-10-05');
});

test('calendar arithmetic remains stable through the Europe/Paris DST transition', () => {
    const script = `const fs=require('fs'),vm=require('vm'); const c={module:{exports:{}},Date}; vm.runInNewContext(fs.readFileSync(${JSON.stringify(fileURLToPath(corePath))},'utf8'),c); const r=c.module.exports.schedule(${JSON.stringify(project([task('A', 1.5), task('B', .5, ['A'])], { startDate: '2026-10-23' }))},'2026-10-20'); console.log(JSON.stringify(r.tasks.map(t=>[t.calcStart.getFullYear(),t.calcStart.getMonth()+1,t.calcStart.getDate(),t.calcEnd.getDate(),t.calcStart.getHours(),t.startOffset,t.endOffset])));`;
    const child = spawnSync(process.execPath, ['-e', script], { env: { ...process.env, TZ: 'Europe/Paris' }, encoding: 'utf8' });
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), [[2026, 10, 23, 26, 0, 0, 1.5], [2026, 10, 26, 26, 0, 1.5, 2]]);
});

test('duplicates, reserved IDs, absent dependencies and cycles are rejected before scheduling', () => {
    for (const tasks of [
        [task('A'), task('A')], [task('__proto__')], [task('constructor')], [task('prototype')],
        [task('bad id')], [task('A', 1, ['MISSING'])], [task('A', 1, ['A'])], [task('A', 1, ['B']), task('B', 1, ['A'])]
    ]) assert.throws(() => P.validateTasks(tasks));
});

test('invalid numbers, progress, statuses and dates cannot silently become a milestone or success', () => {
    for (const duration of ['', '2 jours', 'NaN', Infinity, -1, 3651]) assert.throws(() => P.validateTasks([task('A', duration)]));
    for (const progress of [-1, 101, Infinity, 'invalid']) assert.throws(() => P.validateTasks([task('A', 1, [], { progress })]));
    assert.throws(() => P.validateTasks([task('A', 1, [], { status: 'Réussi' })]));
    assert.throws(() => P.validateTasks([task('A', 1, [], { manualStart: '2026-02-30' })]));
    assert.throws(() => P.normalizeProject(project([], { capacityPerWeek: 0 })));
    assert.throws(() => P.normalizeProject(project([], { startDate: '21/09/2026' })));
    assert.equal(P.parseNumber('0,875'), .875);
});

test('CSV handles BOM, semicolons, doubled quotes, line breaks, decimal commas and one percent', () => {
    const csv = '\uFEFF"ID";"Nom";"Lot";"Durée (jours ouvrés)";"Dépendances";"Responsable";"Statut";"Avancement (%)";"Criticité"\r\n"A";"Mesure; \"\"air\"\"\nÉtage";"L0";"0,75";"";"À confirmer";"À faire";"1";"Majeur"\r\n"B";"Suite";"L1";"1.5";"A";"";"En cours";"12,5%";"Mineur"\r\n';
    const tasks = P.mapRows(P.parseCsv(csv));
    assert.equal(tasks[0].name, 'Mesure; "air"\nÉtage');
    assert.equal(tasks[0].duration, .75);
    assert.equal(tasks[0].progress, 1);
    assert.equal(tasks[1].progress, 12.5);
    assert.deepEqual(plain(tasks[1].dependencies), ['A']);
    assert.equal(P.mapRows(P.parseCsv('ID,Nom,Duree\nA,Simple,1\n'))[0].duration, 1);
});

test('malformed or empty imports fail without mutating the previous project', () => {
    const current = project([task('KEEP', .75)]);
    const before = JSON.stringify(current);
    for (const csv of ['', 'ID;Nom;Duree\n', 'ID;ID;Duree\nA;A;1', 'ID;Nom;Duree\nA;"non fermé;1', 'ID;Nom;Duree\nA;Nom;1;extra', 'Nom;Durée\nNom;1']) {
        assert.throws(() => P.mapRows(P.parseCsv(csv)));
        assert.equal(JSON.stringify(current), before);
    }
    assert.throws(() => P.decodeProject('{"schemaVersion":999}'));
    assert.equal(JSON.stringify(current), before);
    assert.deepEqual(plain(P.normalizeProject(project([])).tasks), []);
    assert.equal(P.schedule(project([]), '2026-09-19').totalDuration, 0);
});

test('JSON round trip preserves only authoritative fields, including fractional durations and manual dates', () => {
    const input = project([task('A', .875, [], { manualStart: '2026-09-23', progress: 1, calcStart: new Date(), startOffset: 99 })]);
    const decoded = P.decodeProject(P.encodeProject(input));
    assert.deepEqual(plain(decoded), plain(P.normalizeProject(input)));
    assert.equal(decoded.tasks[0].calcStart, undefined);
    assert.equal(decoded.tasks[0].startOffset, undefined);
    assert.equal(decoded.tasks[0].manualStart, '2026-09-23');
});

test('CSV export is quoted, protects spreadsheet formulas and reimports safe text without loss', () => {
    const tasks = ['=1+1', '+SUM(A1)', '-instruction', '@SUM(A1)', "'=literal", 'Photo "mur";\nétage'].map((name, i) => task('T' + i, .5, [], { name, owner: '=HYPERLINK("x")', progress: 1 }));
    const csv = P.tasksToCsv(tasks);
    assert.equal(csv.charCodeAt(0), 0xfeff);
    assert.match(csv, /"'=1\+1"/);
    const restored = P.mapRows(P.parseCsv(csv));
    assert.deepEqual(plain(restored), plain(P.validateTasks(tasks)));
});

test('today drives lateness while completed tasks are excluded', () => {
    const tasks = [task('A'), task('B', 1, [], { status: 'Terminé' })];
    const result = P.schedule(project(tasks), '2026-09-23');
    assert.equal(result.tasks[0].isLate, true);
    assert.equal(result.tasks[1].isLate, false);
    assert.equal(date(P.offsetToDate('2026-09-21', 5, { end: true })), '2026-09-25');
    assert.equal(date(P.offsetToDate('2026-09-21', 5)), '2026-09-28');
});

test('oversized lists and date horizons are rejected before creating an unusable Gantt', () => {
    assert.throws(() => P.validateTasks(Array.from({ length: 1001 }, (_, i) => task('T' + i))), /1000/);
    assert.throws(() => P.schedule(project([task('A', 3650)]), '2026-09-19'), /3660 jours calendaires/);
    assert.throws(() => P.schedule(project([task('A', 1)], { capacityPerWeek: .000001 }), '2026-09-19'), /jours ouvrés/);
    assert.throws(() => P.schedule(project([task('A', 0, [], { manualStart: '2040-01-01' })]), '2026-09-19'), /3660 jours calendaires/);
    assert.equal(P.normalizeProject(project([], { targetDate: undefined })).targetDate, null);
});

test('tiny positive durations never collapse into a milestone or an end date before the start', () => {
    const result = P.schedule(project([task('A'), task('B', .000000001)]), '2026-09-19');
    assert.equal(date(result.tasks[1].calcStart), '2026-09-22');
    assert.equal(date(result.tasks[1].calcEnd), '2026-09-22');
    assert.throws(() => P.schedule(project([task('A'), task('B', 1e-12)]), '2026-09-19'), /précision/);
});

const checklistItem = (extra = {}) => ({
    id: 'VERIFY_1', title: 'Vérifier le résultat', action: 'Exécuter le scénario et relever le résultat.',
    expected: 'Le résultat attendu est observable.', sourceRefs: ['audit.md#ev-01'], ...extra
});

test('old JSON and CSV gain empty detail fields without changing existing tracking', () => {
    const legacy = project([task('A', .875, [], { status: 'En cours', progress: 12.5 })]);
    const jsonTask = P.decodeProject(JSON.stringify(legacy)).tasks[0];
    assert.equal(jsonTask.description, '');
    assert.deepEqual(plain(jsonTask.checklist), []);
    assert.equal(jsonTask.status, 'En cours');
    assert.equal(jsonTask.progress, 12.5);
    assert.equal(jsonTask.duration, .875);
    const csvTask = P.mapRows(P.parseCsv('ID;Nom;Durée;Statut;Avancement\nA;Ancienne tâche;0,875;En cours;12,5'))[0];
    assert.equal(csvTask.description, '');
    assert.deepEqual(plain(csvTask.checklist), []);
    assert.equal(csvTask.duration, .875);
    assert.equal(csvTask.progress, 12.5);
});

test('JSON preserves detailed checklists, proof and validation identity without completing the task', () => {
    const detailed = project([task('A', .875, [], {
        description: 'Objectif du lot.\nDeuxième ligne.', status: 'En cours', progress: 12.5,
        checklist: [checklistItem({ completed: true, validated: true, evidence: 'Résultat consigné dans preuve-01.pdf.', validatedBy: 'Relecteur local', validatedAt: '2026-09-21T14:30:15+02:00' })]
    })]);
    const decoded = P.decodeProject(P.encodeProject(detailed));
    assert.deepEqual(plain(decoded), plain(P.normalizeProject(detailed)));
    assert.equal(decoded.schemaVersion, 1);
    assert.equal(decoded.tasks[0].description, 'Objectif du lot.\nDeuxième ligne.');
    assert.equal(decoded.tasks[0].checklist[0].validatedAt, '2026-09-21T12:30:15.000Z');
    assert.equal(decoded.tasks[0].checklist[0].validated, true);
    assert.equal(decoded.tasks[0].status, 'En cours');
    assert.equal(decoded.tasks[0].progress, 12.5);
});

test('checklist validation requires completion, proof, identity and a real ISO timestamp', () => {
    const valid = checklistItem({ completed: true, validated: true, evidence: 'Observation vérifiée', validatedBy: 'Relecteur', validatedAt: '2026-09-21T12:30:00.000Z' });
    for (const override of [
        { completed: false }, { completed: 'true' }, { validated: 1 },
        { evidence: '  ' }, { validatedBy: '' }, { validatedAt: null },
        { validatedAt: '2026-02-30T12:30:00Z' }, { validatedAt: '2026-09-21' },
        { validatedAt: '2026-09-21T12:30:00' }, { validatedAt: '2026-09-21T24:00:00Z' },
        { validatedAt: '2026-09-21T12:30:00+25:00' }
    ]) {
        assert.throws(() => P.validateTasks([task('A', 1, [], { checklist: [{ ...valid, ...override }] })]), JSON.stringify(override));
    }
    assert.equal(P.validateTasks([task('A', 1, [], { checklist: [valid] })])[0].checklist[0].validated, true);
    assert.equal(P.validateTasks([task('A', 1, [], { checklist: [{ ...valid, validatedAt: '2028-02-29T12:30:00Z' }] })])[0].checklist[0].validatedAt, '2028-02-29T12:30:00.000Z');
});

test('draft checklist progress is explicit and cannot retain a validation timestamp', () => {
    const normalized = P.validateTasks([task('A', 1, [], { checklist: [checklistItem({ completed: true, evidence: 'Preuve en attente de relecture' })] })])[0];
    assert.equal(normalized.status, 'À faire');
    assert.equal(normalized.progress, 0);
    assert.equal(normalized.checklist[0].completed, true);
    assert.equal(normalized.checklist[0].validated, false);
    assert.equal(normalized.checklist[0].validatedBy, '');
    assert.equal(normalized.checklist[0].validatedAt, null);
    assert.throws(() => P.validateTasks([task('A', 1, [], { checklist: [checklistItem({ validatedAt: '2026-09-21T12:30:00Z' })] })]), /non validé/);
});

test('detail bounds, types, unsafe identifiers and checklist duplicates are rejected', () => {
    for (const extra of [
        { description: 'x'.repeat(12001) }, { description: null }, { checklist: null },
        { checklist: Array.from({ length: 101 }, (_, i) => checklistItem({ id: 'C' + i })) },
        { checklist: [checklistItem(), checklistItem()] },
        { checklist: [checklistItem({ id: '__proto__' })] },
        { checklist: [checklistItem({ title: '' })] },
        { checklist: [checklistItem({ action: 'x'.repeat(12001) })] },
        { checklist: [checklistItem({ expected: 'x'.repeat(12001) })] },
        { checklist: [checklistItem({ evidence: 'x'.repeat(6001) })] },
        { checklist: [checklistItem({ sourceRefs: Array(21).fill('source') })] },
        { checklist: [checklistItem({ sourceRefs: ['x'.repeat(501)] })] },
        { checklist: [checklistItem({ sourceRefs: [42] })] },
        { checklist: [checklistItem({ completed: 'false' })] }
    ]) assert.throws(() => P.validateTasks([task('A', 1, [], extra)]));
    const boundary = P.validateTasks([task('A', 1, [], {
        description: 'x'.repeat(12000),
        checklist: Array.from({ length: 100 }, (_, i) => checklistItem({ id: 'C' + i }))
    })]);
    assert.equal(boundary[0].checklist.length, 100);
    assert.equal(P.validateTasks([task('A', 1, [], { checklist: [checklistItem()] }), task('B', 1, [], { checklist: [checklistItem()] })]).length, 2);
});

test('normalization and scheduling make independent copies of nested checklist data', () => {
    const original = project([task('A', .75, [], { checklist: [checklistItem()] })]);
    const before = JSON.stringify(original);
    const normalized = P.normalizeProject(original);
    const scheduled = P.schedule(normalized, '2026-09-19');
    scheduled.tasks[0].checklist[0].completed = true;
    scheduled.tasks[0].checklist[0].sourceRefs.push('another-source');
    assert.equal(normalized.tasks[0].checklist[0].completed, false);
    assert.equal(normalized.tasks[0].checklist[0].sourceRefs.length, 1);
    assert.equal(JSON.stringify(original), before);
});

test('adding completed checklists does not change fractional scheduling or the six-lot finish', () => {
    const detailed = [5, 5.75, 5.25, 7, 4.9, 1.5].map((duration, i) => task('L' + i, duration, i ? ['L' + (i - 1)] : [], {
        description: 'Description détaillée', checklist: [checklistItem({ completed: true })]
    }));
    const result = P.schedule(project(detailed), '2026-09-19');
    assert.equal(result.totalDuration, 29.4);
    assert.equal(date(result.projectEnd), '2026-10-30');
    assert.equal(result.tasks[2].startOffset, 10.75);
    assert.equal(result.tasks[5].endOffset, 29.4);
    assert.ok(result.tasks.every(entry => entry.status === 'À faire' && entry.progress === 0));
});

test('aggregate detail volume is rejected before producing a JSON backup that cannot be imported', () => {
    const largeChecklist = Array.from({ length: 100 }, (_, i) => checklistItem({
        id: 'C' + i, action: 'a'.repeat(12000), expected: 'b'.repeat(12000), evidence: 'c'.repeat(6000)
    }));
    const large = project([task('A', 1, [], { checklist: largeChecklist }), task('B', 1, [], { checklist: largeChecklist })]);
    assert.throws(() => P.normalizeProject(large), /5 millions de caractères/);
    assert.throws(() => P.encodeProject(large), /5 millions de caractères/);
    const smaller = project([task('A', 1, [], { checklist: largeChecklist })]);
    const serialized = P.encodeProject(smaller);
    assert.ok(serialized.length <= P.LIMITS.maxProjectCharacters);
    assert.equal(P.decodeProject(serialized).tasks[0].checklist.length, 100);
});

test('Unicode-rich details respect the same five-MiB file limit as the import controller', () => {
    const tooLarge = project([task('A', 1, [], {
        checklist: Array.from({ length: 100 }, (_, i) => checklistItem({ id: 'C' + i, action: '漢'.repeat(12000), expected: '漢'.repeat(12000), evidence: '漢'.repeat(6000) }))
    })]);
    assert.ok(JSON.stringify(tooLarge, null, 2).length < P.LIMITS.maxProjectCharacters);
    assert.throws(() => P.encodeProject(tooLarge), /5 Mio UTF-8/);
    const acceptable = project([task('A', 1, [], {
        checklist: Array.from({ length: 100 }, (_, i) => checklistItem({ id: 'C' + i, action: 'é'.repeat(12000), expected: 'Contrôle 🙂' }))
    })]);
    const serialized = P.encodeProject(acceptable);
    assert.ok(Buffer.byteLength(serialized, 'utf8') <= P.LIMITS.maxProjectBytes);
    assert.equal(P.decodeProject(serialized).tasks[0].checklist[0].expected, 'Contrôle 🙂');
});

const detailedRisk = (extra = {}) => ({ id: 'R1', title: 'Risque de dépendance', ...extra });

test('risk scoring covers the whole 3 by 3 matrix and leaves unqualified risks unscored', () => {
    const cases = [
        ['Faible', 'Mineur', 1, 'Mineur'], ['Faible', 'Majeur', 2, 'Mineur'], ['Faible', 'Critique', 3, 'Majeur'],
        ['Moyenne', 'Mineur', 2, 'Mineur'], ['Moyenne', 'Majeur', 4, 'Majeur'], ['Moyenne', 'Critique', 6, 'Critique'],
        ['Élevée', 'Mineur', 3, 'Majeur'], ['Élevée', 'Majeur', 6, 'Critique'], ['Élevée', 'Critique', 9, 'Critique']
    ];
    for (const [probability, impact, score, level] of cases) {
        assert.equal(P.riskScore({ probability, impact }), score, `${probability}/${impact}`);
        assert.equal(P.riskLevel({ probability, impact }), level, `${probability}/${impact}`);
    }
    for (const risk of [{}, { probability: 'À qualifier', impact: 'Critique' }, { probability: 'Élevée', impact: 'À qualifier' }]) {
        assert.equal(P.riskScore(risk), null);
        assert.equal(P.riskLevel(risk), 'À qualifier');
    }
    assert.throws(() => P.riskScore({ probability: 'Certaine', impact: 'Mineur' }));
    assert.throws(() => P.riskLevel({ probability: 'Faible', impact: 'Nul' }));
});

test('legacy projects retain their risk summary and acquire an empty detailed risk register', () => {
    const old = project([task('A', .875, [], { riskWeight: 'Critique', riskStatus: 'Actif', progress: 35 })]);
    const restored = P.decodeProject(JSON.stringify(old)).tasks[0];
    assert.deepEqual(plain(restored.risks), []);
    assert.equal(restored.riskWeight, 'Critique');
    assert.equal(restored.riskStatus, 'Actif');
    assert.equal(restored.progress, 35);
    assert.equal(P.mapRows(P.parseCsv('ID;Nom;Durée\nA;Ancienne tâche;0,875'))[0].risks.length, 0);
});

test('JSON preserves detailed risk causes, response plans, follow-up, references and review proof', () => {
    const input = project([task('A', .875, [], { riskWeight: 'Majeur', riskStatus: 'Sous surveillance', status: 'En cours', progress: 35,
        risks: [detailedRisk({
            cause: 'Indisponibilité de la dépendance.', consequence: 'Validation retardée.',
            probability: 'Moyenne', impact: 'Critique', prevention: 'Vérifier les prérequis.',
            contingency: 'Utiliser le scénario de secours.', owner: 'Responsable local', status: 'Résolu',
            followUp: 'Action réalisée et revue.', evidence: 'Compte rendu de vérification.',
            reviewDate: '2026-09-21', sourceRefs: ['audit.md#risque-01', 'EV-03']
        })]
    })]);
    const restored = P.decodeProject(P.encodeProject(input));
    assert.deepEqual(plain(restored), plain(P.normalizeProject(input)));
    assert.equal(restored.tasks[0].risks[0].reviewDate, '2026-09-21');
    assert.equal(restored.tasks[0].risks[0].status, 'Résolu');
    assert.equal(P.riskScore(restored.tasks[0].risks[0]), 6);
    assert.equal(restored.tasks[0].riskWeight, 'Majeur');
    assert.equal(restored.tasks[0].riskStatus, 'Sous surveillance');
    assert.equal(restored.tasks[0].status, 'En cours');
    assert.equal(restored.tasks[0].progress, 35);
    assert.equal(restored.tasks[0].duration, .875);
});

test('resolved or accepted risks require qualification, an owner, evidence and a valid review date', () => {
    for (const status of ['Résolu', 'Accepté']) {
        const complete = detailedRisk({ probability: 'Faible', impact: 'Mineur', owner: 'Responsable', status, evidence: 'Résultat observé', reviewDate: '2026-09-21' });
        for (const override of [
            { probability: 'À qualifier' }, { impact: 'À qualifier' }, { owner: ' ' }, { owner: 'À confirmer' },
            { evidence: '' }, { reviewDate: null }, { reviewDate: '2026-02-30' },
            { reviewDate: '21/09/2026' }, { reviewDate: '2026-09-21T12:00:00Z' }
        ]) assert.throws(() => P.validateTasks([task('A', 1, [], { risks: [{ ...complete, ...override }] })]), status + ' ' + JSON.stringify(override));
        assert.equal(P.validateTasks([task('A', 1, [], { risks: [complete] })])[0].risks[0].status, status);
    }
});

test('an open or unqualified risk can remain a draft without inventing qualification or ownership', () => {
    for (const status of ['À qualifier', 'Ouvert', 'Sous surveillance', 'Actif']) {
        const normalized = P.validateTasks([task('A', 1, [], { risks: [detailedRisk({ status })] })])[0].risks[0];
        assert.equal(normalized.probability, 'À qualifier');
        assert.equal(normalized.impact, 'À qualifier');
        assert.equal(normalized.owner, '');
        assert.equal(normalized.evidence, '');
        assert.equal(normalized.reviewDate, null);
        assert.equal(P.riskScore(normalized), null);
    }
});

test('risk registers reject duplicates, excessive volumes, wrong types and invalid dates', () => {
    for (const risks of [
        null, Array.from({ length: 61 }, (_, i) => detailedRisk({ id: 'R' + i })),
        [detailedRisk(), detailedRisk()], [detailedRisk({ id: 'constructor' })],
        [detailedRisk({ title: '' })], [detailedRisk({ cause: 'a'.repeat(12001) })],
        [detailedRisk({ consequence: null })], [detailedRisk({ prevention: 'a'.repeat(12001) })],
        [detailedRisk({ contingency: 'a'.repeat(12001) })], [detailedRisk({ followUp: 'a'.repeat(6001) })],
        [detailedRisk({ evidence: 'a'.repeat(6001) })], [detailedRisk({ owner: 'a'.repeat(201) })],
        [detailedRisk({ sourceRefs: Array(21).fill('source') })], [detailedRisk({ sourceRefs: [true] })],
        [detailedRisk({ status: 'Fermé' })], [detailedRisk({ reviewDate: '2026-02-29' })]
    ]) assert.throws(() => P.validateTasks([task('A', 1, [], { risks })]));
    const maximum = Array.from({ length: 60 }, (_, i) => detailedRisk({ id: 'R' + i }));
    assert.equal(P.validateTasks([task('A', 1, [], { risks: maximum })])[0].risks.length, P.LIMITS.maxRisks);
    assert.equal(P.validateTasks([task('A', 1, [], { risks: [detailedRisk()] }), task('B', 1, [], { risks: [detailedRisk()] })]).length, 2);
});

test('scheduled risks are independent copies and never alter dates or legacy risk summaries', () => {
    const input = project([task('A', .75, [], { riskWeight: 'Mineur', riskStatus: 'Aucun', risks: [detailedRisk({ probability: 'Élevée', impact: 'Critique', status: 'Actif', sourceRefs: ['EV-01'] })] })]);
    const normalized = P.normalizeProject(input);
    const scheduled = P.schedule(normalized, '2026-09-19');
    assert.equal(scheduled.tasks[0].endOffset, .75);
    assert.equal(date(scheduled.tasks[0].calcEnd), '2026-09-21');
    scheduled.tasks[0].risks[0].sourceRefs.push('EV-02');
    scheduled.tasks[0].risks[0].status = 'Ouvert';
    assert.equal(normalized.tasks[0].risks[0].sourceRefs.length, 1);
    assert.equal(input.tasks[0].risks[0].status, 'Actif');
    assert.equal(scheduled.tasks[0].riskWeight, 'Mineur');
    assert.equal(scheduled.tasks[0].riskStatus, 'Aucun');
});
