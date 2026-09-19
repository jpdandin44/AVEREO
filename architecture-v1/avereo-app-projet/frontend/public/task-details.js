/* Fiches locales : les textes de référence et le suivi sont sauvegardés avec la tâche. */
function checklistLabel(items = []) {
    return `${items.filter(item => item.validated).length}/${items.length} étapes validées`;
}

function taskDetailsForSave(latestTask) {
    const description = document.getElementById('task-description').value.trim();
    // Un enrichissement peut finir pendant l'édition. Garder les nouvelles
    // entrées sans remplacer les preuves, cases et risques du brouillon ouvert.
    const keepNewEntries = (draft, latest = [], originalIds) => [
        ...draft,
        ...latest.filter(item => !originalIds.includes(item.id) && !draft.some(entry => entry.id === item.id)),
    ];
    return {
        description: !description && !editingOriginalDetails.description ? latestTask?.description || '' : description,
        checklist: keepNewEntries(editingChecklist, latestTask?.checklist, editingOriginalDetails.checklistIds),
        risks: keepNewEntries(editingRisks, latestTask?.risks, editingOriginalDetails.riskIds),
    };
}

function renderTaskChecklist() {
    document.getElementById('task-checklist-summary').textContent = checklistLabel(editingChecklist);
    document.getElementById('task-checklist').innerHTML = editingChecklist.length ? editingChecklist.map((item, index) => `
        <details class="border rounded-lg bg-white" ${index === 0 ? 'open' : ''}>
            <summary class="cursor-pointer p-3 font-medium text-sm text-slate-800">${escapeHtml(item.id)} · ${escapeHtml(item.title)} <span id="step-state-${index}" class="text-xs text-blue-700">${item.validated ? '— Validée' : item.completed ? '— À vérifier' : '— À faire'}</span></summary>
            <div class="px-4 pb-4 space-y-3 text-sm">
                <div><h4 class="font-semibold text-slate-800">Actions à réaliser</h4><p class="whitespace-pre-wrap text-slate-700 mt-1">${escapeHtml(item.action || 'À compléter')}</p></div>
                <div class="bg-blue-50 rounded p-3"><h4 class="font-semibold text-blue-900">Résultats attendus / critères de vérification</h4><p class="whitespace-pre-wrap text-slate-700 mt-1">${escapeHtml(item.expected || 'À compléter')}</p></div>
                <p class="text-xs text-slate-500 whitespace-pre-wrap">Sources : ${escapeHtml(item.sourceRefs.join(' ; ') || 'Non renseignées')}</p>
                <label class="flex gap-2 items-center"><input type="checkbox" id="step-completed-${index}" onchange="updateChecklistEntry(${index}, 'completed')" ${item.completed ? 'checked' : ''}>Étape réalisée</label>
                <label class="block text-xs font-medium text-slate-700" for="step-evidence-${index}">Preuve / résultat observé / référence du livrable</label>
                <textarea id="step-evidence-${index}" rows="2" maxlength="6000" oninput="updateChecklistEntry(${index}, 'evidence')" class="w-full border rounded p-2">${escapeHtml(item.evidence)}</textarea>
                <label class="block text-xs font-medium text-slate-700" for="step-validatedBy-${index}">Vérifié par</label>
                <input id="step-validatedBy-${index}" maxlength="200" value="${escapeHtml(item.validatedBy)}" oninput="updateChecklistEntry(${index}, 'validatedBy')" class="w-full border rounded p-2">
                <label class="flex gap-2 items-center font-medium"><input type="checkbox" id="step-validated-${index}" onchange="updateChecklistEntry(${index}, 'validated')" ${item.validated ? 'checked' : ''}>Vérifiée et validée</label>
                <p id="step-feedback-${index}" role="status" class="text-xs text-slate-600">${item.validatedAt ? `Validation enregistrée le ${escapeHtml(new Date(item.validatedAt).toLocaleString('fr-FR'))}` : 'Validation : réalisation, preuve et nom du vérificateur requis.'}</p>
            </div>
        </details>`).join('') : '<p class="text-sm text-slate-500">Aucune étape documentée pour cette tâche. La description peut être renseignée ci-dessus.</p>';
}

function updateChecklistEntry(index, field) {
    const item = editingChecklist[index];
    const element = document.getElementById(`step-${field}-${index}`);
    if (!item || !element) return;
    const feedback = document.getElementById(`step-feedback-${index}`);
    if (field === 'validated') {
        if (element.checked && (!item.completed || !item.evidence.trim() || !item.validatedBy.trim())) {
            element.checked = false;
            feedback.textContent = 'Pour valider : réalise l’étape, renseigne une preuve et le nom du vérificateur.';
            return;
        }
        item.validated = element.checked;
        item.validatedAt = item.validated ? new Date().toISOString() : null;
    } else {
        item[field] = field === 'completed' ? element.checked : element.value;
        // Une preuve ou une identité modifiée exige une nouvelle validation explicite.
        if (item.validated) {
            item.validated = false;
            item.validatedAt = null;
            document.getElementById(`step-validated-${index}`).checked = false;
        }
    }
    feedback.textContent = item.validated ? `Validation du ${new Date(item.validatedAt).toLocaleString('fr-FR')} — cliquer sur Enregistrer pour la conserver.` : 'Modifications non enregistrées. La validation reste une action explicite.';
    document.getElementById(`step-state-${index}`).textContent = item.validated ? '— Validée' : item.completed ? '— À vérifier' : '— À faire';
    document.getElementById('task-checklist-summary').textContent = checklistLabel(editingChecklist);
}

