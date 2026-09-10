export const DEFAULT_CATEGORY = 'Expertise & visite technique';
export const DEFAULT_SUBCATEGORY = 'Constat general';
export const HABITOLOGIE_CATEGORY = 'Rapport Habitologue';
export const HABITOLOGIE_SUBCATEGORY = "Rapport d'habitologie";
export const LEGACY_RECEPTION_CATEGORY = 'Reception de travaux';

export const REPORT_CATEGORIES = Object.freeze({
  [DEFAULT_CATEGORY]: {
    description: 'Constat terrain, recherche de pathologies et synthese technique.',
    subcategories: [DEFAULT_SUBCATEGORY, 'Fissures', 'Humidite', 'Toiture'],
  },
  'Assistance avant-projet': {
    description: 'Aide a la decision, cadrage travaux et consultation.',
    subcategories: ['Avant-projet', "Consultation d'entreprise"],
  },
  [HABITOLOGIE_CATEGORY]: {
    description: 'Lecture globale du bien, risques, usages, priorites et aides mobilisables.',
    subcategories: [HABITOLOGIE_SUBCATEGORY],
  },
  'Diagnostic specifique': {
    description: 'Analyse ciblee sur un desordre ou une zone identifiee.',
    subcategories: ['Diagnostic fissures', 'Diagnostic humidite', 'Diagnostic toiture'],
  },
  [LEGACY_RECEPTION_CATEGORY]: {
    description: 'Ancien type conserve uniquement pour relire les dossiers existants.',
    subcategories: ['Reception de travaux', 'Levee de reserves'],
    selectable: false,
  },
});

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function isHabitologieReport(report) {
  return report?.categorie === HABITOLOGIE_CATEGORY;
}

export function getSelectableReportCategories() {
  return Object.entries(REPORT_CATEGORIES).filter(([, category]) => category.selectable !== false);
}

export function defaultReportTitle(category) {
  return category === HABITOLOGIE_CATEGORY
    ? "Rapport d'habitologie"
    : "Rapport d'expertise technique";
}

export function nextReportTitle(currentTitle, currentCategory, nextCategory) {
  const currentDefaultTitle = defaultReportTitle(currentCategory);
  return !currentTitle || currentTitle === currentDefaultTitle
    ? defaultReportTitle(nextCategory)
    : currentTitle;
}

export function recommendedProtocols(category, subcategory) {
  const label = `${category || ''} ${subcategory || ''}`.toLowerCase();
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

  const intermediateHabitologie = report.categorie === DEFAULT_CATEGORY
    && report.sous_categorie === HABITOLOGIE_SUBCATEGORY;
  const requestedCategory = legacyHabitologie || intermediateHabitologie
    ? HABITOLOGIE_CATEGORY
    : report.categorie;
  const categorie = Object.hasOwn(REPORT_CATEGORIES, requestedCategory)
    ? requestedCategory
    : DEFAULT_CATEGORY;
  const availableSubcategories = REPORT_CATEGORIES[categorie].subcategories;
  const requestedSubcategory = legacyHabitologie || intermediateHabitologie
    ? HABITOLOGIE_SUBCATEGORY
    : report.sous_categorie;
  const sousCategorie = availableSubcategories.includes(requestedSubcategory)
    ? requestedSubcategory
    : REPORT_CATEGORIES[categorie].subcategories[0];

  return {
    ...report,
    categorie,
    sous_categorie: sousCategorie,
    titre: report.titre || defaultReportTitle(categorie),
    proprietaire: report.proprietaire || legacyClient.nom || '',
    email: report.email || legacyClient.email || '',
    adresse_logement: report.adresse_logement || legacyProperty.adresse || '',
  };
}
