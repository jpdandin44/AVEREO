import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../frontend/public/' + name, import.meta.url), 'utf8');
const html = read('legacy-app.html');
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

// Exercise the actual renderer/controller, not a separate copy of its grouping logic.
function browser() {
    const elements = new Map();
    const storage = new Map();
    const element = () => ({
        innerHTML: '', textContent: '', style: {}, value: '',
        addEventListener() {}, focus() {}, querySelector() { return null; },
        classList: { add() {}, remove() {} }, showModal() { this.open = true; }, close() { this.open = false; }
    });
    const get = id => {
        if (!elements.has(id)) elements.set(id, element());
        return elements.get(id);
    };
    const context = vm.createContext({
        Date, console, setTimeout() {}, location: { hostname: 'example.invalid' },
        document: { getElementById: get, addEventListener() {}, body: element() },
        window: { addEventListener() {}, alert() {}, confirm() { return true; } },
        localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) }
    });
    const run = source => vm.runInContext(source, context);
    [read('planning-core.js'), inline, read('planning-local.js'), read('task-details.js')].forEach(run);
    context.input = {
        schemaVersion: 1, name: 'Groupes', startDate: '2026-10-28', targetDate: '2026-11-27',
        capacityPerWeek: 5, schedulingMode: 'dependencies',
        tasks: [
            { id: 'A', name: 'Première', lot: 'Création <AVEREO>', duration: 1, progress: 25, dependencies: [] },
            { id: 'B', name: 'Deuxième', lot: 'Création <AVEREO>', duration: 1, dependencies: ['A'] },
            { id: 'C', name: 'Site', lot: 'Site', duration: 1, dependencies: ['B'] }
        ]
    };
    run('applyProject(input)');
    return { get, run, saved: () => JSON.stringify([...storage]) };
}

test('group cartouches expose counts, escaped titles and keyboard-native disclosure controls', () => {
    const ui = browser();
    const left = ui.get('planning-table-body').innerHTML;
    assert.match(left, /<button type="button" id="planning-lot-0"[^>]*aria-expanded="true"[^>]*aria-controls="planning-group-0"/);
    assert.match(left, /Création &lt;AVEREO&gt;/);
    assert.match(left, /2 tâches/);
    assert.equal((left.match(/data-task-id=/g) || []).length, 3);
    assert.equal((ui.get('planning-gantt-body').innerHTML.match(/data-task-id=/g) || []).length, 3);
});

test('collapse removes matching task rows and hidden dependencies, never project data or storage', () => {
    const ui = browser();
    const before = ui.run('ProjetPlanning.encodeProject(currentProject())');
    const saved = ui.saved();
    ui.run('togglePlanningGroup(0)');
    assert.match(ui.get('planning-table-body').innerHTML, /aria-expanded="false"/);
    assert.match(ui.get('planning-table-body').innerHTML, /id="planning-group-0" class="planning-group" hidden/);
    for (const id of ['planning-table-body', 'planning-gantt-body']) {
        assert.doesNotMatch(ui.get(id).innerHTML, /data-task-id="[AB]"/);
        assert.match(ui.get(id).innerHTML, /data-task-id="C"/);
    }
    assert.doesNotMatch(ui.get('gantt-svg-layer').innerHTML, /marker-end=/);
    assert.equal(ui.run('ProjetPlanning.encodeProject(currentProject())'), before);
    assert.equal(ui.saved(), saved);
    ui.run('togglePlanningGroup(0)');
    assert.equal((ui.get('planning-gantt-body').innerHTML.match(/data-task-id=/g) || []).length, 3);
    assert.equal((ui.get('gantt-svg-layer').innerHTML.match(/marker-end=/g) || []).length, 2);
    assert.match(ui.get('gantt-svg-layer').innerHTML, /M [\d.]+ 80 /); // 56px cartouche + task centre 24px.
});

test('expand/collapse all and zoom keep both panes consistent without changing the schedule', () => {
    const ui = browser();
    const before = ui.run('ProjetPlanning.encodeProject(currentProject())');
    ui.run('setPlanningGroupsExpanded(false); setZoom("weeks")');
    assert.doesNotMatch(ui.get('planning-table-body').innerHTML, /data-task-id=/);
    assert.doesNotMatch(ui.get('planning-gantt-body').innerHTML, /data-task-id=/);
    assert.equal((ui.get('planning-table-body').innerHTML.match(/aria-expanded="false"/g) || []).length, 2);
    assert.equal((ui.get('planning-gantt-body').innerHTML.match(/class="project-summary-bar"/g) || []).length, 2, 'collapsed projects retain their planning overview');
    ui.run('setPlanningGroupsExpanded(true); togglePlanningGroup(99)');
    assert.equal((ui.get('planning-table-body').innerHTML.match(/data-task-id=/g) || []).length, 3);
    assert.equal(ui.run('ProjetPlanning.encodeProject(currentProject())'), before);
    assert.equal(ui.get('gantt-master-container').style.width, `${480 + ui.run('state.totalDays') * 10}px`);
});

test('summary span and progress cover the tasks even when the project is collapsed', () => {
    const ui = browser();
    ui.run('setPlanningGroupsExpanded(false)');
    const html = ui.get('planning-gantt-body').innerHTML;
    assert.match(html, /data-lot-index="0" style="left:80px;width:80px"/);
    assert.match(html, /28 oct\. → 29 oct\. · 13%/);
    assert.doesNotMatch(html, /data-task-id=/);
});