function riskBadge(risk) {
    const score = ProjetPlanning.riskScore(risk);
    return score === null ? 'À qualifier' : `${ProjetPlanning.riskLevel(risk)} · ${score}/9${risk.status === 'À qualifier' ? ' · proposé' : ''}`;
}

function renderTaskRisks() {
    const textField = (risk, index, field, label, rows = 2) => `<label class="block text-xs font-medium text-slate-700" for="risk-${field}-${index}">${label}</label><textarea rows="${rows}" maxlength="6000" id="risk-${field}-${index}" oninput="updateRiskField(${index}, '${field}')" class="w-full border rounded p-2 text-sm">${escapeHtml(risk[field])}</textarea>`;
    const choice = (risk, index, field, label, options) => `<label class="text-xs font-medium text-slate-700 flex flex-col gap-1">${label}<select id="risk-${field}-${index}" onchange="updateRiskField(${index}, '${field}')" class="border rounded p-2 text-sm bg-white">${options.map(option => `<option ${risk[field] === option ? 'selected' : ''}>${option}</option>`).join('')}</select></label>`;
    document.getElementById('task-risks').innerHTML = editingRisks.length ? editingRisks.map((risk, index) => `
        <details id="risk-detail-${index}" class="border border-orange-200 rounded-lg bg-white">
            <summary class="cursor-pointer p-3 font-medium text-sm">${escapeHtml(risk.id)} · <span id="risk-title-label-${index}">${escapeHtml(risk.title)}</span> <span class="text-orange-800 text-xs" id="risk-score-${index}">${riskBadge(risk)}</span></summary>
            <div class="px-4 pb-4 space-y-3">
                <label class="block text-xs font-medium text-slate-700" for="risk-title-${index}">Risque</label><input id="risk-title-${index}" value="${escapeHtml(risk.title)}" maxlength="1000" oninput="updateRiskField(${index}, 'title')" class="w-full border rounded p-2 text-sm">
                ${textField(risk, index, 'cause', 'Cause / situation déclenchante')}
                ${textField(risk, index, 'consequence', 'Conséquences attendues')}
                <div class="grid grid-cols-2 gap-3">${choice(risk, index, 'probability', 'Probabilité', ['À qualifier', 'Faible', 'Moyenne', 'Élevée'])}${choice(risk, index, 'impact', 'Impact', ['À qualifier', 'Mineur', 'Majeur', 'Critique'])}</div>
                ${textField(risk, index, 'prevention', 'Prévention / actions de réduction')}
                ${textField(risk, index, 'contingency', 'Réaction si le risque survient')}
                <label class="block text-xs font-medium text-slate-700" for="risk-owner-${index}">Responsable du suivi</label><input id="risk-owner-${index}" value="${escapeHtml(risk.owner)}" maxlength="200" oninput="updateRiskField(${index}, 'owner')" class="w-full border rounded p-2 text-sm">
                <div class="grid grid-cols-2 gap-3">${choice(risk, index, 'status', 'Statut', ['À qualifier', 'Ouvert', 'Sous surveillance', 'Actif', 'Résolu', 'Accepté'])}<label class="text-xs font-medium text-slate-700 flex flex-col gap-1">Date de revue<input type="date" id="risk-reviewDate-${index}" value="${escapeHtml(risk.reviewDate || '')}" onchange="updateRiskField(${index}, 'reviewDate')" class="border rounded p-2 text-sm"></label></div>
                ${textField(risk, index, 'followUp', 'Suivi des actions / prochaine action')}
                ${textField(risk, index, 'evidence', 'Preuve de traitement / justification de clôture ou d’acceptation')}
                <p class="text-xs text-slate-500 whitespace-pre-wrap">Sources : ${escapeHtml(risk.sourceRefs.join(' ; ') || 'Risque ajouté au suivi local')}</p>
                <p class="text-xs text-slate-500">Résolu ou accepté : qualification, responsable nommé, preuve et date de revue obligatoires.</p>
            </div>
        </details>`).join('') : '<p class="text-sm text-slate-500">Aucun risque détaillé enregistré. Cela ne constitue pas une absence de risque.</p>';
}

function updateRiskField(index, field) {
    const risk = editingRisks[index];
    const element = document.getElementById(`risk-${field}-${index}`);
    if (!risk || !element) return;
    risk[field] = field === 'reviewDate' ? element.value || null : element.value;
    document.getElementById(`risk-score-${index}`).textContent = riskBadge(risk);
    document.getElementById(`risk-title-label-${index}`).textContent = risk.title;
}

