/* Private online persistence; the V1 browser draft stays available for recovery. */
(function () {
    'use strict';
    if (isLocalHost() && !new URLSearchParams(location.search).has('online')) return;
    const endpoint = '/api/planning.php';
    let revision = null, csrf = '', pendingKey = '', pending = null, lastPendingRaw = null;
    let running = false, blocked = true, ready = false, initialDraft = false;
    const localInitialize = initializeLocalProject;
    const localPersist = persistProject;
    function controls() {
        document.getElementById('online-save').hidden = !ready;
        document.getElementById('online-reload').hidden = !ready;
        document.getElementById('online-previous').hidden = !ready;
        document.getElementById('online-initial').hidden = !ready;
    }
    function message(text, problem = false) { setStorageMessage(text, problem); }
    async function request(options = {}, suffix = '') {
        const response = await fetch(endpoint + suffix, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', ...options });
        let data;
        try { data = await response.json(); } catch (_) { throw new Error('Réponse serveur indisponible. Reconnecte-toi à AVEREO CONNECT.'); }
        if (!response.ok) throw new Error(data.error || 'Enregistrement en ligne indisponible.');
        if (!Number.isInteger(data.revision) || typeof data.csrf !== 'string' || typeof data.scope !== 'string') throw new Error('Réponse serveur invalide.');
        return data;
    }
    function remember(candidate) {
        // Persist before altering the displayed planning or sending a network write.
        if (localStorage.getItem(pendingKey) !== lastPendingRaw) throw new Error('Un autre onglet a modifié la copie locale. Recharge avant de poursuivre.');
        const raw = JSON.stringify(candidate);
        localStorage.setItem(pendingKey, raw);
        lastPendingRaw = raw;
        pending = candidate;
    }
    function clearPending() {
        if (localStorage.getItem(pendingKey) !== lastPendingRaw) throw new Error('Un autre onglet a modifié la copie locale. Recharge avant de poursuivre.');
        localStorage.removeItem(pendingKey);
        lastPendingRaw = null;
    }
    function validate(project) {
        const result = ProjetPlanning.normalizeProject(project);
        ProjetPlanning.schedule(result, localIso());
        return result;
    }
    async function flush() {
        if (running || blocked || !pending) return;
        running = true;
        try {
            while (pending && !blocked) {
                const sending = pending;
                message('Enregistrement en ligne en cours…');
                const result = await request({ method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Projet-CSRF': csrf }, body: JSON.stringify({ revision, project: sending.project }) });
                revision = result.revision; csrf = result.csrf;
                if (pending === sending) {
                    clearPending();
                    pending = null;
                    initialDraft = false;
                } else {
                    remember({ revision, project: pending.project });
                }
                message(`Enregistré en ligne le ${new Date(result.savedAt).toLocaleString('fr-FR')} · version ${revision}.`);
            }
        } catch (error) {
            blocked = true;
            message(`${error.message} Copie locale conservée : export JSON possible.`, true);
        } finally { running = false; }
    }
    window.ProjetOnline = {
        enabled: true,
        get pending() { return Boolean(pending || initialDraft); },
        async save() {
            if (!ready || running) return;
            try {
                // A retry still uses the last read revision: never overwrite a newer server version.
                blocked = false;
                if (!pending) remember({ revision, project: validate(currentProject()) });
                await flush();
            } catch (error) { blocked = true; message(`Enregistrement impossible : ${error.message}`, true); }
        },
        async reload() {
            if (running) return;
            if ((pending || initialDraft) && !window.confirm('Charger la version en ligne ? Une copie JSON du travail affiché sera téléchargée avant son remplacement.')) return;
            try {
                const result = await request();
                if (!result.project) throw new Error('Aucun planning enregistré en ligne.');
                const project = validate(result.project);
                if (pending || initialDraft) exportProject();
                if (pendingKey) clearPending();
                pending = null; initialDraft = false; blocked = false;
                revision = result.revision; csrf = result.csrf;
                applyProject(project);
                message(`Version en ligne ${revision} chargée · ${new Date(result.savedAt).toLocaleString('fr-FR')}.`);
            } catch (error) { message(error.message, true); }
        },
        async previous() {
            try {
                const result = await request({}, '?version=previous');
                if (!result.project) throw new Error('Aucune version précédente en ligne.');
                downloadFile('avereo-projet-version-precedente.json', ProjetPlanning.encodeProject(validate(result.project)), 'application/json;charset=utf-8');
            } catch (error) { window.alert(error.message); }
        },
        exportInitial() {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw !== null) downloadFile('avereo-projet-brouillon-initial.json', raw, 'application/json;charset=utf-8');
            else window.alert('Aucun brouillon antérieur dans ce navigateur.');
        },
    };
    persistProject = function (project, replacing = false) {
        if (!window.ProjetOnline.enabled) return localPersist(project, replacing);
        if (!ready || blocked) throw new Error('La sauvegarde en ligne est interrompue. Exporte le JSON, puis utilise Réessayer ou Charger la version en ligne.');
        remember({ revision, project: validate(project) });
        void flush();
        return true;
    };
    initializeLocalProject = async function () {
        if (!window.ProjetOnline.enabled) return localInitialize();
        document.getElementById('load-pilot').hidden = true;
        document.getElementById('enrich-pilot').hidden = true;
        document.getElementById('storage-mode').textContent = 'Espace privé';
        document.getElementById('storage-description').textContent = 'Planning enregistré sur AVEREO · copie JSON disponible';
        message('Connexion à ton planning privé…');
        try {
            const result = await request();
            revision = result.revision; csrf = result.csrf;
            pendingKey = 'avereo.projet.online.pending.' + result.scope;
            const raw = localStorage.getItem(pendingKey);
            lastPendingRaw = raw;
            if (raw !== null) {
                const draft = JSON.parse(raw);
                if (!Number.isInteger(draft.revision)) throw new Error('Copie locale à vérifier ; utilise Exporter JSON.');
                pending = { revision: draft.revision, project: validate(draft.project) };
                applyProject(pending.project);
                blocked = draft.revision !== revision;
                message(blocked ? 'Une version plus récente existe en ligne. Ton brouillon est conservé ici : exporte-le ou charge la version en ligne.' : 'Reprise des modifications en attente…', blocked);
            } else if (result.project) {
                applyProject(validate(result.project));
                blocked = false;
                message(`Planning chargé en ligne · version ${revision} du ${new Date(result.savedAt).toLocaleString('fr-FR')}.`);
            } else {
                const legacy = localStorage.getItem(STORAGE_KEY);
                if (legacy !== null) {
                    applyProject(validate(ProjetPlanning.decodeProject(legacy)));
                    initialDraft = true;
                } else { refreshAll(); fillProjectSettings(); }
                blocked = false;
                message('Aucun planning en ligne. Importe ta sauvegarde ou clique sur Enregistrer en ligne pour reprendre le planning affiché.', true);
            }
            ready = true;
            controls();
            if (pending && !blocked) await flush();
        } catch (error) {
            blocked = true;
            message(error.message + ' Aucun planning en ligne remplacé.', true);
            refreshAll(); fillProjectSettings();
        }
    };
    window.addEventListener('beforeunload', event => {
        if (pending) { event.preventDefault(); event.returnValue = ''; }
    });
})();
