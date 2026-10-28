import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('preproduction delivery validates the package and rehearses guarded install/rollback on a fixture', () => {
    const script = String.raw`
import importlib.util, tempfile, pathlib, json, hashlib, stat, zipfile, os
spec=importlib.util.spec_from_file_location('delivery', ${JSON.stringify(fileURLToPath(new URL('../workflows/deploy-preprod-gantt.py', import.meta.url)))})
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as tmp:
 base=pathlib.Path(tmp);root=base/'target';root.mkdir();(base/'recovery').mkdir();(base/'recovery'/'root').mkdir();(base/'candidate').mkdir()
 (root/'legacy-app.html').write_text('old');(root/'.htaccess').write_text('preserved');(root/'index.php').write_text('preserved gate');(root/'index.html').write_text('wrapper')
 # Windows does not implement POSIX chmod for new files. Existing-file mode
 # preservation is checked there; creation/removal with mode 0644 runs on Linux CI.
 if os.name=='nt':
  for name in m.NAMES:
   if not (root/name).exists():(root/name).write_text('old '+name)
 before=m.tree(root)
 files={}
 with zipfile.ZipFile(base/'candidate.zip','w') as z:
  for name in m.NAMES:
   content=('new '+name).encode();z.writestr(name,content);files[name]=hashlib.sha256(content).hexdigest();(base/'candidate'/name).write_bytes(content)
 manifest={'sourceSha':'a'*40,'artifactSha256':m.sha(base/'candidate.zip'),'files':files}
 (base/'manifest.json').write_text(json.dumps(manifest))
 assert m.validate_candidate(base)==manifest
 import shutil
 for name in before:shutil.copy2(root/name,base/'recovery'/'root'/name)
 m.install(root,base,before,manifest)
 assert (root/'.htaccess').read_text()=='preserved' and (root/'index.php').read_text()=='preserved gate'
 m.restore(root,base,before,manifest);assert m.tree(root)==before
 m.install(root,base,before,manifest);(root/'planning-core.js').write_text('concurrent user edit')
 try:m.restore(root,base,before,manifest);raise AssertionError('drift accepted')
 except ValueError:pass
 assert (root/'planning-core.js').read_text()=='concurrent user edit'
 (base/'manifest.json').write_text(json.dumps(dict(manifest,sourceSha='bad')))
 try:m.validate_candidate(base);raise AssertionError('bad sha accepted')
 except ValueError:pass
 (base/'manifest.json').write_text(json.dumps(manifest));(base/'candidate.zip').write_bytes(b'broken')
 try:m.validate_candidate(base);raise AssertionError('corrupt zip accepted')
 except ValueError:pass
 print('fixture install, rollback, access preservation, drift and invalid candidate refusals passed')
`;
    const result = spawnSync(process.platform === 'win32' ? 'python.exe' : 'python3', ['-c', script], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
});
