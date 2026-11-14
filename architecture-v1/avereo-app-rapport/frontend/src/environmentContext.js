import { planPayloadError } from './observationPlans.js';

// This context is deliberately outside observations: it never consumes a number.
export function environmentContext(report) {
  const value = report?.contexte_exterieur;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

export const contextText = (value, field) => typeof value?.[field] === 'string' ? value[field] : '';

export function newEnvironmentContext(id) {
  return { id, titre: '', zone: '', constat: '', explications: '', conseils: '', planId: '', photo: null, includeInClient: false };
}

export function changeEnvironmentContext(report, id, patch) {
  const current = environmentContext(report);
  if (!current || current.id !== id) return report;
  return { ...report, contexte_exterieur: { ...current, ...(typeof patch === 'function' ? patch(current) : patch), id: current.id } };
}

export function removeEnvironmentContext(report, id) {
  if (environmentContext(report)?.id !== id) return report;
  const next = { ...report }; delete next.contexte_exterieur; return next;
}

export function environmentContextError(report) {
  if (report?.contexte_exterieur == null) return null;
  const value = environmentContext(report);
  if (!value || typeof value.id !== 'string' || !value.id || value.id.length > 190) return 'Le contexte extérieur doit avoir un identifiant valide.';
  for (const field of ['titre', 'zone', 'constat', 'explications', 'conseils', 'planId']) {
    if (value[field] != null && typeof value[field] !== 'string') return 'Les champs du contexte extérieur doivent contenir du texte.';
  }
  if (value.includeInClient != null && typeof value.includeInClient !== 'boolean') return 'Le choix de restitution du contexte extérieur est invalide.';
  if (value.photo != null) {
    const photo = value.photo;
    if (!photo || typeof photo !== 'object' || Array.isArray(photo)
      || (photo.caption != null && typeof photo.caption !== 'string')) return 'La photo du contexte extérieur est invalide.';
    const error = planPayloadError({ plans: [{ ...photo, title: photo.name || 'Photo du contexte', kind: 'niveau', source: photo.source || '' }] });
    if (error) return 'Photo du contexte extérieur : ' + error;
  }
  return null;
}
