import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CATEGORY,
  DEFAULT_SUBCATEGORY,
  HABITOLOGIE_ANALYSIS_STAGES,
  HABITOLOGIE_CATEGORY,
  HABITOLOGIE_DEFAULT_HOUSING_TYPE,
  HABITOLOGIE_HOUSING_TYPES,
  LEGACY_DEFAULT_CATEGORY,
  LEGACY_HABITOLOGIE_CATEGORY,
  LEGACY_HABITOLOGIE_SUBCATEGORY,
  LEGACY_RECEPTION_CATEGORY,
  REPORT_CATEGORIES,
  defaultReportTitle,
  getReportSubcategories,
  getSelectableReportCategories,
  isHabitologieReport,
  nextReportTitle,
  normalizeReportClassification,
  recommendedProtocols,
} from './reportClassification.js';

test('seules les deux categories prioritaires sont visibles pour une nouvelle creation', () => {
  const selectable = getSelectableReportCategories();

  assert.deepEqual(selectable.map(([name]) => name), [DEFAULT_CATEGORY, HABITOLOGIE_CATEGORY]);
  assert.equal(REPORT_CATEGORIES['Assistance avant-projet'].selectable, false);
  assert.equal(REPORT_CATEGORIES['Diagnostic specifique'].selectable, false);
  assert.equal(REPORT_CATEGORIES[LEGACY_RECEPTION_CATEGORY].selectable, false);
});

test('les categories visibles proposent les classifications retenues', () => {
  assert.deepEqual(REPORT_CATEGORIES[DEFAULT_CATEGORY].subcategories, [
    'Evaluation Energétique',
    'Mesures',
    'cartographie',
    'pathologies',
  ]);
  assert.deepEqual(REPORT_CATEGORIES[HABITOLOGIE_CATEGORY].subcategories, HABITOLOGIE_HOUSING_TYPES);
  assert.deepEqual(HABITOLOGIE_ANALYSIS_STAGES, ['Eau', 'Air', 'Terre', 'Feu']);
});

test("la categorie principale determine le futur workflow d'habitologie", () => {
  assert.equal(isHabitologieReport({ categorie: HABITOLOGIE_CATEGORY }), true);
  assert.equal(isHabitologieReport({ categorie: LEGACY_HABITOLOGIE_CATEGORY }), true);
  assert.equal(isHabitologieReport({ categorie: DEFAULT_CATEGORY, sous_categorie: LEGACY_HABITOLOGIE_SUBCATEGORY }), false);
  assert.equal(isHabitologieReport({ report_type: 'habitologie' }), false);
});

test('un ancien brouillon technique conserve sa classification', () => {
  const result = normalizeReportClassification({
    categorie: LEGACY_DEFAULT_CATEGORY,
    sous_categorie: 'Fissures',
    titre: 'Visite fissures',
  });

  assert.equal(result.categorie, DEFAULT_CATEGORY);
  assert.equal(result.sous_categorie, 'Fissures');
  assert.equal(result.titre, 'Visite fissures');
});

test("un brouillon du prototype separe est migre sans inventer un type d'habitation", () => {
  const result = normalizeReportClassification({
    report_type: 'habitologie',
    schema_version: 1,
    titre: "Rapport d'habitologie",
    habitologie: {
      client: { nom: 'Famille Exemple', email: 'famille@example.test' },
      bien: { adresse: '1 rue Exemple' },
    },
  });

  assert.equal(result.categorie, HABITOLOGIE_CATEGORY);
  assert.equal(result.sous_categorie, HABITOLOGIE_DEFAULT_HOUSING_TYPE);
  assert.equal(result.proprietaire, 'Famille Exemple');
  assert.equal(result.email, 'famille@example.test');
  assert.equal(result.adresse_logement, '1 rue Exemple');
  assert.equal(Object.hasOwn(result, 'report_type'), false);
  assert.equal(Object.hasOwn(result, 'habitologie'), false);
});

test("un brouillon de l'etape intermediaire est migre vers Visite Globale", () => {
  const result = normalizeReportClassification({
    categorie: LEGACY_DEFAULT_CATEGORY,
    sous_categorie: LEGACY_HABITOLOGIE_SUBCATEGORY,
    titre: "Rapport d'habitologie",
  });

  assert.equal(result.categorie, HABITOLOGIE_CATEGORY);
  assert.equal(result.sous_categorie, HABITOLOGIE_DEFAULT_HOUSING_TYPE);
});

test("un brouillon Rapport Habitologue est migre vers Visite Globale", () => {
  const result = normalizeReportClassification({
    categorie: LEGACY_HABITOLOGIE_CATEGORY,
    sous_categorie: LEGACY_HABITOLOGIE_SUBCATEGORY,
  });

  assert.equal(result.categorie, HABITOLOGIE_CATEGORY);
  assert.equal(result.sous_categorie, HABITOLOGIE_DEFAULT_HOUSING_TYPE);
  assert.deepEqual(getReportSubcategories(result.categorie, result.sous_categorie), HABITOLOGIE_HOUSING_TYPES);
});

test("une ancienne selection d'element devient un type d'habitation a preciser", () => {
  const result = normalizeReportClassification({
    categorie: HABITOLOGIE_CATEGORY,
    sous_categorie: 'Feu',
  });

  assert.equal(result.sous_categorie, HABITOLOGIE_DEFAULT_HOUSING_TYPE);
});

test('un ancien dossier Reception de travaux conserve sa classification', () => {
  const result = normalizeReportClassification({
    categorie: LEGACY_RECEPTION_CATEGORY,
    sous_categorie: 'Levee de reserves',
    titre: 'Levee de reserves existante',
  });

  assert.equal(result.categorie, LEGACY_RECEPTION_CATEGORY);
  assert.equal(result.sous_categorie, 'Levee de reserves');
  assert.equal(result.titre, 'Levee de reserves existante');
});

test('la normalisation remplace une classification inconnue par les valeurs par defaut', () => {
  const result = normalizeReportClassification({ categorie: 'Inconnue', sous_categorie: 'Inconnue' });

  assert.equal(result.categorie, DEFAULT_CATEGORY);
  assert.equal(result.sous_categorie, DEFAULT_SUBCATEGORY);
});

test("le titre et les protocoles par defaut d'habitologie reutilisent le rapport technique", () => {
  assert.equal(defaultReportTitle(HABITOLOGIE_CATEGORY), "Rapport d'habitologie");
  assert.deepEqual(recommendedProtocols(HABITOLOGIE_CATEGORY, HABITOLOGIE_DEFAULT_HOUSING_TYPE), {
    standard: true,
    fissures: false,
    humidite: false,
    toiture: false,
    reception: false,
  });
});

test('le changement de sous-categorie adapte uniquement un titre encore par defaut', () => {
  assert.equal(
    nextReportTitle("Rapport d'expertise technique", DEFAULT_CATEGORY, HABITOLOGIE_CATEGORY),
    "Rapport d'habitologie",
  );
  assert.equal(
    nextReportTitle("Rapport d'habitologie", HABITOLOGIE_CATEGORY, DEFAULT_CATEGORY),
    "Rapport d'expertise technique",
  );
  assert.equal(
    nextReportTitle('Titre personnalise', DEFAULT_CATEGORY, HABITOLOGIE_CATEGORY),
    'Titre personnalise',
  );
});
