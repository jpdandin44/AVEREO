import { normalizeDecision } from './decisionSupport.js';

export const EXPECTATION_LISTENING_FIELDS = [
  ['attentes_client', 'Attentes et priorités du client'],
  ['besoin_reformule', 'Besoin reformulé avec le client'],
];

export function listeningExpectationSources(decision, listening) {
  const d = normalizeDecision(decision);
  return EXPECTATION_LISTENING_FIELDS.map(([field, label]) => {
    const text = typeof listening?.[field] === 'string' ? listening[field] : '';
    const imported = d.attentes.find(a => a.provenance_ecoute?.champ === field);
    return { field, label, text, imported,
      changed: Boolean(imported && imported.provenance_ecoute.texte_original !== text) };
  });
}

// One explicit copy per interview field. Editing either text never changes its stable references.
export function copyListeningExpectation(decision, listening, field, id) {
  const d = normalizeDecision(decision);
  const candidate = listeningExpectationSources(d, listening).find(s => s.field === field);
  if (d.schema_version !== 1 || !candidate || !candidate.text.trim() || candidate.imported
    || d.attentes.length >= 100 || typeof id !== 'string' || !id || d.attentes.some(a => a.id === id)) return decision;
  // An existing manually entered verbatim is kept as-is, without silently reclassifying its provenance.
  if (d.attentes.some(a => a.libelle.trim() === candidate.text.trim())) return decision;
  return { ...d, attentes: [...d.attentes, { id, libelle: candidate.text, priorite: '',
    source: `Dossier / Écoute client — ${candidate.label}. À relire avec les habitants.`,
    provenance_ecoute: { champ: field, texte_original: candidate.text } }] };
}
