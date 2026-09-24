// Recherche plein texte côté navigateur (V0). En V1, remplacée par GET /search de la GED
// (PostgreSQL FTS + pgvector), avec le même contrat de résultat : { resource, score, terms }.
import MiniSearch from 'minisearch';
import { AUTHORITIES, CONFIDENCE, REGULATORY_TERMS } from '../config/referentiels.js';
import { norm, tokenize, isStopword } from '../utils/text.js';
import { provenanceChain } from './resource.js';

const FIELDS = ['title', 'tagsText', 'orgText', 'chainText', 'text', 'body'];

export function buildIndex(resources) {
  const ms = new MiniSearch({
    fields: FIELDS,
    idField: 'id',
    extractField: (doc, field) => {
      if (field === 'tagsText') return doc.tags.join(' ');
      if (field === 'orgText') return doc.src.org;
      if (field === 'chainText') return provenanceChain(doc).join(' ');
      return doc[field];
    },
    processTerm: term => {
      const t = norm(term);
      return t.length > 1 && !isStopword(t) ? t : null;
    },
    tokenize: s => String(s ?? '').split(/[^\p{L}\p{N}°]+/u),
  });
  ms.addAll(resources);
  return ms;
}

const OPTIONS = {
  boost: { title: 3, tagsText: 2.5, orgText: 1.5, chainText: 1.2, text: 1, body: 0.6 },
  prefix: term => term.length > 3,
  fuzzy: term => (term.length > 5 ? 0.15 : 0),
};

export function search(index, resources, query) {
  const byId = new Map(resources.map(r => [r.id, r]));
  const q = String(query || '').trim();
  if (!q) {
    return resources.map(r => ({ resource: r, score: 1, terms: [] }));
  }
  // Tous les mots d'abord ; si rien, au moins un des mots.
  let hits = index.search(q, { ...OPTIONS, combineWith: 'AND' });
  if (!hits.length) hits = index.search(q, { ...OPTIONS, combineWith: 'OR' });

  const regulatory = tokenize(q).some(t => REGULATORY_TERMS.includes(t));
  return hits
    .map(h => {
      const r = byId.get(h.id);
      if (!r) return null;
      let score = h.score;
      if (r.type === 'Connaissance') score *= 1.15;
      if (regulatory) score *= r.authority === 'Officielle' ? 1.6 : r.authority === 'Institutionnelle' ? 1.35 : 1;
      return { resource: r, score, terms: [...h.terms, ...tokenize(q)] };
    })
    .filter(Boolean);
}

const authorityRank = r => AUTHORITIES[r.authority]?.rank || 0;

export function sortResults(results, mode) {
  const list = [...results];
  if (mode === 'date') list.sort((a, b) => String(b.resource.date).localeCompare(String(a.resource.date)));
  else if (mode === 'conf') list.sort((a, b) => (CONFIDENCE[b.resource.conf]?.rank || 0) - (CONFIDENCE[a.resource.conf]?.rank || 0) || authorityRank(b.resource) - authorityRank(a.resource) || b.score - a.score);
  else list.sort((a, b) => b.score - a.score || authorityRank(b.resource) - authorityRank(a.resource));
  return list;
}
