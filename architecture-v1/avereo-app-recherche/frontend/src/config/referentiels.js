// Référentiels métier — alignés sur 03_Prompt_AVEREO_Collector_Optimise.md (§20, §21, §25)
// et 04_Proposition_Collector_Recherche-v1.md (§5, §6, §7).

export const OWNER = { id: 'owner', label: 'Fondateur AVEREO', role: 'OWNER' };

export const TYPES = ['Connaissance', 'Fiche consolidée', 'Transcript', 'PDF', 'Page web', 'Lien', 'Visuel', 'Note', 'Production AVEREO'];

export const DOMAINS = ['Habitologie', 'Rénovation énergétique', 'Thermographie', 'Non classé'];

export const ORIGINS = ['Formation', 'Institutionnel', 'AVEREO', 'Web'];

// rang : sert au classement (plus haut = plus d'autorité)
export const AUTHORITIES = {
  Officielle: { label: 'Texte officiel', rank: 4, badge: true },
  Institutionnelle: { label: 'Source institutionnelle', rank: 3, badge: true },
  Formation: { label: 'Formation', rank: 2, badge: false },
  Interne: { label: 'Interne AVEREO', rank: 1, badge: false },
};

export const RIGHTS = {
  AVEREO_OWNED: { label: 'AVEREO', tone: 'ok' },
  LICENSED_COMMERCIAL: { label: 'Licence commerciale', tone: 'ok' },
  LICENSED_WITH_ATTRIBUTION: { label: 'Licence + attribution', tone: 'info' },
  PUBLIC_DOMAIN: { label: 'Domaine public / texte officiel', tone: 'ok' },
  PERMISSION_GRANTED: { label: 'Autorisation obtenue', tone: 'ok' },
  INTERNAL_REFERENCE_ONLY: { label: 'Référence interne', tone: 'warn' },
  RIGHTS_UNKNOWN: { label: 'Droits inconnus', tone: 'warn' },
  REUSE_PROHIBITED: { label: 'Réemploi interdit', tone: 'bad' },
};

export const CLIENT = {
  NOT_EVALUATED: { label: 'Non évalué', tone: 'neutral' },
  INTERNAL_ONLY: { label: 'Interne uniquement', tone: 'bad' },
  ELIGIBLE_FOR_REVIEW: { label: 'À valider pour client', tone: 'info' },
  APPROVED_FOR_CLIENT_USE: { label: '✓ Utilisable client', tone: 'ok' },
  REJECTED_FOR_CLIENT_USE: { label: 'Refusé pour client', tone: 'bad' },
};

export const CONFIDENCE = {
  HIGH: { label: 'Fiabilité haute', rank: 3 },
  MEDIUM: { label: 'Fiabilité moyenne', rank: 2 },
  LOW: { label: 'Fiabilité faible', rank: 1 },
};

// Mots qui signalent une question de seuil ou de réglementation :
// les sources officielles puis institutionnelles passent alors devant.
export const REGULATORY_TERMS = ['seuil', 'reglement', 'reglementation', 'reglementaire', 'dpe', 'arrete', 'decret', 'norme', 're2020', 'obligation', 'loi', 'opposable', 'dtu'];

// Registre des sources de référence (SOURCE_REGISTRY) — règles de réemploi par défaut.
// Les droits réels se vérifient document par document.
export const SOURCE_REGISTRY = [
  { id: 'legifrance', org: 'Légifrance', site: 'https://www.legifrance.gouv.fr', publications: 'Lois, décrets, arrêtés (DPE, RE2020…)', origin: 'Institutionnel', authority: 'Officielle', rights: 'PUBLIC_DOMAIN', client: 'ELIGIBLE_FOR_REVIEW', rule: 'Textes officiels réutilisables, source à citer' },
  { id: 'aqc', org: 'AQC', site: 'https://www.qualiteconstruction.com', publications: "Fiches pathologie, retours d'expérience, recommandations professionnelles", origin: 'Institutionnel', authority: 'Institutionnelle', rights: 'RIGHTS_UNKNOWN', client: 'INTERNAL_ONLY', rule: 'Droits à vérifier par document' },
  { id: 'ademe', org: 'ADEME', site: 'https://www.ademe.fr', publications: 'Guides pratiques, études, chiffres clés', origin: 'Institutionnel', authority: 'Institutionnelle', rights: 'RIGHTS_UNKNOWN', client: 'INTERNAL_ONLY', rule: 'Droits à vérifier par document' },
  { id: 'france-renov', org: "France Rénov'", site: 'https://france-renov.gouv.fr', publications: 'Guides et fiches pour les particuliers', origin: 'Institutionnel', authority: 'Institutionnelle', rights: 'RIGHTS_UNKNOWN', client: 'INTERNAL_ONLY', rule: 'Droits à vérifier par document' },
  { id: 'cstb', org: 'CSTB', site: 'https://www.cstb.fr', publications: 'Guides et études techniques', origin: 'Institutionnel', authority: 'Institutionnelle', rights: 'RIGHTS_UNKNOWN', client: 'INTERNAL_ONLY', rule: 'Droits à vérifier par document' },
  { id: 'cerema', org: 'Cerema', site: 'https://www.cerema.fr', publications: 'Guides et études techniques', origin: 'Institutionnel', authority: 'Institutionnelle', rights: 'RIGHTS_UNKNOWN', client: 'INTERNAL_ONLY', rule: 'Droits à vérifier par document' },
  { id: 'afnor', org: 'AFNOR', site: 'https://www.boutique.afnor.org', publications: "Normes NF, DTU (règles de l'art)", origin: 'Institutionnel', authority: 'Officielle', rights: 'REUSE_PROHIBITED', client: 'REJECTED_FOR_CLIENT_USE', rule: "Accès payant, reproduction interdite : référencer la norme, ne pas stocker d'extraits" },
  { id: 'avereo', org: 'AVEREO', site: '', publications: 'Productions AVEREO (fiches méthode, modèles)', origin: 'AVEREO', authority: 'Interne', rights: 'AVEREO_OWNED', client: 'ELIGIBLE_FOR_REVIEW', rule: 'Contenu AVEREO, à valider avant usage client' },
];

export const CITATION_FORMATS = [
  { id: 'short', label: 'Référence courte', group: 'Usage interne' },
  { id: 'md', label: 'Markdown (extrait + source)', group: 'Usage interne' },
  { id: 'internal', label: 'Note interne (identifiants et droits)', group: 'Usage interne' },
  { id: 'client-simple', label: 'Client · simple', group: 'Rapport client' },
  { id: 'client-classe', label: 'Client · classe', group: 'Rapport client' },
  { id: 'client-pedagogique', label: 'Client · pédagogique', group: 'Rapport client' },
];

export const AUTHORITY_EXPLANATION = {
  Officielle: "texte officiel ou normatif de référence",
  Institutionnelle: 'organisme de référence du secteur du bâtiment',
  Formation: 'support de formation spécialisée suivie par AVEREO',
  Interne: 'méthode élaborée par AVEREO',
};

export function registryFor(org) {
  if (!org) return null;
  const n = org.trim().toLowerCase();
  return SOURCE_REGISTRY.find(r => r.org.toLowerCase() === n || n.startsWith(r.org.toLowerCase() + ' ')) || null;
}
