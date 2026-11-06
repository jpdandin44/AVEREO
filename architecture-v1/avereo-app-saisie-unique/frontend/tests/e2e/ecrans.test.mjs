// Tests d'écran sur l'application assemblée (dist/index.html), dans Chromium.
// T02 à T04, T07, T08, T16, T18, T20, T21, T23 ; clavier, affichage mobile, aucune requête réseau.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL_APP = new URL('../../dist/index.html', import.meta.url).href;
let navigateur;

before(async () => { navigateur = await chromium.launch(); });
after(async () => { await navigateur.close(); });

async function ouvrir({ largeur = 1440 } = {}) {
  const contexte = await navigateur.newContext({ viewport: { width: largeur, height: 1000 }, locale: 'fr-FR' });
  const page = await contexte.newPage();
  const requetes = [];
  const erreurs = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requetes.push(r.url()); });
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  await page.goto(URL_APP);
  return { page, contexte, requetes, erreurs };
}

const exemple = (page) => page.getByRole('button', { name: 'Dossier d’exemple', exact: true }).click();
const ongletDoc = (page, nom) => page.getByRole('tab', { name: new RegExp(`^${nom}`) });
const nbsp = (s) => s.replace(/[  ]/g, ' ');

test('T21 — le bandeau « Données fictives » est toujours affiché ; aucune requête réseau ; aucune erreur', async () => {
  const { page, contexte, requetes, erreurs } = await ouvrir();
  const bandeau = page.getByText('Données fictives — ne saisir aucune donnée réelle.');
  await assert.doesNotReject(bandeau.waitFor());
  await exemple(page);
  assert.ok(await bandeau.isVisible());
  for (const vue of ['Ratios', 'Paramètres']) {
    await page.getByRole('button', { name: vue, exact: true }).click();
    assert.ok(await bandeau.isVisible(), vue);
  }
  assert.deepEqual(requetes, []);
  assert.deepEqual(erreurs, []);
  await contexte.close();
});

test('T23 — onglets dans l’ordre, avancement lisible par une couleur et un texte ; navigation au clavier', async () => {
  const { page, contexte } = await ouvrir();
  await exemple(page);
  const onglets = page.getByRole('tablist', { name: 'Onglets de la fiche' }).getByRole('tab');
  const titres = await onglets.locator('.o-titre').allTextContents();
  assert.deepEqual(titres, ['Administratif', 'Projet', 'Financement', 'Énergie', 'Travaux']);
  for (const t of await onglets.locator('.o-etat').allTextContents()) assert.match(t, /[✓●○—]/);
  const classes = await onglets.evaluateAll((els) => els.map((e) => e.className));
  assert.ok(classes.every((c) => /etat-(complet|partiel|vide|sans_objet)/.test(c)));
  await onglets.first().focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: /^Projet/ }).getAttribute('aria-selected'), 'true');
  await contexte.close();
});

test('T02, T03 et T04 — plan équilibré, changement d’avis, documents signalés, retour au choix initial', async () => {
  const { page, contexte } = await ouvrir();
  await exemple(page);
  const feuille = page.locator('#feuille');
  assert.match(nbsp(await feuille.innerText()), /✓ Plan équilibré : le total financé couvre le coût des travaux\./);
  await page.getByRole('button', { name: 'Simuler un changement d’avis du propriétaire' }).click();
  assert.match(nbsp(await feuille.innerText()), /! Reste à financer : 1 300 €\./);
  assert.match(nbsp(await ongletDoc(page, 'Attestation \\(devis\\)').innerText()), /mis à jour/i);
  await ongletDoc(page, 'Demande d’avance').click();
  const avance = nbsp(await feuille.innerText());
  assert.match(avance, /Coût total des travaux\s+13 700 €/);
  assert.match(avance, /Avance demandée\s+3 000 €/);
  await page.getByRole('button', { name: 'Revenir au choix initial' }).click();
  await page.locator('details.journal summary').click();
  assert.match(await page.locator('details.journal').innerText(), /Retour au choix initial/);
  await contexte.close();
});

test('T07 — surface et observations effacées : « 2 à compléter » sur la synthèse, les autres restent complets', async () => {
  const { page, contexte } = await ouvrir();
  await exemple(page);
  await page.getByRole('tab', { name: /^Énergie/ }).click();
  await page.getByLabel('Surface habitable (m²)').fill('');
  await page.getByRole('tab', { name: /^Administratif/ }).click();
  await page.getByLabel(/^Observations du conseiller/).fill('');
  assert.match(await ongletDoc(page, 'Synthèse du logement').innerText(), /2 à compléter/);
  for (const d of ['Plan de financement', 'Attestation \\(devis\\)', 'Demande d’avance']) {
    assert.match(await ongletDoc(page, d).innerText(), /✓ Complet/, d);
  }
  await contexte.close();
});

