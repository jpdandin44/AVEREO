import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { definirPortailConnect } from "../src/services/portail-connect.js";

/** Document minimal : une tête qui contient des balises meta. */
function faux() {
  const metas = [];
  const creer = () => {
    const attrs = {};
    const el = {
      setAttribute: (k, v) => { attrs[k] = String(v); },
      getAttribute: (k) => attrs[k] ?? null,
      remove: () => { metas.splice(metas.indexOf(el), 1); },
    };
    return el;
  };
  return {
    metas,
    createElement: creer,
    head: {
      querySelector: () => metas.find((m) => m.getAttribute("name") === "avereo-connect-portal") ?? null,
      append: (el) => metas.push(el),
    },
  };
}

test("portail CONNECT : la balise meta est créée, mise à jour puis retirée", () => {
  const doc = faux();
  definirPortailConnect("https://connect-preprod.avereo.fr", doc);
  assert.equal(doc.metas.length, 1);
  assert.equal(doc.metas[0].getAttribute("content"), "https://connect-preprod.avereo.fr");
  definirPortailConnect("https://connect.avereo.fr", doc);
  assert.equal(doc.metas.length, 1, "une seule balise");
  assert.equal(doc.metas[0].getAttribute("content"), "https://connect.avereo.fr");
  definirPortailConnect("", doc);
  assert.equal(doc.metas.length, 0);
});

test("menu commun : la propriété en lecture seule « portal » n'est jamais passée en prop React (page blanche sinon)", () => {
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(app, /<avereo-account-menu[^>]*\sportal=/);
});
