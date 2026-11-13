import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportHtml, deliveryOptions, optionsWithCurrent } from './reportDelivery.js';
import { normalizeDecision } from './decisionSupport.js';
import { moveObservation } from './observationOrder.js';

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

const withExplanations = () => {
  const report = dossier();
  report.observations[0].explications = 'Principe expliqué : <b>x</b> & "y"\nVoir https://example.com/doc?a=1&b=2 (ou http://example.org/p_(q)).';
  report.observations[1].explications = 'Explication privée du second constat https://example.net/prive';
  return report;
};

test('explanations sit between the finding and the advice in the expert report, with safe links', () => {
  const html = buildReportHtml(withExplanations());
  const first = html.slice(html.indexOf('Constat retenu'), html.indexOf('Autre constat'));
  assert.ok(first.indexOf('<h4>Constat</h4>') < first.indexOf('<h4>Explications</h4>'));
  assert.ok(first.indexOf('<h4>Explications</h4>') < first.indexOf('<h4>Conseils habitologue</h4>'));
  assert.match(first, /&lt;b&gt;x&lt;\/b&gt; &amp; &quot;y&quot;<br \/>/);
  assert.match(first, /<a href="https:\/\/example\.com\/doc\?a=1&amp;b=2" rel="noopener noreferrer">https:\/\/example\.com\/doc\?a=1&amp;b=2<\/a> \(ou <a href="http:\/\/example\.org\/p_\(q\)"/);
  assert.doesNotMatch(first, /<b>x<\/b>/);
  assert.match(html, /Explication privée du second constat/);
});

test('reports without explanations render no explanation block and the common advice label', () => {
  const html = buildReportHtml(dossier());
  assert.doesNotMatch(html, /Explications/); assert.doesNotMatch(html, /Suites proposees/);
  assert.equal((html.match(/<h4>Conseils habitologue<\/h4>/g) || []).length, 2);
  const report = dossier(); report.observations[0].explications = '   ';
  assert.doesNotMatch(buildReportHtml(report), /Explications/);
});

test('the advice label is « Conseils habitologue » for the Habitologue profile and for every other or unknown profile', () => {
  const report = withExplanations(); report.profil_metier = 'habitologue';
  const html = buildReportHtml(report);
  assert.equal((html.match(/<h4>Conseils habitologue<\/h4>/g) || []).length, 2);
  assert.doesNotMatch(html, /Suites proposees/);
  const first = html.slice(html.indexOf('Constat retenu'), html.indexOf('Autre constat'));
  assert.ok(first.indexOf('<h4>Explications</h4>') < first.indexOf('<h4>Conseils habitologue</h4>'));
  for (const profil of ['', 'architecte', 'HABITOLOGUE', 42, null]) {
    report.profil_metier = profil;
    const other = buildReportHtml(report);
    assert.equal((other.match(/<h4>Conseils habitologue<\/h4>/g) || []).length, 2); assert.doesNotMatch(other, /Suites proposees/);
  }
});

test('the client synthesis shows explanations only for selected findings', () => {
  const report = withExplanations(); report.livrable = { audience: 'client', observations: ['1'] };
  const html = buildReportHtml(JSON.parse(JSON.stringify(report)));
  assert.match(html, /Principe expliqué/); assert.match(html, /<a href="https:\/\/example\.com\/doc\?a=1&amp;b=2"/);
  assert.doesNotMatch(html, /Explication privée|example\.net|Contenu expert uniquement/);
  report.livrable.observations = [];
  assert.doesNotMatch(buildReportHtml(report), /Principe expliqué|Explication privée/);
});

test('Habitologue client observations keep finding, explanation and advice in order without exposing excluded advice', () => {
  const report = withExplanations();
  report.profil_metier = 'habitologue';
  report.observations[1].actions = 'CONSEIL-EXPERT-EXCLU';
  report.livrable = { audience: 'client', observations: ['1'] };
  const html = buildReportHtml(report);
  assert.ok(html.indexOf('<h4>Constat</h4>') < html.indexOf('<h4>Explications</h4>'));
  assert.ok(html.indexOf('<h4>Explications</h4>') < html.indexOf('<h4>Conseils habitologue</h4>'));
  assert.match(html, /Examiner/);
  assert.doesNotMatch(html, /CONSEIL-EXPERT-EXCLU|Explication privée|example\.net/);
  delete report.profil_metier;
  assert.doesNotMatch(buildReportHtml(report), /Conseils habitologue|Examiner/);
});

test('unsafe protocols in explanations are exported as plain text, never as links', () => {
  const report = dossier(); report.observations[0].explications = 'javascript:alert(1) data:text/html,x file:///C:/a https://user:pw@example.com/';
  const html = buildReportHtml(report);
  assert.match(html, /javascript:alert\(1\) data:text\/html,x file:\/\/\/C:\/a https:\/\/user:pw@example\.com\//);
  assert.doesNotMatch(html, /href="(?:javascript|data|file|https:\/\/user)/);
});

// Feu captured first: the restitution follows Eau -> Air -> Terre -> Feu -> À classer.
const protocolReport = () => {
  const report = dossier(); report.categorie = 'Visite Globale'; report.profil_metier = 'habitologue';
  const o = (id, phase, extra = {}) => ({ id, titre: `Titre ${id}`, observations: `Texte ${id}`, actions: `Conseil ${id}`, explications: `Explication ${id}`,
    piece: '', surface: '', gravite: '', photos: [], ...(phase ? { phase_habitologie: phase } : {}), ...extra });
  report.observations = [o('feu', 'feu'), o('eau1', 'eau'), o('air', 'air'), o('eau2', 'eau'), o('terre', 'terre'), o('vrac')];
  return report;
};
const titlesInOrder = html => [...html.matchAll(/<h3>(\d+)\. Titre (\w+)<\/h3>/g)].map(m => `${m[1]}:${m[2]}`);

test('the expert Word numbers observations in protocol order and leaves the stored array and JSON untouched', () => {
  const report = protocolReport(), before = JSON.stringify(report);
  assert.deepEqual(titlesInOrder(buildReportHtml(report)), ['1:eau1', '2:eau2', '3:air', '4:terre', '5:feu', '6:vrac']);
  assert.equal(JSON.stringify(report), before);
  const moved = moveObservation(report, 'eau2', 'eau1');
  assert.deepEqual(titlesInOrder(buildReportHtml(JSON.parse(JSON.stringify(moved)))), ['1:eau2', '2:eau1', '3:air', '4:terre', '5:feu', '6:vrac']);
});

test('each expert observation keeps its own finding, explanation and advice after reordering', () => {
  const html = buildReportHtml(protocolReport());
  const feu = html.slice(html.indexOf('5. Titre feu'), html.indexOf('6. Titre vrac'));
  assert.match(feu, /Texte feu/); assert.match(feu, /Explication feu/); assert.match(feu, /Conseil feu/);
  assert.doesNotMatch(feu, /Texte eau1|Conseil air/);
});

test('client findings are filtered after the global sort, keep their global number without any plan, and leak nothing else', () => {
  const report = protocolReport();
  report.livrable = { audience: 'client', observations: ['feu', 'eau2', 'vrac'] };
  const html = buildReportHtml(JSON.parse(JSON.stringify(report)));
  assert.deepEqual([...html.matchAll(/<h3>Observation (\d+) · Titre (\w+)<\/h3>/g)].map(m => `${m[1]}:${m[2]}`), ['2:eau2', '5:feu', '6:vrac']);
  assert.doesNotMatch(html, /Titre (eau1|air|terre)|Texte (eau1|air|terre)|Conseil (eau1|air|terre)|Explication (eau1|air|terre)/);
  assert.doesNotMatch(html, /<h3>Observation 1 /);
  assert.deepEqual(report.livrable.observations, ['feu', 'eau2', 'vrac']);
});

test('the client selection stays attached to identifiers when findings of a phase are moved', () => {
  const report = protocolReport(); report.livrable = { audience: 'client', observations: ['eau2'] };
  assert.match(buildReportHtml(report), /Observation 2 · Titre eau2/);
  const moved = moveObservation(report, 'eau2', 'eau1');
  assert.deepEqual(moved.livrable.observations, ['eau2']);
  const html = buildReportHtml(moved);
  assert.match(html, /Observation 1 · Titre eau2/); assert.doesNotMatch(html, /Titre eau1/);
});

test('technical reports keep the stored order for numbering and client selection', () => {
  const report = protocolReport(); report.categorie = 'Expertise & Visite technique';
  assert.deepEqual(titlesInOrder(buildReportHtml(report)), ['1:feu', '2:eau1', '3:air', '4:eau2', '5:terre', '6:vrac']);
  report.livrable = { audience: 'client', observations: ['eau2'] };
  assert.match(buildReportHtml(report), /Observation 4 · Titre eau2/);
});
