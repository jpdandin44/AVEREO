"""Guarded file-only delivery to Projet preproduction; no SQL or auth writes.

Adapted from the qualified Rapport file-only delivery workflow. The command line
does not accept an alternative target or additional files. Run from private staging.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from zipfile import ZipFile

TARGET = Path('/home/daje3540/projet-preprod.avereo.fr')
PRIVATE = Path('/home/daje3540/private')
CONFIG = Path('/home/daje3540/.avereo/projet-preprod/config.php')
BASE = Path(__file__).resolve().parent
NAMES = {'legacy-app.html', 'planning-core.js', 'planning-local.js', 'task-details.js'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tree(root):
    result = {}
    for path in sorted(root.rglob('*')):
        if path.is_symlink():
            raise ValueError('Symlink refused')
        if path.is_file():
            result[path.relative_to(root).as_posix()] = {'sha256': sha(path), 'mode': stat.S_IMODE(path.stat().st_mode)}
    return result


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    path.chmod(0o600)


def validate_candidate(base):
    manifest = json.loads((base / 'manifest.json').read_text(encoding='utf-8'))
    if set(manifest['files']) != NAMES or not re.fullmatch('[0-9a-f]{40}', manifest['sourceSha']):
        raise ValueError('Candidate scope or source SHA invalid')
    if sha(base / 'candidate.zip') != manifest['artifactSha256']:
        raise ValueError('Archive hash mismatch')
    with ZipFile(base / 'candidate.zip') as archive:
        entries = archive.infolist()
        if len(entries) != 4 or {entry.filename for entry in entries} != NAMES:
            raise ValueError('Archive scope invalid')
        if sum(entry.file_size for entry in entries) > 5 * 1024 * 1024:
            raise ValueError('Archive too large')
        for entry in entries:
            if entry.is_dir() or stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError('Non-regular archive entry')
            if hashlib.sha256(archive.read(entry)).hexdigest() != manifest['files'][entry.filename]:
                raise ValueError('Candidate file hash mismatch')
    return manifest


def expected(before, manifest):
    after = dict(before)
    for name, digest in manifest['files'].items():
        after[name] = {'sha256': digest, 'mode': before.get(name, {}).get('mode', 0o644)}
    return after


def atomic_copy(source, destination, mode):
    with tempfile.NamedTemporaryFile(dir=destination.parent, prefix='.avereo-gantt-', delete=False) as handle:
        pending = Path(handle.name)
    try:
        shutil.copyfile(source, pending)
        pending.chmod(mode)
        os.replace(pending, destination)
    finally:
        if pending.exists():
            pending.unlink()


def install(root, base, before, manifest):
    # Dependencies first, HTML entry last; never replace a gate/configuration.
    for name in sorted(NAMES, key=lambda name: name == 'legacy-app.html'):
        atomic_copy(base / 'candidate' / name, root / name, before.get(name, {}).get('mode', 0o644))
    if tree(root) != expected(before, manifest):
        raise ValueError('Unexpected target changes')


def restore(root, base, before, manifest):
    # Refuse overwriting changes received after delivery.
    if tree(root) != expected(before, manifest):
        raise ValueError('Target drift; refuse rollback')
    for name in NAMES:
        if name in before:
            atomic_copy(base / 'recovery' / 'root' / name, root / name, before[name]['mode'])
        else:
            (root / name).unlink()  # Added candidate file remains recoverable in candidate.zip.
    if tree(root) != before:
        raise ValueError('Restore mismatch')


def target_identity():
    if not TARGET.is_dir() or TARGET.is_symlink() or TARGET.resolve() != TARGET:
        raise ValueError('Target identity invalid')
    if PRIVATE.resolve() not in BASE.resolve().parents or not CONFIG.is_file() or CONFIG.is_symlink():
        raise ValueError('Private staging/configuration invalid')
    raw = json.loads(subprocess.check_output(['uapi', '--output=json', 'DomainInfo', 'single_domain_data', 'domain=projet-preprod.avereo.fr']))
    result = raw.get('result', raw)
    if result.get('status') != 1 or Path(result['data']['documentroot']).resolve() != TARGET:
        raise ValueError('cPanel document root mismatch')


def main(action):
    if action not in ('prepare', 'deploy', 'verify', 'rollback'):
        raise ValueError('Unknown action')
    target_identity()
    manifest = validate_candidate(BASE)
    state_file = BASE / 'recovery.json'
    if action == 'prepare':
        if state_file.exists() or (BASE / 'recovery').exists() or (BASE / 'candidate').exists():
            raise ValueError('Staging already prepared; do not replace recovery')
        before = tree(TARGET)
        if not {'.htaccess', 'index.php', 'index.html', 'legacy-app.html'}.issubset(before):
            raise ValueError('Expected application entry/gates absent')
        with ZipFile(BASE / 'candidate.zip') as archive:
            archive.extractall(BASE / 'candidate')  # Exactly four validated bare filenames.
        (BASE / 'recovery').mkdir(mode=0o700)
        shutil.copytree(TARGET, BASE / 'recovery' / 'root')
        shutil.copy2(CONFIG, BASE / 'recovery' / 'config.php')
        (BASE / 'recovery' / 'config.php').chmod(0o600)
        if tree(BASE / 'recovery' / 'root') != before or sha(BASE / 'recovery' / 'config.php') != sha(CONFIG):
            raise ValueError('Backup mismatch')
        rehearsal = BASE / 'rehearsal'
        shutil.copytree(BASE / 'recovery' / 'root', rehearsal)
        install(rehearsal, BASE, before, manifest)
        restore(rehearsal, BASE, before, manifest)
        if tree(TARGET) != before:
            raise ValueError('Target changed during recovery rehearsal')
        data = {'observedAt': datetime.now(timezone.utc).isoformat(), 'target': str(TARGET),
                'sourceSha': manifest['sourceSha'], 'artifactSha256': manifest['artifactSha256'],
                'before': before, 'configSha256': sha(CONFIG), 'backupVerified': True,
                'restoreVerified': True, 'databaseWrites': False}
        write_json(state_file, data)
        receipt = {key: data[key] for key in ('observedAt', 'target', 'sourceSha', 'artifactSha256', 'backupVerified', 'restoreVerified', 'databaseWrites')}
    else:
        data = json.loads(state_file.read_text())
        if data['target'] != str(TARGET) or data['sourceSha'] != manifest['sourceSha'] or data['artifactSha256'] != manifest['artifactSha256']:
            raise ValueError('Recovery/candidate mismatch')
        if tree(BASE / 'recovery' / 'root') != data['before'] or sha(CONFIG) != data['configSha256'] or sha(BASE / 'recovery' / 'config.php') != data['configSha256']:
            raise ValueError('Recovery/private configuration changed')
        before = data['before']
        if action == 'deploy':
            if tree(TARGET) != before:
                raise ValueError('Target changed since backup')
            try:
                install(TARGET, BASE, before, manifest)
            except Exception:
                # Never overwrite an unrelated post-backup change during recovery.
                for name in NAMES:
                    current = TARGET / name
                    allowed = {manifest['files'][name], before.get(name, {}).get('sha256')}
                    if current.is_file() and sha(current) not in allowed:
                        raise ValueError('Target drift; manual recovery required')
                for name in NAMES:
                    if name in before:
                        atomic_copy(BASE / 'recovery' / 'root' / name, TARGET / name, before[name]['mode'])
                    elif (TARGET / name).is_file() and sha(TARGET / name) == manifest['files'][name]:
                        (TARGET / name).unlink()
                raise
        elif action == 'rollback':
            restore(TARGET, BASE, before, manifest)
        elif tree(TARGET) != expected(before, manifest):
            raise ValueError('Hosted candidate mismatch')
        if sha(CONFIG) != data['configSha256']:
            raise ValueError('Private configuration changed')
        receipt = {'observedAt': datetime.now(timezone.utc).isoformat(), 'target': str(TARGET),
                   'sourceSha': manifest['sourceSha'], 'artifactSha256': manifest['artifactSha256'],
                   'status': 'restored' if action == 'rollback' else 'delivered' if action == 'deploy' else 'verified',
                   'files': manifest['files'], 'privateConfigUnchanged': True, 'databaseWrites': False}
    write_json(BASE / (action + '-receipt.json'), receipt)
    print(json.dumps(receipt))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python3 deploy-preprod-gantt.py prepare|deploy|verify|rollback')
    main(sys.argv[1])
