(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.ProjetPlanning = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
    'use strict';

    const DAY = 86400000;
    const EPSILON = Number.EPSILON * 8;
    const MAX_TASKS = 1000;
    const MAX_HORIZON = 3660;
    const MAX_CALENDAR_DAYS = 3660;
    const STATUSES = ['À faire', 'En cours', 'En attente', 'Bloqué', 'Terminé', 'Validé'];
    const RISK_WEIGHTS = ['Mineur', 'Majeur', 'Critique'];
    const RISK_STATUSES = ['Aucun', 'Sous surveillance', 'Actif', 'Résolu'];
    const RESERVED_IDS = new Set(['__proto__', 'constructor', 'prototype']);

    function fail(message) { throw new Error(message); }
    function object(value, label) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label + ' doit être un objet.');
    }
    function text(value, label, max, required) {
        if (typeof value !== 'string') fail(label + ' doit être du texte.');
        const result = value.replace(/\r\n?/g, '\n').trim();
        if ((required && !result) || result.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(result)) {
            fail(label + ' est vide, trop long ou contient des caractères interdits.');
        }
        return result;
    }
    function identifier(value, label) {
        const result = text(value, label, 128, true);
        if (!/^[A-Za-z0-9_-]+$/.test(result) || RESERVED_IDS.has(result.toLowerCase())) fail(label + ' est invalide.');
        return result;
    }
    function parseNumber(value, label = 'Nombre', options = {}) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(trimmed)) fail(label + ' doit être un nombre explicite.');
            value = Number(trimmed.replace(',', '.'));
        }
        if (typeof value !== 'number' || !Number.isFinite(value)) fail(label + ' doit être fini.');
        if (options.min !== undefined && value < options.min) fail(label + ' est inférieur au minimum ' + options.min + '.');
        if (options.max !== undefined && value > options.max) fail(label + ' dépasse le maximum ' + options.max + '.');
        return Object.is(value, -0) ? 0 : value;
    }
    function dateValue(iso, label = 'Date') {
        if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) fail(label + ' doit être au format AAAA-MM-JJ.');
        const [year, month, day] = iso.split('-').map(Number);
        const date = new Date(0);
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCFullYear(year, month - 1, day);
        if (year < 1 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
            fail(label + ' est une date impossible.');
        }
        return date;
    }
    function isoDate(date) { return date.toISOString().slice(0, 10); }
    function localDate(date) {
        const result = new Date(0);
        result.setFullYear(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        result.setHours(0, 0, 0, 0);
        return result;
    }
    function workingDate(date) {
        const result = new Date(date.getTime());
        if (result.getUTCDay() === 6) result.setUTCDate(result.getUTCDate() + 2);
        if (result.getUTCDay() === 0) result.setUTCDate(result.getUTCDate() + 1);
        return result;
    }
    function addWholeWorkingDays(start, count) {
        const result = new Date(start.getTime());
        result.setUTCDate(result.getUTCDate() + Math.floor(count / 5) * 7);
        let remaining = count % 5;
        while (remaining > 0) {
            result.setUTCDate(result.getUTCDate() + 1);
            if (result.getUTCDay() !== 0 && result.getUTCDay() !== 6) remaining--;
        }
        return result;
    }
    function roundOffset(value) { return Math.round(value * 1e9) / 1e9; }
    function offsetDateValue(start, offset, end) {
        offset = parseNumber(offset, 'Décalage ouvré', { min: 0, max: MAX_HORIZON });
        const nearest = Math.round(offset);
        if (Math.abs(offset - nearest) < EPSILON * Math.max(1, Math.abs(offset))) offset = nearest;
        const whole = end && offset > 0 && Number.isInteger(offset) ? offset - 1 : Math.floor(offset);
        return addWholeWorkingDays(start, whole);
    }
    function offsetToDate(startISO, offset, options = {}) {
        return localDate(offsetDateValue(workingDate(dateValue(startISO)), offset, options.end === true));
    }
    function workingOffset(start, target) {
        target = workingDate(target);
        const span = Math.round((target - start) / DAY);
        if (span <= 0) return 0;
        let result = Math.floor(span / 7) * 5;
        const cursor = new Date(start.getTime());
        cursor.setUTCDate(cursor.getUTCDate() + Math.floor(span / 7) * 7);
        while (cursor < target) {
            cursor.setUTCDate(cursor.getUTCDate() + 1);
            if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6) result++;
        }
        return result;
    }
    function choice(value, values, label) {
        if (!values.includes(value)) fail(label + ' inconnu : ' + String(value));
        return value;
    }
    function topologicalOrder(tasks) {
        const byId = new Map(tasks.map(task => [task.id, task]));
        const remaining = new Map(tasks.map(task => [task.id, task.dependencies.length]));
        const children = new Map(tasks.map(task => [task.id, []]));
        tasks.forEach(task => task.dependencies.forEach(id => {
            if (!byId.has(id)) fail('Dépendance absente pour ' + task.id + ' : ' + id);
            children.get(id).push(task.id);
        }));
        const ready = tasks.filter(task => !task.dependencies.length).map(task => task.id);
        const ordered = [];
        for (let i = 0; i < ready.length; i++) {
            const id = ready[i];
            ordered.push(byId.get(id));
            children.get(id).forEach(child => {
                remaining.set(child, remaining.get(child) - 1);
                if (remaining.get(child) === 0) ready.push(child);
            });
        }
        if (ordered.length !== tasks.length) fail('Cycle de dépendances : ' + tasks.filter(task => remaining.get(task.id) > 0).map(task => task.id).slice(0, 10).join(', '));
        return ordered;
    }
    function validateTasks(input) {
        if (!Array.isArray(input) || input.length > MAX_TASKS) fail('La liste doit contenir au maximum ' + MAX_TASKS + ' tâches.');
        const seen = new Set();
        const tasks = input.map((entry, index) => {
            object(entry, 'Tâche ' + (index + 1));
            const id = identifier(entry.id, 'ID ligne ' + (index + 1));
            if (seen.has(id)) fail('ID dupliqué : ' + id);
            seen.add(id);
            const duration = parseNumber(entry.duration, 'Durée de ' + id, { min: 0, max: 3650 });
            if (entry.isMilestone === true && duration !== 0) fail('Le jalon ' + id + ' doit avoir une durée nulle.');
            if (entry.dependencies !== undefined && !Array.isArray(entry.dependencies)) fail('Les dépendances de ' + id + ' doivent être une liste.');
            const dependencies = [...new Set((entry.dependencies || []).map(dep => identifier(dep, 'Dépendance de ' + id)))];
            if (dependencies.includes(id)) fail('Une tâche ne peut pas dépendre d’elle-même : ' + id);
            const manualStart = entry.manualStart === undefined || entry.manualStart === null || entry.manualStart === '' ? null : isoDate(dateValue(entry.manualStart, 'Début manuel de ' + id));
            return {
                id,
                name: text(entry.name, 'Nom de ' + id, 1000, true),
                lot: text(entry.lot === undefined || entry.lot === '' ? 'Général' : entry.lot, 'Lot de ' + id, 200, true),
                duration,
                dependencies,
                owner: text(entry.owner === undefined ? '' : entry.owner, 'Responsable de ' + id, 200, false),
                status: choice(entry.status === undefined || entry.status === '' ? 'À faire' : entry.status, STATUSES, 'Statut de ' + id),
                progress: parseNumber(entry.progress === undefined || entry.progress === '' ? 0 : entry.progress, 'Avancement de ' + id, { min: 0, max: 100 }),
                riskWeight: choice(entry.riskWeight === undefined || entry.riskWeight === '' ? 'Mineur' : entry.riskWeight, RISK_WEIGHTS, 'Criticité de ' + id),
                riskStatus: choice(entry.riskStatus === undefined || entry.riskStatus === '' ? 'Aucun' : entry.riskStatus, RISK_STATUSES, 'État du risque de ' + id),
                isMilestone: duration === 0,
                manualStart
            };
        });
        topologicalOrder(tasks);
        return tasks;
    }
    function normalizeProject(input) {
        object(input, 'Projet');
        if (input.schemaVersion !== 1) fail('Version de sauvegarde non prise en charge.');
        const startDate = isoDate(dateValue(input.startDate, 'Début du projet'));
        const targetDate = input.targetDate === undefined || input.targetDate === null || input.targetDate === '' ? null : isoDate(dateValue(input.targetDate, 'Objectif du projet'));
        if (targetDate && targetDate < startDate) fail('L’objectif du projet précède son début.');
        const capacityPerWeek = parseNumber(input.capacityPerWeek, 'Capacité par semaine');
        if (capacityPerWeek <= 0) fail('La capacité par semaine doit être strictement positive.');
        const schedulingMode = choice(input.schedulingMode, ['sequential', 'dependencies'], 'Mode de planification');
        const tasks = validateTasks(input.tasks);
        if (schedulingMode === 'sequential') {
            const positions = new Map(tasks.map((task, index) => [task.id, index]));
            tasks.forEach((task, index) => task.dependencies.forEach(id => {
                if (positions.get(id) >= index) fail('En mode séquentiel, la dépendance ' + id + ' doit précéder ' + task.id + ' dans la liste.');
            }));
        }
        return {
            schemaVersion: 1,
            name: text(input.name, 'Nom du projet', 200, true),
            startDate,
            targetDate,
            capacityPerWeek,
            schedulingMode,
            tasks
        };
    }
    function schedule(input, todayISO) {
        const project = normalizeProject(input);
        const start = workingDate(dateValue(project.startDate));
        const today = todayISO ? dateValue(todayISO, 'Date courante') : dateValue(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
        const order = project.schedulingMode === 'sequential' ? project.tasks : topologicalOrder(project.tasks);
        const planned = new Map();
        let cursor = 0;
        let maximumEnd = 0;
        let lastDate = new Date(start.getTime());
        order.forEach(task => {
            let startOffset = project.schedulingMode === 'sequential' ? cursor : 0;
            task.dependencies.forEach(id => {
                if (!planned.has(id)) fail('En mode séquentiel, la dépendance ' + id + ' doit précéder ' + task.id + ' dans la liste.');
                startOffset = Math.max(startOffset, planned.get(id).endOffset);
            });
            if (task.manualStart) startOffset = Math.max(startOffset, workingOffset(start, dateValue(task.manualStart)));
            startOffset = roundOffset(startOffset);
            const endOffset = roundOffset(startOffset + task.duration * 5 / project.capacityPerWeek);
            if (!Number.isFinite(endOffset) || endOffset > MAX_HORIZON) fail('Le planning dépasse ' + MAX_HORIZON + ' jours ouvrés. Vérifiez durées et capacité.');
            if (task.duration > 0 && endOffset <= startOffset) fail('La durée de ' + task.id + ' est trop petite pour la précision du planning.');
            const startDay = offsetDateValue(start, startOffset, false);
            const endDay = offsetDateValue(start, endOffset, task.duration > 0);
            if ((endDay - start) / DAY + 1 > MAX_CALENDAR_DAYS) fail('Le planning dépasse ' + MAX_CALENDAR_DAYS + ' jours calendaires. Vérifiez durées, dates et capacité.');
            planned.set(task.id, {
                ...task,
                dependencies: [...task.dependencies],
                calcStart: localDate(startDay),
                calcEnd: localDate(endDay),
                startOffset,
                endOffset,
                isLate: endDay < today && !['Terminé', 'Validé'].includes(task.status)
            });
            cursor = endOffset;
            maximumEnd = Math.max(maximumEnd, endOffset);
            if (endDay > lastDate) lastDate = endDay;
        });
        return {
            tasks: project.tasks.map(task => planned.get(task.id)),
            projectStart: localDate(start),
            projectEnd: localDate(lastDate),
            totalDays: Math.round((lastDate - start) / DAY) + 1,
            totalWorkDays: maximumEnd,
            totalDuration: roundOffset(project.tasks.reduce((sum, task) => sum + task.duration, 0))
        };
    }

    function parseCsv(input) {
        if (typeof input !== 'string' || input.length > 5000000) fail('CSV invalide ou supérieur à 5 millions de caractères.');
        const source = input.replace(/^\uFEFF/, '');
        const counts = { ';': 0, ',': 0, '\t': 0 };
        let quoted = false;
        for (let i = 0; i < source.length; i++) {
            const char = source[i];
            if (char === '"') {
                if (quoted && source[i + 1] === '"') i++;
                else quoted = !quoted;
            } else if (!quoted && (char === '\r' || char === '\n')) break;
            else if (!quoted && Object.hasOwn(counts, char)) counts[char]++;
        }
        const delimiter = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
        const records = [];
        let row = [], value = '', inQuotes = false, closed = false;
        function finishCell() { row.push(value); value = ''; closed = false; }
        function finishRow() { finishCell(); if (row.some(cell => cell.trim() !== '')) records.push(row); row = []; }
        for (let i = 0; i < source.length; i++) {
            const char = source[i];
            if (inQuotes) {
                if (char === '"') {
                    if (source[i + 1] === '"') { value += '"'; i++; }
                    else { inQuotes = false; closed = true; }
                } else value += char;
            } else if (char === delimiter) finishCell();
            else if (char === '\r' || char === '\n') {
                finishRow();
                if (char === '\r' && source[i + 1] === '\n') i++;
            } else if (char === '"') {
                if (value.trim() !== '' || closed) fail('Guillemet CSV inattendu.');
                value = ''; inQuotes = true;
            } else if (closed) {
                if (!/\s/.test(char)) fail('Caractère inattendu après un champ CSV entre guillemets.');
            } else value += char;
        }
        if (inQuotes) fail('Champ CSV entre guillemets non fermé.');
        if (row.length || value || closed) finishRow();
        if (records.length < 2) fail('Le CSV doit contenir un en-tête et au moins une tâche.');
        const headers = records.shift().map(header => header.trim());
        if (headers.some(header => !header) || new Set(headers.map(headerKey)).size !== headers.length) fail('En-têtes CSV vides ou dupliqués.');
        return records.map((cells, index) => {
            if (cells.length > headers.length) fail('La ligne CSV ' + (index + 2) + ' contient trop de colonnes.');
            const result = Object.create(null);
            headers.forEach((header, i) => { result[header] = cells[i] === undefined ? '' : cells[i]; });
            return result;
        });
    }
    function headerKey(value) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9%]/g, ''); }
    const ALIASES = {
        id: ['id', 'identifiant'], name: ['nom', 'tache', 'task', 'name'], lot: ['lot', 'phase'],
        duration: ['duree', 'dureejours', 'dureejoursouvres', 'duration', 'jours', 'jh'],
        dependencies: ['dependances', 'dependance', 'dependencies', 'predecesseur', 'predecesseurs'],
        owner: ['responsable', 'owner', 'assigne'], status: ['statut', 'etat', 'status'],
        progress: ['avancement', 'avancement%', 'progress', 'progress%', '%'],
        riskWeight: ['criticite', 'ponderation', 'riskweight'], riskStatus: ['etatrisque', 'statutrisque', 'riskstatus'],
        manualStart: ['debutmanuel', 'manualstart']
    };
    function unprotect(value) {
        if (typeof value !== 'string') return value;
        if (value.startsWith("''") || /^'\s*[=+\-@]/.test(value)) return value.slice(1);
        return value;
    }
    function mapRows(rows) {
        if (!Array.isArray(rows) || rows.length === 0) fail('Le fichier ne contient aucune tâche.');
        const mapped = rows.map((row, index) => {
            object(row, 'Ligne ' + (index + 1));
            const task = {};
            Object.keys(row).forEach(header => {
                const key = headerKey(header);
                const field = Object.keys(ALIASES).find(name => ALIASES[name].includes(key));
                if (!field) return;
                if (Object.hasOwn(task, field)) fail('Deux colonnes correspondent au champ ' + field + '.');
                task[field] = unprotect(row[header]);
            });
            if (task.id === undefined || task.name === undefined || task.duration === undefined) fail('Colonnes obligatoires : ID, Nom et Durée (ligne ' + (index + 1) + ').');
            task.id = String(task.id).trim();
            task.name = String(task.name);
            if (task.dependencies === undefined || task.dependencies === '') task.dependencies = [];
            else if (typeof task.dependencies === 'string') task.dependencies = task.dependencies.split(',').map(id => id.trim()).filter(Boolean);
            if (typeof task.progress === 'string' && task.progress.trim().endsWith('%')) task.progress = task.progress.trim().slice(0, -1).trim();
            return task;
        });
        return validateTasks(mapped);
    }
    function encodeProject(project) { return JSON.stringify(normalizeProject(project), null, 2); }
    function decodeProject(source) {
        if (typeof source !== 'string' || source.length > 5000000) fail('Sauvegarde invalide ou trop volumineuse.');
        let project;
        try { project = JSON.parse(source.replace(/^\uFEFF/, '')); }
        catch (_) { fail('La sauvegarde JSON est illisible.'); }
        return normalizeProject(project);
    }
    function tasksToCsv(input) {
        const tasks = validateTasks(input);
        const rows = [['ID', 'Nom', 'Lot', 'Durée (jours ouvrés)', 'Dépendances', 'Responsable', 'Statut', 'Avancement (%)', 'Criticité']];
        tasks.forEach(task => rows.push([task.id, task.name, task.lot, task.duration, task.dependencies.join(','), task.owner, task.status, task.progress, task.riskWeight]));
        function cell(value) {
            let result = String(value);
            if (/^'|^\s*[=+\-@]/.test(result)) result = "'" + result;
            return '"' + result.replace(/"/g, '""') + '"';
        }
        return '\uFEFF' + rows.map(row => row.map(cell).join(';')).join('\r\n') + '\r\n';
    }
    return Object.freeze({
        parseNumber, parseCsv, mapRows, validateTasks, normalizeProject, schedule,
        offsetToDate, encodeProject, decodeProject, tasksToCsv,
        STATUSES: Object.freeze(STATUSES),
        LIMITS: Object.freeze({ maxTasks: MAX_TASKS, maxWorkingDays: MAX_HORIZON, maxCalendarDays: MAX_CALENDAR_DAYS })
    });
});
