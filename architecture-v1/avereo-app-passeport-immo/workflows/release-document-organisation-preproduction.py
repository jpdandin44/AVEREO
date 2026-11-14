"""Deliver only the reviewed PR153 runtime, after private migration qualification."""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('organisation_delivery', HERE/'release-archives-preproduction.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
release.ARTIFACT = 'ad0b3f1ae198f51aa253af74be8941e6407228d8899b1de7dd47d411adc48a3e'
release.COMPANION_BASELINES = {}
BASELINES = {
    'api/index.php': '2afd6b80179bbd9aa819eebcd85673381ef7a314d16bc27a070f7514af26836b',
    'api/storage.php': 'bca81c45e869c4640bc166429cd9716bd9d13b6279596991fc0160e4201b60b5',
}
old_validate = release.validate_scope
old_allowed = release.allowed_write
release.allowed_write = lambda name: name == 'api/index.php' or old_allowed(name)


def validate_scope(work, plan=None):
    manifest, candidates = old_validate(work, plan)
    if plan is not None:
        for name, operation in plan['applications']['passeport-immo']['operations'].items():
            if name in BASELINES and operation['action'] != 'preserve':
                release.engine.require(operation.get('before', {}).get('sha256_lf') == BASELINES[name], 'Observed 500 MiB baseline differs: '+name)
            if not release.allowed_write(name):
                release.engine.require(operation['before'].get('sha256_lf') == manifest['applications']['passeport-immo']['files'][name]['sha256'], 'Protected candidate differs: '+name)
    return manifest, candidates


release.validate_scope = validate_scope


def qualification(work, action):
    result = subprocess.run([release.engine.PHP, str(work/'qualify-organisation-preproduction.php'), str(work), action], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    release.engine.require(result.returncode == 0, 'Private qualification failed: '+result.stderr.decode('utf-8', 'replace')[:240])
    return json.loads(result.stdout)


def perform(action, work):
    if action == 'prepare':
        result = release.perform(action, work)
        _, candidates = validate_scope(work)
        public = work/'candidate-public'
        public.mkdir(mode=0o700)
        for name, content in candidates['passeport-immo'].items():
            target=public/name
            target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            target.write_bytes(content); target.chmod(0o600)
        qualification(work, 'rehearse')
        return result
    rehearsal = json.loads((work/'organisation-rehearsal-public.json').read_text())
    release.engine.require(rehearsal['status'] == 'passed' and rehearsal['liveRowsChanged'] is False, 'Migration rehearsal missing')
    if action != 'rollback':
        qualification(work, 'verify')
        return release.perform(action, work)
    plan = json.loads((work/'plan.json').read_text())
    validate_scope(work, plan)
    release.engine.require(release.external_guards() == plan['externalGuards'], 'External guard drift')
    release.engine.require(qualification(work, 'rollback-check')['allowed'] is True, 'New document organisation in use; old-code rollback refused')
    release.engine.verify_installed(work, plan)
    for name, operation in reversed(list(plan['applications']['passeport-immo']['operations'].items())):
        if operation['action'] == 'preserve':
            continue
        target=release.TARGET/name
        release.engine.require(release.engine.record(target) == operation['after'], 'Rollback conflict')
        if operation['before']['exists']:
            release.engine.atomic_write(target, (work/'recovery/passeport-immo/public'/name).read_bytes(), operation['before']['mode'])
        else:
            target.unlink()
    release.engine.verify_preflight(work, plan)
    result={'status':'old_code_restored','databaseRowsRestored':False,'additiveColumnsRetained':True}
    release.engine.write_json(work/'rollback-public.json', result)
    return result


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare','apply','verify','rollback'])
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--authorized-artifact')
    args=parser.parse_args();work=args.work
    release.engine.require(work.parent == release.engine.HOME/'private' and work.name.startswith('preprod-rapport-passeport-archives-organisation-') and work.resolve()==work and work.is_dir(), 'Dedicated private staging required')
    if args.action in ('apply','rollback'):
        release.engine.require(args.authorized_artifact == release.ARTIFACT, 'Explicit candidate required')
    release.engine.os.umask(0o077)
    print(json.dumps(perform(args.action,work)))
