import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
test('workspace delivery preserves gates, restores copies and refuses files outside its scope', () => {
    const script = String.raw`
import importlib.util,tempfile,pathlib,json,hashlib,zipfile,os,shutil
spec=importlib.util.spec_from_file_location('online',${JSON.stringify(fileURLToPath(new URL('../workflows/deploy-preprod-workspace.py', import.meta.url)))})
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);d=m.delivery
with tempfile.TemporaryDirectory() as tmp:
 b=pathlib.Path(tmp);r=b/'target';r.mkdir();(b/'candidate').mkdir()
 (r/'index.php').write_text('gate preserved');(r/'connect').mkdir();(r/'connect/gate.php').write_text('identity preserved')
 names=m.online.REQUIRED|{'assets/index-test.js','assets/index-test.css'}
 if os.name=='nt':
  for n in names:(r/n).parent.mkdir(parents=True,exist_ok=True);(r/n).write_text('before')
 before=d.tree(r);shutil.copytree(r,b/'recovery/root');files={}
 with zipfile.ZipFile(b/'candidate.zip','w') as z:
  for n in names:
   content=('new '+n).encode();z.writestr(n,content);files[n]=hashlib.sha256(content).hexdigest();(b/'candidate'/n).parent.mkdir(parents=True,exist_ok=True);(b/'candidate'/n).write_bytes(content)
 manifest={'sourceSha':'a'*40,'artifactSha256':d.sha(b/'candidate.zip'),'files':files}
 (b/'manifest.json').write_text(json.dumps(manifest));m.online.validate(b)
 d.install(r,b,before,manifest);assert (r/'connect/gate.php').read_text()=='identity preserved'
 d.restore(r,b,before,manifest);assert d.tree(r)==before
 manifest['files']['connect/gate.php']='b'*64;(b/'manifest.json').write_text(json.dumps(manifest))
 try:m.online.validate(b);raise AssertionError('gate replacement accepted')
 except ValueError:pass
 print('online copy install / restore / scope passed')
`;
    const result = spawnSync(process.platform === 'win32' ? 'python.exe' : 'python3', ['-c', script], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
});
