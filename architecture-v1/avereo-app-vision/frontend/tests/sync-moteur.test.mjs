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
import { creerStockageDexie } from "../src/sync/stockage-dexie.js";
import { creerStockageMemoire } from "../src/sync/stockage-memoire.js";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
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

// ------------------------------------------------------------------------------------------ relecture adversariale

/** Verrou commun à plusieurs moteurs : ce que font les Web Locks entre les onglets d'un même navigateur. */
function verrouCommun() {
  const files = new Map();
  return (cle, fn) => {
    const precedent = files.get(cle) ?? Promise.resolve();
    const suite = precedent.then(fn, fn);
    files.set(cle, suite.catch(() => {}));
    return suite;
  };
}

const sansPiece = () => batimentParDefaut();
const renommerSalon = (batiment, nom) => remplacerNiveau(batiment, remplacerPiece(batiment.niveaux[0], renommerPiece(batiment.niveaux[0].pieces[0], nom)));

test("autre compte : si la session devient celle d'un autre compte, rien n'est envoyé ni écrit dans la base du premier", async () => {
  const serveur = creerFauxServeur({ compte: "12" });
  serveur.etat.identiteAttendue = "avereo_connect:12";
  serveur.etat.horsLigne = true;
  const { moteur } = appareil(serveur, "telephone-01");
  const cree = await moteur.creerProjet({ name: "Privé du compte 12" });
  await moteur.enregistrer(cree.id, null, ref1());
  serveur.etat.horsLigne = false;
  serveur.etat.compteConnecte = "99"; // un autre compte se connecte dans un autre onglet
  await moteur.synchroniserTout();
  assert.equal(moteur.etat().reseau, "autre-compte");
  assert.equal(serveur.projets.size, 0, "le projet du compte 12 n'est pas créé sous le compte 99");
  assert.equal(await moteur.compterEnAttente(), 1 + 3, "création du projet + 3 objets, tous conservés");
  assert.deepEqual((await moteur.listerProjets()).map((p) => p.name), ["Privé du compte 12"], "la liste du compte 99 n'entre pas dans la base du compte 12");
  serveur.etat.compteConnecte = "12"; // retour du bon compte
  await moteur.synchroniserTout();
  assert.equal(moteur.etat().reseau, "ok");
  assert.equal(serveur.projets.size, 1);
});

test("création reçue mais réponse perdue, puis suppression : la suppression part aussi, pas de pièce ressuscitée", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const { moteur } = appareil(serveur, "telephone-01");
  await moteur.enregistrer(PROJET, null, ref1());
  serveur.etat.perdreReponse = 1;
  assert.equal(await moteur.synchroniserProjet(PROJET), false, "la réponse est perdue");
  assert.ok(serveur.projets.get(PROJET).objets.has("piece-salon"), "le serveur a reçu la création");
  await moteur.enregistrer(PROJET, ref1(), sansPiece()); // l'utilisateur supprime la pièce
  assert.equal(await moteur.synchroniserProjet(PROJET), true);
  assert.equal(serveur.projets.get(PROJET).objets.get("piece-salon").deleted, true, "la suppression a été envoyée");
  assert.equal((await moteur.lireBatiment(PROJET)).batiment.niveaux[0].pieces.length, 0, "rien n'est ressuscité");
  assert.equal(await moteur.compterEnAttente(PROJET), 0);
});

test("création supprimée AVANT tout envoi : les deux s'annulent, rien ne part pour cette pièce", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const { moteur } = appareil(serveur, "telephone-01");
  const initial = sansPiece();
  await moteur.enregistrer(PROJET, null, initial);
  await moteur.enregistrer(PROJET, initial, ref1());
  await moteur.enregistrer(PROJET, ref1(), initial);
  await moteur.synchroniserProjet(PROJET);
  assert.equal(serveur.projets.get(PROJET).objets.has("piece-salon"), false);
});

