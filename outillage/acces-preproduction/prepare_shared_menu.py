"""Prepare PR119 recovery and a proposed file plan; never write to live roots.

Uses the existing delivery library's path, hash and cPanel root checks. All
writes stay under a new private work directory. No deploy or SQL action exists.
"""
import argparse
from datetime import datetime, timezone
import json
import os
import re
from pathlib import Path
import shutil
import zipfile

from release_selected_preprod import declared_root, digest, record, require, safe_name

HOME = Path('/home/daje3540')
SOURCE = 'e08cbde814bb552dd3bdfa0ebec101fc0dcc5d52'
TARGETS = {name: HOME / (name + '-preprod.avereo.fr') for name in
           ('rapport', 'coupe', 'projet', 'thermo', 'drone')}
TARGETS.update(connect=HOME / 'connect-preprod.avereo.fr/public',
               **{'passeport-immo': HOME / 'passeport-immo-preprod.avereo.fr/public'})
CONNECT_PATHS = {'account-menu.js', 'index.html'}
ACTIVATION_SHA = '5729f0816c6f1be59ae3881b509f53807af7b8bcd0f558554d7b0647cc93a3ff'


def operation(name, content, before):
    safe_name(name)
    if Path(name).name in ('.htaccess', '.user.ini'):
        require(before['exists'], 'Hosted protection absent: ' + name)
        action = 'preserve'
    elif before['exists'] and before['sha256_lf'] == digest(content.replace(b'\r\n', b'\n')):
        action = 'preserve'
    else:
        action = 'replace' if before['exists'] else 'create'
    after = before if action == 'preserve' else {
        'exists': True, 'sha256': digest(content),
        'sha256_lf': digest(content.replace(b'\r\n', b'\n')),
        'bytes': len(content), 'mode': before.get('mode', 0o644)}
    return {'action': action, 'before': before, 'after': after,
            'rollback': 'none' if action == 'preserve' else
            ('restore_backup' if before['exists'] else 'remove_added_file_if_unchanged')}


def recover_files(root, files, recovery):
    """Exercise candidate replacement and inverse operations on private copies."""
    require(root.resolve() == root and root.is_dir(), 'Unsafe active root')
    require(not recovery.exists(), 'Recovery already exists')
    backup, rehearsal = recovery / 'backup', recovery / 'rehearsal'
    backup.mkdir(parents=True, mode=0o700)
    rehearsal.mkdir(mode=0o700)
    operations = {}
    for name, content in sorted(files.items()):
        safe_name(name)
        source = root / name
        require(source.resolve() == source, 'Linked candidate parent')
        before = record(source)
        op = operation(name, content, before)
        operations[name] = op
        for folder in (backup, rehearsal):
            target = folder / name
            target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            if before['exists']:
                shutil.copy2(source, target)
                require(record(target) == before, 'Backup mismatch')
        target = rehearsal / name
        if op['action'] != 'preserve':
            target.write_bytes(content)
            target.chmod(op['after']['mode'])
            require(record(target) == op['after'], 'Rehearsal write mismatch')
            if before['exists']:
                shutil.copy2(backup / name, target)
            else:
                target.unlink()  # Only the just-created, hash-checked private copy.
        require(record(target) == before == record(source), 'Restore mismatch or active drift')
    require(all(record(root / name) == op['before'] for name, op in operations.items()),
            'Concurrent active change')
    return operations


def snapshot_private(source, destination):
    require(source.resolve() == source and source.is_file(), 'Private source missing or linked')
    destination.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    before = record(source)
    shutil.copy2(source, destination)
    restored = destination.with_name(destination.name + '.restored')
    shutil.copy2(destination, restored)
    require(record(restored) == record(destination) == before == record(source), 'Private recovery mismatch')
    return before


def require_source(actual, expected):
    require(bool(re.fullmatch(r"[0-9a-f]{40}", expected)) and actual == expected, "Source differs")


