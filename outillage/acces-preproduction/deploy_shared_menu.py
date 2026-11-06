"""Deliver the authorized PR121 payload to its seven fixed preproduction roots.

No build, SQL, account change, migration or production target. Preparation and
rollback copies stay private; active writes are limited to the pinned manifest.
"""
import argparse
import json
import os
from pathlib import Path
import zipfile

from prepare_shared_menu import HOME, TARGETS, ACTIVATION_SHA, recover_files, snapshot_private
from release_selected_preprod import atomic_write, declared_root, digest, now, record, require, safe_name, tree, write_json

SOURCE = '317863a9e5603fbbed578a5aa9cfc323cb17b977'
MERGE = 'b12e9bcb6bc529d48565466776f0a5be95791398'
PAYLOAD = '14e1983cc97e113d4238e0f3ffb1f2fc6a2e7d755eeba82dd76a038b45ab359b'
MANIFEST = '40748d3b1c633cf80778e138606e90f182181c0a8b19852f6596ed7f2c1974ef'
WORK = HOME / 'private/mon-espace-preprod-317863a-20261106'


def load(work):
    require(work == WORK and work.resolve() == work and work.is_dir(), 'Exact private workspace required')
    selected = work / 'selection-menu'
    raw = (selected / 'selection.json').read_bytes()
    require(digest(raw) == MANIFEST, 'Manifest differs from authorized selection')
    selection = json.loads(raw)
    require(selection['sourceSha'] == SOURCE and selection['artifactSha256'] == PAYLOAD,
            'Authorized source or payload differs')
    require(set(selection['applications']) == set(TARGETS), 'Exact seven-target scope required')
    receipt = json.loads((selected / 'verification.json').read_text())
    require(receipt['sourceSha'] == SOURCE and receipt['artifactSha256'] == PAYLOAD
            and receipt['status'] == 'rehearsed_not_deployed', 'Rehearsal evidence differs')
    require(all(receipt['applications'][name]['backupAndRestoreOnCopies'] == 'passed'
                for name in TARGETS), 'Recovery not qualified')
    archive_path = selected / 'payload.zip'
    require(digest(archive_path.read_bytes()) == PAYLOAD, 'Payload bytes differ')
    files = {}
    with zipfile.ZipFile(archive_path) as archive:
        expected = {name + '/' + rel for name, app in selection['applications'].items()
                    for rel in app['operations']}
        require(len(expected) == 40 and len(archive.namelist()) == 40
                and set(archive.namelist()) == expected, 'Exact 40-file inventory required')
        require(sum(i.file_size for i in archive.infolist()) < 30 * 1024 * 1024, 'Payload limit')
        for name, app in selection['applications'].items():
            root = TARGETS[name]
            require(str(root) == app['root'] and root.resolve() == root
                    and declared_root(name + '-preprod.avereo.fr') == root, 'Target drift')
            files[name] = {}
            for rel, op in app['operations'].items():
                safe_name(rel)
                require(op['action'] in ('create', 'replace') and Path(rel).name not in
                        ('.htaccess', '.user.ini', 'config.php'), 'Non-UI operation refused')
                require((root / rel).resolve() == root / rel and (root / rel).parent.is_dir(),
                        'Unsafe destination')
                item = archive.getinfo(name + '/' + rel)
                require((item.external_attr >> 16) & 0o170000 != 0o120000, 'Archive link refused')
                content = archive.read(item)
                require(digest(content) == op['after']['sha256'], 'File differs from selection')
                files[name][rel] = content
    return selection, files


def verify_state(selection, plan, after=False):
    for name, root in TARGETS.items():
        expected = dict(plan['public'][name])
        if after:
            expected.update({rel: op['after'] for rel, op in selection['applications'][name]['operations'].items()})
        require(tree(root) == expected, 'Active file drift: ' + name)
    for path, previous in plan['private'].items():
        require(record(Path(path)) == previous, 'Private configuration or activation changed')
    require(tree(Path(plan['planningRoot'])) == plan['planning'], 'Planning data changed')