test("422 : une correction faite pendant l'envoi n'est pas retirée avec la version refusée", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  serveur.etat.refuser = (c) => (c.kind === "piece" && c.data.nom.length > 10 ? "Nom trop long." : null);
  const { moteur } = appareil(serveur, "telephone-01");
  const invalide = renommerSalon(ref1(), "Un nom beaucoup trop long");
  await moteur.enregistrer(PROJET, null, invalide);
  const corrige = renommerSalon(ref1(), "Salon");
  serveur.etat.pendantEnvoi = async () => {
    await moteur.enregistrer(PROJET, invalide, corrige); // l'utilisateur corrige pendant que la requête est en vol
  };
  assert.equal(await moteur.synchroniserProjet(PROJET), true);
  assert.equal(serveur.projets.get(PROJET).objets.get("piece-salon").data.nom, "Salon", "la version corrigée est arrivée sur le serveur");
  assert.equal(await moteur.compterEnAttente(PROJET), 0);
  const refusees = (await moteur.etatProjet(PROJET)).refusees;
  assert.equal(refusees.length, 1);
  assert.equal(refusees[0].data.nom, "Un nom beaucoup trop long", "le contenu refusé est conservé");
});

test("plafond du projet (413 sans indice) : les modifications valides du même lot partent, seule la création en trop est refusée", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const { moteur } = appareil(serveur, "telephone-01");
  await moteur.enregistrer(PROJET, null, ref1());
  await moteur.synchroniserProjet(PROJET);
  serveur.etat.plafondObjets = 3; // bâtiment, niveau, pièce : le projet est plein
  const renomme = renommerSalon(ref1(), "Séjour");
  const base = renomme.niveaux[0];
  const plein = remplacerNiveau(renomme, ajouterPiece(base, creerPieceRectangulaire({ id: "piece-en-trop", nom: "En trop", longueurMm: 2000, largeurMm: 2000 })));
  await moteur.enregistrer(PROJET, ref1(), plein);
  assert.equal(await moteur.compterEnAttente(PROJET), 2);
  await moteur.synchroniserProjet(PROJET);
  assert.equal(serveur.projets.get(PROJET).objets.get("piece-salon").data.nom, "Séjour", "le renommage valide n'est pas perdu");
  assert.deepEqual((await moteur.etatProjet(PROJET)).refusees.map((r) => r.objectId), ["piece-en-trop"]);
  assert.equal(await moteur.compterEnAttente(PROJET), 0);
});

test("erreur d'enveloppe (champ hors des changements) : rien n'est refusé, l'envoi est signalé en erreur", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const { moteur } = appareil(serveur, "telephone-01");
  await moteur.enregistrer(PROJET, null, ref1());
  const original = serveur.api.synchroniser;
  serveur.api.synchroniser = async () => {
    throw new ErreurApi(422, "validation_failed", "Données invalides.", { device_id: "Identifiant d'appareil invalide." });
  };
  assert.equal(await moteur.synchroniserProjet(PROJET), false);
  assert.equal(moteur.etat().reseau, "erreur");
  assert.equal(await moteur.compterEnAttente(PROJET), 3);
  assert.deepEqual((await moteur.etatProjet(PROJET)).refusees, []);
  serveur.api.synchroniser = original;
});

test("projet archivé : la réception reste possible (appareil sans cache, modifications d'un autre appareil) et les modifications locales attendent", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const a = appareil(serveur, "telephone-01").moteur;
  await a.enregistrer(PROJET, null, ref2());
  await a.synchroniserProjet(PROJET);
  serveur.etat.archives.add(PROJET);

  const b = appareil(serveur, "ordinateur-02").moteur; // appareil sans cache, projet archivé
  const ouvert = await b.ouvrirProjet(PROJET);
  assert.equal(ouvert.persistant, true, "le relevé archivé est bien reçu");
  assert.deepEqual(ouvert.batiment, ref2());

  await a.enregistrer(PROJET, ref2(), renommerSalon(ref2(), "Modifié après archivage"));
  assert.equal(await a.synchroniserProjet(PROJET), false);
  assert.equal((await a.etatProjet(PROJET)).archive, true);
  assert.equal(await a.compterEnAttente(PROJET), 1, "la modification attend la réactivation");
  serveur.etat.archives.delete(PROJET);
  assert.equal(await a.synchroniserProjet(PROJET), true);
  assert.equal(serveur.projets.get(PROJET).objets.get("piece-salon").data.nom, "Modifié après archivage");
});

