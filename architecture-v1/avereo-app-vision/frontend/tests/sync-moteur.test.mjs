// Moteur de synchronisation (R03, R04, R05, R06) : stockage mémoire + faux serveur qui applique le protocole du contrat.
import test from "node:test";
import assert from "node:assert/strict";
import {
  ajouterOuverture,
  ajouterPiece,
  creerOuverture,
  creerPieceRectangulaire,
  remplacerNiveau,
  remplacerPiece,
  renommerPiece,
} from "../src/domain/modele.js";
import { ErreurApi } from "../src/services/api.js";
import { batimentParDefaut, creerMoteur } from "../src/sync/moteur.js";
import { creerStockageMemoire } from "../src/sync/stockage-memoire.js";
import { creerFauxServeur } from "./aides/faux-serveur.mjs";

const PROJET = "a".repeat(32);

/** REF-1 : une pièce de 4,00 × 3,00 m, hauteur 2,50 m, dans le bâtiment par défaut. */
function ref1() {
  const batiment = batimentParDefaut();
  const piece = creerPieceRectangulaire({ id: "piece-salon", nom: "Salon", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });
  return remplacerNiveau(batiment, ajouterPiece(batiment.niveaux[0], piece));
}

/** REF-2 : REF-1 avec une porte 0,90 × 2,04 m et une fenêtre 1,20 × 1,00 m (allège 0,90 m). */
function ref2() {
  const base = ref1();
  let piece = base.niveaux[0].pieces[0];
  piece = ajouterOuverture(piece, creerOuverture({ id: "ouv-1-porte", type: "porte", murIndex: 0, positionMm: 500 }));
  piece = ajouterOuverture(piece, creerOuverture({ id: "ouv-2-fenetre", type: "fenetre", murIndex: 1, positionMm: 600 }));
  return remplacerNiveau(base, remplacerPiece(base.niveaux[0], piece));
}

function appareil(serveur, deviceId, stockage = creerStockageMemoire()) {
  const moteur = creerMoteur({ stockage, api: serveur.api, deviceId, delaiOuvertureMs: Infinity, maintenant: () => "2026-11-24T12:00:00.000Z" });
  return { moteur, stockage };
}

async function projetPret(serveur) {
  await serveur.api.creerProjet({ id: PROJET, name: "Maison" });
}

test("R03 : une modification est retrouvée après un « rechargement » (nouveau moteur sur le même stockage), sans réseau", async () => {
  const serveur = creerFauxServeur();
  serveur.etat.horsLigne = true;
  const { moteur, stockage } = appareil(serveur, "telephone-01");
  const initial = (await moteur.ouvrirProjet(PROJET)).batiment;
  assert.equal((await moteur.lireBatiment(PROJET)).persistant, false, "projet neuf : rien d'enregistré");
  assert.ok(await moteur.enregistrer(PROJET, null, initial) > 0);
  await moteur.enregistrer(PROJET, initial, ref2());

  const rechargement = appareil(serveur, "telephone-01", stockage).moteur; // même base locale, nouvelle « page »
  const lu = await rechargement.lireBatiment(PROJET);
  assert.equal(lu.persistant, true);
  assert.deepEqual(lu.batiment, ref2());
  assert.equal(await rechargement.compterEnAttente(PROJET), 5, "5 objets en attente d'envoi : bâtiment, niveau, pièce, porte, fenêtre");
});

test("R04 : hors ligne la saisie continue ; au retour du réseau tout arrive sur le serveur et la file se vide", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  serveur.etat.horsLigne = true;
  const { moteur } = appareil(serveur, "telephone-01");
  const initial = (await moteur.ouvrirProjet(PROJET)).batiment;
  await moteur.enregistrer(PROJET, null, initial);
  await moteur.enregistrer(PROJET, initial, ref2());

  assert.equal(await moteur.synchroniserProjet(PROJET), false);
  assert.equal(moteur.etat().reseau, "hors-ligne");
  assert.equal(await moteur.compterEnAttente(PROJET), 5, "rien n'est perdu pendant la coupure");

  serveur.etat.horsLigne = false;
  assert.equal(await moteur.synchroniserProjet(PROJET), true);
  assert.equal(moteur.etat().reseau, "ok");
  assert.equal(await moteur.compterEnAttente(PROJET), 0);
  const cote = serveur.projets.get(PROJET).objets;
  assert.equal(cote.size, 5);
  assert.deepEqual(cote.get("piece-salon").data.sommets, [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }]);
  assert.equal(cote.get("ouv-1-porte").data.largeurMm, 900);
});

