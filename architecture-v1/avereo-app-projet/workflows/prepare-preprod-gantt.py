"""Package the four already-built static planning files. No hosted access."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
from zipfile import ZipFile, ZIP_DEFLATED

NAMES = ('legacy-app.html', 'planning-core.js', 'planning-local.js', 'task-details.js')


def prepare(source, output):
    source, output = source.resolve(), output.resolve()
    sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source, text=True).strip()
    if subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=normal'], cwd=source, text=True).strip():
        raise ValueError('Source checkout is not clean')
    if output.exists():
        raise ValueError('Output already exists; preserve the previous package')
    files = {}
    for name in NAMES:
        path = source / 'frontend' / 'dist' / name
        if path.is_symlink() or not path.is_file() or path.read_bytes() != (source / 'frontend' / 'public' / name).read_bytes():
            raise ValueError('Source/build mismatch: ' + name)
        files[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    output.mkdir(parents=True)
    with ZipFile(output / 'candidate.zip', 'w', compression=ZIP_DEFLATED) as archive:
        for name in NAMES:
            archive.write(source / 'frontend' / 'dist' / name, name)
    manifest = {'project': 'avereo-app-projet', 'sourceSha': sha, 'target': '/home/daje3540/projet-preprod.avereo.fr',
                'artifactSha256': hashlib.sha256((output / 'candidate.zip').read_bytes()).hexdigest(),
                'files': files, 'preserves': ['index.php', 'index.html', '.htaccess', 'connect/', 'private configuration', 'databases'],
                'note': 'The existing hosted wrapper must reference /legacy-app.html.'}
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    shutil.copy2(source / 'workflows' / 'deploy-preprod-gantt.py', output / 'deploy-preprod-gantt.py')
    print(json.dumps(manifest))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    prepare(args.source, args.output)
