import { readFile, writeFile, rename, realpath, stat, readdir, mkdir, open, unlink } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export class ReviewError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const reject = (status, message) => { throw new ReviewError(status, message); };
const hash = value => createHash('sha256').update(value).digest('hex');
const inside = (root, file) => { const p = relative(root, file); return p !== '..' && !p.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(p); };
const limit = 2 * 1024 * 1024;

// Only manifest-declared Markdown deliverables are readable. Real paths prevent
// a symlink or Windows junction from opening files outside the selected folder.
async function safeFile(root, filename) {
  if (typeof filename !== 'string' || !filename.endsWith('.md')) reject(422, 'Seuls les livrables Markdown sont consultables.');
  const candidate = resolve(root, filename);
  if (!inside(root, candidate)) reject(403, 'Livrable hors du dossier autorisé.');
  const actual = await realpath(candidate);
  if (!inside(root, actual)) reject(403, 'Lien vers un fichier hors du dossier autorisé.');
  if ((await stat(actual)).size > limit) reject(422, 'Livrable trop volumineux (limite : 2 Mo).');
  return actual;
}

export async function createReviewStore(folder, { refreshViews = async () => ({ status: 'not_configured' }), demo = false } = {}) {
  const root = await realpath(folder);
  const statePath = join(root, 'suivi-chantier.json');
  const lockPath = join(root, '.projet-review.lock');
  let queue = Promise.resolve();

  async function snapshot() {
    if ((await realpath(statePath)) !== statePath) reject(403, 'Le suivi JSON doit être un fichier direct du dossier.');
    const bytes = await readFile(statePath);
    if (bytes.length > limit) reject(422, 'Suivi trop volumineux.');
    const data = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
    if (!Array.isArray(data.phases) || !Array.isArray(data.decisions) || !Array.isArray(data.history)) reject(422, 'Structure du suivi incompatible.');
    const ids = data.phases.map(p => p.id);
    if (new Set(ids).size !== ids.length || ids.some(id => !Number.isInteger(id)) || !ids.includes(data.currentPhase)) reject(422, 'Identifiants de phases invalides.');
    const documents = [];
    const issues = [];
    for (const phase of data.phases) {
      for (const artifact of phase.deliverables) {
        let paths = [artifact.path];
        try {
          if (artifact.kind === 'directory') {
            const directory = await realpath(resolve(root, artifact.path));
            if (!inside(root, directory)) reject(403, 'Dossier de livrables hors périmètre.');
            paths = (await readdir(directory, { withFileTypes: true }))
              .filter(f => f.isFile() && f.name.endsWith('.md')).map(f => `${artifact.path.replace(/\/$/, '')}/${f.name}`).sort();
            if (!paths.length) reject(422, 'Dossier sans livrable Markdown.');
            if (paths.length > 100) reject(422, 'Trop de livrables dans le dossier.');
          }
          for (const path of paths) {
            const content = await readFile(await safeFile(root, path));
            documents.push({ phaseId: phase.id, path, sha256: hash(content), size: content.length, artifact: artifact.path });
          }
        } catch (error) {
          issues.push({ phaseId: phase.id, path: artifact.path, message: error.code === 'ENOENT' ? 'Livrable non disponible' : error.message });
        }
      }
    }
    const revision = hash(Buffer.concat([bytes, Buffer.from(JSON.stringify({ documents, issues }))]));
    const result = { data, documents, issues, revision, source: statePath, demo };
    result.actions = Object.fromEntries(data.phases.map(p => [p.id, availableActions(result, p)]));
    return result;
  }

  function proofCurrent(view, phase, visited = new Set()) {
    if (!phase) return false;
    if (visited.has(phase.id)) return false;
    const chain = new Set(visited).add(phase.id);
    if (!(phase.dependsOn || []).every(id => proofCurrent(view, view.data.phases.find(p => p.id === id), chain))) return false;
    const evidence = phase.validationEvidence;
    if (phase.status !== 'validated' || !evidence) return false;
    const decision = view.data.decisions.find(d => d.id === evidence.decisionId && d.status === 'approved');
    if (!decision) return false;
    // Historical conversation approvals remain historical; do not invent hashes.
    const reviewed = decision.evidence?.reviewedArtifacts;
    if (!reviewed) return true;
    const actual = view.documents.filter(d => d.phaseId === phase.id);
    return !view.issues.some(i => i.phaseId === phase.id) && reviewed.length === actual.length && reviewed.every(a => actual.some(b => a.path === b.path && a.sha256 === b.sha256));
  }

  function availableActions(view, phase) {
    const next = view.data.phases.find(p => p.id === phase.id + 1);
    const depsValid = (phase.dependsOn || []).every(id => {
      const dep = view.data.phases.find(p => p.id === id);
      return dep && proofCurrent(view, dep);
    });
    const complete = !view.issues.some(i => i.phaseId === phase.id) && view.documents.some(d => d.phaseId === phase.id);
    const downstreamStarted = view.data.phases.some(p => p.id > phase.id && p.startedOn);
    const authorization = view.data.decisions.find(d => d.id === phase.startEvidence?.decisionId && d.status === 'approved');
    const actions = ['comment'];
    if (phase.status === 'awaiting_review' && complete && depsValid) actions.push('approve');
    if (['awaiting_review', 'validated'].includes(phase.status) && !downstreamStarted) actions.push('request_changes');
    if (['in_progress', 'blocked'].includes(phase.status) && phase.startedOn && complete && depsValid) actions.push('submit');
    if (phase.status === 'not_started' && authorization && depsValid) actions.push('start');
    if (proofCurrent(view, phase) && next?.status === 'not_started' && !next.startEvidence && (next.dependsOn || []).every(id => proofCurrent(view, view.data.phases.find(p => p.id === id)))) actions.push('authorize_next');
    return actions;
  }

  async function document(filename) {
    const view = await snapshot();
    const entry = view.documents.find(d => d.path === filename);
    if (!entry) reject(404, 'Ce document ne fait pas partie des livrables consultables.');
    const content = await readFile(await safeFile(root, filename));
    if (hash(content) !== entry.sha256) reject(409, 'Le document a changé. Actualisez la revue.');
    return { ...entry, content: content.toString('utf8').replace(/^\uFEFF/, '') };
  }

  async function mutate(input) {
    let lock;
    try { lock = await open(lockPath, 'wx'); }
    catch (error) { if (error.code === 'EEXIST') reject(409, 'Une écriture est en cours ou un verrou subsiste. Réessayez ; consultez la procédure de reprise si nécessaire.'); throw error; }
    try {
      await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
      const view = await snapshot();
      if (input.revision !== view.revision) reject(409, 'Le suivi ou un livrable a changé depuis votre lecture. Actualisez puis vérifiez la nouvelle version. Votre commentaire reste affiché.');
      const phase = view.data.phases.find(p => p.id === input.phaseId);
      if (!phase || !view.actions[phase.id].includes(input.action)) reject(409, 'Cette action est indisponible dans l’état actuel de la phase.');
      const reviewer = typeof input.reviewer === 'string' ? input.reviewer.trim() : '';
      const comment = typeof input.comment === 'string' ? input.comment.trim() : '';
      if (!reviewer || reviewer.length > 100 || comment.length < 5 || comment.length > 8000) reject(422, 'Renseignez le décideur (100 caractères maximum) et un commentaire de 5 à 8 000 caractères.');
      if (input.confirm !== true) reject(422, 'Confirmez explicitement votre décision.');
      const reviewedArtifacts = view.documents.filter(d => d.phaseId === phase.id).map(({ path, sha256 }) => ({ path, sha256 }));
      if (input.action === 'approve') {
        const checks = input.checkedCriteria;
        if (!Array.isArray(checks) || checks.length !== phase.exitCriteria.length || !phase.exitCriteria.every((_, index) => checks.includes(index)) || new Set(checks).size !== checks.length) reject(422, 'Tous les critères de sortie doivent être vérifiés explicitement.');
        if (JSON.stringify(input.reviewedArtifacts) !== JSON.stringify(reviewedArtifacts)) reject(422, 'Confirmez la lecture de chaque livrable dans sa version courante.');
      }
      const now = new Date().toISOString();
      const day = now.slice(0, 10);
      const event = { id: randomUUID(), action: input.action, phaseId: phase.id, reviewer, comment, recordedAt: now, reviewedArtifacts, previousRevision: view.revision };
      if (input.action === 'approve') event.checkedCriteria = phase.exitCriteria.slice();
      const evidence = { kind: 'local_review', reviewId: event.id, reviewer, comment, recordedAt: now, reviewedArtifacts };
      const data = view.data;
      const next = data.phases.find(p => p.id === phase.id + 1);
      const newDecision = (type, title, target) => {
        let decision = data.decisions.find(d => d.type === type && d.phaseId === target);
        if (!decision) decision = data.decisions.find(d => d.title === title);
        if (!decision) {
          const n = Math.max(0, ...data.decisions.map(d => Number(d.id.replace(/^D/, '')) || 0)) + 1;
          decision = { id: `D${String(n).padStart(2, '0')}`, title };
          data.decisions.push(decision);
        }
        Object.assign(decision, { type, phaseId: target, status: 'approved', owner: reviewer, blocksPhase: phase.id + 1, recordedOn: day, evidence, nextAction: 'Décision humaine enregistrée dans Projet local.' });
        return decision;
      };
      switch (input.action) {
        case 'approve': {
          const decision = newDecision('approval', `Valider le livrable de phase ${phase.id}`, phase.id);
          phase.status = 'validated'; phase.validatedOn = day; phase.validationEvidence = { decisionId: decision.id };
          phase.nextAction = next ? `Validation enregistrée ; l’autorisation de phase ${next.id} reste une décision distincte.` : 'Dernière phase validée.';
          data.state = next ? 'awaiting_start_authorization' : 'completed';
          break;
        }
        case 'authorize_next': {
          const decision = newDecision('authorization', `Autoriser le passage en phase ${next.id}`, next.id);
          next.startEvidence = { decisionId: decision.id }; next.authorizedOn = day;
          next.nextAction = 'Démarrage autorisé. Démarrer explicitement la phase avant de réaliser ses travaux.';
          phase.nextAction = `Phase ${next.id} autorisée, non démarrée.`;
          data.state = 'ready_to_start';
          break;
        }
        case 'request_changes': {
          phase.status = 'in_progress'; phase.validatedOn = null;
          const previous = data.decisions.find(d => d.id === phase.validationEvidence?.decisionId);
          if (previous) previous.status = 'superseded';
          phase.validationEvidence = null; phase.nextAction = `Corrections demandées : ${comment}`;
          if (next?.startEvidence) {
            const authorization = data.decisions.find(d => d.id === next.startEvidence.decisionId);
            if (authorization) authorization.status = 'superseded';
            delete next.startEvidence; delete next.authorizedOn;
            next.nextAction = 'Attendre une nouvelle validation et une nouvelle autorisation.';
          }
          data.state = 'changes_requested'; data.currentPhase = phase.id;
          break;
        }
        case 'start':
          phase.status = 'in_progress'; phase.startedOn = day; phase.nextAction = 'Préparer les livrables et les soumettre à la revue.';
          data.currentPhase = phase.id; data.state = 'in_progress';
          break;
        case 'submit':
          phase.status = 'awaiting_review'; phase.deliveredOn = day; phase.validatedOn = null; phase.validationEvidence = null;
          phase.deliverables.forEach(a => { a.availability = 'present'; });
          phase.nextAction = 'Livrables soumis à une nouvelle revue humaine.';
          data.state = 'awaiting_human_review';
          break;
      }
      data.reviewEvents ??= [];
      data.reviewEvents.push(event);
      data.history.push({ date: day, event: `Revue locale : ${input.action}, phase ${phase.id}, par ${reviewer}.`, reviewId: event.id });
      data.updated = day;
      const serialized = JSON.stringify(data, null, 2) + '\n';
      if (Buffer.byteLength(serialized) > limit) reject(422, 'Le suivi dépasserait 2 Mo. Prévoir un archivage explicite du journal avant de poursuivre.');
      // Store both the decision and its audit event in one atomic JSON replacement.
      // The backup is written before mutation and never replaces the canonical file.
      const backupRoot = join(root, '.review-backups');
      await mkdir(backupRoot, { recursive: true });
      if (!inside(root, await realpath(backupRoot))) reject(403, 'Dossier de sauvegarde hors périmètre.');
      const currentBytes = await readFile(statePath);
      await writeFile(join(backupRoot, `${now.replace(/[:.]/g, '-')}-${event.id}.json`), currentBytes, { flag: 'wx' });
      if ((await snapshot()).revision !== view.revision) reject(409, 'Une modification concurrente a été détectée. Actualisez avant de réessayer.');
      const temporary = join(root, `.suivi-${event.id}.tmp`);
      try {
        await writeFile(temporary, serialized, { flag: 'wx' });
        await rename(temporary, statePath);
      } finally { await unlink(temporary).catch(() => {}); }
      let derivedViews;
      try { derivedViews = await refreshViews(); }
      catch { derivedViews = { status: 'failed', message: 'Décision enregistrée ; actualisation des vues impossible. Relancez actualiser-tableau-de-bord.py.' }; }
      return { ...(await snapshot()), savedEvent: event, derivedViews };
    } finally { await lock.close(); await unlink(lockPath); }
  }

  return { snapshot, document, act(input) {
    const result = queue.then(() => mutate(input));
    queue = result.catch(() => {});
    return result;
  } };
}
