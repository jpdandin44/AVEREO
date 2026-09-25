import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../frontend/public/' + name, import.meta.url), 'utf8');
const html = read('legacy-app.html');
const inlineSource = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n');
const sources = [read('planning-core.js'), inlineSource, read('planning-local.js'), read('task-details.js')];
const storageKey = 'avereo.projet.planning.v1';
const task = (id, duration, dependencies = []) => ({ id, name: `Tâche ${id}`, duration, dependencies });

// Execute the actual inline UI, controller and core together. The DOM is only
// a rendering/event adapter; scheduling, mouseup and persistence are real code.
function browser(tasks, capacityPerWeek = 5) {
    const elements = new Map();
    const listeners = new Map();
    const storage = new Map();
    const alerts = [];
    const element = () => ({
        value: '', innerHTML: '', textContent: '', style: {}, className: '',
        addEventListener() {}, classList: { add() {}, remove() {} },
        querySelector() { return null; }
    });
    const getElement = id => {
        if (!elements.has(id)) elements.set(id, element());
        return elements.get(id);
    };
    const context = vm.createContext({
        Date, console, setTimeout() {}, location: { hostname: 'example.invalid' },
        document: {
            getElementById: getElement,
            addEventListener(name, handler) { listeners.set(name, handler); },
            body: element()
        },
        window: {
            addEventListener() {}, alert(message) { alerts.push(message); },
            confirm() { return true; }
        },
        localStorage: {
            getItem(key) { return storage.get(key) ?? null; },
            setItem(key, value) { storage.set(key, value); }
        }
    });
    const run = source => vm.runInContext(source, context);
    sources.forEach(run);
    context.inputProject = {
        schemaVersion: 1, name: 'Essai interactions', startDate: '2026-09-21',
        targetDate: '2026-10-30', capacityPerWeek, schedulingMode: 'sequential', tasks
    };
    run('applyProject(inputProject)');
    return {
        run, getElement,
        drag(id, type, dx, { scale = 40, originalLeft = 80 } = {}) {
            context.gesture = { id, type, dx, scale, originalLeft };
            run(`
                zoomLevel = gesture.scale === 10 ? 'weeks' : 'days';
                ganttScale = gesture.scale;
                dnd = {
                    active: true, type: gesture.type, taskId: gesture.id,
                    startX: 100, origVal: gesture.originalLeft,
                    element: { style: { left: (gesture.originalLeft + gesture.dx) + 'px' } }
                };
            `);
            listeners.get('mouseup')({ clientX: 100 + dx });
            assert.deepEqual(alerts, [], 'the gesture must pass the same validation as other edits');
            assert.equal(run('dnd.active'), false);
            return JSON.parse(storage.get(storageKey));
        },
        scheduled(id) {
            context.selectedId = id;
            return run('tasks.find(task => task.id === selectedId)');
        }
    };
}

const iso = value => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

test('resize converts a calendar day into half a person-day at capacity 2.5', () => {
    const ui = browser([task('A', 1)], 2.5);
    assert.equal(iso(ui.scheduled('A').calcEnd), '2026-09-22');
    const saved = ui.drag('A', 'resize', 40);
    assert.equal(saved.tasks[0].duration, 1.5);
    assert.equal(ui.scheduled('A').endOffset, 3);
    assert.equal(iso(ui.scheduled('A').calcEnd), '2026-09-23');
});

test('resizing a Friday endpoint adds no weekend work, then counts Monday fractions', () => {
    for (const [dx, expectedDuration, expectedEnd] of [
        [40, 5, '2026-09-25'], // Sunday boundary: Saturday contains no work.
        [80, 5, '2026-09-25'], // Monday boundary: neither weekend day adds work.
        [100, 5.5, '2026-09-28'],
        [120, 6, '2026-09-28']
    ]) {
        const ui = browser([task('A', 5)]);
        const saved = ui.drag('A', 'resize', dx);
        assert.equal(saved.tasks[0].duration, expectedDuration, `drag ${dx}px`);
        assert.equal(iso(ui.scheduled('A').calcEnd), expectedEnd, `drag ${dx}px`);
    }
});

test('a four-pixel move does not pin a task starting at fraction 0.75 to the next day', () => {
    for (const dx of [-4, 4]) {
        const ui = browser([task('A', .75), task('B', 1, ['A'])]);
        assert.equal(ui.scheduled('B').startOffset, .75);
        // Its real left edge includes two days of visual padding plus 0.75 day.
        const saved = ui.drag('B', 'move', dx, { originalLeft: 110 });
        assert.equal(saved.tasks[1].manualStart, null);
        assert.equal(ui.scheduled('B').startOffset, .75);
        assert.equal(iso(ui.scheduled('B').calcStart), '2026-09-21');
    }
});

test('moving a milestone one day in week zoom ignores its minus-12px visual offset', () => {
    const ui = browser([task('M', 0)]);
    ui.run("zoomLevel = 'weeks'; renderPlanningView()");
    const barMarkup = ui.getElement('planning-gantt-body').innerHTML;
    const actualLeft = Number(barMarkup.match(/class="milestone"[^>]*left:\s*([-\d.]+)px/)[1]);
    assert.equal(actualLeft, 8); // Monday centre = 20px; the diamond starts 12px earlier.
    const saved = ui.drag('M', 'move', 10, { scale: 10, originalLeft: actualLeft });
    assert.equal(saved.tasks[0].manualStart, '2026-09-22');
    assert.equal(saved.tasks[0].duration, 0);
    assert.equal(iso(ui.scheduled('M').calcStart), '2026-09-22');
    assert.equal(iso(ui.scheduled('M').calcEnd), '2026-09-22');
});
