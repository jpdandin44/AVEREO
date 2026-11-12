"""Promote the reviewed PR144 artifact to Passeport Immo preproduction only.

Reuse the existing delivery engine, narrowed to one application. Access policies,
CONNECT, private configuration, cron and production are preserved. No SQL migration.
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
spec = importlib.util.spec_from_file_location('selected_release', CORE)
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)
NAME = 'passeport-immo'
ARTIFACT = '7baca4c4be6fa3cac93444714aff9c50b41681c7b850f4362192df2a53fd1352'
TARGET = engine.HOME / 'passeport-immo-preprod.avereo.fr/public'
engine.TARGETS = {NAME: TARGET}
# Read-only comparison identified older shared components, with no local edits.
# These exact before-images may advance to the already-reviewed full artifact.
COMPANION_BASELINES = {
    'connect/gate.php': 'b6f511077216238ed165323e3e2affad4e356af8b5917bc4ae1e7d0f3fa95bb2',
    'account-menu.js': '14c3db4ed97af9461ff489814ae4b4967049147b2a01e4672de7c2abb00bf326',
}


def allowed_write(name):
    return name in ('index.html', 'api/storage.php') or name.startswith('assets/')


def validate_scope(work, plan=None):
    manifest, candidates = engine.load_candidates(work)
    app = manifest['applications'][NAME]
    engine.require(app['artifactSha256'] == ARTIFACT, 'Reviewed PR144 artifact required')
    if plan is not None:
        engine.require(set(plan['applications']) == {NAME}, 'Passeport Immo only')
        for name, op in plan['applications'][NAME]['operations'].items():
            companion = name in COMPANION_BASELINES and op.get('before', {}).get('sha256_lf') == COMPANION_BASELINES[name]
            engine.require(op['action'] == 'preserve' or allowed_write(name) or companion, 'Protected runtime differs: ' + name)
    return manifest, candidates


def external_guards():
    """Record hashes only, never private configuration or crontab contents."""
    production = engine.HOME / 'passeport-immo.avereo.fr/public'
    command = subprocess.run(['crontab', '-l'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    engine.require(command.returncode in (0, 1), 'Cron inspection failed')
    return {
        'productionPublic': engine.digest(json.dumps(engine.tree(production), sort_keys=True).encode()),
        'productionConfig': engine.record(engine.HOME / '.avereo/passeport-immo/config.php'),
        'cronSha256': engine.digest(command.stdout),
    }


def rehearse(work, plan, candidates):
    app = plan['applications'][NAME]
    recovery = work / 'recovery' / NAME
    copy = recovery / 'rollback-rehearsal'
    shutil.copytree(recovery / 'public', copy)
    expected = dict(app['before'])
    for name, op in app['operations'].items():
        if op['action'] != 'preserve':
            engine.atomic_write(copy / name, candidates[NAME][name], op['after']['mode'])
        expected[name] = op['after']
    engine.require(engine.tree(copy) == expected, 'Candidate rehearsal differs')
    for name, op in reversed(list(app['operations'].items())):
        if op['action'] == 'preserve':
            continue
        if op['before']['exists']:
            engine.atomic_write(copy / name, (recovery / 'public' / name).read_bytes(), op['before']['mode'])
        else:
            (copy / name).unlink()
    engine.require(engine.tree(copy) == app['before'], 'Rollback rehearsal differs')
    engine.verify_preflight(work, plan)
    return {'candidateOnCopy': 'passed', 'restoredOnCopy': 'passed', 'liveFilesChanged': False}


def perform(action, work):
    validate_scope(work)
    if action == 'prepare':
        guards = external_guards()
        result = engine.prepare(work)
        plan = json.loads((work / 'plan.json').read_text())
        _, candidates = validate_scope(work, plan)
        plan['externalGuards'] = guards
        plan['rollbackRehearsal'] = rehearse(work, plan, candidates)
        engine.require(external_guards() == guards, 'External guard changed during preparation')
        engine.write_json(work / 'plan.json', plan)
        engine.write_json(work / 'qualification-public.json', {
            'observedAt': engine.now(), 'target': 'https://passeport-immo-preprod.avereo.fr/',
            'artifactSha256': ARTIFACT, 'dataRecovery': plan['dataRecovery'],
            'rollbackRehearsal': plan['rollbackRehearsal'],
            'externalGuardsPreserved': True, 'operations': plan['applications'][NAME]['counts'],
        })
        return result
    plan = json.loads((work / 'plan.json').read_text())
    validate_scope(work, plan)
    engine.require(plan.get('rollbackRehearsal', {}).get('restoredOnCopy') == 'passed', 'Rehearsal missing')
    engine.require(external_guards() == plan['externalGuards'], 'Production or cron drift')
    if action == 'apply':
        result = engine.apply(work)
    else:
        engine.verify_installed(work, plan)
        result = {'status': 'installed_files_verified'}
    engine.require(external_guards() == plan['externalGuards'], 'External guard changed')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'apply', 'verify'])
    parser.add_argument('--work', required=True, type=Path)
    parser.add_argument('--authorized-artifact')
    args = parser.parse_args()
    work = args.work
    engine.require(work.parent == engine.HOME / 'private' and work.name.startswith('preprod-rapport-passeport-archives-') and work.resolve() == work and work.is_dir(), 'Fresh private staging required')
    if args.action == 'apply':
        engine.require(args.authorized_artifact == ARTIFACT, 'Explicit reviewed artifact required')
    engine.os.umask(0o077)
    print(json.dumps(perform(args.action, work)))


if __name__ == '__main__':
    main()
