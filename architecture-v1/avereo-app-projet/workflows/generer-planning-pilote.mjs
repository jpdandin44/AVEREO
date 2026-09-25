import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(appDirectory, 'data/planning-pilote.json');
const generatedDirectory = resolve(appDirectory, 'data/generated');
const pilotagePath = resolve(appDirectory, 'docs/pilotage-etapes.md');
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
assert(/^\d{4}-\d{2}-\d{2}$/.test(plan.provenance.detailsUpdated),
  'La date de mise à jour des fiches est requise.');
assert(Array.isArray(plan.provenance.detailSources) && plan.provenance.detailSources.length > 0,
  'Les références des fiches sont requises.');
for (const source of plan.provenance.detailSources) {
  for (const key of ['id', 'reference', 'role']) {
    assert(typeof source[key] === 'string' && source[key].trim(), `Référence sans ${key}.`);
  }
}

const precedingIds = new Set();
const stepIds = new Set();
const riskIds = new Set();
const requireText = (value, label, allowEmpty = false) => {
  assert(typeof value === 'string' && (allowEmpty || value.trim()), `${label} doit être un texte.`);
};
const requireSources = (refs, label) => {
  assert(Array.isArray(refs) && refs.length > 0
    && refs.every(ref => typeof ref === 'string' && ref.trim()), `${label} doit être sourcé.`);
};
const riskProposalPrefix = 'Préqualification proposée, à confirmer :';
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
  requireText(task.description, `Description ${task.id}`);
  assert(Array.isArray(task.checklist) && task.checklist.length > 0, `Étapes absentes : ${task.id}`);
  for (const step of task.checklist) {
    for (const key of ['id', 'title', 'action', 'expected']) requireText(step[key], `${task.id}/${key}`);
    assert(!stepIds.has(step.id), `Étape dupliquée : ${step.id}`);
    stepIds.add(step.id);
    requireSources(step.sourceRefs, step.id);
    assert.equal(typeof step.completed, 'boolean');
    assert.equal(typeof step.validated, 'boolean');
    requireText(step.evidence, `Preuve ${step.id}`, true);
    requireText(step.validatedBy, `Validateur ${step.id}`, true);
    assert(step.validatedAt === null || (typeof step.validatedAt === 'string'
      && !Number.isNaN(Date.parse(step.validatedAt))), `Date de validation invalide : ${step.id}`);
    if (step.validated) {
      assert(step.completed && step.evidence.trim() && step.validatedBy.trim() && step.validatedAt,
        `Validation sans réalisation, preuve, auteur ou date : ${step.id}`);
    }
  }
  assert(Array.isArray(task.risks), `Registre de risques absent : ${task.id}`);
  for (const risk of task.risks) {
    for (const key of ['id', 'title', 'cause', 'consequence', 'prevention', 'contingency', 'owner']) {
      requireText(risk[key], `${task.id}/risque/${key}`);
    }
    assert(!riskIds.has(risk.id), `Risque dupliqué : ${risk.id}`);
    riskIds.add(risk.id);
    assert(['À qualifier', 'Faible', 'Moyenne', 'Élevée'].includes(risk.probability),
      `Probabilité invalide : ${risk.id}`);
    assert(['À qualifier', 'Mineur', 'Majeur', 'Critique'].includes(risk.impact),
      `Impact invalide : ${risk.id}`);
    assert(['À qualifier', 'Ouvert', 'Sous surveillance', 'Actif', 'Résolu', 'Accepté'].includes(risk.status),
      `Statut de risque invalide : ${risk.id}`);
    requireText(risk.followUp, `Suivi ${risk.id}`, true);
    requireText(risk.evidence, `Preuve ${risk.id}`, true);
    if (risk.followUp.startsWith(riskProposalPrefix)) {
      assert(risk.probability !== 'À qualifier' && risk.impact !== 'À qualifier',
        `Préqualification sans probabilité ou impact proposé : ${risk.id}`);
      assert(risk.status === 'À qualifier' && risk.owner === 'À confirmer'
        && risk.evidence === '' && risk.reviewDate === null,
      `Proposition de risque confondue avec une qualification confirmée : ${risk.id}`);
    }
    assert(risk.reviewDate === null || (typeof risk.reviewDate === 'string'
      && /^\d{4}-\d{2}-\d{2}$/.test(risk.reviewDate)
      && !Number.isNaN(Date.parse(risk.reviewDate))
      && new Date(risk.reviewDate).toISOString().slice(0, 10) === risk.reviewDate),
    `Date de revue invalide : ${risk.id}`);
    requireSources(risk.sourceRefs, risk.id);
  }
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
  taskDetails: Object.fromEntries(plan.tasks.map(task => [task.id, {
    description: task.description,
    checklist: task.checklist,
    risks: task.risks,
  }])),
};

