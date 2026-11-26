import { test } from "node:test";
import assert from "node:assert/strict";
import { choisirModeAppareil, messageErreurCamera } from "../src/features/terrain/appareil.js";

const gum = () => {};

test("appareil photo : téléphones et iPad → appareil photo natif (input capture)", () => {
  assert.equal(choisirModeAppareil({ userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/131", getUserMedia: gum }), "natif");
  assert.equal(choisirModeAppareil({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Safari/604.1", getUserMedia: gum }), "natif");
  // iPadOS se présente comme un Mac : reconnu par l'écran tactile.
  assert.equal(choisirModeAppareil({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1", maxTouchPoints: 5, getUserMedia: gum }), "natif");
});

test("appareil photo : Surface Pro et PC (Windows, Mac) → caméra intégrée si le navigateur la propose", () => {
  const surface = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0";
  assert.equal(choisirModeAppareil({ userAgent: surface, maxTouchPoints: 10, getUserMedia: gum }), "integre");
  assert.equal(choisirModeAppareil({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1", maxTouchPoints: 0, getUserMedia: gum }), "integre");
  // Sans getUserMedia (navigateur ancien ou page non sécurisée) : repli sur le champ fichier.
  assert.equal(choisirModeAppareil({ userAgent: surface, maxTouchPoints: 10 }), "natif");
});

test("appareil photo : messages d'erreur en toutes lettres, avec le secours « Choisir une photo »", () => {
  for (const nom of ["NotAllowedError", "NotFoundError", "NotReadableError", "AutreErreur"]) {
    assert.match(messageErreurCamera(nom), /Choisir une photo/);
  }
  assert.match(messageErreurCamera("NotAllowedError"), /refusé/);
});