def main(work, expected_source=SOURCE):
    require(work.is_dir() and work.resolve() == work and
            work.parent == HOME / 'private' and work.name.startswith('mon-espace-preprod-'),
            'New private work directory required')
    require(not (work / 'preparation.json').exists() and not (work / 'recovery').exists(),
            'Preserve existing preparation')
    os.umask(0o077)
    manifest = json.loads((work / 'candidate-manifest.json').read_text())
    require_source(manifest['source_sha'], expected_source)
    apps = {a['app']: a for a in manifest['applications']}
    require(set(apps) == set(TARGETS) | {'recherche'}, 'Candidate scope differs')
    roots = {name: declared_root(name + '-preprod.avereo.fr') for name in TARGETS}
    require(roots == TARGETS, 'Declared preproduction roots differ')
    try:
        declared_root('recherche-preprod.avereo.fr')
    except ValueError:
        pass
    else:
        raise ValueError('Recherche target appeared; inspect it before extending the plan')
    activation = HOME / 'connect-preprod.avereo.fr/src/Application.php'
    require(record(activation)['sha256'] == ACTIVATION_SHA, 'Installed PR118 differs')
    result = {'observedAt': datetime.now(timezone.utc).isoformat(), 'sourceSha': expected_source,
              'applications': {}, 'liveFilesModified': False, 'databaseAccessed': False,
              'configurationModified': False, 'deploymentAuthorized': False,
              'rollbackScope': 'files and modes; preserve current user data'}
    comparison = {}
    for name, root in TARGETS.items():
        app = apps[name]
        archive_path = work / app['archive']
        require(digest(archive_path.read_bytes()) == app['artifact_sha256'], 'Archive hash differs')
        with zipfile.ZipFile(archive_path) as archive:
            entries = archive.infolist()
            require(len(entries) == len(app['files']) and
                    {i.filename for i in entries} == set(app['files']), 'Archive inventory differs')
            files = {}
            for item in entries:
                rel = safe_name(item.filename)
                require(not item.is_dir() and (item.external_attr >> 16) & 0o170000 != 0o120000,
                        'Non-file archive entry')
                data = archive.read(rel)
                require(digest(data) == app['files'][rel]['sha256'], 'File hash differs')
                if name == 'connect':
                    if not rel.startswith('public/') or rel[7:] not in CONNECT_PATHS:
                        continue
                    rel = rel[7:]
                files[rel] = data
        operations = recover_files(root, files, work / 'recovery' / name)
        config = HOME / 'private/connect-preprod/config.php' if name == 'connect' else \
                 HOME / '.avereo' / (name + '-preprod') / 'config.php'
        private = snapshot_private(config, work / 'recovery' / name / 'private-config.php')
        # Retain only non-secret summaries outside the server's recovery folder.
        for rel, op in operations.items():
            if op['action'] == 'replace' and Path(rel).suffix in ('.php', '.html', '.js', '.css') \
                    and not rel.startswith(('assets/', 'rga/data/', 'rga/vendor/')):
                comparison[name + '/' + rel] = (root / rel).read_bytes()
        result['applications'][name] = {
            'root': str(root), 'artifactSha256': app['artifact_sha256'],
            'operations': operations,
            'counts': {a: sum(op['action'] == a for op in operations.values())
                       for a in ('preserve', 'replace', 'create')},
            'backupAndRestoreOnCopies': 'passed', 'privateConfigurationRecovery': 'passed',
            'privateConfigurationSha256': private['sha256']}
    snapshot_private(activation, work / 'recovery/connect/protected-Application.php')
    result['installedPr118Preserved'] = record(activation)['sha256'] == ACTIVATION_SHA
    planning = HOME / '.avereo/projet-preprod/planning-data'
    require(planning.is_dir() and planning.resolve() == planning, 'Private planning absent')
    planning_files = [p for p in planning.rglob('*') if p.is_file()]
    for path in planning_files:
        snapshot_private(path, work / 'recovery/projet/planning-data' / path.relative_to(planning))
    result['planningRecovery'] = {'fileCount': len(planning_files), 'byteIdentical': True,
                                  'dataWillNotBeRestoredOverNewWork': True}
    result['recherche'] = {'status': 'target_not_declared', 'candidatePrepared': True,
                            'hostingAndConnectSetupRequired': True}
    result['saisieUnique'] = {'status': 'standalone_local_application', 'hostingConfigured': False}
    for name, app in result['applications'].items():
        require(all(record(TARGETS[name] / rel) == op['before']
                    for rel, op in app['operations'].items()), 'Active drift after preparation')
    (work / 'preparation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    with zipfile.ZipFile(work / 'review.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('preparation.json', (work / 'preparation.json').read_bytes())
        for name, data in comparison.items():
            archive.writestr('before/' + name, data)
    print(json.dumps({'status': 'prepared_not_deployed', 'applications':
                     {a: x['counts'] for a, x in result['applications'].items()},
                     'planningFilesPreserved': len(planning_files)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--work', required=True, type=Path)
    parser.add_argument('--expected-source', default=SOURCE)
    args = parser.parse_args()
    main(args.work, args.expected_source)
