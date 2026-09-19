import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(appDirectory, 'data/planning-pilote.json');
const generatedDirectory = resolve(appDirectory, 'data/generated');
const argumentsList = process.argv.slice(2);
assert(argumentsList.length === 0 || (argumentsList.length === 1 && argumentsList[0] === '--check'),
  'Usage : node workflows/generer-planning-pilote.mjs [--check]');
const checkOnly = argumentsList[0] === '--check';
const plan = JSON.parse(await readFile(sourcePath, 'utf8'));

assert.equal(plan.schemaVersion, 1, 'Version de schéma non prise en charge.');
assert.equal(plan.schedulingMode, 'sequential', 'Le planning pilote doit rester séquentiel.');
assert.equal(typeof plan.name, 'string');
assert(plan.name.trim(), 'Le planning doit être nommé.');
for (const key of ['startDate', 'targetDate']) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(plan[key]), `${key} doit être une date ISO.`);
  const date = new Date(`${plan[key]}T00:00:00Z`);
  assert(!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === plan[key],
    `${key} contient une date invalide.`);
}
assert(plan.targetDate >= plan.startDate, 'La date cible doit suivre le démarrage.');
assert(Number.isFinite(plan.capacityPerWeek) && plan.capacityPerWeek > 0,
  'La capacité hebdomadaire doit être positive.');
assert(Array.isArray(plan.tasks) && plan.tasks.length > 0, 'Le planning ne contient aucune tâche.');
assert.equal(typeof plan.provenance?.sourceNote, 'string');
assert(Array.isArray(plan.notes) && plan.notes.every(note => typeof note === 'string'));

const precedingIds = new Set();
for (const task of plan.tasks) {
  for (const key of ['id', 'name', 'lot', 'owner', 'status', 'riskWeight', 'riskStatus']) {
    assert(typeof task[key] === 'string' && task[key].trim(), `Champ ${key} manquant pour une tâche.`);
  }
  assert(!precedingIds.has(task.id), `Identifiant dupliqué : ${task.id}`);
  assert(Number.isFinite(task.duration) && task.duration >= 0, `Durée invalide : ${task.id}`);
  assert(Array.isArray(task.dependencies), `Dépendances invalides : ${task.id}`);
  assert(task.dependencies.every(id => precedingIds.has(id)),
    `Une dépendance de ${task.id} est absente ou placée après la tâche.`);
  assert(Number.isFinite(task.progress) && task.progress >= 0 && task.progress <= 100,
    `Avancement invalide : ${task.id}`);
  assert.equal(typeof task.isMilestone, 'boolean');
  precedingIds.add(task.id);
}
const totalCharge = plan.tasks.reduce((sum, task) => sum + task.duration, 0);
assert(Number.isFinite(plan.provenance.totalChargeDays)
  && Math.abs(totalCharge - plan.provenance.totalChargeDays) < 1e-9,
'La somme des tâches ne correspond pas à la charge centrale de référence.');

// Même contrat de neuf colonnes que l’import initial ; aucune durée arrondie.
const headers = ['ID', 'Nom', 'Lot', 'Durée (jours ouvrés)', 'Dépendances',
  'Responsable', 'Statut', 'Avancement (%)', 'Criticité'];
const quote = value => `"${String(value).replaceAll('"', '""')}"`;
const rows = plan.tasks.map(task => [task.id, task.name, task.lot, task.duration,
  task.dependencies.join(','), task.owner, task.status, task.progress, task.riskWeight]);
const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(quote).join(';')).join('\r\n') + '\r\n';
const metadata = {
  schemaVersion: plan.schemaVersion,
  name: plan.name,
  title: plan.name,
  startDate: plan.startDate,
  targetDate: plan.targetDate,
  capacityPerWeek: plan.capacityPerWeek,
  schedulingMode: plan.schedulingMode,
  sourceNote: plan.provenance.sourceNote,
  notes: plan.notes,
};
const outputs = [
  ['planning-pilote.csv', csv],
  ['planning-pilote.json', JSON.stringify(metadata, null, 2) + '\n'],
];
if (!checkOnly) await mkdir(generatedDirectory, { recursive: true });
for (const [filename, expected] of outputs) {
  const target = resolve(generatedDirectory, filename);
  if (checkOnly) {
    assert.equal(await readFile(target, 'utf8'), expected,
      `${filename} n’est pas aligné avec data/planning-pilote.json ; relancer le générateur.`);
  } else {
    await writeFile(target, expected, 'utf8');
  }
}
console.log(`${checkOnly ? 'Vérification' : 'Génération'} du planning pilote : ${plan.tasks.length} lots, `
  + `${plan.provenance.totalChargeDays} jours-personne, CSV et métadonnées cohérents.`);