test("deux onglets sur la même base : aucune modification de la file n'est perdue (verrou entre onglets)", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const stockage = creerStockageMemoire();
  const verrou = verrouCommun();
  const creer = (id) => creerMoteur({ stockage, api: serveur.api, deviceId: "telephone-01", delaiOuvertureMs: 0, verrouExterne: verrou });
  const ongletA = creer("A");
  const ongletB = creer("B");
  const base = batimentParDefaut();
  await ongletA.enregistrer(PROJET, null, base);
  const avecA = remplacerNiveau(base, ajouterPiece(base.niveaux[0], creerPieceRectangulaire({ id: "piece-A", nom: "A", longueurMm: 3000, largeurMm: 3000 })));
  const avecB = remplacerNiveau(base, ajouterPiece(base.niveaux[0], creerPieceRectangulaire({ id: "piece-B", nom: "B", longueurMm: 2000, largeurMm: 2000 })));
  await Promise.all([ongletA.enregistrer(PROJET, base, avecA), ongletB.enregistrer(PROJET, base, avecB)]); // chacun part de l'état précédent
  assert.equal(await ongletA.compterEnAttente(PROJET), 4, "bâtiment, niveau, pièce A, pièce B");
  await ongletA.synchroniserProjet(PROJET);
  assert.deepEqual([...serveur.projets.get(PROJET).objets.keys()].sort(), ["batiment-1", "niveau-1", "piece-A", "piece-B"]);
});

test("deux connexions Dexie à la même base : la file contient les modifications des deux onglets", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const nom = `onglets-${Math.random()}`;
  const verrou = verrouCommun();
  const a = creerMoteur({ stockage: creerStockageDexie({ nom, indexedDB, IDBKeyRange }), api: serveur.api, deviceId: "telephone-01", delaiOuvertureMs: 0, verrouExterne: verrou });
  const b = creerMoteur({ stockage: creerStockageDexie({ nom, indexedDB, IDBKeyRange }), api: serveur.api, deviceId: "telephone-01", delaiOuvertureMs: 0, verrouExterne: verrou });
  const base = batimentParDefaut();
  await a.enregistrer(PROJET, null, base);
  const avecA = remplacerNiveau(base, ajouterPiece(base.niveaux[0], creerPieceRectangulaire({ id: "piece-A", nom: "A", longueurMm: 3000, largeurMm: 3000 })));
  const avecAB = remplacerNiveau(avecA, ajouterPiece(avecA.niveaux[0], creerPieceRectangulaire({ id: "piece-B", nom: "B", longueurMm: 2000, largeurMm: 2000 })));
  await a.enregistrer(PROJET, base, avecA);
  await b.enregistrer(PROJET, avecA, avecAB); // l'autre onglet ajoute sa pièce depuis son propre accès à la base
  assert.equal(await a.compterEnAttente(PROJET), 4);
  await a.synchroniserProjet(PROJET);
  assert.ok(serveur.projets.get(PROJET).objets.has("piece-A") && serveur.projets.get(PROJET).objets.has("piece-B"));
});

