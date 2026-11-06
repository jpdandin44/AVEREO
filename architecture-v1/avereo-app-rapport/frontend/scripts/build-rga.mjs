// Package RGA with the identity-aware Rapport gate; RGA keeps its own app code and cookie.
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const source = new URL('../../data/rga/', import.meta.url);
const target = new URL('../dist/rga/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('sources.json', source), 'utf8'));
await mkdir(target, { recursive: true });
const gate = await readFile(new URL('../public/connect/gate.php', import.meta.url), 'utf8');
const appConstant = "const AVEREO_GATE_APP = 'rapport';";
if (gate.split(appConstant).length !== 2) throw new Error('Unexpected Rapport gate app constant');
await writeFile(new URL('connect-gate.php', target), gate.replace(appConstant, '// RGA defines AVEREO_GATE_APP in gate.php.'));
for (const map of manifest.maps) {
  const bytes = await readFile(new URL(map.file, source));
  if (createHash('sha256').update(bytes).digest('hex') !== map.sha256) throw new Error(`RGA source changed: ${map.file}`);
  // Never publish the raw HTML: every map request must execute the PHP gate first.
  await writeFile(new URL(map.output, target), Buffer.concat([
    Buffer.from("<?php require __DIR__ . '/guard.php'; ?>\n"), bytes,
  ]));
}
console.log(`RGA: ${manifest.maps.length} protected maps packaged.`);
const interactive = new URL('interactive/', source);
const provenance = JSON.parse(await readFile(new URL('provenance.json', interactive), 'utf8'));
for (const file of provenance.sourceFiles.filter(item => item.file.startsWith('data/'))) {
  const bytes = await readFile(new URL(file.file, interactive));
  if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error(`RGA data changed: ${file.file}`);
}
await cp(new URL('data/', interactive), new URL('data/', target), { recursive: true });
await writeFile(new URL('carte.php', target), Buffer.concat([
  Buffer.from("<?php require __DIR__ . '/guard.php'; ?>\n"),
  Buffer.from((await readFile(new URL('carte.html', interactive), 'utf8')).replace('</head>', `<meta name="avereo-connect-portal" content="<?= htmlspecialchars(avereo_gate_portal($config), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"></head>`)),
]));
await mkdir(new URL('modules/', target), { recursive: true });
for (const file of ['rgaContext.js', 'rgaOverlay.js', 'georisquesRiskSummary.js', 'georisquesReport.js', 'locationMap.js']) {
  await cp(new URL(`../src/${file}`, import.meta.url), new URL(`modules/${file}`, target));
}
await mkdir(new URL('vendor/leaflet/', target), { recursive: true });
for (const file of ['leaflet-src.esm.js', 'leaflet.css', 'images']) {
  await cp(new URL(`../node_modules/leaflet/dist/${file}`, import.meta.url), new URL(`vendor/leaflet/${file}`, target), { recursive: true });
}
await cp(new URL('../node_modules/leaflet/LICENSE', import.meta.url), new URL('vendor/leaflet/LICENSE', target));
console.log('RGA: new address map and verified geographic data packaged.');
