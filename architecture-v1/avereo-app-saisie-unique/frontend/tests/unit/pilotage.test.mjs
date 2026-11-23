import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrerDossiers, indicateurs, regrouper } from '../../src/lib/pilotage.js';
import { dossierDemonstration } from '../../src/lib/demonstration.js';
import { dossierExemple } from '../../src/lib/exemple.js';
test('recherche cumulée sans accents, filtre statut et alertes',()=>{
 const ds=[dossierDemonstration('a'),dossierExemple('b')];
 assert.deepEqual(filtrerDossiers(ds,{recherche:'demo longages'}).map(d=>d.id),['a']);
 assert.equal(filtrerDossiers(ds,{recherche:'inexistant'}).length,0);
 assert.deepEqual(filtrerDossiers(ds,{alertes:true}).map(d=>d.id),['a']);
 assert.equal(filtrerDossiers(ds,{statut:'Soldé'}).length,0);
});
test('pilotage lit les factures quand elles existent, sans double compter',()=>{
 const d=dossierDemonstration('a');d.fige={date:'2026-11-21'};d.plans.factures=structuredClone(d.plans.devis);d.plans.factures.postes[0].valeurs.pst_ttc='4000';
 assert.equal(indicateurs([d]).travaux,13706);assert.equal(indicateurs([d]).factures,1);
 assert.equal(regrouper([d],'log_epci')[0][1].length,1);
});
