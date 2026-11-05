"""Package only the already built online planning and wrapper, never user data."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
from zipfile import ZipFile, ZIP_DEFLATED

def prepare(source, output):
    source, output = source.resolve(), output.resolve()
    sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source).decode().strip()
    if subprocess.check_output(['git', 'status', '--porcelain'], cwd=source).strip(): raise ValueError('Source must be clean')
    if output.exists(): raise ValueError('Preserve existing package')
    dist = source / 'frontend/dist'
    names = ['.htaccess', 'index.html', 'legacy-app.html', 'planning-core.js', 'planning-local.js', 'task-details.js', 'planning-online.js', 'api/planning.php', 'api/planning-store.php']
    names += [path.relative_to(dist).as_posix() for path in (dist / 'assets').iterdir()]
    for name in names:
        if name != 'index.html' and not name.startswith('assets/') and (dist / name).read_bytes() != (source / 'frontend/public' / name).read_bytes(): raise ValueError('Source/build mismatch')
    output.mkdir(parents=True)
    with ZipFile(output / 'candidate.zip', 'w', ZIP_DEFLATED) as archive:
        for name in names: archive.write(dist / name, name)
    files = {name: hashlib.sha256((dist / name).read_bytes()).hexdigest() for name in names}
    manifest = {'sourceSha': sha, 'artifactSha256': hashlib.sha256((output / 'candidate.zip').read_bytes()).hexdigest(), 'files': files, 'target': 'https://projet-preprod.avereo.fr', 'preserves': ['CONNECT gate', 'CONNECT private config', 'other applications', 'databases', 'existing browser drafts']}
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    for name in ['deploy-preprod-gantt.py', 'deploy-preprod-online.py']: shutil.copy2(source / 'workflows' / name, output / name)
    # Isolated hosted qualification uses synthetic credentials and a temporary root.
    testroot = output / 'qualification/architecture-v1'
    shutil.copytree(source / 'frontend/public/api', testroot / 'avereo-app-projet/frontend/public/api')
    (testroot / 'avereo-app-projet/tests').mkdir()
    shutil.copy2(source / 'tests/planning-http.py', testroot / 'avereo-app-projet/tests/planning-http.py')
    (testroot / 'avereo-platform/shared').mkdir(parents=True)
    shutil.copy2(source.parent / 'avereo-platform/shared/connect-gate.php', testroot / 'avereo-platform/shared/connect-gate.php')
    print(json.dumps(manifest))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    prepare(args.source, args.output)
