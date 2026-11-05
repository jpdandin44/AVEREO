import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = file => readFileSync(new URL('../frontend/public/' + file, import.meta.url), 'utf8');
const project = name => ({ schemaVersion: 1, name, startDate: '2026-11-05', targetDate: null, capacityPerWeek: 5, schedulingMode: 'dependencies', tasks: [] });
const clone = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));

function browser(server, { storage = new Map(), legacy, failWrite = false } = {}) {
    if (legacy) storage.set('avereo.projet.planning.v1', JSON.stringify(legacy));
    const elements = new Map();
    const el = id => { if (!elements.has(id)) elements.set(id, { hidden: false, textContent: '', value: '' }); return elements.get(id); };
    const context = vm.createContext({ console, Date, URLSearchParams, location: { hostname: 'projet-preprod.avereo.fr' },
        window: { addEventListener() {}, confirm: () => true, alert() {} },
        document: { getElementById: el, addEventListener() {} },
        localStorage: { getItem: key => storage.get(key) ?? null, setItem(key, value) { if (failWrite) throw Error('Quota'); storage.set(key, value); }, removeItem: key => storage.delete(key) },
        fetch: async (url, options) => server(url, options), showToast() {},
    });
    vm.runInContext(source('planning-core.js'), context);
    vm.runInContext(`let projectSettings = ${JSON.stringify(project('Vide'))}; let tasks = []; function refreshAll() {} function fillProjectSettings() {} function exportProject() {} function downloadFile() {}`, context);
    vm.runInContext(source('planning-local.js'), context);
    vm.runInContext(source('planning-online.js'), context);
    const run = value => vm.runInContext(value, context);
    return { initialize: () => run('initializeLocalProject()'), save: () => run('window.ProjetOnline.save()'), reload: () => run('window.ProjetOnline.reload()'),
        stage(value) { context.next = clone(value); run('persistProject(next); applyProject(next)'); },
        current: () => clone(run('currentProject()')), message: () => el('storage-status').textContent, storage, run };
}

function service(initial = project('Serveur')) {
    let record = { revision: initial ? 1 : 0, savedAt: '2026-11-05T12:00:00Z', project: initial, csrf: 'fixture', scope: 'owner' };
    let writes = 0, fail = false;
    const call = async (_, options) => {
        if (options.method === 'PUT') {
            writes++;
            if (fail) throw Error('Réseau interrompu');
            const body = JSON.parse(options.body);
            if (body.revision !== record.revision) return { ok: false, json: async () => ({ error: 'Version plus récente' }) };
            record = { ...record, project: body.project, revision: record.revision + 1 };
        }
        return { ok: true, json: async () => clone(record) };
    };
    return { call, get record() { return record; }, get writes() { return writes; }, set fail(value) { fail = value; } };
}
test('two independent browser stores recover the same server planning without altering V1 drafts', async () => {
    const server = service();
    const first = browser(server.call, { legacy: project('Ancien brouillon') });
    const second = browser(server.call);
    await first.initialize(); await second.initialize();
    assert.deepEqual(first.current(), second.current());
    assert.equal(JSON.parse(first.storage.get('avereo.projet.planning.v1')).name, 'Ancien brouillon');
    first.stage(project('Modification'));
    await tick();
    await second.reload();
    assert.equal(second.current().name, 'Modification');
    assert.match(first.message(), /Enregistré en ligne/);
});
test('first online import requires an explicit save and keeps the original browser JSON', async () => {
    const server = service(null), local = project('Brouillon existant');
    const first = browser(server.call, { legacy: local });
    await first.initialize();
    assert.equal(server.writes, 0);
    assert.equal(first.current().name, local.name);
    await first.save();
    assert.equal(server.record.project.name, local.name);
    assert.deepEqual(JSON.parse(first.storage.get('avereo.projet.planning.v1')), local);
});
test('stale browser cannot overwrite another browser and its full pending draft survives reload', async () => {
    const server = service(), first = browser(server.call), stale = browser(server.call);
    await first.initialize(); await stale.initialize();
    first.stage(project('Premier'));
    await tick();
    stale.stage(project('Second'));
    await tick();
    assert.equal(server.record.project.name, 'Premier');
    assert.match(stale.message(), /plus récente/);
    const restored = browser(server.call, { storage: stale.storage });
    await restored.initialize();
    assert.equal(restored.current().name, 'Second');
    assert.match(restored.message(), /plus récente/);
    assert.throws(() => restored.stage(project('Refusé')), /interrompue/);
});
test('network failure is not presented as a successful save and retry preserves revision checks', async () => {
    const server = service(), first = browser(server.call);
    await first.initialize(); server.fail = true;
    first.stage(project('Hors ligne'));
    await tick();
    assert.match(first.message(), /Réseau interrompu.*Copie locale conservée/);
    assert.equal(server.record.project.name, 'Serveur');
    server.fail = false;
    await first.save();
    assert.equal(server.record.project.name, 'Hors ligne');
    assert.equal(first.storage.has('avereo.projet.online.pending.owner'), false);
});
test('rapid edits queue in order and the newest draft is sent using the acknowledged revision', async () => {
    const server = service(), first = browser(server.call);
    await first.initialize();
    first.stage(project('A')); first.stage(project('B')); first.stage(project('C'));
    await tick();
    assert.equal(server.record.project.name, 'C');
    assert.equal(server.writes, 2);
    assert.equal(first.storage.has('avereo.projet.online.pending.owner'), false);
});
test('local storage failure prevents a write whose recoverable copy cannot be kept', async () => {
    const server = service(), first = browser(server.call, { failWrite: true });
    await first.initialize();
    assert.throws(() => first.stage(project('Perte évitée')), /Quota/);
    assert.equal(server.writes, 0);
});
test('two tabs sharing localStorage cannot erase each other pending recovery copy', async () => {
    const server = service(), storage = new Map();
    const first = browser(server.call, { storage }), second = browser(server.call, { storage });
    await first.initialize(); await second.initialize();
    server.fail = true;
    first.stage(project('Premier brouillon'));
    assert.throws(() => second.stage(project('Autre brouillon')), /autre onglet/);
    await tick();
    assert.equal(JSON.parse(storage.get('avereo.projet.online.pending.owner')).project.name, 'Premier brouillon');
});
test('authentication error never loads the previous private V1 draft into another account', async () => {
    const first = browser(async () => ({ ok: false, json: async () => ({ error: 'Accès refusé' }) }), { legacy: project('Privé') });
    await first.initialize();
    assert.equal(first.current().name, 'Vide');
    assert.match(first.message(), /Accès refusé/);
});

