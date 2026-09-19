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