test("R05 : un relevé saisi sur un appareil se retrouve identique sur un autre", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const telephone = appareil(serveur, "telephone-01").moteur;
  const initial = (await telephone.ouvrirProjet(PROJET)).batiment;
  await telephone.enregistrer(PROJET, null, initial);
  await telephone.enregistrer(PROJET, initial, ref2());
  await telephone.synchroniserProjet(PROJET);

  const ordinateur = appareil(serveur, "ordinateur-02").moteur;
  const ouvert = await ordinateur.ouvrirProjet(PROJET); // première réception avant de proposer un bâtiment par défaut
  assert.equal(ouvert.persistant, true);
  assert.deepEqual(ouvert.batiment, ref2());
  // Sans modification, rien n'est renvoyé (pas d'écho) :
  assert.equal(await ordinateur.enregistrer(PROJET, ouvert.batiment, ouvert.batiment), 0);
  assert.equal(await ordinateur.compterEnAttente(PROJET), 0);
});

test("R05 : une modification de l'ordinateur arrive sur le téléphone à la synchronisation suivante, et signale le projet modifié", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const telephone = appareil(serveur, "telephone-01").moteur;
  const initial = (await telephone.ouvrirProjet(PROJET)).batiment;
  await telephone.enregistrer(PROJET, null, initial);
  await telephone.enregistrer(PROJET, initial, ref1());
  await telephone.synchroniserProjet(PROJET);

  const ordinateur = appareil(serveur, "ordinateur-02").moteur;
  const sur = (await ordinateur.ouvrirProjet(PROJET)).batiment;
  const renomme = remplacerNiveau(sur, remplacerPiece(sur.niveaux[0], renommerPiece(sur.niveaux[0].pieces[0], "Séjour")));
  await ordinateur.enregistrer(PROJET, sur, renomme);
  await ordinateur.synchroniserProjet(PROJET);

  const evenements = [];
  telephone.abonner((e) => evenements.push(e));
  await telephone.synchroniserProjet(PROJET);
  assert.ok(evenements.some((e) => e.type === "projet" && e.projetId === PROJET), "l'écran doit recharger le relevé");
  assert.equal((await telephone.lireBatiment(PROJET)).batiment.niveaux[0].pieces[0].nom, "Séjour");
});

test("R06 : même pièce modifiée sur deux appareils : la plus récente est gardée, l'écrasée est au journal de l'appareil concerné", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const a = appareil(serveur, "telephone-01").moteur;
  const b = appareil(serveur, "ordinateur-02").moteur;
  const initial = (await a.ouvrirProjet(PROJET)).batiment;
  await a.enregistrer(PROJET, null, initial);
  await a.enregistrer(PROJET, initial, ref1());
  await a.synchroniserProjet(PROJET);
  const chezB = (await b.ouvrirProjet(PROJET)).batiment;

  const renommer = (batiment, nom) => remplacerNiveau(batiment, remplacerPiece(batiment.niveaux[0], renommerPiece(batiment.niveaux[0].pieces[0], nom)));
  await a.enregistrer(PROJET, ref1(), renommer(ref1(), "Salon (A)"));
  await b.enregistrer(PROJET, chezB, renommer(chezB, "Salon (B)"));
  await a.synchroniserProjet(PROJET); // A envoie d'abord
  await b.synchroniserProjet(PROJET); // B ensuite : B est la plus récente
  assert.equal(serveur.projets.get(PROJET).objets.get("piece-salon").data.nom, "Salon (B)");

  await a.synchroniserProjet(PROJET); // A reçoit la valeur de B et lit le journal
  assert.equal((await a.lireBatiment(PROJET)).batiment.niveaux[0].pieces[0].nom, "Salon (B)");
  const journal = await a.lireJournal(PROJET);
  assert.equal(journal.length, 1);
  assert.equal(journal[0].lost.device_id, "telephone-01");
  assert.equal(journal[0].lost.data.nom, "Salon (A)", "la valeur écrasée n'est pas perdue");
});

test("R06 : B modifie sans avoir reçu A : l'écart est détecté par le serveur et la valeur de A est journalisée", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const a = appareil(serveur, "telephone-01").moteur;
  const b = appareil(serveur, "ordinateur-02").moteur;
  const initial = (await a.ouvrirProjet(PROJET)).batiment;
  await a.enregistrer(PROJET, null, initial);
  await a.enregistrer(PROJET, initial, ref1());
  await a.synchroniserProjet(PROJET);
  const chezB = (await b.ouvrirProjet(PROJET)).batiment;

  const renommer = (batiment, nom) => remplacerNiveau(batiment, remplacerPiece(batiment.niveaux[0], renommerPiece(batiment.niveaux[0].pieces[0], nom)));
  await a.enregistrer(PROJET, ref1(), renommer(ref1(), "Salon (A)"));
  await a.synchroniserProjet(PROJET);
  await b.enregistrer(PROJET, chezB, renommer(chezB, "Salon (B)")); // B modifie sans avoir reçu A
  await b.synchroniserProjet(PROJET); // B n'a pas reçu A : son `base_rev` est périmé, le serveur détecte l'écart
  assert.equal(serveur.projets.get(PROJET).objets.get("piece-salon").data.nom, "Salon (B)");
  assert.equal(serveur.projets.get(PROJET).journal.length, 1, "l'écrasement de la valeur de A est journalisé côté serveur");
  assert.equal(serveur.projets.get(PROJET).journal[0].lost.data.nom, "Salon (A)");
});

