// Package the frozen source maps behind the same CONNECT gate as Rapport.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const source = new URL('../../data/rga/', import.meta.url);
const target = new URL('../dist/rga/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('sources.json', source), 'utf8'));
await mkdir(target, { recursive: true });
for (const map of manifest.maps) {
  const bytes = await readFile(new URL(map.file, source));
  if (createHash('sha256').update(bytes).digest('hex') !== map.sha256) throw new Error(`RGA source changed: ${map.file}`);
  // Never publish the raw HTML: every map request must execute the PHP gate first.
  await writeFile(new URL(map.output, target), Buffer.concat([
    Buffer.from("<?php require __DIR__ . '/guard.php'; ?>\n"), bytes,
  ]));
}
console.log(`RGA: ${manifest.maps.length} protected maps packaged.`);