test('T08 et T18 — frappes regroupées au journal ; après rechargement, le dossier est identique', async () => {
  const { page, contexte } = await ouvrir();
  await exemple(page);
  await page.getByLabel('Prénom du propriétaire').pressSequentially('Camille', { delay: 30 });
  await page.locator('details.journal summary').click();
  assert.match(await page.locator('details.journal summary').innerText(), /\(1\)/);
  await page.reload();
  await exemple(page);
  assert.equal(await page.getByLabel('Prénom du propriétaire').inputValue(), 'Camille');
  await contexte.close();
});

test('T20 — la dernière page de chaque document signé est isolée à l’impression', async () => {
  const { page, contexte } = await ouvrir();
  await exemple(page);
  for (const d of ['Plan de financement', 'Attestation \\(devis\\)', 'Demande d’avance', 'Demande d’acompte', 'Demande d’aide \\(PO\\)']) {
    await page.emulateMedia({ media: 'screen' });
    await ongletDoc(page, d).click();
    await page.emulateMedia({ media: 'print' });
    const sig = page.locator('#feuille .page-signature');
    assert.equal(await sig.count(), 1, d);
    assert.equal(await sig.evaluate((e) => getComputedStyle(e).breakBefore), 'page', d);
    assert.equal(await page.locator('#feuille > :last-child').evaluate((e) => e.classList.contains('page-signature')), true, d);
  }
  assert.equal(await page.locator('.form-panel').evaluate((e) => getComputedStyle(e).display), 'none');
  await contexte.close();
});

test('T16 — « Figer au dépôt » : confirmation, plan Factures créé, proposition facultative de date et de statut ; filtre par statut', async () => {
  const { page, contexte } = await ouvrir();
  await exemple(page);
  await page.getByRole('tab', { name: /^Financement/ }).click();
  await page.getByRole('button', { name: 'Figer au dépôt…' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Figer au dépôt' }).click();
  await assert.doesNotReject(page.getByText('Plan Devis figé au dépôt.').waitFor());
  await page.getByRole('button', { name: 'Ne rien changer' }).click();
  assert.match(await page.locator('.dossier-titre').innerText(), /statut : En cours/);
  assert.match(await ongletDoc(page, 'Attestation \\(factures\\)').innerText(), /Complet/);
  await page.getByRole('button', { name: /^Plan Devis/ }).click();
  assert.equal(await page.getByLabel(/^Apport personnel/).isDisabled(), true);
  await page.getByRole('button', { name: '← Liste des dossiers' }).click();
  await page.getByLabel('Filtrer par statut').selectOption('Relance');
  assert.match(await page.locator('.panneau').innerText(), /Aucun dossier pour ce statut/);
  await page.getByLabel('Filtrer par statut').selectOption('En cours');
  assert.match(await page.locator('.liste-dossiers').innerText(), /Dossier d’exemple/);
  await contexte.close();
});

test('sauvegarde : export dans un fichier, puis import dans un autre navigateur sans remplacer ses dossiers', async () => {
  const { page, contexte } = await ouvrir();
  await exemple(page);
  await page.getByLabel('Prénom du propriétaire').fill('Camille');
  await page.getByRole('button', { name: 'Dossiers', exact: true }).click();
  const [telechargement] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter les dossiers' }).click()]);
  assert.match(telechargement.suggestedFilename(), /^avereo-uni-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/);
  const chemin = join(mkdtempSync(join(tmpdir(), 'avereo-uni-')), telechargement.suggestedFilename());
  await telechargement.saveAs(chemin);
  await contexte.close();
  const autre = await ouvrir();
  await autre.page.getByLabel('Fichier de sauvegarde à importer').setInputFiles(chemin);
  await assert.doesNotReject(autre.page.getByText('1 dossier importé, ajouté en tête de liste.').waitFor());
  assert.equal(await autre.page.locator('.liste-dossiers tbody tr').count(), 2);
  await autre.page.locator('.liste-dossiers tbody tr').first().getByRole('button').first().click();
  assert.equal(await autre.page.getByLabel('Prénom du propriétaire').inputValue(), 'Camille');
  assert.deepEqual(autre.requetes, []);
  await autre.contexte.close();
});

test('affichage mobile : une colonne, sans défilement horizontal', async () => {
  const { page, contexte } = await ouvrir({ largeur: 390 });
  await exemple(page);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await contexte.close();
});

