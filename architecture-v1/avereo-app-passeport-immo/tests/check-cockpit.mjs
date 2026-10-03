// Vérifie le raccordement du suivi réel au contrat de présentation du cockpit.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reviewFollowUpPullRequests } from '../../avereo-app-projet/frontend/src/review/review-pull-request.mjs';

const state = JSON.parse(await readFile(new URL('../docs/suivi-chantier.json', import.meta.url), 'utf8'));
const phase = state.phases.find(item => item.id === 0);
const requests = reviewFollowUpPullRequests(state.reviewFollowUps, phase);
const followUp = requests.find(item => item.request.url === state.developmentWorkflow.github.followUpPrUrl);
assert.ok(followUp, 'La PR de suivi doit produire une carte dans la revue de phase 0.');
assert.equal(followUp.request.number, 72);
assert.equal(followUp.request.state, state.developmentWorkflow.github.followUpObservation.state);
assert.equal(phase.deliverables[0].path, 'iteration-developpement.md', 'L’itération réelle doit être accessible dès la phase 0.');
const document = await readFile(new URL('../docs/iteration-developpement.md', import.meta.url), 'utf8');
assert.ok(document.includes('## Où en est le développement ?'));
assert.ok(document.includes(state.developmentWorkflow.github.followUpPrUrl));
assert.ok(document.includes(`phase ${state.currentPhase} —`));
console.log('PR de suivi visible par le contrat du cockpit ; étape réelle et phase formelle présentes.');
