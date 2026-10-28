import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = { module: { exports: {} }, Date };
vm.runInNewContext(readFileSync(new URL('../frontend/public/planning-core.js', import.meta.url), 'utf8'), context);
const P = context.module.exports;
const plain = value => JSON.parse(JSON.stringify(value));
const input = () => ({ schemaVersion: 1, name: 'Gestes', startDate: '2026-10-26', targetDate: '2026-11-27', capacityPerWeek: 5, schedulingMode: 'dependencies', tasks: [
    { id: 'A', name: 'Première', lot: 'Création', duration: 1, dependencies: [], manualStart: '2026-10-29', progress: 25, description: 'À conserver' },
    { id: 'B', name: 'Deuxième', lot: 'Création', duration: .5, dependencies: ['A'], manualStart: '2026-10-30' },
    { id: 'D', name: 'Différé', lot: 'Différés', duration: 0, dependencies: [], status: 'En attente', manualStart: '2026-11-27' },
    { id: 'E', name: 'Autre différé', lot: 'Différés', duration: 0, dependencies: [], status: 'En attente', manualStart: '2026-11-27' }
] });

test('moving a deferred milestone changes only its date pin, not status, duration or source', () => {
    const source = input(), before = JSON.stringify(source);
    const result = P.movePlanningDates(source, ['D'], -7);
    assert.equal(result.tasks[2].manualStart, '2026-11-20');
    assert.equal(result.tasks[2].status, 'En attente');
    assert.equal(result.tasks[2].duration, 0);
    assert.equal(JSON.stringify(source), before);
    assert.equal(result.tasks[3].manualStart, '2026-11-27');
});

test('project dates move together, weekends normalize and dependencies remain active', () => {
    const result = P.movePlanningDates(input(), ['A', 'B'], 1);
    assert.equal(result.tasks[0].manualStart, '2026-10-30');
    assert.equal(result.tasks[1].manualStart, '2026-11-02');
    const schedule = P.schedule(result, '2026-10-28');
    assert.ok(schedule.tasks[1].startOffset >= schedule.tasks[0].endOffset);
    assert.equal(result.tasks[0].progress, 25);
    assert.equal(result.tasks[0].description, 'À conserver');
    assert.deepEqual(plain(result.tasks[1].dependencies), ['A']);
});

test('date moves reject invalid selections, fractional moves and impossible horizons', () => {
    for (const [ids, delta] of [[[], 1], [['A', 'A'], 1], [['missing'], 1], [['A'], 1.2], [['A'], 100000]]) {
        assert.throws(() => P.movePlanningDates(input(), ids, delta));
    }
    assert.deepEqual(plain(P.movePlanningDates(input(), ['A'], 0)), plain(P.normalizeProject(input())));
});

test('whole project reorder preserves task order, dates and all details and round-trips', () => {
    const source = input(), before = JSON.stringify(source);
    const result = P.reorderPlanning(source, 'lot', 'Différés', 'Création');
    assert.deepEqual(plain(result.tasks.map(task => task.id)), ['D', 'E', 'A', 'B']);
    assert.deepEqual(plain(result.tasks.find(task => task.id === 'A')), plain(P.normalizeProject(source).tasks[0]));
    assert.deepEqual(plain(P.decodeProject(P.encodeProject(result))), plain(result));
    assert.equal(JSON.stringify(source), before);
});

test('deferred subject order can change within its project, not silently transfer projects', () => {
    const result = P.reorderPlanning(input(), 'task', 'E', 'D');
    assert.deepEqual(plain(result.tasks.map(task => task.id)), ['A', 'B', 'E', 'D']);
    assert.equal(result.tasks[2].status, 'En attente');
    assert.throws(() => P.reorderPlanning(input(), 'task', 'D', 'A'), /dans leur projet/);
    assert.throws(() => P.reorderPlanning(input(), 'lot', 'missing', 'Création'));
    assert.deepEqual(plain(P.reorderPlanning(input(), 'task', 'D', 'D')), plain(P.normalizeProject(input())));
});

test('sequential reorders that violate dependencies fail without changing the source', () => {
    const source = input(); source.schedulingMode = 'sequential';
    const before = JSON.stringify(source);
    assert.throws(() => P.reorderPlanning(source, 'task', 'B', 'A'), /doit précéder/);
    assert.equal(JSON.stringify(source), before);
    const valid = P.reorderPlanning(source, 'task', 'D', 'E', true);
    assert.deepEqual(plain(valid.tasks.map(task => task.id)), ['A', 'B', 'E', 'D']);
});
