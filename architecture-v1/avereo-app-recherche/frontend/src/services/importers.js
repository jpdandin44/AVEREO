// Import de fichiers locaux : fiches Markdown Collector (format § 29 du prompt Collector),
// textes bruts et sauvegardes JSON de l'application.
import { normalizeResource } from './resource.js';
import { norm } from '../utils/text.js';

export const BACKUP_FORMAT = 'avereo-recherche';
export const BACKUP_VERSION = 1;

const META = {
  formation: /^\s*(?:\*\*)?formation(?:\*\*)?\s*:\s*(.+)$/im,
  module: /^\s*(?:\*\*)?module(?:\*\*)?\s*:\s*(.+)$/im,
  lesson: /^\s*(?:\*\*)?le[çc]on(?:\s*\/\s*vid[ée]o)?(?:\*\*)?\s*:\s*(.+)$/im,
  org: /^\s*(?:\*\*)?organisme(?:\*\*)?\s*:\s*(.+)$/im,
  url: /^\s*(?:\*\*)?url(?: source)?(?:\*\*)?\s*:\s*(\S+)/im,
  date: /^\s*(?:\*\*)?date de collecte(?:\*\*)?\s*:\s*(.+)$/im,
  domain: /^\s*(?:\*\*)?domaine(?:\*\*)?\s*:\s*(.+)$/im,
};

function section(md, name) {
  const re = new RegExp(`^##\\s+${name}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'im');
  const m = md.match(re);
  return m ? m[1].trim() : '';
}

function toISODate(s) {
  if (!s) return '';
  const fr = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`;
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  return iso ? iso[0] : '';
}

export function guessDomain(text) {
  const t = norm(text);
  if (/thermogra|infrarouge|emissivit|camera thermique/.test(t)) return 'Thermographie';
  if (/habitolog|humidite|moisissure|qualite de l.air|radon|ventilation/.test(t)) return 'Habitologie';
  if (/renovation|isolation|dpe|re2020|pompe a chaleur|audit energetique/.test(t)) return 'Rénovation énergétique';
  return 'Non classé';
}

const clean = v => (v ? v.trim().replace(/^\*\*|\*\*$/g, '').trim() : '');

export function parseCollectorMarkdown(md, filename = 'fiche.md') {
  const get = key => clean(md.match(META[key])?.[1]);
  const title = clean(md.match(/^#\s+(.+)$/m)?.[1]) || filename.replace(/\.[^.]+$/, '');
  const summary = section(md, 'Résumé') || section(md, 'Resume');
  const plain = md.replace(/^#.*$/gm, '').replace(/^\s*[-*]\s+/gm, '').replace(/\n{2,}/g, '\n').trim();
  const concepts = section(md, 'Concepts clés') || section(md, 'Concepts cles');
  const tags = concepts.split('\n').map(l => l.replace(/^\s*[-*]\s*/, '').replace(/[;.]$/, '').trim()).filter(l => l && l.length < 60).slice(0, 8);
  const formation = get('formation');
  const declaredDomain = get('domain');
  return normalizeResource({
    type: formation ? 'Fiche consolidée' : 'Note',
    domain: declaredDomain || guessDomain(`${title} ${md}`),
    origin: formation ? 'Formation' : undefined,
    title,
    text: (summary || plain).slice(0, 700),
    body: md,
    tags,
    src: { formation, module: get('module'), lesson: get('lesson'), org: get('org'), url: get('url'), loc: filename },
    date: toISODate(get('date')) || undefined,
  });
}

export function parsePlainText(txt, filename = 'note.txt') {
  const firstLine = txt.split('\n').find(l => l.trim()) || filename;
  return normalizeResource({
    type: 'Note',
    domain: guessDomain(txt),
    title: firstLine.trim().slice(0, 120),
    text: txt.trim().slice(0, 700),
    body: txt,
    src: { loc: filename },
  });
}

// Sauvegarde de l'application ou simple tableau de ressources.
export function parseJson(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return { resources: data.map(normalizeResource) };
  if (data && data.format === BACKUP_FORMAT && Array.isArray(data.resources)) {
    return { resources: data.resources.map(normalizeResource), log: data.log || null };
  }
  throw new Error("Ce fichier JSON n'est pas une sauvegarde AVEREO Collector Recherche.");
}

export async function importFiles(fileList) {
  const report = { resources: [], errors: [] };
  for (const file of Array.from(fileList)) {
    try {
      const text = await file.text();
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'md' || ext === 'markdown') report.resources.push(parseCollectorMarkdown(text, file.name));
      else if (ext === 'txt') report.resources.push(parsePlainText(text, file.name));
      else if (ext === 'json') report.resources.push(...parseJson(text).resources);
      else report.errors.push(`${file.name} : format non pris en charge (utilisez .md, .txt ou .json).`);
    } catch (e) {
      report.errors.push(`${file.name} : ${e.message}`);
    }
  }
  return report;
}

export function makeBackup(state) {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    resources: state.resources,
    log: state.log,
  }, null, 2);
}
