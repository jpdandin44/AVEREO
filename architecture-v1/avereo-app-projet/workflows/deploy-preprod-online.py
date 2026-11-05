"""Install the private planning candidate on the single qualified preproduction root.

Reuses the Gantt backup/rehearsal/drift/rollback workflow. CONNECT's gate and
secret configuration stay byte-identical. Planning data survive code rollback.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sys
from zipfile import ZipFile

BASE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('gantt_delivery', BASE / 'deploy-preprod-gantt.py')
delivery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(delivery)
delivery.BASE = BASE
SETTINGS = Path('/home/daje3540/.avereo/projet-preprod/planning.php')
DATA = Path('/home/daje3540/.avereo/projet-preprod/planning-data')
SETTINGS_BYTES = ("<?php\nreturn ['owner_connect_id' => '1', 'origin' => 'https://projet-preprod.avereo.fr', "
                  "'directory' => '/home/daje3540/.avereo/projet-preprod/planning-data'];\n").encode()
REQUIRED = {'.htaccess', 'index.html', 'legacy-app.html', 'planning-core.js', 'planning-local.js',
            'task-details.js', 'planning-online.js', 'api/planning.php', 'api/planning-store.php'}

def validate(base):
    manifest = json.loads((base / 'manifest.json').read_text())
    names = set(manifest['files'])
    if not REQUIRED.issubset(names) or len(names) != len(REQUIRED) + 2:
        raise ValueError('Incomplete candidate')
    assets = names - REQUIRED
    if not all(re.fullmatch(r'assets/index-[A-Za-z0-9_-]+\.(js|css)', name) for name in assets):
        raise ValueError('Unexpected asset')
    if {name.rsplit('.', 1)[-1] for name in assets} != {'js', 'css'}:
        raise ValueError('Expected wrapper assets absent')
    if not re.fullmatch('[0-9a-f]{40}', manifest['sourceSha']) or delivery.sha(base / 'candidate.zip') != manifest['artifactSha256']:
        raise ValueError('Candidate identity invalid')
    with ZipFile(base / 'candidate.zip') as archive:
        entries = archive.infolist()
        if len(entries) != len(names) or {item.filename for item in entries} != names or sum(item.file_size for item in entries) > 5*1024*1024:
            raise ValueError('Invalid archive')
        for item in entries:
            if item.is_dir() or stat.S_ISLNK(item.external_attr >> 16) or hashlib.sha256(archive.read(item)).hexdigest() != manifest['files'][item.filename]:
                raise ValueError('Invalid archive entry')
    delivery.NAMES = names
    return manifest

original_atomic = delivery.atomic_copy
def atomic(source, destination, mode):
    destination.parent.mkdir(parents=True, exist_ok=True)
    return original_atomic(source, destination, mode)

delivery.validate_candidate = validate
delivery.atomic_copy = atomic

def main(action):
    if action == 'prepare':
        if SETTINGS.exists() or DATA.exists():
            raise ValueError('Existing planning storage requires a separate recovery plan')
        delivery.main(action)
        # Rehearse the new non-secret settings on copies; never touch the live gate config.
        sample = BASE / 'rehearsal-planning.php'
        sample.write_bytes(SETTINGS_BYTES); sample.chmod(0o600)
        restored = BASE / 'rehearsal-planning-restored.php'
        shutil.copy2(sample, restored)
        if sample.read_bytes() != restored.read_bytes(): raise ValueError('Settings recovery mismatch')
        delivery.write_json(BASE / 'settings-recovery.json', {'existedBefore': False, 'copyRestorePassed': True, 'sha256': hashlib.sha256(SETTINGS_BYTES).hexdigest(), 'dataPreservedOnRollback': True})
    elif action == 'deploy':
        if SETTINGS.exists() or DATA.exists(): raise ValueError('Storage appeared after preparation')
        delivery.target_identity(); validate(BASE)
        # Check all drift guards before creating the additional private configuration.
        state = json.loads((BASE / 'recovery.json').read_text())
        if delivery.tree(delivery.TARGET) != state['before'] or delivery.sha(delivery.CONFIG) != state['configSha256']:
            raise ValueError('Target drift')
        DATA.mkdir(mode=0o700)
        with open(str(SETTINGS), 'xb') as handle: handle.write(SETTINGS_BYTES)
        SETTINGS.chmod(0o600)
        try: delivery.main(action)
        except Exception:
            os.replace(str(SETTINGS), str(BASE / 'planning-settings-after-failure.php'))
            raise
    elif action in ('verify', 'rollback'):
        if not SETTINGS.is_file() or SETTINGS.is_symlink() or SETTINGS.read_bytes() != SETTINGS_BYTES or DATA.is_symlink():
            raise ValueError('Private settings drift')
        delivery.main(action)
        if action == 'rollback': os.replace(str(SETTINGS), str(BASE / 'planning-settings-after-rollback.php'))
    else: raise ValueError('Unknown action')

if __name__ == '__main__':
    main(sys.argv[1])
