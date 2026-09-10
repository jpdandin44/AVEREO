import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CATEGORY,
  DEFAULT_SUBCATEGORY,
  HABITOLOGIE_SUBCATEGORY,
  REPORT_CATEGORIES,
  defaultReportTitle,
  isHabitologieReport,
  nextReportTitle,
  normalizeReportClassification,
  recommendedProtocols,
} from './reportClassification.js';

test("le rapport d'habitologie est une sous-categorie du rapport existant", () => {
  assert.ok(REPORT_CATEGORIES[DEFAULT_CATEGORY].subcategories.includes(HABITOLOGIE_SUBCATEGORY));
  assert.equal(Object.hasOwn(REPORT_CATEGORIES, HABITOLOGIE_SUBCATEGORY), false);
});

test("la sous-categorie determine l'adaptation habitologie sans changer de moteur", () => {
  assert.equal(isHabitologieReport({ sous_categorie: HABITOLOGIE_SUBCATEGORY }), true);
  assert.equal(isHabitologieReport({ sous_categorie: DEFAULT_SUBCATEGORY }), false);
  assert.equal(isHabitologieReport({ report_type: 'habitologie' }), false);
});

test('un ancien brouillon technique conserve sa classification', () => {
  const result = normalizeReportClassification({
    categorie: DEFAULT_CATEGORY,
    sous_categorie: 'Fissures',
    titre: 'Visite fissures',
  });

  assert.equal(result.categorie, DEFAULT_CATEGORY);
  assert.equal(result.sous_categorie, 'Fissures');
  assert.equal(result.titre, 'Visite fissures');
});

test("un brouillon du prototype separe est migre vers la sous-categorie habitologie", () => {
  const result = normalizeReportClassification({
    report_type: 'habitologie',
    schema_version: 1,
    titre: "Rapport d'habitologie",
    habitologie: {
      client: { nom: 'Famille Exemple', email: 'famille@example.test' },
      bien: { adresse: '1 rue Exemple' },
    },
  });

  assert.equal(result.categorie, DEFAULT_CATEGORY);
  assert.equal(result.sous_categorie, HABITOLOGIE_SUBCATEGORY);
  assert.equal(result.proprietaire, 'Famille Exemple');
  assert.equal(result.email, 'famille@example.test');
  assert.equal(result.adresse_logement, '1 rue Exemple');
  assert.equal(Object.hasOwn(result, 'report_type'), false);
  assert.equal(Object.hasOwn(result, 'habitologie'), false);
});

test('la normalisation remplace une classification inconnue par les valeurs par defaut', () => {
  const result = normalizeReportClassification({ categorie: 'Inconnue', sous_categorie: 'Inconnue' });

  assert.equal(result.categorie, DEFAULT_CATEGORY);
  assert.equal(result.sous_categorie, DEFAULT_SUBCATEGORY);
});

test("le titre et les protocoles par defaut d'habitologie reutilisent le rapport technique", () => {
  assert.equal(defaultReportTitle(HABITOLOGIE_SUBCATEGORY), "Rapport d'habitologie");
  assert.deepEqual(recommendedProtocols(HABITOLOGIE_SUBCATEGORY), {
    standard: true,
    fissures: false,
    humidite: false,
    toiture: false,
    reception: false,
  });
});

test('le changement de sous-categorie adapte uniquement un titre encore par defaut', () => {
  assert.equal(
    nextReportTitle("Rapport d'expertise technique", DEFAULT_SUBCATEGORY, HABITOLOGIE_SUBCATEGORY),
    "Rapport d'habitologie",
  );
  assert.equal(
    nextReportTitle("Rapport d'habitologie", HABITOLOGIE_SUBCATEGORY, 'Fissures'),
    "Rapport d'expertise technique",
  );
  assert.equal(
    nextReportTitle('Titre personnalise', DEFAULT_SUBCATEGORY, HABITOLOGIE_SUBCATEGORY),
    'Titre personnalise',
  );
});
