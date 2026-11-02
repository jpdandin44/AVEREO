"""Compose RGA access changes with the qualified hosted CONNECT/Rapport baselines."""
from pathlib import Path
import argparse, hashlib, io, json, os, re, subprocess, sys, zipfile

APP = Path(__file__).resolve().parents[1]
REPO = APP.parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--observed', type=Path, required=True)
parser.add_argument('--rapport-build', type=Path, required=True, help='Isolated Rapport checkout at the hosted 63ec279 baseline, already built')
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
out = args.output.resolve()
out.mkdir(parents=True, exist_ok=True)
assert not (out / 'candidate.zip').exists(), 'Use a fresh delivery directory'
source_sha = subprocess.check_output(['git', '-C', str(REPO), 'rev-parse', 'HEAD']).decode().strip()
assert subprocess.call(['git', '-C', str(REPO), 'diff', '--quiet', 'HEAD', '--', 'architecture-v1/avereo-app-connect', 'architecture-v1/avereo-app-rapport']) == 0, 'Commit reviewed sources first'

def at(ref, name):
    return subprocess.check_output(['git', '-C', str(REPO), 'show', ref + ':' + name])

def sha(data):
    return hashlib.sha256(data).hexdigest()

def replace_once(text, old, new):
    assert text.count(old) == 1, 'Observed source differs from reviewed patch'
    return text.replace(old, new, 1)

trees = json.loads((args.observed / 'observed-trees.json').read_text())
build = args.rapport_build.resolve()
dist = build / 'frontend/dist'
# Rebuild the prior source first: the actual served HTML and its assets must match.
baseline_index = (dist / 'index.html').read_bytes()
assert sha(baseline_index) == trees['rapport']['index.html'], 'Rapport baseline HTML differs'
for name in re.findall(r'(?:src|href)="(/assets/[^\"]+)"', baseline_index.decode()):
    assert sha((dist / name.lstrip('/')).read_bytes()) == trees['rapport'][name.lstrip('/')]

prefix = 'architecture-v1/avereo-app-rapport/'
changes = ['frontend/src/LocationMap.jsx', 'frontend/src/RgaMap.jsx', 'frontend/src/useRgaAccess.js',
           'frontend/public/rga/guard.php', 'frontend/public/rga/gate.php', 'frontend/public/rga/entry.php',
           'frontend/public/rga/resume.php', 'frontend/public/rga/access.php', 'frontend/scripts/build-rga.mjs',
           'tests/rga-gate.php', 'tests/rga-http.py']
for name in changes:
    destination = build / name
    if destination.exists():
        assert destination.read_bytes() == at('c3b6c08', prefix + name), 'Overlapping later Rapport change: ' + name
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes((APP / name).read_bytes())

files = {}
connect = 'architecture-v1/avereo-app-connect/backend/'
for name in ['src/Application.php', 'src/Config.php', 'public/index.php']:
    observed = (args.observed / 'connect' / name).read_bytes()
    assert sha(observed) == trees['connect'][name]
    text = observed.decode().replace('\r\n', '\n')
    if name == 'src/Application.php':
        old = at('c3b6c08', connect + name).decode()
        new = (REPO / connect / name).read_text(encoding='utf-8')
        for start, end in [('            $location = $this->appLaunchTickets->issueLocation(', '\n        }\n\n        if ($auth->userId === null)'),
                           ('    private function applicationCatalog(', '\n    private function requireAuthenticated(')]:
            before = old[old.index(start):old.index(end, old.index(start))]
            after = new[new.index(start):new.index(end, new.index(start))]
            text = replace_once(text, before, after)
    elif name == 'src/Config.php':
        for suffix in ['URL', 'SECRET']:
            line = "                'rapport' => self::env('APP_LAUNCH_RAPPORT_" + suffix + "'),"
            text = replace_once(text, line, line + "\n                'rga' => self::env('APP_LAUNCH_RGA_" + suffix + "'),")
    else:
        line = "            'APP_LAUNCH_RAPPORT_URL', 'APP_LAUNCH_RAPPORT_SECRET',"
        text = replace_once(text, line, line + "\n            'APP_LAUNCH_RGA_URL', 'APP_LAUNCH_RGA_SECRET',")
    files['connect/' + name] = text.encode()
