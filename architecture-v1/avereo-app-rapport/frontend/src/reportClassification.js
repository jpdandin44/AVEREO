export const DEFAULT_CATEGORY = 'Expertise & visite technique';
export const DEFAULT_SUBCATEGORY = 'Constat general';
export const HABITOLOGIE_SUBCATEGORY = "Rapport d'habitologie";

export const REPORT_CATEGORIES = Object.freeze({
  [DEFAULT_CATEGORY]: {
    description: 'Constat terrain, recherche de pathologies et synthese technique.',
    subcategories: [DEFAULT_SUBCATEGORY, 'Fissures', 'Humidite', 'Toiture', HABITOLOGIE_SUBCATEGORY],
  },
  'Assistance avant-projet': {
    description: 'Aide a la decision, cadrage travaux et consultation.',
    subcategories: ['Avant-projet', "Consultation d'entreprise"],
  },
  'Reception de travaux': {
    description: 'Releve des reserves, conformite apparente et recommandations.',
    subcategories: ['Reception de travaux', 'Levee de reserves'],
  },
  'Diagnostic specifique': {
    description: 'Analyse ciblee sur un desordre ou une zone identifiee.',
    subcategories: ['Diagnostic fissures', 'Diagnostic humidite', 'Diagnostic toiture'],
  },
});

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function isHabitologieReport(report) {
  return report?.sous_categorie === HABITOLOGIE_SUBCATEGORY;
}

export function defaultReportTitle(subcategory) {
  return subcategory === HABITOLOGIE_SUBCATEGORY
    ? "Rapport d'habitologie"
    : "Rapport d'expertise technique";
}

export function nextReportTitle(currentTitle, currentSubcategory, nextSubcategory) {
  const currentDefaultTitle = defaultReportTitle(currentSubcategory);
  return !currentTitle || currentTitle === currentDefaultTitle
    ? defaultReportTitle(nextSubcategory)
    : currentTitle;
}

export function recommendedProtocols(subcategory) {
  const label = (subcategory || '').toLowerCase();
  return {
    standard: true,
    fissures: label.includes('fissure'),
    humidite: label.includes('humid'),
    toiture: label.includes('toiture'),
    reception: label.includes('reception') || label.includes('reserve'),
  };
}

export function normalizeReportClassification(incoming = {}) {
  const source = isRecord(incoming) ? incoming : {};
  const legacyHabitologie = source.report_type === 'habitologie';
  const legacySections = isRecord(source.habitologie) ? source.habitologie : {};
  const legacyClient = isRecord(legacySections.client) ? legacySections.client : {};
  const legacyProperty = isRecord(legacySections.bien) ? legacySections.bien : {};
  const { report_type: _reportType, schema_version: _schemaVersion, habitologie: _habitologie, ...report } = source;

  const requestedCategory = legacyHabitologie ? DEFAULT_CATEGORY : report.categorie;
  const categorie = Object.hasOwn(REPORT_CATEGORIES, requestedCategory)
    ? requestedCategory
    : DEFAULT_CATEGORY;
  const availableSubcategories = REPORT_CATEGORIES[categorie].subcategories;
  const requestedSubcategory = legacyHabitologie ? HABITOLOGIE_SUBCATEGORY : report.sous_categorie;
  const sousCategorie = availableSubcategories.includes(requestedSubcategory)
    ? requestedSubcategory
    : REPORT_CATEGORIES[categorie].subcategories[0];

  return {
    ...report,
    categorie,
    sous_categorie: sousCategorie,
    titre: report.titre || defaultReportTitle(sousCategorie),
    proprietaire: report.proprietaire || legacyClient.nom || '',
    email: report.email || legacyClient.email || '',
    adresse_logement: report.adresse_logement || legacyProperty.adresse || '',
  };
}
