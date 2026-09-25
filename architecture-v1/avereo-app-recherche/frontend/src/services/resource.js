// Modèle d'une ressource documentaire et valeurs par défaut.
import { TYPES, DOMAINS, ORIGINS, AUTHORITIES, RIGHTS, CLIENT, CONFIDENCE, registryFor } from '../config/referentiels.js';
import { todayISO, uid } from '../utils/text.js';

const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);

export function normalizeResource(raw = {}) {
  const src = raw.src || {};
  const reg = registryFor(src.org);
  const origin = pick(raw.origin, ORIGINS, reg?.origin || (src.formation ? 'Formation' : 'Web'));
  const defaultAuthority = reg?.authority || (origin === 'AVEREO' ? 'Interne' : 'Formation');
  const tags = Array.isArray(raw.tags) ? raw.tags : String(raw.tags || '').split(',');
  return {
    id: raw.id || uid(),
    type: pick(raw.type, TYPES, 'Note'),
    domain: pick(raw.domain, DOMAINS, 'Non classé'),
    origin,
    authority: pick(raw.authority, Object.keys(AUTHORITIES), defaultAuthority),
    title: String(raw.title || 'Sans titre').trim(),
    text: String(raw.text || '').trim(),
    body: raw.body ? String(raw.body) : '',
    tags: tags.map(t => String(t).trim()).filter(Boolean),
    src: {
      org: String(src.org || '').trim(),
      formation: String(src.formation || '').trim(),
      module: String(src.module || '').trim(),
      lesson: String(src.lesson || '').trim(),
      url: String(src.url || '').trim(),
      loc: String(src.loc || '').trim(),
    },
    date: raw.date || todayISO(),
    rights: pick(raw.rights, Object.keys(RIGHTS), reg?.rights || 'RIGHTS_UNKNOWN'),
    client: pick(raw.client, Object.keys(CLIENT), reg?.client || (origin === 'AVEREO' ? 'NOT_EVALUATED' : 'INTERNAL_ONLY')),
    conf: pick(raw.conf, Object.keys(CONFIDENCE), 'MEDIUM'),
    conflict: raw.conflict ? String(raw.conflict) : '',
    need: raw.need ? String(raw.need) : '',
    validation: raw.validation || null,
    demo: !!raw.demo,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export const provenanceChain = r => [r.src.formation, r.src.module, r.src.lesson].filter(x => x && x !== '—');

export const isApproved = r => r.client === 'APPROVED_FOR_CLIENT_USE';
