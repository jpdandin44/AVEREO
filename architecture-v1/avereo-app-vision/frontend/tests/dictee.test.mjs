import { test } from "node:test";
import assert from "node:assert/strict";
import { conseilDictee } from "../src/components/dictee.js";

test("dictée : Android et iPhone → micro du clavier", () => {
  assert.match(conseilDictee({ userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/131" }), /micro du clavier/);
  assert.match(conseilDictee({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Safari/604.1" }), /micro du clavier.*Dictée/);
  // iPadOS se présente comme un Mac : reconnu par l'écran tactile.
  assert.match(conseilDictee({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1", maxTouchPoints: 5 }), /micro du clavier/);
});

test("dictée : Surface Pro et PC Windows → Windows + H", () => {
  const surface = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0";
  assert.match(conseilDictee({ userAgent: surface, maxTouchPoints: 10 }), /Windows \+ H/);
});

test("dictée : Mac et appareil inconnu → conseil générique, jamais vide", () => {
  assert.match(conseilDictee({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1", maxTouchPoints: 0 }), /Fn/);
  assert.ok(conseilDictee({}).length > 0);
  assert.ok(conseilDictee().length > 0);
});