test('date preview can cancel, apply and undo without losing task data', () => {
    const ui = browser();
    const before = ui.run('ProjetPlanning.encodeProject(currentProject())');
    ui.run('requestPlanningDates("lot", 0, 2)');
    assert.equal(ui.run('ProjetPlanning.encodeProject(currentProject())'), before);
    assert.equal(ui.get('planning-change-dialog').open, true);
    ui.run('cancelPlanningChange()');
    assert.equal(ui.run('ProjetPlanning.encodeProject(currentProject())'), before);
    ui.run('requestPlanningDates("lot", 0, 2); applyPlanningChange()');
    assert.notEqual(ui.run('ProjetPlanning.encodeProject(currentProject())'), before);
    assert.equal(ui.get('planning-undo').disabled, false);
    assert.equal(ui.run('tasks[0].progress'), 25);
    ui.run('undoPlanningChange()');
    assert.equal(ui.run('ProjetPlanning.encodeProject(currentProject())'), before);
});

test('reorder is previewed, applied only explicitly and survives a full JSON round trip', () => {
    const ui = browser();
    const before = ui.run('ProjetPlanning.encodeProject(currentProject())');
    ui.run('requestPlanningReorder("lot", "Site", "Création <AVEREO>", false)');
    assert.equal(ui.run('ProjetPlanning.encodeProject(currentProject())'), before);
    assert.match(ui.get('planning-change-details').innerHTML, /Dates inchangées/);
    ui.run('applyPlanningChange()');
    assert.equal(ui.run('tasks[0].id'), 'C');
    assert.equal(ui.run('ProjetPlanning.decodeProject(ProjetPlanning.encodeProject(currentProject())).tasks[0].id'), 'C');
});

test('stale preview and stale undo cannot overwrite a subsequent user edit', () => {
    const ui = browser();
    ui.run('requestPlanningDates("lot", 0, 2); projectSettings.name = "Modification personnelle"');
    assert.equal(ui.run('applyPlanningChange()'), false);
    assert.equal(ui.run('projectSettings.name'), 'Modification personnelle');
    ui.run('requestPlanningDates("lot", 0, 2); applyPlanningChange(); projectSettings.name = "Autre saisie"');
    assert.equal(ui.run('undoPlanningChange()'), false);
    assert.equal(ui.run('projectSettings.name'), 'Autre saisie');
});

test('layout has one scroll region and both sticky headers outside the timeline body', () => {
    assert.match(html, /id="gantt-viewport" tabindex="0" role="region"/);
    assert.match(html, /#planning-table-header[^}]*position: sticky; top: 0; left: 0/);
    assert.match(html, /#gantt-timeline-header[^}]*position: sticky; top: 0/);
    assert.match(html, /#gantt-scroll-pane[^}]*overflow: clip/);
    const pane = html.slice(html.indexOf('<div id="gantt-scroll-pane">'), html.indexOf('<!-- View: Risks -->'));
    assert.doesNotMatch(pane, /id="gantt-timeline-header"|min-h-full|overflow-x-auto|top-12/);
});

test('today marker uses the centre of the calendar day in both zooms, including DST and weekends', () => {
    const ui = browser();
    assert.equal(ui.run('todayMarkerPosition(new Date(2026,9,26), new Date(2026,9,28), 40, 51)'), 100);
    assert.equal(ui.run('todayMarkerPosition(new Date(2026,9,26), new Date(2026,9,28), 10, 51)'), 25);
    assert.equal(ui.run('todayMarkerPosition(new Date(2026,9,23), new Date(2026,9,26), 40, 51)'), 140);
    assert.equal(ui.run('todayMarkerPosition(new Date(2026,9,23), new Date(2026,9,25), 40, 51)'), 100);
    assert.equal(ui.run('todayMarkerPosition(new Date(2026,9,26), new Date(2026,9,25), 40, 51)'), null);
    assert.equal(ui.run('todayMarkerPosition(new Date(2026,9,26), new Date(2026,9,29), 40, 3)'), null);
});

test('today line and dated header remain aligned through zoom and collapse without changing data', () => {
    const ui = browser();
    const before = ui.run('ProjetPlanning.encodeProject(currentProject())');
    const saved = ui.saved();
    ui.run('state.projectStart = new Date(); renderPlanningView()');
    assert.equal(ui.get('gantt-today-line').style.left, '100px');
    assert.equal(ui.get('gantt-today-line').hidden, false);
    assert.match(ui.get('gantt-timeline-header').innerHTML, /class="gantt-today-line" style="left:100px"/);
    assert.match(ui.get('gantt-timeline-header').innerHTML, /Aujourd’hui :/);
    ui.run('setPlanningGroupsExpanded(false); setZoom("weeks")');
    assert.equal(ui.get('gantt-today-line').style.left, '25px');
    assert.match(ui.get('gantt-timeline-header').innerHTML, /class="gantt-today-line" style="left:25px"/);
    assert.equal(ui.run('ProjetPlanning.encodeProject(currentProject())'), before);
    assert.equal(ui.saved(), saved);
    ui.run('state.projectStart = new Date(2099,0,1); renderPlanningView()');
    assert.equal(ui.get('gantt-today-line').hidden, true);
    assert.doesNotMatch(ui.get('gantt-timeline-header').innerHTML, /gantt-today-caption/);
});

test('day rollover refresh is read-only and waits while a gesture is active', () => {
    const ui = browser();
    const before = ui.run('ProjetPlanning.encodeProject(currentProject())');
    const saved = ui.saved();
    ui.run('state.currentDate = new Date(2000,0,1); dnd.active = true; refreshPlanningDay()');
    assert.equal(ui.run('state.currentDate.getFullYear()'), 2000);
    ui.run('dnd.active = false; refreshPlanningDay()');
    assert.equal(ui.run('localIso(state.currentDate)'), ui.run('localIso()'));
    assert.equal(ui.run('ProjetPlanning.encodeProject(currentProject())'), before);
    assert.equal(ui.saved(), saved);
    assert.match(html, /\.gantt-today-line[^}]*pointer-events: none/);
});
