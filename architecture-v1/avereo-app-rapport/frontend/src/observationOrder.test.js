import test from 'node:test';
import assert from 'node:assert/strict';
import { orderedObservations, observationNumber, moveObservation } from './observationOrder.js';

const report = () => ({ categorie: 'Visite Globale', observations: [
  { id: 'f', phase_habitologie: 'feu', titre: 'Chauffage saisi en premier' },
  { id: 'e1', phase_habitologie: 'eau', photos: [{ id: 'photo', src: 'unchanged' }], actions: 'Conseil conservé', reperes: [{planId:'p',x:.4,y:.7}] },
  { id: 'a', phase_habitologie: 'air' }, { id: 'e2', phase_habitologie: 'eau', explications: 'https://example.test' },
  { id: 't', phase_habitologie: 'terre' }, { id: 'old' }, { id: 'future', phase_habitologie: 'inconnue' },
], decision: { liens: [{ observation_id: 'e1' }] }, livrable: { observations: ['e1'] } });
const ids = value => orderedObservations(value).map(o => o.id);

test('protocol order prevails over capture order without modifying the imported report', () => {
  const r = report(), before = structuredClone(r);
  assert.deepEqual(ids(r), ['e1','e2','a','t','f','old','future']);
  assert.equal(observationNumber(r,r.observations[0]), 5);
  assert.deepEqual(r,before);
  r.habitologie_protocoles = {eau:{enabled:false}};
  assert.deepEqual(ids(r), ['e1','e2','a','t','f','old','future']);
});

test('moving within a phase renumbers globally and preserves objects, references and JSON round-trip', () => {
  const r=report(), next=moveObservation(r,'e2','e1');
  assert.deepEqual(ids(next), ['e2','e1','a','t','f','old','future']);
  assert.equal(observationNumber(next,next.observations.find(o=>o.id==='e1')),2);
  for(const old of r.observations) assert.equal(next.observations.find(o=>o.id===old.id),old);
  assert.equal(next.decision,r.decision); assert.equal(next.livrable,r.livrable);
  assert.deepEqual(ids(JSON.parse(JSON.stringify(next))),ids(next));
  assert.deepEqual(ids(moveObservation(next,'e2','e1')),ids(r));
});

test('cross-phase, missing, identical or ambiguous moves leave the original untouched', () => {
  const r=report();
  for(const pair of [['f','e1'],['e1','a'],['missing','e1'],['e1','missing'],['e1','e1'],['','e1']]) assert.equal(moveObservation(r,...pair),r);
  r.observations.push({...r.observations[1]});
  assert.equal(moveObservation(r,'e1','e2'),r);
});

test('unclassified observations stay in their own group and technical reports retain array order', () => {
  const r=report(); assert.deepEqual(ids(moveObservation(r,'future','old')), ['e1','e2','a','t','f','future','old']);
  assert.equal(moveObservation(r,'old','e1'),r);
  r.categorie='Expertise & Visite technique';
  assert.deepEqual(ids(r),r.observations.map(o=>o.id));
  assert.deepEqual(ids(moveObservation(r,'f','e1')),['e1','f','a','e2','t','old','future']);
});
