import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const frontend = fileURLToPath(new URL('../frontend/', import.meta.url));
const dist = join(frontend, 'dist');
async function files(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(join(folder, entry.name)) : join(folder, entry.name)))).flat();
}
const artifacts = await files(dist);
for (const file of artifacts) {
  assert.ok(!/\.(md|csv|json)$/i.test(file), `Donnée locale interdite dans dist : ${relative(dist, file)}`);
  if (file.endsWith('.js')) {
    const content = await readFile(file, 'utf8');
    assert.ok(!content.includes('/local-review/'), 'Interface de revue locale présente dans le build hébergé.');
  }
}
for (const file of ['index.php', 'connect/entry.php', 'connect/gate.php', 'connect/logout.php', '.htaccess']) assert.ok((await readFile(join(dist, file))).length > 0, `Sas absent : ${file}`);
for (const file of ['legacy-app.html', 'planning-core.js', 'planning-local.js', 'task-details.js']) assert.deepEqual(await readFile(join(frontend, 'public', file)), await readFile(join(dist, file)), `Asset historique modifié : ${file}`);
console.log(`Artefact vérifié : ${artifacts.length} fichiers ; aucune donnée ou API de revue, pilote absent, sas et planning conservés.`);
