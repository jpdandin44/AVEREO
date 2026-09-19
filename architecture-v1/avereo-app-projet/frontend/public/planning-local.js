/* Contrôleur local du planning. Le moteur pur est dans planning-core.js. */
const STORAGE_KEY = 'avereo.projet.planning.v1';
const BACKUP_KEY = 'avereo.projet.planning.previous.v1';
let lastStoredRaw = null;
let storageBlocked = false;
let storageAvailable = true;
let projectLoaded = false;

function localIso(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function drawIcons() { window.lucide?.createIcons(); }

function setStorageMessage(message, problem = false) {
    const status = document.getElementById('storage-status');
    status.textContent = message;
    status.className = problem ? 'text-sm font-medium text-amber-800' : 'text-sm text-emerald-800';
}

function currentProject() {
    return { ...projectSettings, tasks };
}

function applyProject(project) {
    const normalized = ProjetPlanning.normalizeProject(project);
    ProjetPlanning.schedule(normalized, localIso());
    const { tasks: nextTasks, ...settings } = normalized;
    projectSettings = settings;
    tasks = nextTasks;
    projectLoaded = true;
    refreshAll();
    fillProjectSettings();
}

function fillProjectSettings() {
    const fields = { 'project-name': 'name', 'project-start': 'startDate', 'project-target': 'targetDate', 'project-capacity': 'capacityPerWeek', 'project-mode': 'schedulingMode' };
    for (const [id, field] of Object.entries(fields)) document.getElementById(id).value = projectSettings[field] ?? '';
}

function persistProject(project, replacing = false) {
    const serialized = ProjetPlanning.encodeProject(project);
    if (!storageAvailable) {
        setStorageMessage('Modification en mémoire seulement : exporte le JSON pour la conserver.', true);
        return false;
    }
    let existing;
    try { existing = localStorage.getItem(STORAGE_KEY); }
    catch (_) {
        storageAvailable = false;
        setStorageMessage('Stockage du navigateur indisponible : exporte le JSON pour conserver le travail.', true);
        return false;
    }
    if (existing !== lastStoredRaw) throw new Error('Le planning a changé dans un autre onglet. Exporte ton travail, puis recharge cette page avant de modifier la sauvegarde.');
    if (storageBlocked && !replacing) throw new Error('Le brouillon local est illisible. Exporte sa copie de secours, puis importe un fichier valide pour le remplacer.');
    try {
        if (replacing && existing !== null) localStorage.setItem(BACKUP_KEY, existing);
        localStorage.setItem(STORAGE_KEY, serialized);
        lastStoredRaw = serialized;
        storageBlocked = false;
        setStorageMessage(`Enregistré dans ce navigateur à ${new Date().toLocaleTimeString('fr-FR')}. Exporte le JSON pour une sauvegarde indépendante.`);
        return true;
    } catch (_) {
        setStorageMessage('Sauvegarde impossible (stockage plein ou refusé). Travail conservé en mémoire : exporte le JSON.', true);
        return false;
    }
}

function commitProject(candidate, { replacing = false, message = 'Planning enregistré' } = {}) {
    try {
        const normalized = ProjetPlanning.normalizeProject(candidate);
        ProjetPlanning.schedule(normalized, localIso()); // Aucun changement avant validation complète.
        if (replacing && (tasks.length || lastStoredRaw !== null) && !window.confirm('Remplacer le planning de cette session par le fichier sélectionné ? Exporte d’abord le JSON si tu souhaites conserver le travail en cours.')) return false;
        const saved = persistProject(normalized, replacing);
        applyProject(normalized);
        showToast(saved ? message : 'Modification en mémoire — export JSON nécessaire', saved ? 'emerald' : 'amber');
        return true;
    } catch (error) {
        window.alert(error.message);
        return false;
    }
}

function saveProjectSettings(event) {
    event.preventDefault();
    const form = document.getElementById('project-settings-form');
    if (!form.reportValidity()) return;
    commitProject({
        ...currentProject(),
        name: document.getElementById('project-name').value.trim(),
        startDate: document.getElementById('project-start').value,
        targetDate: document.getElementById('project-target').value,
        capacityPerWeek: Number(document.getElementById('project-capacity').value),
        schedulingMode: document.getElementById('project-mode').value,
    });
}

function downloadFile(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportProject() {
    try { downloadFile('avereo-projet-planning.json', ProjetPlanning.encodeProject(currentProject()), 'application/json;charset=utf-8'); }
    catch (error) { window.alert(error.message); }
}

function exportCsv() {
    try { downloadFile('avereo-projet-taches.csv', ProjetPlanning.tasksToCsv(tasks), 'text/csv;charset=utf-8'); }
    catch (error) { window.alert(error.message); }
}

function exportPreviousSave() {
    try {
        const raw = storageBlocked ? lastStoredRaw : localStorage.getItem(BACKUP_KEY);
        if (raw === null) { window.alert('Aucune copie précédente disponible.'); return; }
        downloadFile('avereo-projet-copie-precedente.json', raw, 'application/json;charset=utf-8');
    } catch (_) { window.alert('La copie précédente est inaccessible dans ce navigateur.'); }
}

async function readImport(file) {
    if (file.size > 5 * 1024 * 1024) throw new Error('Le fichier dépasse 5 Mo. Réduis le nombre de tâches avant import.');
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'json') return ProjetPlanning.decodeProject(await file.text());
    let rows;
    if (extension === 'csv') rows = ProjetPlanning.parseCsv(await file.text());
    else if (['xlsx', 'xls'].includes(extension)) {
        if (!window.XLSX) throw new Error('Le lecteur Excel n’est pas disponible. Utilise un CSV ou un export JSON, ou rétablis l’accès à la bibliothèque Excel.');
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: false });
    } else throw new Error('Format accepté : CSV, Excel (.xlsx, .xls) ou sauvegarde JSON Projet.');
    if (!rows.length) throw new Error('Le fichier ne contient aucune tâche.');
    return { ...currentProject(), tasks: ProjetPlanning.mapRows(rows) };
}

