/* Relative planning: explicit positions, no calendar anchor or inferred duration. */
function renderPeriodPlanning() {
    const view = document.getElementById('view-planning');
    let panel = document.getElementById('period-planning');
    const periods = projectSettings.timelineMode === 'periods';
    if (!panel && !periods) return false;
    if (!panel) {
        panel = document.createElement('section'); panel.id = 'period-planning';
        panel.className = 'period-planning'; panel.setAttribute('aria-label', 'Gantt simplifié par périodes sans dates');
        view.prepend(panel);
    }
    for (const child of view.children) {
        if (child === panel) continue;
        if (periods) {
            if (child.dataset.periodOriginalDisplay === undefined) child.dataset.periodOriginalDisplay = child.style.display;
            child.style.display = 'none';
        } else if (child.dataset.periodOriginalDisplay !== undefined) {
            child.style.display = child.dataset.periodOriginalDisplay; delete child.dataset.periodOriginalDisplay;
        }
    }
    panel.hidden = !periods;
    if (!periods) return false;
    document.getElementById('planning-project-title').textContent = projectSettings.name;
    const count = Math.max(1, ...tasks.map(task => task.periodStart - 1 + Math.max(1, task.periodDuration)));
    panel.innerHTML = `<header><h1>${escapeHtml(projectSettings.name)}</h1><p>Planning indicatif par périodes · P1 à P${count}</p>
        <p>Les périodes n’imposent ni dates, ni semaines, ni mois. Ouvrez une intervention pour modifier son début et sa durée.</p>
        <button type="button" id="period-add">Ajouter une intervention</button> <button type="button" id="period-export">Exporter le projet JSON</button></header>
        <div class="period-scroll"><div class="period-matrix" style="--period-width:${count*96}px">
        <div class="period-line"><strong>Intervention</strong><div class="period-axis">${Array.from({length:count},(_,i)=>`<span>P${i+1}</span>`).join('')}</div></div>
        ${tasks.map(task => `<div class="period-line"><button type="button" class="period-task" data-period-task="${escapeHtml(task.id)}"><strong>${escapeHtml(task.name)}</strong><small>${escapeHtml(task.lot)} · ${escapeHtml(task.status)}${task.duration ? ' · '+task.duration+' j-personne' : ''}</small></button>
        <div class="period-track"><button type="button" data-period-task="${escapeHtml(task.id)}" class="period-bar" style="left:${(task.periodStart-1)*96}px;width:${Math.max(12,task.periodDuration*96-8)}px" aria-label="${escapeHtml(task.name)} : P${task.periodStart}${task.periodDuration ? ' à P'+(task.periodStart+task.periodDuration-1) : ' · jalon'}"><span>${task.periodDuration ? 'P'+task.periodStart+' à P'+(task.periodStart+task.periodDuration-1) : 'Jalon P'+task.periodStart}</span></button></div></div>`).join('')}
        ${tasks.length ? '' : '<p>Aucune intervention. Ajoutez une tâche pour renseigner ses périodes.</p>'}</div></div>`;
    panel.querySelector('#period-add').addEventListener('click', () => openTaskModal());
    panel.querySelector('#period-export').addEventListener('click', exportProject);
    for (const button of panel.querySelectorAll('[data-period-task]')) button.addEventListener('click', () => openTaskModal(button.dataset.periodTask));
    return true;
}
