import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportHtml, deliveryOptions, optionsWithCurrent } from './reportDelivery.js';
import { normalizeDecision } from './decisionSupport.js';

const dossier = () => ({titre:'Exemple <script>', reference_dossier:'TEST-1', proprietaire:'Client', adresse_logement:'Adresse test',
  intervenant:'Test', categorie:'Expertise & Visite technique', sous_categorie:'Humidite', date_visite:'',
  meteo:{}, cadastre:{}, urbanisme:{}, risques:{}, terrain:{}, localisation:{}, ressources_batiment:{},
  protocoles:{standard:true}, analyse_expert:'Analyse intégrale', recommandations:'Action intégrale',reserves:'Réserve conservée',
  signature:'Non signé',nom_signataire:'Test',observations:[{id:'1',titre:'Constat retenu',observations:'Trace relevée',actions:'Examiner',piece:'Cave Est',surface:'Mur ancien',gravite:'Non qualifiée',photos:[]},
    {id:'2',titre:'Autre constat',observations:'Contenu expert uniquement',actions:'',piece:'',surface:'',gravite:'',photos:[]}],
});

test('decision section and matching comparison are generated before the expert signature', () => {
  const report = dossier(); report.categorie = 'Visite Globale'; report.sous_categorie = 'Maison';
  report.decision = normalizeDecision(); report.decision.attentes = [{id:'w1',libelle:'Besoin relié',priorite:'À discuter',source:'Entretien'}];
  report.decision.option_a.criteres.budget = 'Montant à recueillir';
  const html = buildReportHtml(report);
  assert.ok(html.indexOf('Aide à la décision</h2>') < html.indexOf('. Signature</h2>'));
  assert.match(html, /Besoin relié/); assert.match(html, /Montant à recueillir/);
  report.livrable = {audience:'client'};
  assert.match(buildReportHtml(report), /Montant à recueillir/);
});

test('old reports export as expert without silently adding case-specific or educational material', () => {
  const report = dossier(); const original = JSON.stringify(report); const html = buildReportHtml(report);
  assert.match(html,/Rapport expert détaillé/); assert.match(html,/Contenu expert uniquement/); assert.match(html,/Non qualifiée/);
  assert.match(html,/Exemple &lt;script&gt;/); assert.doesNotMatch(html,/Ubakus|Mollier|Cricq/);
  assert.equal(JSON.stringify(report),original);
});

test('client selection is explicit, keeps reservations, and excludes expert annexes and technical diagrams', () => {
  const report = dossier(); report.livrable={audience:'client',synthese:'Message bref',priorites:'Priorité choisie',suite:'Revoir ensemble',
    observations:['1'],visuels:['origines','mollier'],annexes:[{title:'Pièce privée expert',src:'data:image/png;base64,AAAA',caption:'Limites',source:'Dossier'}]};
  const restored=JSON.parse(JSON.stringify(report)); const html=buildReportHtml(restored);
  assert.match(html,/Message bref/); assert.match(html,/Trace relevée/); assert.match(html,/Réserve conservée/); assert.match(html,/AQC/);
  assert.doesNotMatch(html,/Contenu expert uniquement|Analyse intégrale|Pièce privée expert|Diagramme de Mollier/);
  assert.equal(restored.observations.length,2); assert.equal(restored.livrable.annexes.length,1);
});

test('unsafe annex URLs and unknown illustrations are not exported or fetched', () => {
  const report=dossier(); report.livrable={annexes:[{title:'Unsafe',src:'https://example.com/tracker.png'},{src:'javascript:alert(1)'}],visuels:['arbitrary']};
  assert.equal(deliveryOptions(report).annexes.length,0); assert.deepEqual(deliveryOptions(report).visuels,[]);
  assert.doesNotMatch(buildReportHtml(report),/tracker.png|javascript:/);
});

test('imported select values remain selectable without reclassification', () => {
  assert.deepEqual(optionsWithCurrent(['Mineure','Moyenne'],'Non qualifiée'),['Non qualifiée','Mineure','Moyenne']);
  assert.deepEqual(optionsWithCurrent(['Mineure'],'Mineure'),['Mineure']);
});
