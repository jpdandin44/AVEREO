// File d'envoi des projets (création et modifications faites hors ligne) : logique pure.
import test from "node:test";
import assert from "node:assert/strict";
import { annoterProjets, appliquerOperations, ecartsDescriptifs, empilerOperation, genererIdProjet, retirerOperation } from "../src/sync/operations-projets.js";

const creer = (id, champs = { name: "N", address: "", client_label: "" }) => ({ type: "creer", id, champs });
const modifier = (id, champs) => ({ type: "modifier", id, champs });

test("identifiant de projet : 32 caractères hexadécimaux minuscules, tiré de 16 octets", () => {
  const id = genererIdProjet((octets) => octets.map((_, i) => i * 17));
  assert.equal(id, "00112233445566778899aabbccddeeff");
  assert.match(genererIdProjet(), /^[0-9a-f]{32}$/);
  assert.notEqual(genererIdProjet(), genererIdProjet());
});

test("un renommage fait avant l'envoi se fond dans la création ; l'archivage reste une modification à part", () => {
  let file = empilerOperation([], creer("p1"));
  file = empilerOperation(file, modifier("p1", { name: "Renommé", address: "1 rue A" }));
  assert.deepEqual(file, [creer("p1", { name: "Renommé", address: "1 rue A", client_label: "" })]);
  file = empilerOperation(file, modifier("p1", { status: "archived" }));
  assert.deepEqual(file, [creer("p1", { name: "Renommé", address: "1 rue A", client_label: "" }), modifier("p1", { status: "archived" })]);
  file = empilerOperation(file, modifier("p1", { status: "active", client_label: "M. Durand" }));
  assert.deepEqual(file, [creer("p1", { name: "Renommé", address: "1 rue A", client_label: "M. Durand" }), modifier("p1", { status: "active" })]);
});

test("deux modifications d'un projet déjà envoyé n'en font qu'une, la dernière valeur de chaque champ gagne", () => {
  let file = empilerOperation([], modifier("p1", { name: "A" }));
  file = empilerOperation(file, modifier("p1", { address: "X" }));
  file = empilerOperation(file, modifier("p1", { name: "B" }));
  file = empilerOperation(file, modifier("p2", { name: "Autre" }));
  assert.deepEqual(file, [modifier("p1", { name: "B", address: "X" }), modifier("p2", { name: "Autre" })]);
});

test("la file n'est jamais modifiée en place", () => {
  const depart = [creer("p1")];
  const copie = structuredClone(depart);
  empilerOperation(depart, modifier("p1", { name: "Autre" }));
  assert.deepEqual(depart, copie);
});

test("retirerOperation : l'opération envoyée sort ; si elle a changé pendant l'envoi, elle reste (rien n'est perdu)", () => {
  const envoyee = modifier("p1", { name: "A" });
  assert.deepEqual(retirerOperation([envoyee, modifier("p2", { name: "Z" })], envoyee), [modifier("p2", { name: "Z" })]);
  const changeeEnVol = [modifier("p1", { name: "B" })];
  assert.deepEqual(retirerOperation(changeeEnVol, envoyee), changeeEnVol);
});

test("annoterProjets et appliquerOperations : la liste montre l'intention locale et l'état d'envoi", () => {
  const projets = [{ id: "p1", name: "Un", status: "active" }, { id: "p2", name: "Deux", status: "active" }, { id: "p3", name: "Trois", status: "active" }];
  const operations = [creer("p1"), modifier("p2", { name: "Deux (modifié)" })];
  assert.deepEqual(annoterProjets(projets, operations).map((p) => p.etat), ["a-creer", "a-modifier", "synchronise"]);
  assert.equal(appliquerOperations(projets[1], operations).name, "Deux (modifié)");
  assert.equal(appliquerOperations(projets[2], operations), projets[2]);
});

test("ecartsDescriptifs : seuls les champs qui diffèrent du serveur sont à renvoyer", () => {
  assert.deepEqual(ecartsDescriptifs({ name: "B", address: "x", client_label: "c" }, { name: "A", address: "x", client_label: "c" }), { name: "B" });
  assert.deepEqual(ecartsDescriptifs({ name: "A" }, { name: "A", address: "x" }), {});
});
