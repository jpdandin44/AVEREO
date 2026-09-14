export const DEFAULT_CATEGORY = 'Expertise & Visite technique';
export const DEFAULT_SUBCATEGORY = 'Evaluation Energétique';
export const HABITOLOGIE_CATEGORY = 'Visite Globale';
export const HABITOLOGIE_DEFAULT_HOUSING_TYPE = 'À préciser';
export const HABITOLOGIE_HOUSING_TYPES = Object.freeze([
  HABITOLOGIE_DEFAULT_HOUSING_TYPE,
  'Maison',
  'Appartement',
  'Immeuble collectif',
  'Autre habitation',
]);
export const HABITOLOGIE_ANALYSIS_STAGES = Object.freeze(['Eau', 'Air', 'Terre', 'Feu']);
export const LEGACY_DEFAULT_CATEGORY = 'Expertise & visite technique';
export const LEGACY_HABITOLOGIE_CATEGORY = 'Rapport Habitologue';
export const LEGACY_HABITOLOGIE_SUBCATEGORY = "Rapport d'habitologie";
export const LEGACY_RECEPTION_CATEGORY = 'Reception de travaux';

export const REPORT_CATEGORIES = Object.freeze({
  [DEFAULT_CATEGORY]: {
    description: 'Constat terrain, recherche de pathologies et synthese technique.',
    subcategories: [DEFAULT_SUBCATEGORY, 'Mesures', 'cartographie', 'pathologies'],
    legacySubcategories: ['Constat general', 'Fissures', 'Humidite', 'Toiture'],
  },
  [HABITOLOGIE_CATEGORY]: {
    description: 'Lecture globale et ordonnee du bien : Eau, Air, Terre puis Feu.',
    subcategories: HABITOLOGIE_HOUSING_TYPES,
    legacySubcategories: [LEGACY_HABITOLOGIE_SUBCATEGORY, ...HABITOLOGIE_ANALYSIS_STAGES],
  },
  'Assistance avant-projet': {
    description: 'Aide a la decision, cadrage travaux et consultation.',
    subcategories: ['Avant-projet', "Consultation d'entreprise"],
    selectable: false,
  },
  'Diagnostic specifique': {
    description: 'Analyse ciblee sur un desordre ou une zone identifiee.',
    subcategories: ['Diagnostic fissures', 'Diagnostic humidite', 'Diagnostic toiture'],
    selectable: false,
  },
  [LEGACY_RECEPTION_CATEGORY]: {
    description: 'Ancien type conserve uniquement pour relire les dossiers existants.',
    subcategories: ['Reception de travaux', 'Levee de reserves'],
    selectable: false,
  },
});

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function isHabitologieReport(report) {
  return report?.categorie === HABITOLOGIE_CATEGORY
    || report?.categorie === LEGACY_HABITOLOGIE_CATEGORY;
}

export function getSelectableReportCategories() {
  return Object.entries(REPORT_CATEGORIES).filter(([, category]) => category.selectable !== false);
}

export function getReportSubcategories(category, currentSubcategory = '') {
  const definition = REPORT_CATEGORIES[category];
  if (!definition) return [];

  const visibleSubcategories = [...definition.subcategories];
  if (
    category !== HABITOLOGIE_CATEGORY
    && currentSubcategory
    && definition.legacySubcategories?.includes(currentSubcategory)
    && !visibleSubcategories.includes(currentSubcategory)
  ) {
    visibleSubcategories.push(currentSubcategory);
  }
  return visibleSubcategories;
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

  const intermediateHabitologie = [DEFAULT_CATEGORY, LEGACY_DEFAULT_CATEGORY].includes(report.categorie)
    && report.sous_categorie === LEGACY_HABITOLOGIE_SUBCATEGORY;
  const previousHabitologie = report.categorie === LEGACY_HABITOLOGIE_CATEGORY;
  const requestedCategory = legacyHabitologie || intermediateHabitologie || previousHabitologie
    ? HABITOLOGIE_CATEGORY
    : report.categorie === LEGACY_DEFAULT_CATEGORY
      ? DEFAULT_CATEGORY
      : report.categorie;
  const categorie = Object.hasOwn(REPORT_CATEGORIES, requestedCategory)
    ? requestedCategory
    : DEFAULT_CATEGORY;
  const categoryDefinition = REPORT_CATEGORIES[categorie];
  const availableSubcategories = [
    ...categoryDefinition.subcategories,
    ...(categoryDefinition.legacySubcategories || []),
  ];
  const requestedSubcategory = report.sous_categorie;
  const sousCategorie = categorie === HABITOLOGIE_CATEGORY
    ? HABITOLOGIE_HOUSING_TYPES.includes(requestedSubcategory)
      ? requestedSubcategory
      : HABITOLOGIE_DEFAULT_HOUSING_TYPE
    : availableSubcategories.includes(requestedSubcategory)
      ? requestedSubcategory
      : categoryDefinition.subcategories[0];

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
