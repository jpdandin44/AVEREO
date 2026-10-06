"""Targeted Composer dependency repair for the qualified identity preproduction.

Preparation stays private. Apply/rollback require the exact receipt and digest.
No Drupal bootstrap, database command, password, plugin or Composer script runs.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

TARGET = Path('/home/daje3540/auth-next-preprod.avereo.fr')
PRIVATE = Path('/home/daje3540/private/identity-repair')
DEPENDENCIES = {
    'league/oauth2-server': '^9.0',
    'steverhoades/oauth2-openid-connect-server': '^3.0',
}
PARTS = ('composer.json', 'composer.lock', 'vendor')


def write_json(path, data):
    path.write_bytes((json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
    path.chmod(0o600)


def digest(root):
    """Hash only the deployable contract and vendor, including relative symlinks."""
    h = hashlib.sha256()
    for name in PARTS:
        part = root / name
        paths = [part] if part.is_file() else sorted(part.rglob('*'))
        for path in paths:
            relative = str(path.relative_to(root)).replace(os.sep, '/')
            if path.is_symlink():
                link = os.readlink(str(path))
                if os.path.isabs(link) or not str(path.resolve()).startswith(str((root / 'vendor').resolve()) + os.sep):
                    raise ValueError('Lien vendor externe refuse : ' + relative)
                data = ('LINK:' + link).encode('utf-8')
            elif path.is_file():
                data = path.read_bytes()
            else:
                continue
            h.update(relative.encode('utf-8') + b'\0' + hashlib.sha256(data).digest())
    return h.hexdigest()


def validate_target():
    if TARGET != Path('/home/daje3540/auth-next-preprod.avereo.fr') or TARGET.resolve() != TARGET:
        raise ValueError('Seule la racine qualifiee auth-next-preprod est autorisee.')
    for name in PARTS:
        path = TARGET / name
        if path.resolve() != path or not path.exists():
            raise ValueError('Source absente ou partagee : ' + name)
    if "const VERSION = '11.4.6'" not in (TARGET / 'core/lib/Drupal.php').read_text():
        raise ValueError('La version Drupal a change ; requalifier.')
    info = (TARGET / 'modules/contrib/simple_oauth/simple_oauth.info.yml').read_text()
    if not re.search(r"^version: ['\"]?6\.1\.1['\"]?\s*$", info, re.M):
        raise ValueError('La version Simple OAuth a change ; requalifier.')
    requirements = json.loads((TARGET / 'modules/contrib/simple_oauth/composer.json').read_text())['require']
    if any(requirements.get(k) != v for k, v in DEPENDENCIES.items()):
        raise ValueError('Contrat des dependances different du diagnostic.')


def verify_contract(original, candidate, original_lock, candidate_lock):
    original = dict(original)
    expected = dict(original.get('require', {}))
    expected.update(DEPENDENCIES)
    original['require'] = expected
    if original != candidate:
        raise ValueError('Composer a modifie un autre champ du contrat.')
    def packages(lock):
        return {p['name']: p for group in ('packages', 'packages-dev') for p in lock.get(group, [])}
    before, after = packages(original_lock), packages(candidate_lock)
    if any(after.get(name) != package for name, package in before.items()):
        raise ValueError('Une dependance existante a change ; candidat refuse.')
    if not all(name in after for name in DEPENDENCIES):
        raise ValueError('Une dependance requise manque au verrou.')
    return {name: package['version'] for name, package in after.items() if name not in before}


def prepare():
    validate_target()
    if PRIVATE.parent.resolve() != PRIVATE.parent:
        raise ValueError('Parent prive non qualifie.')
    PRIVATE.mkdir(mode=0o700, exist_ok=True)
    if PRIVATE.resolve() != PRIVATE or PRIVATE.stat().st_mode & 0o077:
        raise ValueError('Dossier de preparation non prive.')
    folder = PRIVATE / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    folder.mkdir(mode=0o700)
    original_digest = digest(TARGET)
    backup, candidate = folder / 'backup', folder / 'candidate'
    for root in (backup, candidate):
        root.mkdir(mode=0o700)
        for name in PARTS:
            source = TARGET / name
            if source.is_dir():
                shutil.copytree(str(source), str(root / name), symlinks=True)
            else:
                shutil.copy2(str(source), str(root / name))
    if digest(backup) != original_digest or digest(candidate) != original_digest:
        raise ValueError('Copie de sauvegarde ou de restauration invalide.')
    # Read-only autoload context, outside the promoted vendor; plugins/scripts disabled.
    (candidate / 'core').symlink_to(TARGET / 'core', target_is_directory=True)
    php, composer = shutil.which('php'), shutil.which('composer')
    if not php or not composer:
        raise ValueError('PHP ou Composer absent.')
    environment = dict(os.environ)
    environment['COMPOSER_HOME'] = str(folder / 'composer-home')
    environment['COMPOSER_CACHE_DIR'] = str(folder / 'composer-cache')
    command = [composer, 'require'] + [k + ':' + v for k, v in sorted(DEPENDENCIES.items())]
    command += ['--no-dev', '--no-interaction', '--no-scripts', '--no-plugins', '--no-progress', '--no-audit']
    with (folder / 'build.log').open('wb') as log:
        subprocess.check_call(command, cwd=str(candidate), env=environment, stdout=log, stderr=subprocess.STDOUT)
        subprocess.check_call([composer, '--no-plugins', 'check-platform-reqs', '--no-dev', '--no-interaction'],
            cwd=str(candidate), env=environment, stdout=log, stderr=subprocess.STDOUT)
    (folder / 'build.log').chmod(0o600)
    added = verify_contract(json.loads((backup / 'composer.json').read_text()),
        json.loads((candidate / 'composer.json').read_text()),
        json.loads((backup / 'composer.lock').read_text()), json.loads((candidate / 'composer.lock').read_text()))
    code = r'''$loader = require $argv[1] . '/vendor/autoload.php';
$loader->addPsr4('Drupal\\simple_oauth\\', $argv[2] . '/modules/contrib/simple_oauth/src');
$loader->addPsr4('Drupal\\user\\', $argv[2] . '/core/modules/user/src');
if (!interface_exists('OpenIDConnectServer\\Repositories\\IdentityProviderInterface')
 || !class_exists('League\\OAuth2\\Server\\AuthorizationServer')
 || !class_exists('Drupal\\Core\\DrupalKernel')) { exit(3); }
require $argv[2] . '/modules/contrib/simple_oauth/src/OpenIdConnect/UserIdentityProvider.php';
if (!class_exists('Drupal\\simple_oauth\\OpenIdConnect\\UserIdentityProvider', false)) { exit(4); }
echo "Autoload OIDC, OAuth, Drupal et fournisseur Simple OAuth : OK\n";'''
    result = subprocess.check_output([php, '-r', code, str(candidate), str(TARGET)], stderr=subprocess.STDOUT)
    if digest(TARGET) != original_digest:
        raise ValueError('La cible a change pendant la preparation.')
    receipt = {'target': str(TARGET), 'folder': str(folder), 'original_sha256': original_digest,
        'artifact_sha256': digest(candidate), 'added_packages': added,
        'backup_restore_copy_verified': True, 'autoload_verified': True,
        'existing_packages_unchanged': True, 'composer_scripts_and_plugins_disabled': True,
        'database_modified': False, 'public_target_written': False,
        'prepared_at': datetime.now(timezone.utc).isoformat(),
        'modes': {name: TARGET.joinpath(name).stat().st_mode & 0o777 for name in PARTS}}
    write_json(folder / 'receipt.json', receipt)
    # Downloadable source contains no settings, credentials, cookies or database.
    source = folder / 'source'
    source.mkdir(mode=0o700)
    for name in ('composer.json', 'composer.lock'):
        shutil.copyfile(str(candidate / name), str(source / name))
    shutil.copyfile(str(folder / 'receipt.json'), str(source / 'receipt.json'))
    shutil.make_archive(str(folder / 'source'), 'zip', str(source))
    (folder / 'source.zip').chmod(0o600)
    print(result.decode().strip())
    print(json.dumps(receipt, indent=2))


def receipt_for(folder, artifact):
    validate_target()
    if folder.parent != PRIVATE or folder.resolve() != folder or not re.fullmatch(r'\d{8}T\d{12}Z', folder.name):
        raise ValueError('Dossier hors preparation privee qualifiee.')
    receipt = json.loads((folder / 'receipt.json').read_text())
    if receipt['target'] != str(TARGET) or receipt['artifact_sha256'] != artifact:
        raise ValueError('Cible ou empreinte du recu differentes.')
    if digest(folder / 'backup') != receipt['original_sha256']:
        raise ValueError('Sauvegarde modifiee.')
    return receipt


def atomic_file(source, target, folder, mode):
    temporary = folder / ('transfer-' + target.name)
    try:
        with temporary.open('xb') as output:
            output.write(source.read_bytes())
            output.flush()
            os.fsync(output.fileno())
        temporary.chmod(mode)
        os.replace(str(temporary), str(target))
    finally:
        if temporary.exists():
            temporary.unlink()


def apply(folder, artifact):
    receipt = receipt_for(folder, artifact)
    candidate = folder / 'candidate'
    if digest(TARGET) != receipt['original_sha256'] or digest(candidate) != artifact:
        raise ValueError('Cible concurrente ou candidat modifie ; aucun remplacement.')
    retained = folder / 'live-original.vendor'
    if retained.exists() or TARGET.stat().st_dev != folder.stat().st_dev:
        raise ValueError('Recu deja utilise ou filesystem different.')
    try:
        os.rename(str(TARGET / 'vendor'), str(retained))
        os.rename(str(candidate / 'vendor'), str(TARGET / 'vendor'))
        for name in ('composer.json', 'composer.lock'):
            atomic_file(candidate / name, TARGET / name, folder, receipt['modes'][name])
        if digest(TARGET) != artifact:
            raise ValueError('Empreinte active differente du candidat.')
    except Exception:
        if retained.exists():
            if (TARGET / 'vendor').exists():
                os.rename(str(TARGET / 'vendor'), str(folder / 'rejected.vendor'))
            os.rename(str(retained), str(TARGET / 'vendor'))
            for name in ('composer.json', 'composer.lock'):
                atomic_file(folder / 'backup' / name, TARGET / name, folder, receipt['modes'][name])
        raise
    delivery = {'target': str(TARGET), 'artifact_sha256': digest(TARGET),
        'applied_at': datetime.now(timezone.utc).isoformat(), 'database_modified': False,
        'accounts_or_keys_modified': False, 'production_modified': False, 'backup': str(folder)}
    write_json(folder / 'deployment.json', delivery)
    print(json.dumps(delivery, indent=2))


def rollback(folder, artifact):
    receipt = receipt_for(folder, artifact)
    if digest(TARGET) != artifact or not (folder / 'live-original.vendor').is_dir():
        raise ValueError('Etat courant different ; retour arriere automatique refuse.')
    os.rename(str(TARGET / 'vendor'), str(folder / 'rolled-back.vendor'))
    os.rename(str(folder / 'live-original.vendor'), str(TARGET / 'vendor'))
    for name in ('composer.json', 'composer.lock'):
        atomic_file(folder / 'backup' / name, TARGET / name, folder, receipt['modes'][name])
    if digest(TARGET) != receipt['original_sha256']:
        raise ValueError('Empreinte de restauration invalide.')
    write_json(folder / 'rollback.json', {'restored_at': datetime.now(timezone.utc).isoformat(),
        'restored_sha256': digest(TARGET), 'target': str(TARGET)})
    print('Restauration ciblee verifiee.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('prepare', 'apply', 'rollback'))
    parser.add_argument('--folder', type=Path)
    parser.add_argument('--artifact-sha256')
    args = parser.parse_args()
    if args.action == 'prepare':
        prepare()
    elif args.folder and args.artifact_sha256:
        {'apply': apply, 'rollback': rollback}[args.action](args.folder, args.artifact_sha256)
    else:
        parser.error('Dossier et empreinte exacts requis.')


if __name__ == '__main__':
    main()
