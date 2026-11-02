"""Build a file-only preproduction package, preserving the observed CONNECT baseline."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--previous-manifest', type=Path, help='Manifest of the verified previous deployment')
args = parser.parse_args()
previous = json.loads(args.previous_manifest.read_text(encoding='utf-8')) if args.previous_manifest else None

APP = Path(__file__).resolve().parents[1]
REPO = APP.parents[1]
OUT = APP / 'frontend/.local/rga-delivery'
OUT.mkdir(parents=True, exist_ok=True)
DIST = APP / 'frontend/dist'
SOURCE_SHA = subprocess.check_output(['git', '-C', str(REPO), 'rev-parse', 'HEAD']).decode().strip()
assert subprocess.call(['git', '-C', str(REPO), 'diff', '--quiet', 'HEAD', '--', 'architecture-v1/avereo-app-rapport', 'architecture-v1/avereo-app-connect']) == 0, 'Commit the reviewed source before packaging'
assert not subprocess.check_output(['git', '-C', str(REPO), 'ls-files', '--others', '--exclude-standard', '--', 'architecture-v1/avereo-app-rapport', 'architecture-v1/avereo-app-connect']).strip(), 'Untracked source files'
PATH = 'architecture-v1/avereo-app-connect/backend/src/Application.php'

def at(ref, name):
    return subprocess.check_output(['git', '-C', str(REPO), 'show', ref + ':' + name])

def sha(data):
    return hashlib.sha256(data).hexdigest()

base = at('2e3239b', PATH).decode()
current = (REPO / PATH).read_text(encoding='utf-8')
hosted = at('76566ca43b3e1e03a4a465391aac2f99017517cb', PATH).decode()
assert sha(hosted.encode()) == '50125e1c9f70aadaf31e4846ce752d71ffc29c6791c15947e99f64bcdf83cbbd'
# Use only the two modified methods, never replace unrelated hosted activation code.
for start, end in [
    ("            return Response::redirect(\n                $this->appLaunchTickets->issueLocation(", "\n        }\n\n        if ($auth->userId === null)"),
    ("    private function applicationCatalog(", "\n    private function requireAuthenticated("),
]:
    if start.startswith('            return'):
        new_start = '            $location = $this->appLaunchTickets->issueLocation('
    else:
        new_start = start
    old_part = base[base.index(start):base.index(end, base.index(start))]
    new_part = current[current.index(new_start):current.index(end, current.index(new_start))]
    assert hosted.count(old_part) == 1, 'Hosted method differs from reviewed source'
    hosted = hosted.replace(old_part, new_part, 1)

files = {'connect/src/Application.php': hosted.encode()}
for name in ['index.html', 'connect/entry.php', 'rga/index.php', 'rga/guard.php', 'rga/carte.php', 'rga/address-search.js', 'rga/cadastre-map.js']:
    files['rapport/' + name] = (DIST / name).read_bytes()
for folder in ['assets', 'rga/data', 'rga/modules', 'rga/vendor']:
    for p in sorted((DIST / folder).rglob('*')):
        if p.is_file():
            files['rapport/' + p.relative_to(DIST).as_posix()] = p.read_bytes()
assert not any('gate.php' in n or '.env' in n or 'preview' in n for n in files)
assert files['rapport/rga/carte.php'].startswith(b"<?php require __DIR__ . '/guard.php'; ?>")

archive = OUT / 'candidate.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for name, data in sorted(files.items()):
        info = zipfile.ZipInfo(name, date_time=(2026, 11, 2, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        z.writestr(info, data)
manifest = {'sourceSha': SOURCE_SHA, 'artifactSha256': sha(archive.read_bytes()),
    'connectBaseline': '76566ca43b3e1e03a4a465391aac2f99017517cb',
    'targets': {'connect': '/home/daje3540/connect-preprod.avereo.fr', 'rapport': '/home/daje3540/rapport-preprod.avereo.fr'},
    'previousFiles': {'connect/src/Application.php': '50125e1c9f70aadaf31e4846ce752d71ffc29c6791c15947e99f64bcdf83cbbd',
        'rapport/index.html': '8620dbbc68d201f80b8b6bc3db600039fb7c9747b6cc363fd741758e2bd38ccf',
        'rapport/assets/index-DBhClGNR.js': '69f0ea6cd868901fdbead723f6c797522611782584bfb073b25641de99221263',
        # Hosted entry is byte-identical to this source after CRLF normalization (verified 2026-11-02).
        'rapport/connect/entry.php': sha(at('2e3239b', 'architecture-v1/avereo-app-rapport/frontend/public/connect/entry.php').replace(b'\n', b'\r\n')),
        'rapport/rga/index.php': sha(at('2e3239b', 'architecture-v1/avereo-app-rapport/frontend/public/rga/index.php'))},
    'files': {n: sha(b) for n, b in sorted(files.items())}}
if previous:
    assert previous['targets'] == manifest['targets'], 'Previous target differs'
    assert previous['connectBaseline'] == manifest['connectBaseline'], 'Previous CONNECT baseline differs'
    assert len(previous['sourceSha']) == 40 and len(previous['artifactSha256']) == 64
    manifest['previousFiles'] = previous['files']
    manifest['previousSourceSha'] = previous['sourceSha']
    manifest['previousArtifactSha256'] = previous['artifactSha256']
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
(OUT / 'connect-Application.php').write_bytes(files['connect/src/Application.php'])
print(json.dumps({'archive': str(archive), 'files': len(files), 'sha256': manifest['artifactSha256'], 'sourceSha': SOURCE_SHA}))
