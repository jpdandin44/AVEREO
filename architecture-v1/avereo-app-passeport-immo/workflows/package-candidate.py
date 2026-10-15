"""Archive reproductible des seuls assets construits, sans donnée du navigateur."""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_STORED

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from candidate_contract import GATE_FILES, STORAGE_FILES, valid_name

def build(output):
    dist = ROOT / 'frontend/dist'
    if not (dist / 'index.html').is_file():
        raise ValueError('Build absent : exécuter npm run build dans frontend.')
    files = sorted((p for p in dist.rglob('*') if p.is_file()), key=lambda p: p.relative_to(dist).as_posix())
    names = {p.relative_to(dist).as_posix() for p in files}
    if any(p.is_symlink() or not valid_name(p.relative_to(dist).as_posix()) for p in files):
        raise ValueError('Fichier privé, lien ou chemin non autorisé dans le build.')
    if names.intersection(GATE_FILES) and not GATE_FILES.issubset(names):
        raise ValueError('Sas CONNECT incomplet dans le build.')
    if names.intersection(STORAGE_FILES) and not (GATE_FILES | STORAGE_FILES).issubset(names):
        raise ValueError('Stockage serveur incomplet dans le build.')
    output = output.resolve()
    if output.is_relative_to(dist.resolve()):
        raise ValueError('Archive de sortie à placer hors dist.')
    output.parent.mkdir(parents=True, exist_ok=True)
    manifest = []
    with ZipFile(output, 'w', compression=ZIP_STORED) as archive:
        for path in files:
            name = path.relative_to(dist).as_posix()
            content = path.read_bytes()
            if name in GATE_FILES | STORAGE_FILES:
                content = content.replace(b'\r\n', b'\n')
            entry = ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, content)
            manifest.append({'path': name, 'sha256': hashlib.sha256(content).hexdigest(), 'size': len(content)})
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    with ZipFile(output) as archive:
        assert archive.testzip() is None
        assert archive.namelist() == [item['path'] for item in manifest]
        for item in manifest:
            assert hashlib.sha256(archive.read(item['path'])).hexdigest() == item['sha256']
    return digest, manifest

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / '.local/candidate.zip')
    args = parser.parse_args()
    digest, files = build(args.output)
    sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    result = {'sourceSha': sha, 'artifactSha256': digest, 'files': files}
    args.output.with_suffix('.manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'sourceSha': sha, 'artifactSha256': digest, 'files': len(files), 'archiveReadback': 'passed'}))

if __name__ == '__main__':
    main()
