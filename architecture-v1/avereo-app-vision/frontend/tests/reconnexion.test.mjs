import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transformSync } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { creerClient } from "../src/services/api.js";

const module = { exports: {} };
const code = transformSync(readFileSync(new URL('../src/components/Reconnexion.jsx', import.meta.url), 'utf8'), { loader: 'jsx', format: 'cjs' }).code;
new Function('React', 'module', 'exports', code)(React, module, module.exports);
const Reconnexion = module.exports.default;

test('R49 : le client conserve le portail public sur un 401', async () => {
  const client = creerClient({ fetchImpl: async () => Response.json({ ok: false, error: 'unauthenticated', connect_portal: 'https://connect-preprod.avereo.fr' }, {status: 401}) });
  await assert.rejects(client.identite(), e => e.statut === 401 && e.connectPortal === 'https://connect-preprod.avereo.fr');
});
test('R49 : reconnexion dans la même fenêtre, secours sans portail et stockage mémoire', () => {
  const html = renderToStaticMarkup(React.createElement(Reconnexion, {portal: 'http://127.0.0.1:5250/revue'}));
  assert.match(html, /href="http:\/\/127.0.0.1:5250\/revue\?app=vision"/);
  assert.match(html, /Se reconnecter/);
  assert.doesNotMatch(html, /target=/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Reconnexion)), /<a/);
  assert.match(renderToStaticMarkup(React.createElement(Reconnexion, {durable: false})), /risquent d’être perdues/);
});