test("une modification faite PENDANT un envoi n'est jamais perdue et ne crée pas de faux conflit", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const { moteur } = appareil(serveur, "telephone-01");
  const initial = (await moteur.ouvrirProjet(PROJET)).batiment;
  await moteur.enregistrer(PROJET, null, initial);
  await moteur.enregistrer(PROJET, initial, ref1());
  await moteur.synchroniserProjet(PROJET);

  const v1 = remplacerNiveau(ref1(), remplacerPiece(ref1().niveaux[0], renommerPiece(ref1().niveaux[0].pieces[0], "V1")));
  const v2 = remplacerNiveau(v1, remplacerPiece(v1.niveaux[0], renommerPiece(v1.niveaux[0].pieces[0], "V2")));
  await moteur.enregistrer(PROJET, ref1(), v1);
  serveur.etat.avantReponse = async () => {
    serveur.etat.avantReponse = null;
    await moteur.enregistrer(PROJET, v1, v2); // l'utilisateur continue de saisir pendant que la requête est en vol
  };
  await moteur.synchroniserProjet(PROJET);
  assert.equal(serveur.projets.get(PROJET).objets.get("piece-salon").data.nom, "V2", "la boucle d'envoi reprend la modification faite en vol");
  assert.equal(await moteur.compterEnAttente(PROJET), 0);
  assert.equal(serveur.projets.get(PROJET).journal.length, 0, "aucun faux conflit");
});

test("401 (cookie expiré) : la file n'est jamais vidée ; l'envoi reprend après reconnexion", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const { moteur } = appareil(serveur, "telephone-01");
  const initial = (await moteur.ouvrirProjet(PROJET)).batiment;
  await moteur.enregistrer(PROJET, null, initial);
  await moteur.enregistrer(PROJET, initial, ref2());
  serveur.etat.session = false;
  assert.equal(await moteur.synchroniserProjet(PROJET), false);
  assert.equal(moteur.etat().reseau, "reconnexion");
  assert.equal(await moteur.compterEnAttente(PROJET), 5);
  serveur.etat.session = true;
  assert.equal(await moteur.synchroniserProjet(PROJET), true);
  assert.equal(await moteur.compterEnAttente(PROJET), 0);
  assert.equal(moteur.etat().reseau, "ok");
});

test("un élément refusé (422) sort de la file et reste visible ; les autres partent", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  serveur.etat.refuser = (c) => (c.object_id === "ouv-1-porte" ? "Valeur refusée." : null);
  const { moteur } = appareil(serveur, "telephone-01");
  const initial = (await moteur.ouvrirProjet(PROJET)).batiment;
  await moteur.enregistrer(PROJET, null, initial);
  await moteur.enregistrer(PROJET, initial, ref2());
  assert.equal(await moteur.synchroniserProjet(PROJET), true);
  const etat = await moteur.etatProjet(PROJET);
  assert.equal(etat.enAttente, 0);
  assert.deepEqual(etat.refusees.map((r) => r.objectId), ["ouv-1-porte"]);
  assert.equal(serveur.projets.get(PROJET).objets.size, 4, "bâtiment, niveau, pièce, fenêtre sont arrivés");
});

test("projet archivé (409) : les modifications restent en file, signalées, jusqu'à la réactivation", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const { moteur } = appareil(serveur, "telephone-01");
  const initial = (await moteur.ouvrirProjet(PROJET)).batiment;
  await moteur.enregistrer(PROJET, null, initial);
  serveur.etat.archives.add(PROJET);
  assert.equal(await moteur.synchroniserProjet(PROJET), false);
  assert.equal((await moteur.etatProjet(PROJET)).archive, true);
  assert.equal(await moteur.compterEnAttente(PROJET), 2);
  serveur.etat.archives.delete(PROJET);
  assert.equal(await moteur.synchroniserProjet(PROJET), true);
  assert.equal((await moteur.etatProjet(PROJET)).archive, false);
});

