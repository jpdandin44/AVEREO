import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const data = JSON.parse(await readFile(new URL('data/progression-examin.json', root), 'utf8'));
const counts = Object.fromEntries(Object.keys(data.statusLabels).map(status => [status, data.features.filter(feature => feature.currentStatus === status).length]));
const rows = data.features.map(feature => `| ${feature.feature} | ${data.statusLabels[feature.currentStatus]} | ${feature.finding} | ${feature.source.id}, ${feature.source.sheet}, ligne ${feature.source.row} |`).join('\n');
const output = `---
project: avereo-app-passeport-immo
document_type: functional-progress
title: Progression face aux sources ExamIn
status: active
version: git
created: 2026-10-14
updated: ${data.observedAt}
owner: jpdandin
tags: [passeport-immo, examin, progression]
---

# Progression face aux sources ExamIn

Vue générée depuis [la matrice JSON](../data/progression-examin.json). Observation : ${data.observedAt}.

${data.method}

## Lecture du statut

Sur les 14 fonctions de référence : **${counts.local} disponibles localement,
${counts.partiel} partielles, ${counts.simule} simulées et ${counts.absent} absentes**.
La disponibilité locale ne signifie ni stockage centralisé, ni droits réels,
ni livraison hébergée. Aucun pourcentage global n'est calculé.

| Fonction de référence | État actuel | Constat | Source initiale |
|---|---|---|---|
${rows}

## Documents du client liés au bien

${data.documentsExtension.status}.

${data.documentsExtension.capabilities.map(value => '- '+value).join('\n')}

Sources complémentaires : ${data.documentsExtension.sources.join(' ; ')}.
Les détails du lot et du cas réel sont dans [le guide](documents-bien.md) et
[son audit](source-audit-documents.md). Les documents et identifiants clients
ne sont pas copiés dans cette matrice.

## Éléments encore ouverts

${data.documentsExtension.open.map(value => '- '+value).join('\n')}

Le socle initial d'audit et ses validations restent historiques. Le regroupement
du suivi est décrit dans [la correspondance des phases](mapping-phases.md).
La recette ExamIn de 2025 et ses anomalies ne mesurent pas l'état de cette version.
`;
const path = new URL('docs/progression-examin.md', root);
if (process.argv.includes('--check')) {
  if (await readFile(path, 'utf8') !== output) throw new Error('Projection de progression différente du JSON source.');
  console.log('Progression ExamIn alignée : 14 fonctionnalités, statuts locaux distincts des validations historiques.');
} else { await writeFile(path, output); console.log('Projection de progression générée.'); }
