import test from 'node:test';
import assert from 'node:assert/strict';
import { reportMissionDossier, missionContactLines } from '../shared/mission-dossier.js';

test('un changement de coordonnées agit sur le dossier ouvert et conserve son contenu métier', () => {
  const before={reference_dossier:'D-1',proprietaire:'Client du dossier',email:'courant@example.invalid',
    adresse_logement:'Site B',date_visite:'2026-11-07',observations:[{titre:'À conserver'}],
    missionBrief:{client:'Ancien nom',email:'ancienne@example.invalid',adresseClient:'Courrier A'}};
  let updated;
  const mission=reportMissionDossier(before, update=>{updated=update(before);}, true);
  assert.equal(mission.fields.client,'Client du dossier');
  assert.equal(mission.fields.email,'courant@example.invalid');
  mission.apply({...mission.fields,client:'Nouveau nom',telephone:'Téléphone fictif'});
  assert.equal(updated.proprietaire,'Nouveau nom');
  assert.deepEqual(updated.observations,before.observations);
  assert.equal(updated.adresse_logement,'Site B');
  assert.equal(updated.missionBrief.adresseClient,'Courrier A');
  assert.equal(updated.missionBrief.email,undefined);
  assert.equal(before.proprietaire,'Client du dossier');
});

test('les anciens dossiers et les champs non renseignés restent utilisables', () => {
  const before={reference_dossier:'D-2',proprietaire:'Client',adresse_logement:'Site'};
  let updated;
  const mission=reportMissionDossier(before, update=>{updated=update(before);}, false);
  assert.deepEqual(missionContactLines(before.missionBrief),[]);
  mission.apply({...mission.fields,email:'thermo@example.invalid',telephone:'  '});
  assert.deepEqual(missionContactLines(updated.missionBrief),[['E-mail','thermo@example.invalid']]);
});

test('Thermo reprend le courriel de l’ancien dossier et respecte son effacement explicite', () => {
  const legacy={proprietaire:'Client fictif',email:'ancien@example.invalid',adresse_logement:'Site B'};
  let saved;
  const mission=reportMissionDossier(legacy, update=>{saved=update(legacy);}, false);
  assert.equal(mission.fields.email,legacy.email);
  mission.apply({...mission.fields,email:''});
  assert.equal(reportMissionDossier(saved, null, false).fields.email,'');
  const newer={...legacy,missionBrief:{email:'confirme@example.invalid'}};
  assert.equal(reportMissionDossier(newer, null, false).fields.email,'confirme@example.invalid');
});