test("R01 : création et renommage de projet hors ligne, envoyés au retour du réseau sans doublon", async () => {
  const serveur = creerFauxServeur();
  serveur.etat.horsLigne = true;
  const { moteur } = appareil(serveur, "telephone-01");
  const cree = await moteur.creerProjet({ name: "Chez les Martin", address: "5 rue Neuve" });
  assert.match(cree.id, /^[0-9a-f]{32}$/);
  await moteur.modifierProjet(cree.id, { name: "Chez les Martin (cave)" });
  let liste = await moteur.listerProjets();
  assert.deepEqual(liste.map((p) => [p.name, p.etat]), [["Chez les Martin (cave)", "a-creer"]]);
  assert.equal(await moteur.synchroniserProjets(), false);
  assert.equal(moteur.etat().reseau, "hors-ligne");

  serveur.etat.horsLigne = false;
  assert.equal(await moteur.synchroniserProjets(), true);
  assert.equal(serveur.projets.size, 1);
  assert.equal(serveur.projets.get(cree.id).projet.name, "Chez les Martin (cave)", "le renommage a été fondu dans la création");
  assert.deepEqual(serveur.etat.appels.filter(([nom]) => nom === "creerProjet").length, 1);
  liste = await moteur.listerProjets();
  assert.deepEqual(liste.map((p) => p.etat), ["synchronise"]);
});

test("R01 : réponse de création perdue puis rejeu : un seul projet, et un renommage fait entre-temps est conservé", async () => {
  const serveur = creerFauxServeur();
  serveur.etat.perdreReponse = 1;
  const { moteur } = appareil(serveur, "telephone-01");
  const cree = await moteur.creerProjet({ name: "Premier nom" });
  assert.equal(await moteur.synchroniserProjets(), false, "la réponse est perdue : le client ne sait pas que la création a réussi");
  assert.equal(serveur.projets.size, 1, "le serveur, lui, a bien créé le projet");
  await moteur.modifierProjet(cree.id, { name: "Second nom" });
  assert.equal(await moteur.synchroniserProjets(), true);
  assert.equal(serveur.projets.size, 1, "le rejeu ne crée pas de doublon");
  assert.equal(serveur.projets.get(cree.id).projet.name, "Second nom");
  assert.deepEqual((await moteur.listerProjets()).map((p) => p.etat), ["synchronise"]);
});

test("R01 : une création refusée (identifiant pris) sort de la file sans bloquer les suivantes", async () => {
  const serveur = creerFauxServeur();
  const { moteur } = appareil(serveur, "telephone-01");
  const premier = await moteur.creerProjet({ name: "Refusé" });
  const second = await moteur.creerProjet({ name: "Accepté" });
  const original = serveur.api.creerProjet;
  serveur.api.creerProjet = async (donnees) => {
    if (donnees.id === premier.id) throw new ErreurApi(409, "id_conflict", "Identifiant déjà utilisé.");
    return original(donnees);
  };
  assert.equal(await moteur.synchroniserProjets(), true);
  assert.equal(serveur.projets.has(second.id), true);
  assert.equal(moteur.operationsRefusees().length, 1);
  assert.equal(moteur.operationsRefusees()[0].operation.id, premier.id);
});

test("la liste des projets garde l'intention locale et retire les projets disparus du serveur", async () => {
  const serveur = creerFauxServeur();
  await serveur.api.creerProjet({ id: "b".repeat(32), name: "Ancien" });
  await serveur.api.creerProjet({ id: "c".repeat(32), name: "Gardé" });
  const { moteur } = appareil(serveur, "telephone-01");
  await moteur.rafraichirListe();
  assert.deepEqual((await moteur.listerProjets()).map((p) => p.name).sort(), ["Ancien", "Gardé"]);
  serveur.projets.delete("b".repeat(32)); // archivé ou retiré ailleurs
  serveur.etat.horsLigne = true;
  await moteur.modifierProjet("c".repeat(32), { name: "Renommé hors ligne" });
  serveur.etat.horsLigne = false;
  await moteur.rafraichirListe();
  assert.deepEqual((await moteur.listerProjets()).map((p) => [p.name, p.etat]), [["Renommé hors ligne", "a-modifier"]]);
});

test("synchroniserTout : projets d'abord, puis les projets ouverts ; un seul cycle à la fois", async () => {
  const serveur = creerFauxServeur();
  const { moteur } = appareil(serveur, "telephone-01");
  const cree = await moteur.creerProjet({ name: "Tout en un" });
  const initial = (await moteur.ouvrirProjet(cree.id)).batiment;
  await moteur.enregistrer(cree.id, null, initial);
  await Promise.all([moteur.synchroniserTout(), moteur.synchroniserTout(), moteur.synchroniserTout()]);
  assert.equal(serveur.projets.size, 1);
  assert.equal(serveur.projets.get(cree.id).objets.size, 2);
  assert.equal(await moteur.compterEnAttente(), 0);
});