// Restitution dérivée des fiches : une seule source maintenue, sans lien machine local.
const steps = plan.tasks.flatMap(task => task.checklist);
const number = value => String(value).replace('.', ',');
const sources = refs => refs.map(ref => `- ${ref}`).join('\n');
const missing = value => value || 'Non renseigné';
const lines = [
  '---',
  'project: avereo-app-projet',
  'document_type: pilotage-derive',
  'title: Étapes et risques du pilote AVEREO',
  'status: active',
  'version: git',
  'created: 2026-09-19',
  `updated: ${plan.provenance.detailsUpdated}`,
  'owner: jpdandin',
  'tags:',
  '  - projet',
  '  - pilote',
  '  - recette',
  '  - risques',
  '---',
  '',
  '# Étapes et risques du pilote AVEREO',
  '',
  'Document généré depuis [data/planning-pilote.json](../data/planning-pilote.json) par',
  '[le générateur](../workflows/generer-planning-pilote.mjs). Ne pas le modifier manuellement.',
  'Depuis `frontend/`, exécuter `npm.cmd run generate:planning` pour régénérer les dérivés',
  'et `npm.cmd run check:planning` pour vérifier leur concordance.',
  '',
  '## Sources et règles de suivi',
  '',
  'Le Markdown utilisateur de l’audit et la référence humaine du planning demeurent',
  'les références de périmètre. Le JSON applicatif est leur projection maintenue pour',
  'les six lots ; ce document et les fichiers sous `data/generated/` sont dérivés.',
  'Les documents utilisateur sont identifiés ci-dessous et ne sont pas embarqués dans l’application.',
  '',
];
for (const source of plan.provenance.detailSources) {
  lines.push(`- **${source.id}** — \`${source.reference}\` : ${source.role}`);
  if (source.sha256) lines.push(`  Empreinte SHA-256 : \`${source.sha256}\`.`);
}
lines.push('',
  'Les références T/A/H/G/W se résolvent dans les annexes §19–20 de l’audit.',
  'Les étapes EV détaillent les enveloppes existantes ; les décisions DA et les recettes AT',
  'n’ajoutent ni charge ni nouvelles dates au calendrier. Chaque AT possède une seule',
  'fiche de résultat, même lorsqu’il est cité par plusieurs EV. EV-14-B rassemble les',
  'preuves et demande de rejouer les cas affectés sur la version candidate.',
  '',
  'EV-14, EV-16 et EV-18 restent chacune découpées en A/B sans double comptage.',
  'Les deux essais EV-18-A suivent le Markdown de l’audit §17 et le planning §2 ;',
  'la fiche historique du registre n’en mentionnait qu’un. Ce choix reste à confirmer',
  'dans l’acceptation du périmètre. La capacité de cinq jours par semaine est confirmée ;',
  'DA-09 demeure ouverte sur les autres paramètres. Les décisions DA-03/04/05 sont',
  'placées en L1 pour leur échéance proposée du 2 octobre avant les actions L2.',
  '',
  'Une case réalisée ne vaut pas validation : conserver résultat, preuve, auteur et date.',
  'Une non-applicabilité se motive explicitement ; elle n’est pas un test réussi fictif.',
  'Les étapes proposées ne prouvent aucune EV implémentée ni recette exécutée. Les tests',
  'de l’application Projet sont distincts des recettes AT du pilote CONNECT → Rapport.',
  'Chaque risque porte une probabilité et un impact **proposés, à confirmer**, avec',
  'une justification dans son suivi. Le statut reste « À qualifier », le responsable',
  '« À confirmer », et aucune preuve ni date de revue n’est préremplie.',
  'Ces appréciations sont qualitatives, sans fréquence mesurée ni probabilité statistique.',
  '« Moyenne » signale ici un scénario plausible identifié dont l’exposition ou la',
  'fréquence reste inconnue ; « Élevée » est proposée quand la cause est déjà constatée',
  'ou que la marge du calendrier est très faible. Ce sont des conventions de lecture',
  'proposées pour ce registre, à confirmer avec le responsable.',
  'L’impact « Critique » correspond à une conséquence pouvant bloquer le GO, toucher',
  'les accès, perdre des données ou fausser une conclusion essentielle ; « Majeur »',
  'signale une dégradation de mission, de livrable ou de délai nécessitant un arbitrage.',
  'La justification propre à chaque risque précise l’incertitude et le prochain contrôle.',
  'Ni cette préqualification ni l’avancement ne constituent une validation ou une clôture.',
  'Un changement durable de périmètre doit être décidé et reporté dans les sources',
  'avant de réaligner cette projection. Aucun déploiement n’est autorisé par une case.',
  '',
  '## Couverture de la projection',
  '',
  `${steps.filter(step => step.id.startsWith('EV-')).length} tâches EV, `
    + `${steps.filter(step => step.id.startsWith('DA-')).length} décisions DA, `
    + `${steps.filter(step => step.id.startsWith('AT-')).length} recettes AT et `
    + `${steps.filter(step => step.id.startsWith('BUF-')).length} réserve : `
    + `**${steps.length} étapes uniques et ${riskIds.size} risques**.`,
  '',
  '| Lot | Charge (j-p) | Étapes | Risques |',
  '|---|---:|---:|---:|',
);
for (const task of plan.tasks) {
  lines.push(`| ${task.id} — ${task.name} | ${number(task.duration)} | ${task.checklist.length} | ${task.risks.length} |`);
}
lines.push('',
  `Total : **${number(totalCharge)} jours-personne**, du ${plan.startDate} au ${plan.targetDate} `
    + `(dates proposées, capacité ${number(plan.capacityPerWeek)} j-p/semaine).`,
  'Les disponibilités, attentes et décisions peuvent déplacer la réalisation effective.',
  'Les fiches de décision conservent leurs échéances proposées dans leur texte ;',
  'elles ne constituent pas des rendez-vous confirmés ni des jalons recalculés par le moteur.',
);
for (const task of plan.tasks) {
  lines.push('', `## ${task.id} — ${task.name}`, '', task.description, '', '### Étapes', '');
  for (const step of task.checklist) {
    lines.push(`#### ${step.id} — ${step.title}`, '', '**Actions à mener**', '', step.action,
      '', '**Résultat attendu**', '', step.expected, '', '**Suivi de l’étape**', '',
      `- [${step.completed ? 'x' : ' '}] Réalisée`,
      `- [${step.validated ? 'x' : ' '}] Validée`,
      '', `Preuve : ${missing(step.evidence)}.`,
      `Validation : ${missing(step.validatedBy)} ; date : ${missing(step.validatedAt)}.`,
      '', '**Sources**', '', sources(step.sourceRefs), '');
  }
  lines.push('### Registre des risques', '');
  for (const risk of task.risks) {
    lines.push(`#### ${risk.id} — ${risk.title}`, '', `**Cause :** ${risk.cause}`, '',
      `**Conséquence :** ${risk.consequence}`, '',
      `**${risk.followUp.startsWith(riskProposalPrefix) ? 'Préqualification proposée (à confirmer)' : 'Qualification déclarée'} :** `
        + `probabilité ${risk.probability} ; impact ${risk.impact} ; statut ${risk.status}.`,
      '', `**Responsable :** ${risk.owner}.`, '', '**Prévention**', '', risk.prevention,
      '', '**Réaction si le risque survient**', '', risk.contingency,
      '', `**Suivi :** ${missing(risk.followUp)}`, '', `**Preuve :** ${missing(risk.evidence)}.`,
      `**Date de revue :** ${missing(risk.reviewDate)}.`, '', '**Sources**', '', sources(risk.sourceRefs), '');
  }
}
const pilotageMarkdown = lines.join('\n').trimEnd() + '\n';
const outputs = [
  [resolve(generatedDirectory, 'planning-pilote.csv'), csv],
  [resolve(generatedDirectory, 'planning-pilote.json'), JSON.stringify(metadata, null, 2) + '\n'],
  [pilotagePath, pilotageMarkdown],
];
for (const [target, expected] of outputs) {
  if (checkOnly) {
    assert.equal(await readFile(target, 'utf8'), expected,
      `${target} n’est pas aligné avec data/planning-pilote.json ; relancer le générateur.`);
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, expected, 'utf8');
  }
}
console.log(`${checkOnly ? 'Vérification' : 'Génération'} du planning pilote : ${plan.tasks.length} lots, `
  + `${plan.provenance.totalChargeDays} jours-personne, ${stepIds.size} étapes, ${riskIds.size} risques ; `
  + 'CSV, métadonnées et documentation cohérents.');
