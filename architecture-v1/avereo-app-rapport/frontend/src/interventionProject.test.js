import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInterventionProject, interventionPlanningError, projectSettings } from './interventionProject.js';
import { normalizeDecision } from './decisionSupport.js';

const fixture = () => ({ categorie: 'Visite Globale', profil_metier: 'habitologue', reference_dossier: 'FICTIF-TRANSFERT',
  observations: [{ id: 'o1', titre: 'Accès au jardin', phase_habitologie: 'terrain' }],
  proprietaire: 'IDENTITE A NE PAS EXPORTER', adresse_logement: 'ADRESSE A NE PAS EXPORTER', signature: 'SIGNATURE PRIVEE',
  decision: { schema_version: 1, notes_attentes: 'NOTE INTERNE PRIVEE', attentes: [{ id: 'a1', libelle: 'Accéder au jardin' }],
    planning_projet: { titre: 'Planning fictif', date_debut: '2026-11-16', date_cible: '', capacite_semaine: '5' },
    actions: [1, 2].map(i => ({ id: 'action-'+i, intitule: 'Intervention '+i, categorie: 'Correctif', priorite: 'À discuter',
      horizon: 'Après accord, sans date connue', realisation: 'Avec un professionnel', prealables: 'Vérifier les usages',
      explication: 'JUSTIFICATION INTERNE NON TRANSMISE', observation_ids: ['o1'], attente_ids: ['a1'], inclure_client: false,
      planning_projet: { inclure: true, charge: i===1 ? '1,5' : '0.5', debut_minimal: '', responsable: '' }, unknown: 'conservé' })) } });

test('relative intervention export preserves source and contains periods without invented dates', () => {
  const report=fixture();report.decision.planning_projet={mode:'periodes',titre:'FICTIF périodes'};
  report.decision.actions.forEach((action,i)=>Object.assign(action.planning_projet,{periode_debut:i===0?'1':'3',duree_periodes:i===0?'2':'3'}));
  const before=JSON.stringify(report),result=buildInterventionProject(report);
  assert.equal(result.project.timelineMode,'periods');assert.equal(result.project.startDate,null);assert.equal(result.project.targetDate,null);
  assert.deepEqual(result.project.tasks.map(t=>[t.periodStart,t.periodDuration]),[[1,2],[3,3]]);
  assert.equal(result.schedule.totalPeriods,5);assert.equal(result.schedule.projectStart,null);assert.equal(JSON.stringify(report),before);
  assert.equal(result.json.includes('NOTE INTERNE PRIVEE'),false);assert.equal(result.json.includes('2026-'),false);
});

test('relative intervention export requires explicit whole periods and keeps effort optional',()=>{
  const report=fixture();report.decision.planning_projet={mode:'periodes',titre:'Périodes'};
  assert.throws(()=>buildInterventionProject(report),/périodes/);
  report.decision.actions.forEach(action=>Object.assign(action.planning_projet,{periode_debut:'1',duree_periodes:'1',charge:''}));
  assert.equal(buildInterventionProject(report).project.tasks[0].isMilestone,false);
  report.decision.actions[0].planning_projet.periode_debut='1.5';assert.match(interventionPlanningError(report),/entiers/);
});

test('selected interventions form a lossless native Projet file with unique source-position IDs', () => {
  const report = fixture(), original = JSON.stringify(report), result = buildInterventionProject(report);
  assert.equal(result.project.tasks.length, 2);
  assert.deepEqual(result.project.tasks.map(t => t.id), ['I001', 'I002']);
  assert.deepEqual(globalThis.ProjetPlanning.decodeProject(result.json), result.project);
  assert.equal(result.schedule.totalDuration, 2);
  assert.equal(result.project.schedulingMode, 'sequential');
  assert.equal(result.project.tasks[0].status, 'À faire');
  assert.equal(result.project.tasks[0].progress, 0);
  assert.equal(JSON.stringify(report), original);
});

test('Projet selection is explicit and independent from client inclusion', () => {
  const report = fixture(); report.decision.actions[1].planning_projet.inclure = false;
  report.decision.actions[1].inclure_client = true;
  const result = buildInterventionProject(report);
  assert.equal(result.project.tasks.length, 1);
  assert.equal(result.project.tasks[0].name, 'Intervention 1');
  report.decision.actions[0].planning_projet.inclure = false;
  assert.throws(() => buildInterventionProject(report), /Sélectionnez/);
});