function projectsService() {
    const primary = service(project('Principal')), second = service(project('Second'));
    return { primary, second, call: (url, options) => (new URL(url, 'https://fixture.invalid').searchParams.get('project') === 'p-second' ? second : primary).call(url, options) };
}
test('switching projects loads independent server documents and scopes pending browser copies', async () => {
    const server = projectsService(), first = browser(server.call);
    await first.initialize();
    await first.run("window.ProjetOnline.open('p-second')");
    first.stage(project('Deuxième modifié')); await tick();
    assert.equal(server.second.record.project.name, 'Deuxième modifié');
    assert.equal(server.primary.record.project.name, 'Principal');
    await first.run("window.ProjetOnline.open('principal')");
    assert.equal(first.current().name, 'Principal');
});
test('a pending offline edit prevents switching and survives a separate browser session', async () => {
    const server = projectsService(), first = browser(server.call);
    await first.initialize(); await first.run("window.ProjetOnline.open('p-second')");
    server.second.fail = true;
    first.stage(project('Brouillon du second')); await tick();
    await assert.rejects(first.run("window.ProjetOnline.open('principal')"), /non enregistrées/);
    assert.equal(JSON.parse(first.storage.get('avereo.projet.online.pending.owner.p-second')).project.name, 'Brouillon du second');
    const resumed = browser(server.call, { storage: first.storage });
    await resumed.initialize();
    assert.equal(resumed.current().name, 'Principal');
    server.second.fail = false;
    await resumed.run("window.ProjetOnline.open('p-second')");
    assert.equal(resumed.current().name, 'Brouillon du second');
    assert.equal(server.primary.record.project.name, 'Principal');
});
test('failed project opening leaves the active document and its save destination unchanged', async () => {
    const server = projectsService();
    const first = browser((url, options) => url.includes('p-missing') ? Promise.resolve({ ok: false, json: async () => ({ error: 'Projet introuvable' }) }) : server.call(url, options));
    await first.initialize();
    await assert.rejects(first.run("window.ProjetOnline.open('p-missing')"), /introuvable/);
    first.stage(project('Toujours principal')); await tick();
    assert.equal(server.primary.record.project.name, 'Toujours principal');
    assert.equal(server.second.record.project.name, 'Second');
});
test('opening the active project again reads the latest online document', async () => {
    const server = projectsService(), first = browser(server.call), second = browser(server.call);
    await first.initialize(); await second.initialize();
    second.stage(project('Depuis un autre navigateur')); await tick();
    await first.run("window.ProjetOnline.open('principal')");
    assert.equal(first.current().name, 'Depuis un autre navigateur');
});

test('opening a project clears the previous project movement undo snapshot', async () => {
    const server = projectsService(), first = browser(server.call);
    await first.initialize(); first.run('let lastPlanningEdit = { before: "other project" };');
    await first.run("window.ProjetOnline.open('p-second')");
    assert.equal(first.run('lastPlanningEdit'), null);
});
