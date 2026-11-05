"""Deliver the account workspace; existing private planning and CONNECT remain in place."""
import importlib.util
import json
from pathlib import Path
import shutil
import sys

BASE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('online_delivery', BASE / 'deploy-preprod-online.py')
online = importlib.util.module_from_spec(spec)
spec.loader.exec_module(online)
online.REQUIRED |= {'api/planning-auth.php', 'api/workspace.php', 'api/workspace-store.php',
                    'project-workspace.js', 'project-workspace.css'}
delivery = online.delivery


def main(action):
    settings, data = online.SETTINGS, online.DATA
    if not settings.is_file() or settings.is_symlink() or not data.is_dir() or data.is_symlink():
        raise ValueError('Qualified private planning store required')
    recovery_file = BASE / 'workspace-recovery.json'
    if action == 'prepare':
        if recovery_file.exists(): raise ValueError('Preserve previous recovery')
        before = delivery.tree(data)
        if 'current.json' not in before: raise ValueError('Existing planning missing')
        delivery.main(action)
        backup = BASE / 'recovery' / 'planning-data'
        restored = BASE / 'rehearsal-planning-data'
        shutil.copytree(data, backup)
        shutil.copytree(backup, restored)
        shutil.copy2(settings, BASE / 'recovery' / 'planning.php')
        if delivery.tree(backup) != before or delivery.tree(restored) != before or delivery.tree(data) != before:
            raise ValueError('Planning recovery mismatch or concurrent change; do not deploy')
        delivery.write_json(recovery_file, {'data': before, 'settingsSha256': delivery.sha(settings),
            'backupVerified': True, 'restoreVerified': True, 'codeRollbackPreservesData': True})
        print('WORKSPACE_DATA_BACKUP_AND_RESTORE_VERIFIED')
    else:
        recovery = json.loads(recovery_file.read_text())
        if delivery.sha(settings) != recovery['settingsSha256']:
            raise ValueError('Planning settings drift')
        if delivery.tree(BASE / 'recovery' / 'planning-data') != recovery['data']:
            raise ValueError('Planning recovery drift')
        if action == 'deploy' and delivery.tree(data) != recovery['data']:
            raise ValueError('Planning changed since preparation; take a fresh backup before delivery')
        delivery.main(action)
        if action == 'deploy':
            after = delivery.tree(data)
            if any(after.get(name) != value for name, value in recovery['data'].items()):
                raise ValueError('Concurrent planning modification; inspect before continuing')
            print('EXISTING_PLANNING_PRESERVED')
        # Rollback is code-only. Never restore an older planning over new user work.


if __name__ == '__main__': main(sys.argv[1])