test("un projet archivé qui garde des modifications en attente n'empêche pas la synchronisation des projets suivants", async () => {
  const serveur = creerFauxServeur();
  const archive = "1".repeat(32);
  const actif = "2".repeat(32);
  await serveur.api.creerProjet({ id: archive, name: "Archivé" });
  await serveur.api.creerProjet({ id: actif, name: "Actif" });
  const { moteur } = appareil(serveur, "telephone-01");
  await moteur.ouvrirProjet(archive);
  await moteur.ouvrirProjet(actif);
  await moteur.enregistrer(archive, null, ref1());
  await moteur.enregistrer(actif, null, ref1());
  serveur.etat.archives.add(archive);
  await moteur.synchroniserTout();
  assert.equal(await moteur.compterEnAttente(archive), 3, "l'archivé attend sa réactivation");
  assert.equal(await moteur.compterEnAttente(actif), 0, "le projet actif est synchronisé malgré l'archivé");
  assert.equal(serveur.projets.get(actif).objets.size, 3);
});

test("journal : une erreur réseau pendant sa lecture n'est pas oubliée, il est relu au cycle suivant", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const a = appareil(serveur, "telephone-01").moteur;
  const b = appareil(serveur, "ordinateur-02").moteur;
  await a.enregistrer(PROJET, null, ref1());
  await a.synchroniserProjet(PROJET);
  const chezB = (await b.ouvrirProjet(PROJET)).batiment;
  await a.enregistrer(PROJET, ref1(), renommerSalon(ref1(), "Salon (A)"));
  await b.enregistrer(PROJET, chezB, renommerSalon(chezB, "Salon (B)"));
  await a.synchroniserProjet(PROJET);
  await b.synchroniserProjet(PROJET); // B écrase A
  const journalReel = serveur.api.journal;
  serveur.api.journal = async () => {
    throw new ErreurApi(0, "reseau", "Le serveur est injoignable.");
  };
  await a.synchroniserProjet(PROJET); // A reçoit la valeur de B, mais ne peut pas lire le journal
  assert.equal((await a.lireJournal(PROJET)).length, 0);
  serveur.api.journal = journalReel;
  await a.synchroniserProjet(PROJET); // aucun nouveau changement distant : le journal est quand même relu
  assert.equal((await a.lireJournal(PROJET)).length, 1);
});

test("liste des projets : une erreur serveur est signalée (état « erreur »), pas silencieuse", async () => {
  const serveur = creerFauxServeur();
  serveur.api.listerProjets = async () => {
    throw new ErreurApi(503, "database_unavailable", "La base de données est indisponible.");
  };
  const { moteur } = appareil(serveur, "telephone-01");
  assert.equal(await moteur.rafraichirListe(), false);
  assert.equal(moteur.etat().reseau, "erreur");
});

test("deux onglets : l'enregistrement d'un relevé dans l'un prévient l'autre que le contenu a changé", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const stockage = creerStockageMemoire();
  const verrou = verrouCommun();
  const nomCanal = `onglets-${Math.random()}`;
  const creer = () => creerMoteur({ stockage, api: serveur.api, deviceId: "telephone-01", delaiOuvertureMs: 0, verrouExterne: verrou, nomCanal });
  const a = creer();
  const b = creer();
  const recus = [];
  b.abonner((e) => recus.push(e));
  await a.enregistrer(PROJET, null, ref1());
  await new Promise((resolu) => setTimeout(resolu, 50)); // un message BroadcastChannel arrive de façon asynchrone
  assert.ok(recus.some((e) => e.type === "projet" && e.projetId === PROJET), "l'autre onglet doit relire le relevé");
  a.fermer();
  b.fermer();
});

test("R04 : le contenu des projets actifs jamais ouverts sur l'appareil est préchargé quand le réseau est là", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const bureau = appareil(serveur, "ordinateur-02").moteur; // le relevé est fait au bureau
  await bureau.enregistrer(PROJET, null, ref2());
  await bureau.synchroniserProjet(PROJET);
  await serveur.api.creerProjet({ id: "e".repeat(32), name: "Archivé" });
  serveur.projets.get("e".repeat(32)).projet.status = "archived";

  const telephone = appareil(serveur, "telephone-01").moteur; // le téléphone n'a jamais ouvert ce projet
  await telephone.synchroniserTout();
  serveur.etat.horsLigne = true; // chez le client, sans réseau
  const ouvert = await telephone.ouvrirProjet(PROJET);
  assert.equal(ouvert.persistant, true, "le relevé est disponible hors ligne sans avoir été ouvert");
  assert.deepEqual(ouvert.batiment, ref2());
  assert.ok(!serveur.etat.appels.some(([nom, id]) => nom === "synchroniser" && id === "e".repeat(32)), "un projet archivé n'est pas préchargé");
});