test('export is whitelisted and retains readable source, modalities, prerequisites and references', () => {
  const result = buildInterventionProject(fixture());
  for (const text of ['IDENTITE A NE PAS EXPORTER','ADRESSE A NE PAS EXPORTER','SIGNATURE PRIVEE','NOTE INTERNE PRIVEE','JUSTIFICATION INTERNE NON TRANSMISE']) assert.ok(!result.json.includes(text));
  for (const text of ['FICTIF-TRANSFERT','Avec un professionnel','Vérifier les usages','Accéder au jardin','Accès au jardin','Intervention source : 1']) assert.ok(result.json.includes(text));
});

test('no date, capacity or charge is guessed from a free horizon', () => {
  for (const key of ['date_debut','capacite_semaine']) {
    const report=fixture();report.decision.planning_projet[key]='';
    assert.throws(()=>buildInterventionProject(report), /Renseignez/);
  }
  const report=fixture();report.decision.actions[0].planning_projet.charge='';
  assert.throws(()=>buildInterventionProject(report), /charge estimée/);
});

test('the native Projet calendar respects capacity, weekends and earliest start without compressing a target', () => {
  const report=fixture();Object.assign(report.decision.planning_projet,{date_debut:'2026-11-20',date_cible:'2026-11-20',capacite_semaine:'2.5'});
  report.decision.actions[1].planning_projet.debut_minimal='2026-11-30';
  const result=buildInterventionProject(report);
  assert.equal(result.schedule.tasks[0].startOffset,0);
  assert.equal(result.schedule.tasks[0].endOffset,3);
  assert.equal(result.schedule.tasks[1].calcStart.getDate(),30);
  assert.equal(result.project.targetDate,'2026-11-20');
});

test('duplicate or missing IDs and dangling references block an inaccurate transfer', () => {
  for (const change of [r=>r.decision.actions[1].id='action-1',r=>r.decision.actions[0].observation_ids=['missing'],r=>r.decision.actions[0].attente_ids=[],r=>r.observations.push({...r.observations[0]})]) {
    const report=fixture();change(report);assert.throws(()=>buildInterventionProject(report));
  }
});

test('invalid storage types, impossible dates and estimates are rejected while incomplete planning is valid', () => {
  const report=fixture();report.decision.actions[0].planning_projet.charge='';assert.equal(interventionPlanningError(report),null);
  for (const value of [null,[],{},{inclure:'true'},{charge:'-1'},{charge:'1e2'},{charge:'3651'},{debut_minimal:'2026-02-30'},{responsable:3}]) {
    const bad=fixture();bad.decision.actions[0].planning_projet=value;assert.ok(interventionPlanningError(bad));
  }
  const bad=fixture();bad.decision.planning_projet.date_cible='2026-01-01';assert.ok(interventionPlanningError(bad));
});

test('unknown fields and old reports remain intact, unsupported profiles and future schema are refused', () => {
  const report=fixture();delete report.decision.planning_projet;report.decision.actions.forEach(a=>delete a.planning_projet);
  const before=JSON.stringify(report);assert.equal(interventionPlanningError(report),null);assert.equal(projectSettings(report).date_debut,'');
  assert.equal(JSON.stringify(report),before);assert.throws(()=>buildInterventionProject(report),/Sélectionnez/);
  const normalized=normalizeDecision(fixture().decision);assert.equal(normalized.actions[0].unknown,'conservé');assert.equal(normalized.actions[0].planning_projet.charge,'1,5');
  const future=fixture();future.decision.schema_version=2;assert.throws(()=>buildInterventionProject(future),/non pris en charge/);
  const other=fixture();other.profil_metier='parcours_actuel';assert.throws(()=>buildInterventionProject(other),/Habitologue/);
});

test('long descriptions are refused explicitly rather than silently truncated', () => {
  const report=fixture();report.decision.actions[0].realisation='x'.repeat(12001);
  assert.throws(()=>buildInterventionProject(report),/12 000/);
});

test('an invalid intermediate number stays editable while export and server save require correction', () => {
  const report=fixture();report.decision.planning_projet.capacite_semaine='0';
  assert.ok(interventionPlanningError(report));
  assert.equal(interventionPlanningError(report,true),null);
  assert.throws(()=>buildInterventionProject(report));
  report.decision.planning_projet.capacite_semaine='5';
  report.decision.actions[0].planning_projet.charge='.';
  assert.match(interventionPlanningError(report),/Intervention 1/);
  assert.equal(interventionPlanningError(report,true),null);
});