for name in ['src/Repository/RgaRegistration.php', 'bin/register-rga.php']:
    files['connect/' + name] = (REPO / connect / name).read_bytes()

staged = out / 'connect-candidate'
for name, data in files.items():
    p = staged / name.removeprefix('connect/')
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)
(out / 'composition.json').write_text(json.dumps({'sourceSha': source_sha,
    'rapportBaseline': '63ec279abfadab31a453543e85460f46c6ed07b9', 'rapportBuild': str(build),
    'connectBaseline': '76566ca43b3e1e03a4a465391aac2f99017517cb', 'changes': changes,
    'observed': str(args.observed.resolve())}, indent=2) + '\n')
test_root = out / 'connect-test'
assert not test_root.exists()
with zipfile.ZipFile(io.BytesIO(subprocess.check_output(['git', '-C', str(REPO), 'archive', '--format=zip',
        '76566ca43b3e1e03a4a465391aac2f99017517cb', 'architecture-v1/avereo-app-connect/backend']))) as z:
    z.extractall(test_root)
backend = test_root / connect
for name, data in files.items():
    p = backend / name.removeprefix('connect/')
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)
# Exercise the new permission assertions with the hosted backend's own 32-test suite.
test_file = backend / 'tests/run.php'
old = test_file.read_text(encoding='utf-8')
new = (REPO / connect / 'tests/run.php').read_text(encoding='utf-8')
marker = "$tests['launch ticket is signed and application bound'] ="
before = old[old.index(marker):old.index("$tests[", old.index(marker) + len(marker))]
after = new[new.index(marker):new.index("$tests[", new.index(marker) + len(marker))]
test_file.write_text(replace_once(old, before, after), encoding='utf-8')
subprocess.run(['php', str(test_file)], check=True)
for p in staged.rglob('*.php'):
    subprocess.run(['php', '-l', str(p)], check=True)
npm = 'npm.cmd' if os.name == 'nt' else 'npm'
subprocess.run([npm, 'test'], cwd=build / 'frontend', check=True)
subprocess.run([npm, 'run', 'build'], cwd=build / 'frontend', env=dict(os.environ, VITE_ENABLE_ONLINE_SYNC='true'), check=True)
subprocess.run(['php', str(build / 'tests/rga-gate.php')], check=True)
subprocess.run([sys.executable, str(build / 'tests/rga-http.py')], check=True)
for name in ['index.html', 'rga/guard.php', 'rga/gate.php', 'rga/connect-gate.php', 'rga/entry.php', 'rga/resume.php', 'rga/access.php']:
    files['rapport/' + name] = (dist / name).read_bytes()
for name in re.findall(r'(?:src|href)="(/assets/[^\"]+)"', (dist / 'index.html').read_text()):
    relative = name.lstrip('/')
    data = (dist / relative).read_bytes()
    if sha(data) != trees['rapport'].get(relative):
        files['rapport/' + relative] = data
archive = out / 'candidate.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, data in sorted(files.items()):
        info = zipfile.ZipInfo(name, date_time=(2026, 11, 2, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        z.writestr(info, data)
manifest = {'kind': 'rga-independent-access', 'sourceSha': source_sha, 'artifactSha256': sha(archive.read_bytes()),
    'rapportBaseline': '63ec279abfadab31a453543e85460f46c6ed07b9',
    'connectBaseline': '76566ca43b3e1e03a4a465391aac2f99017517cb',
    'targets': {'connect': '/home/daje3540/connect-preprod.avereo.fr', 'rapport': '/home/daje3540/rapport-preprod.avereo.fr'},
    'previousFiles': {k + '/' + n: h for k, tree in trees.items() for n, h in tree.items()},
    'files': {n: sha(data) for n, data in sorted(files.items())}}
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'status': 'tested_and_packaged', 'sourceSha': source_sha, 'files': len(files), 'artifactSha256': manifest['artifactSha256']}))
