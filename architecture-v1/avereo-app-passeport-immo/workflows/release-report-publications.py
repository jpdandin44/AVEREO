"""Deliver the paired Rapport/Passeport candidate to preproduction only.

Reuse the existing file/data recovery engine. Authentication, configuration,
unlisted paths, cron and production stay unchanged. The nullable schema addition
is retained on rollback; sources never become ordinary shared documents.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess

HERE = Path(__file__).resolve().parent
CORE = HERE / 'release_selected_preprod.py'
if not CORE.is_file():
    CORE = HERE.parents[2] / 'outillage/acces-preproduction/release_selected_preprod.py'
spec = importlib.util.spec_from_file_location('publication_release_core', CORE)
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)
BIN = engine.HOME / '.avereo/passeport-immo-preprod/backups/bin'
PRIVATE_FILES = {'backup-storage.php': 'backup-storage.php', 'storage.sql': 'storage.sql'}


def allowed(app, name):
    return name == 'index.html' or name.startswith('assets/') or (
        app == 'passeport-immo' and name in ('api/index.php', 'api/storage.php', 'api/publications.php'))


def order(item):
    name = item[0]
    return (0 if name == 'api/publications.php' else 1 if name == 'api/storage.php'
            else 3 if name == 'api/index.php' else 4 if name == 'index.html' else 2, name)


def guard():
    result = {}
    for name in ('rapport', 'passeport-immo'):
        root = engine.HOME / (name + '.avereo.fr')
        if name == 'passeport-immo': root = root / 'public'
        result[name] = engine.digest(json.dumps(engine.tree(root), sort_keys=True).encode())
        result[name + 'Config'] = engine.record(engine.HOME / '.avereo' / name / 'config.php')
    cron = subprocess.run(['crontab', '-l'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    engine.require(cron.returncode == 0, 'Scheduler unreadable')
    result['cron'] = engine.digest(cron.stdout)
    result['connectConfig'] = engine.record(engine.HOME / 'private/connect-preprod/config.php')
    return result


def validate(work, plan=None):
    manifest, candidates = engine.load_candidates(work)
    engine.require(len({a['sourceSha'] for a in manifest['applications'].values()}) == 1, 'Paired source required')
    if plan:
        for app, row in plan['applications'].items():
            for name, op in row['operations'].items():
                engine.require(op['action'] == 'preserve' or allowed(app, name), 'Protected path differs: ' + app + '/' + name)
                expected = manifest['applications'][app]['files'][name].get('expectedHostedSha256')
                engine.require(op['before'].get('sha256') == expected, 'Reviewed hosted baseline differs: ' + app + '/' + name)
    return manifest, candidates


def prepare(work):
    validate(work)
    guards = guard()
    result = engine.prepare(work)
    plan = json.loads((work / 'plan.json').read_text())
    _, candidates = validate(work, plan)
    for app, row in plan['applications'].items():
        copy = work / 'recovery' / app / 'rollback-rehearsal'
        shutil.copytree(work / 'recovery' / app / 'public', copy)
        for name, op in sorted(row['operations'].items(), key=order):
            if op['action'] != 'preserve': engine.atomic_write(copy / name, candidates[app][name], op['after']['mode'])
        for name, op in reversed(list(row['operations'].items())):
            if op['action'] == 'preserve': continue
            if op['before']['exists']: engine.atomic_write(copy / name, (work / 'recovery' / app / 'public' / name).read_bytes(), op['before']['mode'])
            else: (copy / name).unlink()
        engine.require(engine.tree(copy) == row['before'], 'File rollback rehearsal failed')
    plan['privateTools'] = {}
    for name in PRIVATE_FILES:
        before = engine.record(BIN / name)
        engine.require(before['exists'], 'Existing backup tool required')
        shutil.copy2(BIN / name, work / 'recovery' / ('backup-' + name))
        engine.require(engine.record(work / 'recovery' / ('backup-' + name)) == before, 'Backup tool recovery mismatch')
        plan['privateTools'][name] = before
    engine.verify_preflight(work, plan)
    engine.require(guard() == guards, 'External drift during preparation')
    plan.update(externalGuards=guards, rollbackRehearsal='passed')
    engine.write_json(work / 'plan.json', plan)
    engine.write_json(work / 'qualification-public.json', {'status': 'passed', 'observedAt': engine.now(), 'fileRollback': 'passed', 'dataRecovery': plan['dataRecovery'], 'privateBackupToolsCopied': True, 'externalGuardsPreserved': True})
    return result


def perform(action, work):
    if action == 'prepare': return prepare(work)
    plan = json.loads((work / 'plan.json').read_text())
    _, candidates = validate(work, plan)
    engine.require(plan['rollbackRehearsal'] == 'passed' and guard() == plan['externalGuards'], 'Recovery or external drift')
    if action == 'verify':
        receipt = engine.verify_installed(work, plan)
        for name in PRIVATE_FILES: engine.require((BIN / name).read_bytes() == (work / name).read_bytes(), 'Private backup tool drift')
        return {'status': 'installed_files_verified', 'applications': list(receipt['applications'])}
    engine.verify_preflight(work, plan)
    engine.require(not (work / 'delivery.json').exists(), 'Delivery already recorded')
    for name in PRIVATE_FILES: engine.require(engine.record(BIN / name) == plan['privateTools'][name], 'Backup tool concurrent change')
    writes = []; private_writes = []
    # Same lock as the scheduled backup; no job configuration or schedule changes.
    import fcntl
    with (BIN.parent / 'backup.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        try:
            for name in PRIVATE_FILES:
                engine.atomic_write(BIN / name, (work / name).read_bytes(), plan['privateTools'][name]['mode']); private_writes.append(name)
            migrate = subprocess.run([engine.PHP, str(work / 'migrate-report-publications.php'), str(engine.HOME / '.avereo/passeport-immo-preprod/config.php'), 'daje3540_pimpreprod', '--apply'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            engine.require(migrate.returncode == 0, 'Nullable publication migration failed')
            migration = json.loads(migrate.stdout)
            engine.require(migration['existingRowsPreserved'], 'Migration preservation missing')
            for app, root in engine.TARGETS.items():
                for name, op in sorted(plan['applications'][app]['operations'].items(), key=order):
                    if op['action'] == 'preserve': continue
                    engine.require(engine.record(root / name) == op['before'], 'Concurrent public change')
                    engine.atomic_write(root / name, candidates[app][name], op['after']['mode']); writes.append((app, name))
            receipt = engine.verify_installed(work, plan)
            engine.require(guard() == plan['externalGuards'], 'External drift after delivery')
            receipt.update(status='delivered_verified', observedAt=engine.now(), databaseMigration=migration, backupToolsUpdated=True, writes=[{'app': a, 'path': n} for a, n in writes])
            engine.write_json(work / 'delivery.json', receipt)
            return {'status': 'delivered_verified', 'writtenFiles': len(writes), 'migration': migration, 'backupToolsUpdated': True}
        except BaseException:
            for app, name in reversed(writes):
                op = plan['applications'][app]['operations'][name]; target = engine.TARGETS[app] / name
                engine.require(engine.record(target) == op['after'], 'Rollback conflict')
                if op['before']['exists']: engine.atomic_write(target, (work / 'recovery' / app / 'public' / name).read_bytes(), op['before']['mode'])
                else: target.unlink()
            for name in reversed(private_writes):
                engine.require((BIN / name).read_bytes() == (work / name).read_bytes(), 'Backup tool rollback conflict')
                engine.atomic_write(BIN / name, (work / 'recovery' / ('backup-' + name)).read_bytes(), plan['privateTools'][name]['mode'])
            raise


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'apply', 'verify'])
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--authorized-selection')
    args = parser.parse_args(); work = args.work
    engine.require(work.parent == engine.HOME / 'private' and work.name.startswith('preprod-rapport-passeport-publication-') and work.resolve() == work, 'Private preproduction staging required')
    if args.action == 'apply': engine.require(args.authorized_selection == engine.digest((work / 'selection.json').read_bytes()), 'Explicit paired candidate required')
    engine.os.umask(0o077)
    print(json.dumps(perform(args.action, work)))
