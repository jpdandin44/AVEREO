import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canCreateTechnicalReport, isTechnicalReport, newTechnicalReport, technicalMission, technicalReportTypes, technicalTypeLabel } from './technicalReport.js';
import { normalizeReportClassification } from './reportClassification.js';
import { usesMissionContext } from './reportProfiles.js';
import { buildReportHtml } from './reportDelivery.js';
import { moveObservation } from './observationOrder.js';

test('technical creation depends only on an explicit server capability', () => {
  for (const user of [null, {}, { profil_metier:'architecte' }, { canManageAll:true },
    { profileAccess:{managed:true,profile:{template:'architecte'},actions:['create','export']} },
    { reportCapabilities:{technicalReport:'true'} }]) assert.equal(canCreateTechnicalReport(user),false);
  assert.equal(canCreateTechnicalReport({reportCapabilities:{technicalReport:true}}),true);
});

test('the new technical dossier has no global default; historical dossiers are not mutated', () => {
  const global = {categorie:'Visite Globale',profil_metier:'habitologue',titre:'Titre',observations:[{id:'keep'}]};
  const before=JSON.stringify(global), technical=newTechnicalReport(global);
  assert.equal(technical.profil_metier,''); assert.equal(technical.sous_categorie,'');
  assert.equal(normalizeReportClassification(technical).sous_categorie,'');
  assert.equal(isTechnicalReport(technical),true); assert.equal(usesMissionContext(technical),false);
  assert.equal(usesMissionContext({...technical,profil_metier:'habitologue'}),false);
  assert.equal(JSON.stringify(global),before); assert.equal(technical.observations,global.observations);
  assert.deepEqual(technicalMission({mission_technique:{objet:[],perimetre:'Visite',limites:4}}),{objet:'',perimetre:'Visite',limites:''});
});

test('technical specialties remain selectable and survive normalization without imposing a default', () => {
  const options = technicalReportTypes();
  for (const value of ['Fissures','Humidite','Toiture','Mesures','cartographie','pathologies']) {
    assert.ok(options.some(option => option.value === value));
    assert.equal(normalizeReportClassification({ ...newTechnicalReport({}), sous_categorie:value }).sous_categorie,value);
  }
  assert.equal(options[0].value,''); assert.equal(technicalTypeLabel('Humidite'),'Humidité');
  assert.ok(technicalReportTypes('Type historique').some(option => option.value === 'Type historique'));
});

test('expert retains technical details, client keeps only selected findings and common scope; no mutation', () => {
  const report=newTechnicalReport({meteo:{},cadastre:{},urbanisme:{},terrain:{},localisation:{},ressources_batiment:{},protocoles:{standard:true},
    ...JSON.parse(readFileSync(new URL('../../tests/fixtures/dossier-complet.json',import.meta.url)))});
  report.mission_technique={objet:'Mission <script>',perimetre:'Façade accessible',limites:'Sans sondage'};
  report.sous_categorie='Humidite';
  const first=report.observations[0], second=report.observations[1];
  first.mesures_techniques='MESURE-INTERNE-12';first.verifications_techniques='VERIFICATION-INTERNE';first.references_techniques='https://example.org/tech <img onerror=x>';
  second.actions='CONSEIL-EXCLU-SECRET'; const before=JSON.stringify(report);
  const expert=buildReportHtml(report);
  assert.match(expert,/Rapport Technique/);assert.match(expert,/Mission &lt;script&gt;/);assert.match(expert,/MESURE-INTERNE-12/);assert.match(expert,/VERIFICATION-INTERNE/);
  assert.match(expert,/Type de rapport technique<\/td><td>Humidité/);
  assert.doesNotMatch(expert,/<img onerror=x>|<script>/);assert.equal(JSON.stringify(report),before);
  report.livrable={audience:'client',observations:[first.id]};const client=buildReportHtml(report);
  assert.match(client,/Façade accessible|Sans sondage/);assert.ok(client.includes(first.actions));
  assert.match(client,/Type de rapport technique<\/td><td>Humidité/);
  assert.doesNotMatch(client,/MESURE-INTERNE-12|VERIFICATION-INTERNE|CONSEIL-EXCLU-SECRET/);
  const moved=moveObservation(report,first.id,second.id);
  assert.deepEqual(new Set(moved.observations.map(o=>o.id)),new Set(report.observations.map(o=>o.id)));
  assert.equal(moved.observations.find(o=>o.id===first.id).mesures_techniques,'MESURE-INTERNE-12');
});