def prepare(work):
    selection, files = load(work)
    folder = work / 'deployment'
    require(not folder.exists(), 'Preserve previous deployment evidence')
    original = json.loads((work / 'preparation.json').read_text())
    require(original['sourceSha'] == SOURCE, 'Initial source differs')
    for name, root in TARGETS.items():
        require(all(record(root / rel) == op['before'] for rel, op in
                    original['applications'][name]['operations'].items()), 'Hosted drift since preparation: ' + name)
    folder.mkdir(mode=0o700)
    plan = {'observedAt': now(), 'sourceSha': SOURCE, 'mergeSha': MERGE,
            'artifactSha256': PAYLOAD, 'public': {}, 'private': {}}
    for name, root in TARGETS.items():
        plan['public'][name] = tree(root)
        ops = recover_files(root, files[name], folder / 'recovery' / name)
        require(ops == selection['applications'][name]['operations'], 'Fresh recovery differs')
        config = HOME / 'private/connect-preprod/config.php' if name == 'connect' else \
                 HOME / '.avereo' / (name + '-preprod') / 'config.php'
        previous = snapshot_private(config, folder / 'recovery' / name / 'private-config.php')
        require(previous['sha256'] == original['applications'][name]['privateConfigurationSha256'],
                'Private configuration drift')
        plan['private'][str(config)] = previous
    activation = HOME / 'connect-preprod.avereo.fr/src/Application.php'
    previous = snapshot_private(activation, folder / 'recovery/connect/protected-Application.php')
    require(previous['sha256'] == ACTIVATION_SHA, 'Installed PR118 differs')
    plan['private'][str(activation)] = previous
    planning = HOME / '.avereo/projet-preprod/planning-data'
    plan['planningRoot'] = str(planning)
    plan['planning'] = tree(planning)
    for rel in plan['planning']:
        snapshot_private(planning / rel, folder / 'recovery/projet/planning-data' / rel)
    verify_state(selection, plan)
    write_json(folder / 'plan-private.json', plan)
    public = {'observedAt': now(), 'sourceSha': SOURCE, 'mergeSha': MERGE,
              'artifactSha256': PAYLOAD, 'status': 'fresh_preflight_passed',
              'applications': {name: {'root': str(root), 'files': len(files[name]),
                                    'backupAndRestoreOnCopies': 'passed'} for name, root in TARGETS.items()},
              'planningFilesPreserved': len(plan['planning']), 'privateConfigurationsPreserved': 7,
              'installedPr118Preserved': True, 'liveFilesModified': False, 'databaseAccessed': False}
    write_json(folder / 'preflight.json', public)
    return public


def install(selection, files, plan, recovery, writer=atomic_write):
    """Guard every write and restore only our own unchanged writes on failure."""
    verify_state(selection, plan)
    writes = []
    try:
        for name, root in TARGETS.items():
            operations = selection['applications'][name]['operations']
            def order(rel):
                return (3 if rel == 'index.php' else 2 if rel.endswith(('.html', '.php')) else 0, rel)
            for rel in sorted(operations, key=order):
                op = operations[rel]
                require(record(root / rel) == op['before'], 'Concurrent selected-file change')
                writer(root / rel, files[name][rel], op['after']['mode'])
                writes.append((name, rel))
                require(record(root / rel) == op['after'], 'Written bytes or mode differ')
        verify_state(selection, plan, after=True)
        return [{'application': name, 'path': rel} for name, rel in writes]
    except Exception as error:
        conflicts = []
        for name, rel in reversed(writes):
            root = TARGETS[name]; op = selection['applications'][name]['operations'][rel]
            if record(root / rel) != op['after']:
                conflicts.append(name + '/' + rel)
                continue
            if op['before']['exists']:
                backup = recovery / name / 'backup' / rel
                require(record(backup) == op['before'], 'Rollback backup changed')
                atomic_write(root / rel, backup.read_bytes(), op['before']['mode'])
            else:
                (root / rel).unlink()  # Exact new file from this failed operation, hash checked above.
        require(not conflicts, 'Rollback conflict; recent writes preserved: ' + ', '.join(conflicts))
        verify_state(selection, plan)
        raise RuntimeError('Deployment failed; selected files restored: ' + str(error)) from error


def apply(work, authorized_payload):
    require(authorized_payload == PAYLOAD, 'Exact authorized payload confirmation required')
    selection, files = load(work)
    folder = work / 'deployment'
    require(not (folder / 'delivery.json').exists(), 'Delivery already recorded')
    plan = json.loads((folder / 'plan-private.json').read_text())
    require(plan['sourceSha'] == SOURCE and plan['artifactSha256'] == PAYLOAD, 'Preflight candidate differs')
    writes = install(selection, files, plan, folder / 'recovery')
    result = {'observedAt': now(), 'sourceSha': SOURCE, 'mergeSha': MERGE, 'artifactSha256': PAYLOAD,
              'status': 'delivered_verified', 'writes': writes,
              'applications': {name: {'root': str(root), 'verifiedFiles': len(files[name]),
                                    'unlistedPathsPreserved': True, 'accessProtectionPreserved': True}
                               for name, root in TARGETS.items()},
              'planningFilesPreserved': len(plan['planning']), 'privateConfigurationsPreserved': 7,
              'installedPr118Preserved': True, 'databaseAccessed': False, 'productionChanged': False,
              'configurationModified': False, 'rollbackDirectory': str(folder / 'recovery')}
    write_json(folder / 'delivery.json', result)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'apply', 'verify'])
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--authorized-payload')
    args = parser.parse_args()
    os.umask(0o077)
    if args.action == 'prepare': result = prepare(args.work)
    elif args.action == 'apply': result = apply(args.work, args.authorized_payload)
    else:
        selected, _ = load(args.work)
        plan = json.loads((args.work / 'deployment/plan-private.json').read_text())
        verify_state(selected, plan, after=True)
        result = {'status': 'installed_files_verified', 'observedAt': now(), 'artifactSha256': PAYLOAD}
    print(json.dumps(result))