test("R04 : le préchargement avance même derrière 20 projets vides, et marque un projet seulement quand sa réception est complète", async () => {
  const serveur = creerFauxServeur();
  for (let i = 0; i < 21; i += 1) await serveur.api.creerProjet({ id: i.toString(16).padStart(32, "0"), name: `Vide ${i}` });
  await projetPret(serveur); // PROJET (aaaa…) : le seul avec un relevé, trié après les vides
  const bureau = appareil(serveur, "ordinateur-02").moteur;
  await bureau.enregistrer(PROJET, null, ref2());
  await bureau.synchroniserProjet(PROJET);

  const telephone = appareil(serveur, "telephone-01");
  await telephone.moteur.synchroniserTout();
  await telephone.moteur.synchroniserTout();
  assert.equal((await telephone.moteur.lireBatiment(PROJET)).persistant, true, "le projet rempli finit par être préchargé");
  assert.ok(await telephone.stockage.lireMeta(`precharge:${"0".repeat(32)}`), "un projet vide reçu est marqué fait");
});

test("R04 : une réception interrompue au milieu (pagination) n'est pas marquée et reprend au cycle suivant", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const bureau = appareil(serveur, "ordinateur-02").moteur;
  let batiment = batimentParDefaut();
  for (let i = 0; i < 550; i += 1) {
    batiment = remplacerNiveau(batiment, ajouterPiece(batiment.niveaux[0], creerPieceRectangulaire({ id: `piece-${String(i).padStart(4, "0")}`, nom: `P${i}`, longueurMm: 3000, largeurMm: 3000 })));
  }
  await bureau.enregistrer(PROJET, null, batiment);
  await bureau.synchroniserProjet(PROJET);
  assert.equal(serveur.projets.get(PROJET).objets.size, 552);

  const telephone = appareil(serveur, "telephone-01");
  const recevoir = serveur.api.recevoir;
  let appels = 0;
  serveur.api.recevoir = async (...args) => {
    appels += 1;
    if (appels === 2) throw new ErreurApi(0, "reseau", "Coupure pendant la deuxième page.");
    return recevoir(...args);
  };
  await telephone.moteur.synchroniserTout();
  assert.equal(await telephone.stockage.lireMeta(`precharge:${PROJET}`), undefined, "réception incomplète : pas marquée");
  serveur.api.recevoir = recevoir;
  await telephone.moteur.synchroniserTout();
  assert.ok(await telephone.stockage.lireMeta(`precharge:${PROJET}`));
  const lu = await telephone.moteur.lireBatiment(PROJET);
  assert.equal(lu.batiment.niveaux[0].pieces.length, 550, "toutes les pièces sont arrivées");
});

test("R04 : un projet préchargé vide puis complété au bureau est de nouveau reçu (date de modification du projet)", async () => {
  const serveur = creerFauxServeur();
  await projetPret(serveur);
  const telephone = appareil(serveur, "telephone-01");
  await telephone.moteur.synchroniserTout(); // précharge le projet encore vide
  assert.equal((await telephone.moteur.lireBatiment(PROJET)).persistant, false);
  const bureau = appareil(serveur, "ordinateur-02").moteur;
  await bureau.enregistrer(PROJET, null, ref2());
  await bureau.synchroniserProjet(PROJET);
  await telephone.moteur.synchroniserTout(); // la liste rapporte la nouvelle date : on reçoit de nouveau
  serveur.etat.horsLigne = true;
  const ouvert = await telephone.moteur.ouvrirProjet(PROJET);
  assert.equal(ouvert.persistant, true);
  assert.deepEqual(ouvert.batiment, ref2());
});
