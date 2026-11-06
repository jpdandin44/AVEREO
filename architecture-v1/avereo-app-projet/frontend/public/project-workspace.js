/* The account workspace lists independent private projects; it never imports the old Gantt implicitly. */
(function () {
    'use strict';
    const el = id => document.getElementById(id);
    let catalog = null, tab = 'projects', busy = false, imported = null;
    const localPreferenceKey = 'avereo.projet.preferences.v1';
    function status(text, error = false) {
        el('workspace-status').textContent = text;
        el('workspace-status').classList.toggle('error', error);
    }
    async function request(body) {
        const response = await fetch('/api/workspace.php', {
            credentials: 'same-origin', cache: 'no-store', redirect: 'error',
            ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Projet-CSRF': catalog.csrf }, body: JSON.stringify({ ...body, revision: catalog.revision }) } : {}),
        });
        let result;
        try { result = await response.json(); } catch (_) { throw new Error('Espace indisponible. Reconnecte-toi à AVEREO CONNECT.'); }
        if (!response.ok) throw new Error(result.error || 'Impossible de récupérer tes projets.');
        if (!Array.isArray(result.projects) || !Number.isInteger(result.revision) || typeof result.csrf !== 'string' || !result.preferences) throw new Error('Réponse de l’espace invalide.');
        return result;
    }
    async function operation(action) {
        if (busy) return;
        busy = true;
        el('view-workspace').setAttribute('aria-busy', 'true');
        try { await action(); }
        catch (error) { status(error.message, true); }
        finally { busy = false; el('view-workspace').setAttribute('aria-busy', 'false'); }
    }
    function preferences() {
        el('workspace-zoom').value = catalog.preferences.zoom;
        el('workspace-collapsed').checked = catalog.preferences.collapsed;
        el('workspace-verify-results').checked = catalog.preferences.verifyResults === true;
        el('workspace-manual-start').checked = catalog.preferences.manualStart === true;
        el('workspace-density').value = catalog.preferences.density || 'comfortable';
        applyInterfacePreferences(catalog.preferences);
    }
    function applyPreferences() {
        collapsedPlanningLots.clear();
        if (catalog.preferences.collapsed) tasks.forEach(task => collapsedPlanningLots.add(task.lot));
        setZoom(catalog.preferences.zoom);
    }
    function confirmAction(title, description, initial = null) {
        return new Promise(resolve => {
            const dialog = el('workspace-action');
            el('workspace-action-title').textContent = title;
            el('workspace-action-description').textContent = description;
            el('workspace-action-label').hidden = initial === null;
            el('workspace-action-value').value = initial ?? '';
            const finish = value => { dialog.close(); resolve(value); };
            el('workspace-action-form').onsubmit = event => { event.preventDefault(); finish(initial === null ? true : el('workspace-action-value').value); };
            el('workspace-action-cancel').onclick = () => finish(null);
            dialog.oncancel = event => { event.preventDefault(); finish(null); };
            dialog.showModal();
        });
    }
    function button(text, action, primary = false) {
        const node = document.createElement('button');
        node.type = 'button'; node.textContent = text;
        if (primary) node.className = 'primary';
        node.addEventListener('click', () => void operation(action));
        return node;
    }
    function paragraph(text, className) {
        const node = document.createElement('p'); node.textContent = text;
        if (className) node.className = className;
        return node;
    }
    function render() {
        const list = el('workspace-list'); list.replaceChildren();
        if (!catalog) return;
        window.ProjetOnline?.setArchived(Boolean(catalog.projects.find(p => p.id === window.ProjetOnline.projectId)?.archivedAt));
        const query = el('workspace-search').value.trim().toLocaleLowerCase('fr');
        const archived = tab === 'archives';
        const rows = catalog.projects.filter(p => Boolean(p.archivedAt) === archived && `${p.name} ${p.client}`.toLocaleLowerCase('fr').includes(query));
        rows.sort(el('workspace-sort').value === 'name' ? (a, b) => a.name.localeCompare(b.name, 'fr') : (a, b) => b.savedAt.localeCompare(a.savedAt));
        el('workspace-count').textContent = `${rows.length} projet${rows.length > 1 ? 's' : ''}${archived ? ' archivé' + (rows.length > 1 ? 's' : '') : ''}`;
        if (!rows.length) list.append(paragraph(query ? 'Aucun projet ne correspond à cette recherche.' : archived ? 'Aucun projet archivé. Les projets archivés restent conservés et peuvent être restaurés.' : 'Ton espace est prêt. Crée un projet ou importe une sauvegarde JSON complète.', 'ws-empty'));
        rows.forEach(project => {
            const card = document.createElement('article'); card.className = 'ws-card';
            card.append(paragraph(archived ? 'Archivé' : 'Projet en ligne', 'ws-kicker'));
            const title = document.createElement('h2'); title.textContent = project.name; card.append(title);
            if (project.client) card.append(paragraph(project.client));
            card.append(paragraph(`${project.taskCount} tâche${project.taskCount > 1 ? 's' : ''} · Enregistré le ${new Date(project.savedAt).toLocaleString('fr-FR')}`));
            const actions = document.createElement('div'); actions.className = 'ws-actions';
            if (!archived) {
                actions.append(button('Ouvrir', async () => {
                    await window.ProjetOnline.open(project.id); applyPreferences(); switchView('planning');
                }, true));
                actions.append(button('Client / référence', async () => {
                    const client = await confirmAction('Client / référence', project.name, project.client);
                    if (client === null) return;
                    catalog = await request({ action: 'client', id: project.id, client }); render(); status('Référence enregistrée en ligne.');
                }));
            }
            actions.append(button(archived ? 'Restaurer' : 'Archiver', async () => {
                if (!archived) {
                    await window.ProjetOnline.canSwitch();
                    if (!await confirmAction('Archiver ce projet ?', `« ${project.name} » restera conservé dans Archives et pourra être restauré.`)) return;
                }
                catalog = await request({ action: archived ? 'restore' : 'archive', id: project.id });
                render(); status(archived ? 'Projet restauré dans Mes projets.' : 'Projet conservé dans les archives.');
            }));
            card.append(actions); list.append(card);
        });
    }
    function selectTab(value) {
        tab = value;
        for (const name of ['projects', 'archives', 'preferences', 'account']) {
            el('workspace-tab-' + name).setAttribute('aria-selected', String(name === tab));
            if (name !== 'archives') el('workspace-panel-' + name).hidden = name === 'projects' ? !['projects', 'archives'].includes(tab) : name !== tab;
        }
        el('workspace-new').hidden = tab !== 'projects' || !window.ProjetOnline?.enabled;
        el('workspace-import').hidden = tab !== 'projects' || !window.ProjetOnline?.enabled;
        render();
    }
    async function refresh() {
        if (!window.ProjetOnline?.enabled) {
            el('preferences-scope').textContent = 'Mode local : ces préférences restent dans ce navigateur.';
            let saved = {};
            try { saved = JSON.parse(localStorage.getItem(localPreferenceKey) || '{}'); } catch (_) { /* Defaults remain usable. */ }
            catalog = { projects: [], preferences: { zoom: 'weeks', collapsed: false, ...saved } };
            preferences();
            status('Préférences locales disponibles. Les projets en ligne nécessitent une connexion à AVEREO CONNECT.');
            return;
        }
        status('Chargement de tes projets…');
        catalog = await request(); preferences(); render();
        status('Tes projets sont enregistrés dans ton espace privé AVEREO.');
    }
    function createDialog(project = null) {
        if (!catalog) { status('Actualise la liste avant de créer un projet.', true); return; }
        imported = project;
        el('workspace-create-title').textContent = project ? 'Importer un projet' : 'Nouveau projet';
        el('workspace-name').value = project ? project.name : '';
        el('workspace-client').value = '';
        el('workspace-start').value = project ? project.startDate : localIso();
        el('workspace-start').readOnly = Boolean(project);
        el('workspace-create-error').textContent = '';
        el('workspace-create').showModal(); el('workspace-name').focus();
    }
    window.ProjectWorkspace = {
        show(value = 'projects') {
            if (taskDraftDirty()) return;
            switchView('workspace'); selectTab(value); void operation(refresh);
        },
    };
    document.addEventListener('DOMContentLoaded', () => {
        const accountMenu = el('account-menu');
        for (const button of accountMenu.querySelectorAll('[data-account-view]')) {
            button.addEventListener('click', () => {
                accountMenu.open = false;
                window.ProjectWorkspace.show(button.dataset.accountView);
                el('workspace-tab-' + button.dataset.accountView).focus();
            });
        }
        document.addEventListener('click', event => {
            if (!accountMenu.contains(event.target)) accountMenu.open = false;
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && accountMenu.open) {
                accountMenu.open = false;
                accountMenu.querySelector('summary').focus();
            }
        });
        el('account-logout').hidden = !window.ProjetOnline?.enabled;
        for (const name of ['projects', 'archives', 'preferences', 'account']) el('workspace-tab-' + name).addEventListener('click', () => selectTab(name));
        el('workspace-search').addEventListener('input', render);
        el('workspace-sort').addEventListener('change', render);
        el('workspace-refresh').addEventListener('click', () => void operation(refresh));
        el('workspace-new').addEventListener('click', () => createDialog());
        el('workspace-import').addEventListener('click', () => el('workspace-file').click());
        el('workspace-file').addEventListener('change', async event => {
            const file = event.target.files[0]; event.target.value = '';
            if (!file) return;
            try {
                if (file.size > 5 * 1024 * 1024) throw new Error('Sauvegarde trop volumineuse (maximum 5 Mo).');
                const project = ProjetPlanning.decodeProject(await file.text());
                ProjetPlanning.schedule(project, localIso()); createDialog(project);
            } catch (error) { status(error.message, true); }
        });
        el('workspace-create-cancel').addEventListener('click', () => el('workspace-create').close());
        el('workspace-create-form').addEventListener('submit', async event => {
            event.preventDefault();
            if (busy || !event.target.reportValidity()) return;
            await operation(async () => {
                try {
                    await window.ProjetOnline.canSwitch();
                    const project = ProjetPlanning.normalizeProject(imported ? { ...imported, name: el('workspace-name').value.trim() } : {
                        schemaVersion: 1, name: el('workspace-name').value.trim(), startDate: el('workspace-start').value,
                        targetDate: null, capacityPerWeek: 5, schedulingMode: 'dependencies', tasks: [],
                    });
                    ProjetPlanning.schedule(project, localIso());
                    catalog = await request({ action: 'create', project, client: el('workspace-client').value.trim() });
                    el('workspace-create').close(); render(); status('Nouveau projet enregistré en ligne.');
                    await window.ProjetOnline.open(catalog.createdId); applyPreferences(); switchView('planning');
                } catch (error) { el('workspace-create-error').textContent = error.message; throw error; }
            });
        });
        el('workspace-preferences-form').addEventListener('submit', event => {
            event.preventDefault();
            void operation(async () => {
                if (!catalog) throw new Error('Actualise ton espace avant de modifier les préférences.');
                const value = { zoom: el('workspace-zoom').value, collapsed: el('workspace-collapsed').checked,
                    verifyResults: el('workspace-verify-results').checked, manualStart: el('workspace-manual-start').checked, density: el('workspace-density').value };
                if (window.ProjetOnline?.enabled) catalog = await request({ action: 'preferences', preferences: value });
                else { localStorage.setItem(localPreferenceKey, JSON.stringify(value)); catalog.preferences = value; }
                preferences(); applyPreferences(); status('Préférences enregistrées. Les résultats et les dates existants sont conservés.');
            });
        });
        if (window.ProjetOnline?.enabled) window.ProjectWorkspace.show();
        else {
            try {
                const saved = JSON.parse(localStorage.getItem(localPreferenceKey) || '{}');
                if (saved.collapsed === true) tasks.forEach(task => collapsedPlanningLots.add(task.lot));
                applyInterfacePreferences(saved);
                if (Object.hasOwn(timelineScales, saved.zoom)) setZoom(saved.zoom);
            }
            catch (_) { /* Local preferences never prevent access to a planning. */ }
        }
    });
})();