async function importPlanningFile(file) {
    if (!file) return;
    try { commitProject(await readImport(file), { replacing: true, message: 'Planning importé' }); }
    catch (error) { window.alert(`Import refusé : ${error.message}`); }
}

async function handleFileImport(event) {
    try { await importPlanningFile(event.target.files[0]); }
    finally { event.target.value = ''; }
}

function isLocalHost() { return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname); }

async function getPilotProject() {
    if (!isLocalHost()) throw new Error('Le planning du pilote est disponible uniquement sur le serveur local de développement.');
    const responses = await Promise.all([fetch('/local-planning/planning-pilote.json', { cache: 'no-store' }), fetch('/local-planning/planning-pilote.csv', { cache: 'no-store' })]);
    if (responses.some(response => !response.ok)) throw new Error('Le planning initial est indisponible. Lance npm run dev depuis le dossier frontend, ou importe ton fichier.');
    const metadata = await responses[0].json();
    const csv = await responses[1].text();
    return { ...metadata, tasks: ProjetPlanning.mapRows(ProjetPlanning.parseCsv(csv)) };
}

async function loadPilotProject() {
    try { commitProject(await getPilotProject(), { replacing: true, message: 'Pilote AVEREO chargé — dates proposées' }); }
    catch (error) { window.alert(error.message); }
}

async function initializeLocalProject() {
    document.getElementById('load-pilot').hidden = !isLocalHost();
    try {
        lastStoredRaw = localStorage.getItem(STORAGE_KEY);
    } catch (_) {
        storageAvailable = false;
        setStorageMessage('Stockage indisponible : session en mémoire. Exporte le JSON pour conserver le travail.', true);
    }
    if (lastStoredRaw !== null) {
        try {
            applyProject(ProjetPlanning.decodeProject(lastStoredRaw));
            setStorageMessage('Brouillon restauré depuis ce navigateur. Sauvegarde indépendante : export JSON.');
            return;
        } catch (_) {
            storageBlocked = true;
            setStorageMessage('Brouillon local illisible : il a été conservé. Exporte la copie précédente, puis importe une sauvegarde valide.', true);
            refreshAll(); fillProjectSettings(); return;
        }
    }
    if (isLocalHost()) {
        try {
            const project = ProjetPlanning.normalizeProject(await getPilotProject());
            ProjetPlanning.schedule(project, localIso());
            persistProject(project);
            applyProject(project);
            return;
        } catch (error) { setStorageMessage(error.message, true); }
    }
    refreshAll(); fillProjectSettings();
    if (storageAvailable && !isLocalHost()) setStorageMessage('Aucun planning local : importe un fichier ou crée une tâche.');
}

window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY || event.key === null) setStorageMessage('Le stockage a changé dans un autre onglet. Exporte le travail en cours puis recharge avant de modifier.', true);
});

document.addEventListener('dragover', event => {
    if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
});
document.addEventListener('drop', event => {
    if (!event.dataTransfer?.files.length) return;
    event.preventDefault();
    importPlanningFile(event.dataTransfer.files[0]);
});