function addTaskRisk() {
    if (editingRisks.length >= 60) { window.alert('Maximum de 60 risques par tâche.'); return; }
    let number = 1; while (editingRisks.some(risk => risk.id === `R-LOCAL-${number}`)) number++;
    editingRisks.push({ id: `R-LOCAL-${number}`, title: 'Nouveau risque', cause: '', consequence: '', probability: 'À qualifier', impact: 'À qualifier', prevention: '', contingency: '', owner: '', status: 'À qualifier', followUp: '', evidence: '', reviewDate: null, sourceRefs: [] });
    renderTaskRisks();
    const detail = document.getElementById(`risk-detail-${editingRisks.length - 1}`);
    detail.open = true;
    detail.scrollIntoView({ block: 'nearest' });
}

function openTaskRisk(taskId, riskIndex) {
    openTaskModal(taskId);
    const detail = document.getElementById(`risk-detail-${riskIndex}`);
    if (detail) { detail.open = true; detail.scrollIntoView({ block: 'start' }); }
}

async function showPilotDocumentation() {
    const panel = document.getElementById('task-documentation');
    if (!panel.hidden) { panel.hidden = true; return; }
    panel.hidden = false;
    panel.textContent = 'Chargement des étapes documentées…';
    try {
        if (!isLocalHost()) throw new Error('Disponible sur le serveur local de développement.');
        const response = await fetch('/local-planning/pilotage-etapes.md', { cache: 'no-store' });
        if (!response.ok) throw new Error('Document local indisponible.');
        panel.textContent = await response.text();
    } catch (error) { panel.textContent = error.message; }
}

function riskAttention(task) {
    return (task.risks || []).some(risk => !['Résolu', 'Accepté', 'À qualifier'].includes(risk.status) && (risk.status === 'Actif' || ProjetPlanning.riskLevel(risk) === 'Critique'));
}

function renderDetailedRisksView() {
    const risks = tasks.flatMap(task => (task.risks || []).map((risk, index) => ({ task, risk, index })));
    const order = { Actif: 0, 'À qualifier': 1, Ouvert: 2, 'Sous surveillance': 3, Accepté: 4, Résolu: 5 };
    risks.sort((a, b) => order[a.risk.status] - order[b.risk.status] || (ProjetPlanning.riskScore(b.risk) || 0) - (ProjetPlanning.riskScore(a.risk) || 0));
    const open = risks.filter(({ risk }) => !['Résolu', 'Accepté'].includes(risk.status));
    document.getElementById('risk-register-summary').textContent = `${risks.length} risques documentés · ${open.length} ouverts · ${open.filter(({ risk }) => risk.status === 'À qualifier' || ProjetPlanning.riskScore(risk) === null).length} à qualifier / confirmer · ${risks.filter(({ risk }) => risk.status === 'Accepté').length} acceptés · ${risks.filter(({ risk }) => risk.status === 'Résolu').length} résolus`;
    let html = risks.map(({ task, risk, index }) => `<tr class="hover:bg-slate-50"><td class="px-4 py-3"><b>${escapeHtml(task.id)}</b><p class="text-xs">${escapeHtml(task.name)}</p></td><td class="px-4 py-3"><b>${escapeHtml(risk.id)} · ${escapeHtml(risk.title)}</b><p class="text-xs text-slate-600 mt-1">${escapeHtml(risk.consequence)}</p><p class="text-xs mt-1">Suivi : ${escapeHtml(risk.owner || 'À affecter')} · ${escapeHtml(risk.reviewDate || 'Revue à planifier')}</p></td><td class="px-4 py-3 text-xs">${riskBadge(risk)}</td><td class="px-4 py-3 text-xs">${escapeHtml(risk.status)}</td><td class="px-4 py-3"><button class="text-blue-700 underline" onclick="openTaskRisk('${task.id}', ${index})">Ouvrir / suivre</button></td></tr>`).join('');
    html += tasks.filter(task => task.isLate || task.status === 'Bloqué' || ['Actif', 'Sous surveillance'].includes(task.riskStatus)).map(task => `<tr class="bg-amber-50"><td class="p-4">${escapeHtml(task.id)}</td><td class="p-4">${escapeHtml(task.name)} — ${task.isLate ? 'Retard du planning' : 'Alerte du lot'}</td><td class="p-4">${escapeHtml(task.riskWeight)}</td><td class="p-4">${escapeHtml(task.status === 'Bloqué' ? 'Bloqué' : task.riskStatus)}</td><td class="p-4"><button class="text-blue-700 underline" onclick="openTaskModal('${task.id}')">Ouvrir le lot</button></td></tr>`).join('');
    document.getElementById('risks-table-body').innerHTML = html || '<tr><td colspan="5" class="p-6 text-slate-500">Aucun risque saisi. Ouvre une tâche pour documenter ses risques.</td></tr>';
}
